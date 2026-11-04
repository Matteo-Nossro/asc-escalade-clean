-- ============================================================================
-- Migration B (securite-bdd) : search_path vide, fonctions de rôle dans `private`
-- ============================================================================
-- Prérequis : migration A (20261102, schéma `private`) ; passe en prod APRÈS
-- 20261025, 20261029 et 20261030 (elle réécrit leurs fonctions). L'ordre des
-- dates le garantit.
--
-- Ce que fait cette migration :
--   1. is_admin_or_secretary() et has_role(text) quittent `public` pour
--      `private` (schéma non exposé par l'API : plus d'appel RPC). Les policies
--      qui les appellent suivent d'elles-mêmes (elles référencent l'OID de la
--      fonction). EXECUTE : `authenticated` seul ; USAGE sur `private` pour
--      `authenticated`. Rien pour anon, PUBLIC ni service_role.
--   2. SET search_path = '' et corps entièrement qualifiés (public., auth.,
--      private.) sur : toutes les fonctions SECURITY DEFINER de public et
--      private, plus handle_updated_at, registrations_block_user_status_change,
--      profiles_block_payment_change, profiles_block_status_change,
--      helloasso_acquire_token_lock. (pg_catalog reste implicite : now(),
--      COALESCE, LOWER, CONCAT, make_interval, opérateurs, types de base.)
--   3. handle_new_user() et enrich_profile_from_temps_user() : EXECUTE retiré
--      à PUBLIC, anon, authenticated (fonctions de trigger, inutiles en RPC ;
--      Postgres ne vérifie EXECUTE qu'à la création du trigger, pas à son
--      déclenchement).
--   4. service_role : plus aucun droit sur la vue public.member_directory
--      (restes TRUNCATE / REFERENCES / TRIGGER des privilèges par défaut).
--
-- Fonctions de trigger en SECURITY INVOKER (elles s'exécutent avec le rôle de
-- l'appelant, qui doit donc pouvoir appeler private.is_admin_or_secretary()) :
--   * profiles_block_status_change : teste auth.role() IS NULL, puis
--     'service_role', AVANT d'appeler la fonction de rôle. service_role et les
--     connexions sans JWT sont exemptés avant l'appel : aucun droit à leur
--     donner.
--   * profiles_block_payment_change : teste 'service_role' AVANT l'appel ; pas
--     d'exemption « sans JWT », mais ce cas (postgres, ou le trigger
--     on_profile_enrich exécuté sous le propriétaire des fonctions
--     SECURITY DEFINER) tourne sous `postgres`, propriétaire de `private`.
--   * registrations_block_user_status_change : appelle la fonction de rôle EN
--     PREMIER, sans exemption service_role. Aucun chemin réel ne l'exige
--     aujourd'hui (toute écriture sur registrations passe par le client
--     `authenticated`, jamais par server/). Donc pas de droit pour service_role.
--     Si une route server/ doit un jour écrire registrations avec la service
--     role, il faudra soit lui donner USAGE sur private + EXECUTE sur
--     private.is_admin_or_secretary(), soit exempter 'service_role' en tête du
--     trigger (à décider alors).
--   * anon : une écriture anonyme reste refusée (pas de droit sur les tables,
--     RLS) ; si elle atteignait un trigger, l'appel de la fonction de rôle
--     lèverait « permission denied for schema private » : refus, aucun droit
--     ouvert.
--   * handle_new_user (GoTrue, rôle supabase_auth_admin) : INSERT dans
--     public.profiles sous `postgres` (SECURITY DEFINER) ; le trigger
--     on_profile_enrich (SECURITY DEFINER aussi) fait un UPDATE dont les
--     triggers profiles_block_* s'exécutent sous `postgres` avec
--     auth.role() NULL : exemption immédiate, ou appel de la fonction de rôle
--     par son propriétaire. Aucun droit à donner à supabase_auth_admin.
--
-- Transactionnelle et idempotente. Les droits sont tous explicites
-- (« Automatically expose new tables » désactivé). Aucune table, colonne,
-- policy ni trigger n'est modifié ; les triggers ne sont pas recréés
-- (CREATE OR REPLACE FUNCTION les conserve).
-- ============================================================================

BEGIN;

-- ─── 0. Schéma `private` (créé par A ; no-op sinon) ──────────────────────────
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, service_role;
GRANT USAGE ON SCHEMA private TO authenticated;

-- ─── 1. Fonctions de rôle : public -> private ────────────────────────────────
-- Le déplacement conserve l'OID, donc les ~30 policies. Idempotent : ignoré si
-- la fonction a déjà été déplacée.
DO $move$
BEGIN
  IF to_regprocedure('public.has_role(text)') IS NOT NULL THEN
    ALTER FUNCTION public.has_role(text) SET SCHEMA private;
  END IF;
  IF to_regprocedure('public.is_admin_or_secretary()') IS NOT NULL THEN
    ALTER FUNCTION public.is_admin_or_secretary() SET SCHEMA private;
  END IF;
END
$move$;

CREATE OR REPLACE FUNCTION private.has_role(_role text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_code = _role
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin_or_secretary() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_code IN ('admin', 'secretary')
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.is_admin_or_secretary()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_or_secretary() TO authenticated;

-- ─── 2. Fonctions de trigger SECURITY DEFINER ────────────────────────────────
-- Corps de 20260101 (enrich_profile_from_temps_user) et de 20261029
-- (handle_new_user, statut « En attente »), déjà qualifiés ; seul le
-- search_path passe de public / aucun à ''.
CREATE OR REPLACE FUNCTION public.enrich_profile_from_temps_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
  UPDATE public.profiles p SET
    licence_number  = tu."Numero_Licence_Origine",
    first_name      = tu."Prenom_Final",
    last_name       = tu."Nom_Final",
    full_name       = CONCAT(tu."Prenom_Final", ' ', tu."Nom_Final"),
    birth_date      = tu."Date_Naissance_Final",
    gender          = tu."Sexe_Final",
    address         = tu."Adresse_Final",
    postal_code     = CAST(tu."CodePostal_Final" AS text),
    city            = tu."Ville_Final",
    phone           = tu."Telephone_Final",
    mobile          = tu."Portable_Final",
    licence_type    = tu."TypeLicence_Final",
    passport        = tu."Passeport_Final",
    notes           = tu."Observation_Final",
    club_group      = tu."Groupe_Final",
    updated_at      = now()
  FROM public.temps_user tu
  WHERE p.id = NEW.id
    AND LOWER(TRIM(p.email)) = LOWER(TRIM(tu."Email_Final"))
    AND p.licence_number IS NULL;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
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

-- Fonctions de trigger : retirées de l'API (anon / authenticated / PUBLIC).
-- Le droit de service_role n'est pas touché ici.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enrich_profile_from_temps_user()
  FROM PUBLIC, anon, authenticated;

-- ─── 3. Fonctions SECURITY INVOKER : search_path vide + noms qualifiés ───────
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Seul changement de corps : is_admin_or_secretary() -> private.is_admin_or_secretary()
CREATE OR REPLACE FUNCTION public.registrations_block_user_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
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

-- Seul changement de corps : is_admin_or_secretary() -> private.is_admin_or_secretary()
CREATE OR REPLACE FUNCTION public.profiles_block_payment_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF private.is_admin_or_secretary() THEN RETURN NEW; END IF;

  IF NEW.payment_done IS DISTINCT FROM OLD.payment_done
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount THEN
    RAISE EXCEPTION 'Modification de payment_done / payment_amount réservée au service ou aux admins';
  END IF;

  RETURN NEW;
END $$;

-- Corps de 20261030 ; seul changement : public.is_admin_or_secretary() ->
-- private.is_admin_or_secretary() et search_path vide.
CREATE OR REPLACE FUNCTION public.profiles_block_status_change() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = ''
    AS $$
BEGIN
  -- Aucune claim JWT : postgres, seed, GoTrue, triggers internes (on_profile_enrich)
  IF auth.role() IS NULL THEN RETURN NEW; END IF;
  -- Service role (routes serveur)
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  -- Bureau : admin ET secretary
  IF private.is_admin_or_secretary() THEN RETURN NEW; END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.profile_completed_at IS DISTINCT FROM OLD.profile_completed_at THEN
    RAISE EXCEPTION 'Modification de status / profile_completed_at réservée au bureau ou au service';
  END IF;

  RETURN NEW;
END
$$;

-- Corps de 20261025 (déjà qualifié) ; seul le search_path passe de public à ''.
-- ACL inchangée (service_role seul), conservée par CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.helloasso_acquire_token_lock(
  p_environment text,
  p_holder uuid,
  p_ttl_seconds integer DEFAULT 20
) RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
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

-- ─── 4. Vue member_directory : aucun droit pour service_role ─────────────────
REVOKE ALL ON public.member_directory FROM service_role;

-- ─── 5. Contrôles : la migration échoue (rollback) au moindre écart ──────────
DO $check$
DECLARE
  v_bad text;
  v_authenticated oid := (SELECT oid FROM pg_roles WHERE rolname = 'authenticated');
BEGIN
  -- 5.1 Toute fonction SECURITY DEFINER de public / private a search_path = ''
  SELECT string_agg(n.nspname || '.' || p.proname, ', ')
    INTO v_bad
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE p.prosecdef
     AND n.nspname IN ('public', 'private')
     AND NOT (COALESCE(p.proconfig, ARRAY[]::text[]) @> ARRAY['search_path=""']);
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Fonctions SECURITY DEFINER sans search_path vide : %', v_bad;
  END IF;

  -- 5.2 Les fonctions nommées de la décision 3 aussi (non DEFINER)
  SELECT string_agg(p.proname, ', ')
    INTO v_bad
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('handle_updated_at', 'registrations_block_user_status_change',
                       'profiles_block_payment_change', 'profiles_block_status_change',
                       'helloasso_acquire_token_lock')
     AND (p.proconfig IS NULL OR NOT (p.proconfig @> ARRAY['search_path=""']));
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Fonctions sans search_path vide : %', v_bad;
  END IF;

  -- 5.3 Fonctions de rôle : seulement dans private
  IF to_regprocedure('public.has_role(text)') IS NOT NULL
     OR to_regprocedure('public.is_admin_or_secretary()') IS NOT NULL
     OR to_regprocedure('private.has_role(text)') IS NULL
     OR to_regprocedure('private.is_admin_or_secretary()') IS NULL THEN
    RAISE EXCEPTION 'has_role / is_admin_or_secretary doivent exister dans private seulement';
  END IF;

  -- 5.4 Aucun corps de fonction de public / private n'appelle encore ces
  --     fonctions sans le préfixe private. (search_path vide : échec à l'exécution)
  SELECT string_agg(n.nspname || '.' || p.proname, ', ')
    INTO v_bad
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname IN ('public', 'private')
     AND p.prolang IN (SELECT oid FROM pg_language WHERE lanname IN ('sql', 'plpgsql'))
     AND p.prosrc ~ '(^|[^.a-zA-Z_])(has_role|is_admin_or_secretary)\s*\(';
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Appel non qualifié de has_role / is_admin_or_secretary dans : %', v_bad;
  END IF;

  -- 5.5 Les policies qui appellent ces fonctions ne visent que `authenticated`
  --     (anon n'a pas USAGE sur la fonction : une policy évaluée pour anon
  --     ferait échouer toute lecture anonyme de la table).
  SELECT string_agg(c.relname || '.' || pol.polname, ', ')
    INTO v_bad
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
   WHERE (   pg_get_expr(pol.polqual, pol.polrelid)      ~ '(has_role|is_admin_or_secretary)\('
          OR pg_get_expr(pol.polwithcheck, pol.polrelid) ~ '(has_role|is_admin_or_secretary)\(')
     AND pol.polroles <> ARRAY[v_authenticated];
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Policies appelant les fonctions de rôle et non limitées à authenticated : %', v_bad;
  END IF;

  -- 5.6 Droits d'EXECUTE / USAGE
  IF NOT has_function_privilege('authenticated', 'private.has_role(text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.is_admin_or_secretary()', 'EXECUTE')
     OR NOT has_schema_privilege('authenticated', 'private', 'USAGE') THEN
    RAISE EXCEPTION 'authenticated doit avoir USAGE sur private et EXECUTE sur les fonctions de rôle';
  END IF;
  IF has_function_privilege('anon', 'private.has_role(text)', 'EXECUTE')
     OR has_function_privilege('anon', 'private.is_admin_or_secretary()', 'EXECUTE')
     OR has_function_privilege('service_role', 'private.has_role(text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'private.is_admin_or_secretary()', 'EXECUTE')
     OR has_function_privilege('service_role', 'private.member_directory_rows()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.enrich_profile_from_temps_user()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.enrich_profile_from_temps_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Droit EXECUTE excessif sur une fonction de private ou de trigger';
  END IF;
  IF has_table_privilege('service_role', 'public.member_directory',
                         'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
    RAISE EXCEPTION 'service_role ne doit avoir aucun droit sur public.member_directory';
  END IF;
END
$check$;

COMMIT;
