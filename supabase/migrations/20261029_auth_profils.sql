-- ============================================================================
-- 2026-10-29 — auth-profils : complétion de profil et statut protégé
-- ============================================================================
-- Périmètre :
--   1. profiles.profile_completed_at — NULL = profil incomplet. Rattrapage des
--                      profils existants (enfants compris) UNIQUEMENT à la
--                      création de la colonne.
--   2. profiles.status — défaut 'En attente' (protection supplémentaire ; toutes
--                      les insertions de l'application posent déjà le statut).
--   3. handle_new_user() — le profil créé à l'inscription est 'En attente',
--                      profile_completed_at vide.
--   4. profiles_block_status_change() + trigger profiles_block_status — refuse
--                      toute modification de status / profile_completed_at,
--                      sauf : auth.uid() NULL (postgres, seed, triggers
--                      internes), service role, bureau (admin ET secretary via
--                      is_admin_or_secretary()). Couvre aussi les profils des
--                      enfants, que profiles_update_family laisse modifier.
--
-- Aucune policy RLS n'est modifiée. on_profile_enrich et
-- enrich_profile_from_temps_user sont inchangés.
-- Idempotente (rejouable sans erreur ni changement de données) et
-- transactionnelle. 20260101_rattrapage_schema.sql n'est pas modifiée.
-- ============================================================================

BEGIN;

-- ─── 1. Colonne + rattrapage (un seul bloc : jamais rejoué sur des profils récents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'profile_completed_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_completed_at timestamptz NULL;

    -- Ne pas toucher updated_at pendant le rattrapage
    ALTER TABLE public.profiles DISABLE TRIGGER on_profiles_updated;

    UPDATE public.profiles
       SET profile_completed_at = created_at
     WHERE profile_completed_at IS NULL;

    ALTER TABLE public.profiles ENABLE TRIGGER on_profiles_updated;
  END IF;
END
$$;

-- ─── 2. Défaut du statut ────────────────────────────────────────────────────
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'En attente';

-- ─── 3. handle_new_user : profil créé 'En attente', non complété ─────────────
-- Le trigger on_auth_user_created n'est pas recréé. La branche ON CONFLICT ne
-- touche ni status ni profile_completed_at.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = public
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    'En attente'
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 4. Trigger : status / profile_completed_at réservés au bureau ───────────
CREATE OR REPLACE FUNCTION public.profiles_block_status_change() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public
    AS $$
BEGIN
  -- Postgres, seed, triggers internes (on_profile_enrich) : pas de JWT.
  -- Un appel PostgREST anonyme a aussi auth.uid() NULL, mais auth.role() = 'anon' : pas d'exemption.
  IF auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'anon' THEN RETURN NEW; END IF;
  -- Service role (routes serveur)
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  -- Bureau : admin ET secretary
  IF public.is_admin_or_secretary() THEN RETURN NEW; END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.profile_completed_at IS DISTINCT FROM OLD.profile_completed_at THEN
    RAISE EXCEPTION 'Modification de status / profile_completed_at réservée au bureau ou au service';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS profiles_block_status ON public.profiles;
CREATE TRIGGER profiles_block_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_block_status_change();

COMMIT;
