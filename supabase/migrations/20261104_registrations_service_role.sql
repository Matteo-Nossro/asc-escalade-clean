-- ============================================================================
-- Migration C (securite-bdd) : trigger de `registrations`, exemption service_role
-- ============================================================================
-- Prérequis : migration B (20261103) : fonctions de rôle dans `private`.
--
-- registrations_block_user_status_change appelait private.is_admin_or_secretary()
-- en premier, sans exemption : une écriture de `registrations` par la service
-- role (qui n'a ni USAGE sur `private` ni EXECUTE sur la fonction) échouait en
-- « permission denied ». Le trigger commence maintenant par les mêmes
-- exemptions que profiles_block_status_change (auth.role() NULL, puis
-- 'service_role'), avant l'appel de la fonction de rôle. L'interdiction reste
-- entière pour un adhérent. Aucun droit n'est accordé à service_role.
--
-- Corps de 20261103, précédé des deux exemptions. Idempotente (CREATE OR
-- REPLACE conserve le trigger).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.registrations_block_user_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Aucune claim JWT : postgres, seed, GoTrue, triggers internes
  IF auth.role() IS NULL THEN RETURN NEW; END IF;
  -- Service role (routes serveur)
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;

  IF private.is_admin_or_secretary() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Seul un admin peut changer un status vers autre chose que cancelled';
  END IF;

  IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
    RAISE EXCEPTION 'Champs reviewed_by / reviewed_at / admin_note réservés aux admins';
  END IF;

  RETURN NEW;
END $$;

COMMIT;
