-- ============================================================================
-- 2026-04-26 — Security fixes RLS (3 failles HIGH)
-- ============================================================================
-- 1. parent_access_insert_parent : un user pouvait s'attribuer n'importe quel
--    profil comme enfant en connaissant son UUID → escalade vers lecture +
--    UPDATE du profil cible + inscriptions usurpées.
-- 2. profiles_select_authenticated : tout user authentifié pouvait lire
--    l'intégralité des profils (email, téléphone, adresse, DDN, licence...).
-- 3. registrations_update_own : un user pouvait s'auto-confirmer une
--    inscription event en passant le status à 'confirmed', contournant
--    le workflow d'approbation admin.
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH 1 — parent_access : restreindre child_id aux profils sans compte auth
--                          et empêcher le vol d'enfant déjà rattaché
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS parent_access_insert_parent ON parent_access;

CREATE POLICY parent_access_insert_parent
ON parent_access FOR INSERT TO authenticated
WITH CHECK (
  parent_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = child_id AND p.email IS NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM parent_access pa WHERE pa.child_id = parent_access.child_id
  )
);
-- NB : empêche aussi le co-parentage côté client (2 parents pour 1 enfant).
-- Si ce besoin existe, le passer par une route serveur dédiée avec
-- vérification (ex. invitation par email du second parent).

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH 2 — profiles : restreindre la lecture à self / famille / staff
--                     + exposer une vue publique limitée pour les jointures
--                     cross-user (référent groupe, instructeurs, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_select_authenticated ON profiles;

CREATE POLICY profiles_select_self_or_family
ON profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM parent_access pa
    WHERE pa.child_id = profiles.id AND pa.parent_id = auth.uid()
  )
);

CREATE POLICY profiles_select_staff
ON profiles FOR SELECT TO authenticated
USING (is_admin_or_secretary());

-- Les anciennes policies famille ciblaient le rôle `public` (anon+auth) au
-- lieu de `authenticated` — on les recrée proprement.
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;

CREATE POLICY profiles_update_family
ON profiles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parent_access pa
    WHERE pa.child_id = profiles.id AND pa.parent_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_access pa
    WHERE pa.child_id = profiles.id AND pa.parent_id = auth.uid()
  )
);

-- Vue publique limitée : id + full_name + avatar_url uniquement.
-- security_invoker = false (défaut) → la vue bypass la RLS sur profiles
-- mais n'expose que des colonnes non sensibles.
CREATE OR REPLACE VIEW public.member_directory
WITH (security_invoker = false) AS
SELECT id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.member_directory TO anon, authenticated;

COMMENT ON VIEW public.member_directory IS
  'Annuaire public des membres : seules les colonnes affichables (nom, avatar) '
  'sont exposées. À utiliser pour les jointures cross-user (référent groupe, '
  'instructeurs, liste publique). Les données sensibles (email, téléphone, '
  'adresse, DDN, licence) restent protégées sur profiles via RLS.';

-- ─────────────────────────────────────────────────────────────────────────────
-- HIGH 3 — registrations : trigger anti auto-confirmation
--                          On garde la policy UPDATE pour permettre annulation
--                          et édition de notes, mais un trigger bloque les
--                          modifications de status / reviewed_* / admin_note
--                          pour les non-staff (sauf transition vers cancelled).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrations_block_user_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_admin_or_secretary() THEN
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

DROP TRIGGER IF EXISTS registrations_block_user_status ON registrations;

CREATE TRIGGER registrations_block_user_status
BEFORE UPDATE ON registrations
FOR EACH ROW EXECUTE FUNCTION public.registrations_block_user_status_change();

COMMIT;
