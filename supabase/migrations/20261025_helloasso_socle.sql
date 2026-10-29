-- ============================================================================
-- 2026-10-25 — HelloAsso : socle (lot 1/7 de la feature helloasso-socle)
-- ============================================================================
-- Périmètre :
--   1. helloasso_forms        — colonnes season / event_id, CHECK, UNIQUE,
--                               écritures réservées à l'admin (RLS)
--   2. helloasso_tokens       — jeton d'API par environnement (service role seul)
--   3. helloasso_sync_runs    — historique des passages de synchronisation
--   4. helloasso_acquire_token_lock() — verrou atomique de renouvellement du jeton
--
-- Idempotente (rejouable sans erreur ni changement) et transactionnelle.
-- 20260520_helloasso.sql (déjà appliquée) n'est pas modifiée.
--
-- Refus documentés (la transaction entière est alors annulée ; corriger les
-- données à la main puis relancer) :
--   • doublon (form_type, form_slug) dans helloasso_forms ;
--   • ligne existante violant un des CHECK (format de saison, type, event_id).
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. helloasso_forms
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 Colonnes (season d'abord nullable, pour pouvoir remplir l'existant)
ALTER TABLE public.helloasso_forms
  ADD COLUMN IF NOT EXISTS season text;

ALTER TABLE public.helloasso_forms
  ADD COLUMN IF NOT EXISTS event_id uuid NULL
  REFERENCES public.events(id) ON DELETE SET NULL;

-- 1.2 Remplissage de season : saison en cours à created_at (coupure au
--     1er septembre, heure de Paris). Du 1er sept. Y au 31 août Y+1 : Y-(Y+1).
DO $$
DECLARE
  v_filled integer;
BEGIN
  UPDATE public.helloasso_forms f
  SET season = s.y || '-' || (s.y + 1)
  FROM (
    SELECT id,
           CASE
             WHEN extract(month FROM d) >= 9 THEN extract(year FROM d)::int
             ELSE extract(year FROM d)::int - 1
           END AS y
    FROM (
      SELECT id,
             (COALESCE(created_at, now()) AT TIME ZONE 'Europe/Paris') AS d
      FROM public.helloasso_forms
      WHERE season IS NULL
    ) dates
  ) s
  WHERE f.id = s.id
    AND f.season IS NULL;

  GET DIAGNOSTICS v_filled = ROW_COUNT;
  RAISE NOTICE 'helloasso_forms.season : % ligne(s) remplie(s)', v_filled;
END $$;

-- 1.3 NOT NULL (sans effet s'il est déjà posé)
ALTER TABLE public.helloasso_forms
  ALTER COLUMN season SET NOT NULL;

-- 1.4 CHECK : NOT VALID puis VALIDATE (échec = migration annulée)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'helloasso_forms_season_format'
      AND conrelid = 'public.helloasso_forms'::regclass
  ) THEN
    -- CASE : la conversion ::int n'est tentée qu'après le contrôle du format.
    ALTER TABLE public.helloasso_forms
      ADD CONSTRAINT helloasso_forms_season_format
      CHECK (
        CASE
          WHEN season ~ '^[0-9]{4}-[0-9]{4}$'
            THEN split_part(season, '-', 2)::int = split_part(season, '-', 1)::int + 1
          ELSE false
        END
      ) NOT VALID;
  END IF;
  ALTER TABLE public.helloasso_forms VALIDATE CONSTRAINT helloasso_forms_season_format;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'helloasso_forms_form_type_check'
      AND conrelid = 'public.helloasso_forms'::regclass
  ) THEN
    ALTER TABLE public.helloasso_forms
      ADD CONSTRAINT helloasso_forms_form_type_check
      CHECK (form_type IN ('Membership', 'Event')) NOT VALID;
  END IF;
  ALTER TABLE public.helloasso_forms VALIDATE CONSTRAINT helloasso_forms_form_type_check;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'helloasso_forms_event_type_check'
      AND conrelid = 'public.helloasso_forms'::regclass
  ) THEN
    ALTER TABLE public.helloasso_forms
      ADD CONSTRAINT helloasso_forms_event_type_check
      CHECK (event_id IS NULL OR form_type = 'Event') NOT VALID;
  END IF;
  ALTER TABLE public.helloasso_forms VALIDATE CONSTRAINT helloasso_forms_event_type_check;
END $$;

-- 1.5 UNIQUE (form_type, form_slug) : pas de NOT VALID possible, donc
--     pré-vérification des doublons (refus sans suppression automatique).
DO $$
DECLARE
  v_dups text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'helloasso_forms_type_slug_key'
      AND conrelid = 'public.helloasso_forms'::regclass
  ) THEN
    SELECT string_agg(format('(%s, %s) x%s', form_type, form_slug, n), ', ' ORDER BY form_type, form_slug)
    INTO v_dups
    FROM (
      SELECT form_type, form_slug, count(*) AS n
      FROM public.helloasso_forms
      GROUP BY form_type, form_slug
      HAVING count(*) > 1
    ) d;

    IF v_dups IS NOT NULL THEN
      RAISE EXCEPTION
        'helloasso_forms : doublons (form_type, form_slug) à corriger avant la migration : %', v_dups;
    END IF;

    ALTER TABLE public.helloasso_forms
      ADD CONSTRAINT helloasso_forms_type_slug_key UNIQUE (form_type, form_slug);
  END IF;
END $$;

-- 1.6 Policies : lecture admin + secrétaire (inchangée), écritures admin seul
DROP POLICY IF EXISTS helloasso_forms_select_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_select_staff
  ON public.helloasso_forms FOR SELECT TO authenticated
  USING (public.is_admin_or_secretary());

DROP POLICY IF EXISTS helloasso_forms_insert_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_insert_staff
  ON public.helloasso_forms FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS helloasso_forms_update_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_update_staff
  ON public.helloasso_forms FOR UPDATE TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS helloasso_forms_delete_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_delete_staff
  ON public.helloasso_forms FOR DELETE TO authenticated
  USING (public.has_role('admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. helloasso_tokens — jeton par environnement (service role uniquement)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.helloasso_tokens (
  environment        text        PRIMARY KEY CHECK (environment IN ('sandbox', 'production')),
  client_id          text,
  access_token       text,
  access_expires_at  timestamptz,
  refresh_token      text,
  refresh_expires_at timestamptz,
  lock_holder        uuid,
  lock_until         timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- RLS activée, volontairement aucune policy : seul le service role y accède.
ALTER TABLE public.helloasso_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.helloasso_tokens FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. helloasso_sync_runs — historique des synchronisations (alimentée dès le lot 2)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.helloasso_sync_runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope          text        NOT NULL,
  trigger_source text        NOT NULL CHECK (trigger_source IN ('manual', 'cron')),
  environment    text        NOT NULL CHECK (environment IN ('sandbox', 'production')),
  triggered_by   uuid        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  status         text        NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  counts         jsonb       NOT NULL DEFAULT '{}',
  error          text
);

CREATE INDEX IF NOT EXISTS helloasso_sync_runs_scope_started_idx
  ON public.helloasso_sync_runs (scope, started_at DESC);

ALTER TABLE public.helloasso_sync_runs ENABLE ROW LEVEL SECURITY;

-- Lecture admin + secrétaire ; aucune policy d'écriture (service role seul).
DROP POLICY IF EXISTS helloasso_sync_runs_select_staff ON public.helloasso_sync_runs;
CREATE POLICY helloasso_sync_runs_select_staff
  ON public.helloasso_sync_runs FOR SELECT TO authenticated
  USING (public.is_admin_or_secretary());

-- Ceinture et bretelles : pas de droits d'écriture pour les rôles clients.
REVOKE ALL ON TABLE public.helloasso_sync_runs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.helloasso_sync_runs FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verrou de renouvellement du jeton
-- ─────────────────────────────────────────────────────────────────────────────
-- true  : verrou obtenu (ligne insérée, ou verrou libre / expiré repris)
-- false : verrou détenu par un autre et encore valide
-- L'heure vient de la base (now()), pas de l'horloge des instances.

CREATE OR REPLACE FUNCTION public.helloasso_acquire_token_lock(
  p_environment text,
  p_holder uuid,
  p_ttl_seconds integer DEFAULT 20
) RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  INSERT INTO public.helloasso_tokens AS t (environment, lock_holder, lock_until, updated_at)
  VALUES (p_environment, p_holder, now() + make_interval(secs => p_ttl_seconds), now())
  ON CONFLICT (environment) DO UPDATE
    SET lock_holder = EXCLUDED.lock_holder,
        lock_until  = EXCLUDED.lock_until,
        updated_at  = now()
    WHERE t.lock_until IS NULL OR t.lock_until < now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END $$;

REVOKE EXECUTE ON FUNCTION public.helloasso_acquire_token_lock(text, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.helloasso_acquire_token_lock(text, uuid, integer)
  TO service_role;

COMMIT;
