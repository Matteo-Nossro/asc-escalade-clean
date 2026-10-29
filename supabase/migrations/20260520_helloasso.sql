-- ============================================================================
-- 2026-05-20 — HelloAsso : intégration complète
-- ============================================================================
-- Périmètre :
--   1. helloasso_forms   — référentiel des formulaires (billetterie/adhésions)
--   2. profile_payments  — source de vérité des paiements par formulaire
--   3. profiles          — ajout payment_amount + policy UPDATE staff manquante
--   4. Trigger           — protège payment_done / payment_amount côté client
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles — champ montant + policy UPDATE staff (manquait depuis 26/04)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_amount numeric;

DROP POLICY IF EXISTS profiles_update_staff ON profiles;
CREATE POLICY profiles_update_staff
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin_or_secretary())
  WITH CHECK (is_admin_or_secretary());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. helloasso_forms — référentiel des formulaires actifs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.helloasso_forms (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_slug   text        NOT NULL,
  form_type   text        NOT NULL DEFAULT 'Membership', -- 'Membership' | 'Event'
  label       text        NOT NULL,
  active      boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.helloasso_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS helloasso_forms_select_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_select_staff
  ON public.helloasso_forms FOR SELECT TO authenticated
  USING (is_admin_or_secretary());

DROP POLICY IF EXISTS helloasso_forms_insert_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_insert_staff
  ON public.helloasso_forms FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_secretary());

DROP POLICY IF EXISTS helloasso_forms_update_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_update_staff
  ON public.helloasso_forms FOR UPDATE TO authenticated
  USING (is_admin_or_secretary())
  WITH CHECK (is_admin_or_secretary());

DROP POLICY IF EXISTS helloasso_forms_delete_staff ON public.helloasso_forms;
CREATE POLICY helloasso_forms_delete_staff
  ON public.helloasso_forms FOR DELETE TO authenticated
  USING (is_admin_or_secretary());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. profile_payments — paiements HelloAsso par profil et par formulaire
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Rôle :
--   • Source de vérité multi-formulaire (qui a payé QUEL formulaire)
--   • Déduplication des webhooks via helloasso_order_id
--   • Historique des montants par formulaire
--
-- profiles.payment_done reste un flag de raccourci maintenu en parallèle
-- pour les KPIs et filtres existants. Les overrides manuels admin (modal)
-- ne créent pas de ligne ici — ils écrivent directement sur payment_done.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profile_payments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  form_id             uuid        NOT NULL REFERENCES helloasso_forms(id) ON DELETE RESTRICT,
  helloasso_order_id  text        UNIQUE, -- NULL si override manuel ; UNIQUE pour idempotence webhook
  amount              numeric     NOT NULL DEFAULT 0,
  paid_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, form_id)
);

ALTER TABLE public.profile_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_payments_select_staff ON public.profile_payments;
CREATE POLICY profile_payments_select_staff
  ON public.profile_payments FOR SELECT TO authenticated
  USING (is_admin_or_secretary());

DROP POLICY IF EXISTS profile_payments_insert_staff ON public.profile_payments;
CREATE POLICY profile_payments_insert_staff
  ON public.profile_payments FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_secretary());

DROP POLICY IF EXISTS profile_payments_update_staff ON public.profile_payments;
CREATE POLICY profile_payments_update_staff
  ON public.profile_payments FOR UPDATE TO authenticated
  USING (is_admin_or_secretary())
  WITH CHECK (is_admin_or_secretary());

DROP POLICY IF EXISTS profile_payments_delete_staff ON public.profile_payments;
CREATE POLICY profile_payments_delete_staff
  ON public.profile_payments FOR DELETE TO authenticated
  USING (is_admin_or_secretary());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger — bloquer la modification de payment_done / payment_amount
--             par les clients non-admin (le service_role est exempté)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.profiles_block_payment_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF is_admin_or_secretary() THEN RETURN NEW; END IF;

  IF NEW.payment_done IS DISTINCT FROM OLD.payment_done
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount THEN
    RAISE EXCEPTION 'Modification de payment_done / payment_amount réservée au service ou aux admins';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_block_payment ON profiles;
CREATE TRIGGER profiles_block_payment
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_block_payment_change();

COMMIT;
