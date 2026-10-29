-- ============================================================================
-- 2026-10-30 — auth-profils (R1-d) : durcissement de profiles_block_status
-- ============================================================================
-- 20261029_auth_profils.sql est déjà appliquée : elle n'est pas réécrite.
--
-- Exemption « sans JWT » : auparavant `auth.uid() IS NULL` (puis
-- `auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'anon'`). Désormais
-- `auth.role() IS NULL` : seule une connexion sans aucune claim JWT
-- (postgres, seed, `supabase db push`, GoTrue / supabase_auth_admin pour
-- handle_new_user et on_profile_enrich) est exemptée. Un jeton PostgREST,
-- même `authenticated` sans `sub` ou `anon`, a un rôle non NULL : il n'est
-- plus exempté.
--
-- Inchangé : exemption service_role, exemption du bureau (admin ET secretary
-- via is_admin_or_secretary()), refus de tout changement de status /
-- profile_completed_at pour les autres. Aucune policy modifiée.
-- Idempotente (CREATE OR REPLACE, DROP TRIGGER IF EXISTS) et transactionnelle.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.profiles_block_status_change() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public
    AS $$
BEGIN
  -- Aucune claim JWT : postgres, seed, GoTrue, triggers internes (on_profile_enrich)
  IF auth.role() IS NULL THEN RETURN NEW; END IF;
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
