-- ============================================================================
-- Migration A (securite-bdd) : annuaire public `member_directory` verrouillé
-- ============================================================================
-- Problème corrigé : la vue public.member_directory (migration 20260426) était
-- security_invoker = false, lisait TOUS les profils (id, full_name, avatar_url)
-- et, créée par postgres dans public, héritait de privilèges par défaut trop
-- larges (selon l'état du projet : INSERT/UPDATE/DELETE/TRUNCATE/... pour anon
-- et authenticated). Une vue simple étant modifiable, des écritures passaient
-- jusqu'à profiles.
--
-- Après cette migration :
--   * la vue ne renvoie que les référents de groupe (groups.referent_id) et les
--     moniteurs (group_instructors.user_id), colonnes id et full_name seulement
--     (avatar_url est retiré) ;
--   * la vue est security_invoker = true et non modifiable (elle lit une
--     fonction) ;
--   * anon et authenticated n'ont que SELECT sur la vue ;
--   * la lecture passe par une fonction SECURITY DEFINER du schéma `private`
--     (non exposé par l'API : pas d'appel RPC direct), search_path = '' et noms
--     qualifiés, EXECUTE réservé à anon et authenticated (pas service_role).
--
-- Autonome : ne dépend que de profiles, groups, group_instructors (présentes en
-- prod) et des rôles Supabase. Ne touche aucune fonction de `public` (has_role,
-- is_admin_or_secretary relèvent de la migration B).
-- Idempotente et transactionnelle : rejouable sans erreur.
-- Les droits sont tous explicites (« Automatically expose new tables »
-- désactivé : rien n'est accordé automatiquement).
-- ============================================================================

BEGIN;

-- ─── 1. Schéma `private` ─────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

-- ─── 2. Fonction de l'annuaire (référents + moniteurs seulement) ─────────────
CREATE OR REPLACE FUNCTION private.member_directory_rows()
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.full_name
  FROM public.profiles AS p
  WHERE EXISTS (
          SELECT 1 FROM public.groups AS g
          WHERE g.referent_id = p.id
        )
     OR EXISTS (
          SELECT 1 FROM public.group_instructors AS gi
          WHERE gi.user_id = p.id
        );
$$;

-- service_role est retiré explicitement : aucun lecteur serveur aujourd'hui.
REVOKE ALL ON FUNCTION private.member_directory_rows()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.member_directory_rows() TO anon, authenticated;

-- ─── 3. Vue publique recréée au-dessus de la fonction ────────────────────────
-- DROP + CREATE : CREATE OR REPLACE ne peut pas retirer la colonne avatar_url.
-- Pas de CASCADE : si un objet dépend de la vue, la migration échoue (et la
-- transaction est annulée) au lieu de le supprimer en silence.
DROP VIEW IF EXISTS public.member_directory;

CREATE VIEW public.member_directory
WITH (security_invoker = true) AS
SELECT d.id, d.full_name
FROM private.member_directory_rows() AS d;

-- Droits de la vue, APRÈS sa création (la vue neuve peut recevoir des
-- privilèges par défaut selon la configuration du projet).
REVOKE ALL ON public.member_directory FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.member_directory FROM anon, authenticated;
GRANT SELECT ON public.member_directory TO anon, authenticated;

COMMENT ON VIEW public.member_directory IS
  'Annuaire public limité : id et nom des seuls référents de groupe et '
  'moniteurs (colonnes id, full_name ; pas d''avatar). Lecture seule, via '
  'private.member_directory_rows() (SECURITY DEFINER, search_path vide). '
  'Les autres profils et les données sensibles restent protégés par la RLS '
  'de profiles.';

COMMIT;
