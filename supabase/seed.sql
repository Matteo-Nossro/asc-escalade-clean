-- ════════════════════════════════════════════════════════════════════════════
-- Seed du projet Supabase de DEV — données de test fictives
-- ════════════════════════════════════════════════════════════════════════════
-- Application (projet DEV uniquement, jamais la prod) :
--   1. node scripts/seed-test-users.mjs        crée les 4 comptes Auth de test
--   2. supabase db push --linked --include-seed  applique les migrations + ce fichier
--      (exécuté avec le rôle postgres)
--   3. node scripts/seed-test-users.mjs --check  vérifie profils et rôles
--
-- Ce fichier DÉPEND des comptes créés par scripts/seed-test-users.mjs : il les
-- retrouve par `auth.users.raw_app_meta_data->>'test_role'` (admin, secretary,
-- initiateur, parent), jamais par e-mail. Si les comptes n'existent pas encore,
-- les parties qui les concernent ne font rien (sans erreur) ; relancer le seed
-- une fois les comptes créés.
--
-- Ce qu'il crée :
--   a. roles : admin, secretary, parent, initiateur (labels en français)
--   b. user_roles des 4 comptes de test + mise à jour de leur profil (nom,
--      statut Actif, données fictives)
--   c. données fictives à UUID fixes (préfixe f5eed…) :
--        · 6 adhérents sans compte Auth + 2 enfants du compte « adhérent »
--          (parent_access)
--        · inscriptions (group_members) aux groupes existants, sélectionnés
--          par nom (les 19 groupes de 20260411 ne sont ni recréés ni modifiés)
--        · compte « initiateur » encadrant 2 groupes (group_instructors)
--        · 4 événements (2 passés, 2 à venir) + registrations
--        · 2 helloasso_forms (Membership, slugs fictifs) + profile_payments
--        · notification_logs
--      Ni temps_user ni la table "User" (legacy) ne sont remplies.
--
-- Idempotent : rejouable sans doublon ni erreur (ON CONFLICT DO NOTHING / DO
-- UPDATE), une seule transaction. Rien n'est supprimé.
--
-- Points d'attention liés au schéma :
--   · trigger profiles_block_payment (BEFORE UPDATE) : en seed, auth.role()
--     n'est pas 'service_role' et is_admin_or_secretary() est faux (pas de
--     JWT). payment_done / payment_amount ne peuvent donc être posés que par
--     INSERT (le trigger ne couvre pas l'INSERT) ; les profils de test créés
--     par Auth gardent payment_done = false, jamais modifié ici.
--   · registrations_block_user_status (BEFORE UPDATE) : registrations et
--     group_members sont uniquement insérées (DO NOTHING), jamais mises à jour.
--   · on_profile_enrich (AFTER INSERT) : sans effet, les e-mails @example.com
--     ou NULL ne correspondent à aucune ligne de temps_user.
--   · profiles.id n'a plus de FK vers auth.users (20260409) : profils fictifs
--     possibles avec UUID autonome.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── a. Rôles ────────────────────────────────────────────────────────────────
INSERT INTO public.roles (code, label) VALUES
  ('admin',      'Administrateur'),
  ('secretary',  'Secrétaire'),
  ('parent',     'Adhérent / parent'),
  ('initiateur', 'Initiateur')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label;

-- ─── Acteurs : clé logique → UUID (table temporaire, supprimée au COMMIT) ───
CREATE TEMP TABLE seed_actors (
  key text PRIMARY KEY,
  id  uuid NOT NULL
) ON COMMIT DROP;

-- Comptes de test déjà créés dans Auth (et dotés d'un profil par le trigger)
INSERT INTO seed_actors (key, id)
SELECT u.raw_app_meta_data->>'test_role', u.id
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.raw_app_meta_data->>'test_role' IN ('admin', 'secretary', 'initiateur', 'parent')
ORDER BY u.created_at
ON CONFLICT (key) DO NOTHING;

-- ─── b. Rôles et profils des comptes de test ────────────────────────────────
INSERT INTO public.user_roles (user_id, role_code)
SELECT id, key FROM seed_actors
WHERE key IN ('admin', 'secretary', 'initiateur', 'parent')
ON CONFLICT (user_id, role_code) DO NOTHING;

-- payment_done / payment_amount volontairement absents du SET (trigger).
UPDATE public.profiles p SET
  first_name          = t.first_name,
  last_name           = t.last_name,
  full_name           = t.first_name || ' ' || t.last_name,
  birth_date          = t.birth_date::date,
  gender              = t.gender,
  address             = t.address,
  postal_code         = '21800',
  city                = 'Chevigny-Saint-Sauveur',
  mobile              = t.mobile,
  licence_type        = t.licence_type,
  licence_number      = t.licence_number::bigint,
  status              = 'Actif',
  profile_completed_at = COALESCE(p.profile_completed_at, now()),
  medical_certificate = 'certificat_medical',
  ffme_insurance      = 'certificat_renouvellement',
  registration_form   = true,
  category            = 'Adulte',
  emergency_contact   = 'Contact fictif 06 00 00 00 99'
FROM (VALUES
  ('admin',      'Alice', 'Admin-Test',      '1985-02-10', 'F', '1 rue de l''Exemple',   '0600000101', 'Licence Adulte', 990000101),
  ('secretary',  'Sacha', 'Secrétaire-Test', '1990-06-21', 'M', '2 rue de l''Exemple',   '0600000102', 'Licence Adulte', 990000102),
  ('initiateur', 'Ivan',  'Initiateur-Test', '1987-09-05', 'M', '3 rue de l''Exemple',   '0600000103', 'Licence Adulte', 990000103),
  ('parent',     'Paula', 'Adhérent-Test',   '1984-12-17', 'F', '4 rue de l''Exemple',   '0600000104', 'Licence Adulte', 990000104)
) AS t(test_role, first_name, last_name, birth_date, gender, address, mobile, licence_type, licence_number)
JOIN seed_actors a ON a.key = t.test_role
WHERE p.id = a.id;

-- ─── c. Adhérents fictifs sans compte Auth + enfants du compte « adhérent » ──
-- Les enfants (child1, child2) ont un e-mail NULL. INSERT direct : payment_*
-- peut être renseigné ici (le trigger ne protège que l'UPDATE).
WITH p (key, id, email, first_name, last_name, birth_date, gender, address, mobile, licence_type,
        licence_number, status, medical_certificate, ffme_insurance, category, tshirt, club_group,
        registration_form, payment_done, payment_amount, emergency_contact) AS (
  VALUES
    ('camille', 'f5eed000-0000-4000-8000-000000000001', 'camille.exemple@example.com', 'Camille', 'Exemple', '1988-03-14', 'F', '10 rue du Test',     '0600000001', 'Licence Adulte', 990000001, 'Actif',      'certificat_medical', 'certificat_renouvellement', 'Adulte', 'M', 'Adultes (1)',                true,  true,  240, NULL),
    ('hugo',    'f5eed000-0000-4000-8000-000000000002', 'hugo.modele@example.com',       'Hugo',    'Modèle',  '1991-07-02', 'M', '11 rue du Test',     '0600000002', 'Licence Adulte', 990000002, 'En attente', 'fiche_attestation',  'mail_renouvellement',      'Adulte', 'L', 'Adultes (1)',                false, false, NULL, NULL),
    ('ines',    'f5eed000-0000-4000-8000-000000000003', 'ines.demo@example.com',         'Inès',    'Démo',    '1995-11-20', 'F', '12 rue du Test',     '0600000003', 'Licence Adulte', 990000003, 'Actif',      'certificat_medical', 'certificat_renouvellement', 'Adulte', 'S', 'Adultes Entraînement Niv 4', true,  true,  270, NULL),
    ('noe',     'f5eed000-0000-4000-8000-000000000004', NULL,                            'Noé',     'Factice', '2010-05-09', 'M', '13 rue du Test',     NULL,         'Licence Jeune',  990000004, 'Actif',      'certificat_medical', 'certificat_renouvellement', 'U17',    'M', '14 – 17 ans (1) Mardi 19h00', true,  true,  225, 'Parent fictif 06 00 00 00 04'),
    ('manon',   'f5eed000-0000-4000-8000-000000000005', NULL,                            'Manon',   'Fictive', '2014-01-25', 'F', '14 rue du Test',     NULL,         'Licence Jeune',  990000005, 'Inactif',    'non',                'non',                      'U13',    'S', '10 – 13 ans Mercredi 16h30', false, false, NULL, 'Parent fictif 06 00 00 00 05'),
    ('louis',   'f5eed000-0000-4000-8000-000000000006', NULL,                            'Louis',   'Témoin',  '2017-09-30', 'M', '15 rue du Test',     NULL,         'Licence Jeune',  990000006, 'En attente', NULL,                 NULL,                       'U10',    'XS','7 – 9 ans Lundi 17h30',      false, false, NULL, 'Parent fictif 06 00 00 00 06'),
    ('child1',  'f5eed000-0000-4000-8000-000000000011', NULL,                            'Léo',     'Adhérent-Test', '2017-04-12', 'M', '4 rue de l''Exemple', NULL,   'Licence Jeune',  990000011, 'Actif',      'certificat_medical', 'certificat_renouvellement', 'U10',    'XS','7 – 9 ans Mercredi 15h00',   true,  true,  225, 'Paula Adhérent-Test 06 00 00 01 04'),
    ('child2',  'f5eed000-0000-4000-8000-000000000012', NULL,                            'Jade',    'Adhérent-Test', '2013-09-03', 'F', '4 rue de l''Exemple', NULL,   'Licence Jeune',  990000012, 'Actif',      'fiche_attestation',  'mail_renouvellement',      'U14',    'S', '10 – 13 ans Mercredi 16h30', true,  false, NULL, 'Paula Adhérent-Test 06 00 00 01 04')
),
a AS (
  INSERT INTO seed_actors (key, id)
  SELECT p.key, p.id::uuid FROM p
  ON CONFLICT (key) DO NOTHING
)
INSERT INTO public.profiles (
  id, email, full_name, first_name, last_name, birth_date, gender, address, postal_code, city,
  mobile, licence_type, licence_number, status, medical_certificate, ffme_insurance, category,
  tshirt, club_group, registration_form, payment_done, payment_amount, emergency_contact,
  profile_completed_at
)
SELECT
  p.id::uuid, p.email, p.first_name || ' ' || p.last_name, p.first_name, p.last_name,
  p.birth_date::date, p.gender, p.address, '21800', 'Chevigny-Saint-Sauveur',
  p.mobile, p.licence_type, p.licence_number::bigint, p.status, p.medical_certificate,
  p.ffme_insurance, p.category, p.tshirt, p.club_group, p.registration_form,
  p.payment_done, p.payment_amount::numeric, p.emergency_contact,
  now()
FROM p
ON CONFLICT DO NOTHING;

-- Parent → enfants (compte « adhérent » de test)
INSERT INTO public.parent_access (id, parent_id, child_id, access_type)
SELECT v.id::uuid, par.id, ch.id, v.access_type::public.access_type
FROM (VALUES
  ('f5eed007-0000-4000-8000-000000000001', 'child1', 'full'),
  ('f5eed007-0000-4000-8000-000000000002', 'child2', 'register')
) AS v(id, child_key, access_type)
JOIN seed_actors par ON par.key = 'parent'
JOIN seed_actors ch  ON ch.key  = v.child_key
ON CONFLICT DO NOTHING;

-- Initiateur de test : encadre deux groupes jeunes (les groupes existent déjà)
-- Motifs LIKE : « _ » remplace le tiret demi-cadratin des noms de groupes.
INSERT INTO public.group_instructors (id, group_id, user_id)
SELECT v.id::uuid, g.id, ini.id
FROM (VALUES
  ('f5eed008-0000-4000-8000-000000000001', '7 _ 9 ans Mercredi 15h00'),
  ('f5eed008-0000-4000-8000-000000000002', '10 _ 13 ans Mercredi 16h30')
) AS v(id, group_pattern)
JOIN public.groups g ON g.name LIKE v.group_pattern
JOIN seed_actors ini ON ini.key = 'initiateur'
ON CONFLICT DO NOTHING;

-- ─── Inscriptions aux groupes existants (statuts variés) ────────────────────
INSERT INTO public.group_members (
  id, group_id, user_id, enrolled_by, enrolled_at, status, admin_note, reviewed_at, reviewed_by
)
SELECT
  v.id::uuid,
  g.id,
  m.id,
  e.id,
  now() - make_interval(days => v.days_ago),
  v.status::public.registration_status,
  v.admin_note,
  CASE WHEN v.status <> 'pending' THEN now() - make_interval(days => v.days_ago - 1) END,
  CASE WHEN v.status <> 'pending' THEN adm.id END
FROM (VALUES
  ('f5eed004-0000-4000-8000-000000000001', 'camille',    'Adultes (1)',                      NULL,     'confirmed', 40, NULL),
  ('f5eed004-0000-4000-8000-000000000002', 'hugo',       'Adultes (1)',                      NULL,     'pending',    3, NULL),
  ('f5eed004-0000-4000-8000-000000000003', 'ines',       'Adultes Entra%nement Niv 4',       NULL,     'confirmed', 55, NULL),
  ('f5eed004-0000-4000-8000-000000000004', 'noe',        '14 _ 17 ans (1) Mardi 19h00',      NULL,     'confirmed', 35, NULL),
  ('f5eed004-0000-4000-8000-000000000005', 'manon',      '10 _ 13 ans Mercredi 16h30',       NULL,     'cancelled', 20, 'Désistement (donnée fictive)'),
  ('f5eed004-0000-4000-8000-000000000006', 'louis',      '7 _ 9 ans Lundi 17h30',            NULL,     'pending',    5, NULL),
  ('f5eed004-0000-4000-8000-000000000007', 'parent',     'Adultes (1)',                      NULL,     'confirmed', 30, NULL),
  ('f5eed004-0000-4000-8000-000000000008', 'initiateur', 'Adultes (1)',                      NULL,     'confirmed', 60, NULL),
  ('f5eed004-0000-4000-8000-000000000009', 'child1',     '7 _ 9 ans Mercredi 15h00',         'parent', 'confirmed', 25, NULL),
  ('f5eed004-0000-4000-8000-000000000010', 'child2',     '10 _ 13 ans Mercredi 16h30',       'parent', 'pending',    2, NULL),
  ('f5eed004-0000-4000-8000-000000000011', 'camille',    'Escalade famille Samedi 19h00',    NULL,     'confirmed', 10, NULL)
) AS v(id, member_key, group_pattern, enrolled_by_key, status, days_ago, admin_note)
JOIN seed_actors m ON m.key = v.member_key
JOIN public.groups g ON g.name LIKE v.group_pattern
LEFT JOIN seed_actors e   ON e.key   = v.enrolled_by_key
LEFT JOIN seed_actors adm ON adm.key = 'admin'
ON CONFLICT DO NOTHING;

-- ─── Événements (sorties) passés et à venir ─────────────────────────────────
-- Dates relatives au premier passage du seed (puis figées : DO NOTHING).
INSERT INTO public.events (
  id, title, starts_at, slug, location, category, difficulty, max_participants, price, description
) VALUES
  ('f5eed001-0000-4000-8000-000000000001', 'Sortie bloc à Fontainebleau (fictive)',
   now() - interval '45 days', 'seed-sortie-fontainebleau', 'Fontainebleau (77)',
   'Falaise', 'Intermédiaire', 12, 0,
   'Journée de bloc en forêt de Fontainebleau. Événement fictif de test, passé.'),
  ('f5eed001-0000-4000-8000-000000000002', 'Sortie falaise de Saffres (fictive)',
   now() + interval '21 days', 'seed-sortie-saffres', 'Saffres (21)',
   'Falaise', 'Débutant', 10, 15,
   'Sortie en falaise pour grimpeurs débutants et confirmés. Événement fictif de test, à venir.'),
  ('f5eed001-0000-4000-8000-000000000003', 'Compétition jeunes départementale (fictive)',
   now() + interval '60 days', 'seed-competition-jeunes', 'Dijon (21)',
   'Compétition', NULL, 20, 8,
   'Compétition départementale jeunes. Événement fictif de test, à venir.'),
  ('f5eed001-0000-4000-8000-000000000004', 'Soirée initiation bloc (fictive)',
   now() - interval '14 days', 'seed-soiree-initiation', 'Salle ASC Escalade',
   'Initiation', 'Débutant', 8, 5,
   'Soirée découverte du bloc en salle. Événement fictif de test, passé.')
ON CONFLICT DO NOTHING;

INSERT INTO public.registrations (
  id, user_id, event_id, status, registered_by, notes, registered_at, reviewed_at, reviewed_by
)
SELECT
  v.id::uuid,
  u.id,
  v.event_id::uuid,
  v.status::public.registration_status,
  rb.id,
  v.notes,
  now() - make_interval(days => v.days_ago),
  CASE WHEN v.status <> 'pending' THEN now() - make_interval(days => v.days_ago - 1) END,
  CASE WHEN v.status <> 'pending' THEN adm.id END
FROM (VALUES
  -- Fontainebleau (passé)
  ('f5eed005-0000-4000-8000-000000000001', 'camille', 'f5eed001-0000-4000-8000-000000000001', 'confirmed', NULL,     NULL,                 60),
  ('f5eed005-0000-4000-8000-000000000002', 'ines',    'f5eed001-0000-4000-8000-000000000001', 'confirmed', NULL,     NULL,                 58),
  ('f5eed005-0000-4000-8000-000000000003', 'parent',  'f5eed001-0000-4000-8000-000000000001', 'confirmed', NULL,     NULL,                 57),
  ('f5eed005-0000-4000-8000-000000000004', 'hugo',    'f5eed001-0000-4000-8000-000000000001', 'cancelled', NULL,     'Indisponible',       56),
  -- Saffres (à venir)
  ('f5eed005-0000-4000-8000-000000000005', 'camille',    'f5eed001-0000-4000-8000-000000000002', 'confirmed', NULL,  NULL,                 12),
  ('f5eed005-0000-4000-8000-000000000006', 'parent',     'f5eed001-0000-4000-8000-000000000002', 'pending',   NULL,  'Covoiturage possible', 4),
  ('f5eed005-0000-4000-8000-000000000007', 'initiateur', 'f5eed001-0000-4000-8000-000000000002', 'confirmed', NULL,  'Encadrement',        10),
  -- Compétition jeunes (à venir)
  ('f5eed005-0000-4000-8000-000000000008', 'child1', 'f5eed001-0000-4000-8000-000000000003', 'pending',   'parent', NULL,                 3),
  ('f5eed005-0000-4000-8000-000000000009', 'child2', 'f5eed001-0000-4000-8000-000000000003', 'confirmed', 'parent', NULL,                 9),
  ('f5eed005-0000-4000-8000-000000000010', 'noe',    'f5eed001-0000-4000-8000-000000000003', 'confirmed', NULL,     NULL,                 8),
  -- Soirée initiation (passée)
  ('f5eed005-0000-4000-8000-000000000011', 'louis', 'f5eed001-0000-4000-8000-000000000004', 'cancelled', NULL, 'Malade',                 20),
  ('f5eed005-0000-4000-8000-000000000012', 'hugo',  'f5eed001-0000-4000-8000-000000000004', 'confirmed', NULL, 'Premier essai',           18)
) AS v(id, user_key, event_id, status, registered_by_key, notes, days_ago)
JOIN seed_actors u ON u.key = v.user_key
LEFT JOIN seed_actors rb  ON rb.key  = v.registered_by_key
LEFT JOIN seed_actors adm ON adm.key = 'admin'
ON CONFLICT DO NOTHING;

-- ─── HelloAsso : formulaires fictifs + paiements ────────────────────────────
-- Cohérents avec profiles.payment_done / payment_amount posés plus haut.
INSERT INTO public.helloasso_forms (id, form_slug, form_type, label, active, season) VALUES
  ('f5eed002-0000-4000-8000-000000000001', 'seed-adhesion-2026-2027', 'Membership', 'Adhésion saison 2026-2027 (fictif)', true, '2026-2027'),
  ('f5eed002-0000-4000-8000-000000000002', 'seed-adhesion-2025-2026', 'Membership', 'Adhésion saison 2025-2026 (fictif, archivé)', false, '2025-2026')
-- Saison réimposée au rejeu : si le seed a été chargé avant la migration 20261025, celle-ci l'a déduite de created_at.
ON CONFLICT (id) DO UPDATE SET season = EXCLUDED.season;

INSERT INTO public.profile_payments (id, profile_id, form_id, helloasso_order_id, amount, paid_at)
SELECT v.id::uuid, p.id, v.form_id::uuid, v.order_id, v.amount, now() - make_interval(days => v.days_ago)
FROM (VALUES
  ('f5eed003-0000-4000-8000-000000000001', 'camille', 'f5eed002-0000-4000-8000-000000000001', 'SEED-ORDER-0001', 240, 20),
  ('f5eed003-0000-4000-8000-000000000002', 'ines',    'f5eed002-0000-4000-8000-000000000001', 'SEED-ORDER-0002', 270, 33),
  ('f5eed003-0000-4000-8000-000000000003', 'noe',     'f5eed002-0000-4000-8000-000000000001', 'SEED-ORDER-0003', 225, 28),
  ('f5eed003-0000-4000-8000-000000000004', 'child1',  'f5eed002-0000-4000-8000-000000000001', 'SEED-ORDER-0004', 225, 15),
  ('f5eed003-0000-4000-8000-000000000005', 'camille', 'f5eed002-0000-4000-8000-000000000002', 'SEED-ORDER-0000', 235, 400)
) AS v(id, profile_key, form_id, order_id, amount, days_ago)
JOIN seed_actors p ON p.key = v.profile_key
ON CONFLICT DO NOTHING;

-- ─── Notifications (journal d'e-mails fictifs) ──────────────────────────────
INSERT INTO public.notification_logs (id, recipient_id, type, subject, body, metadata, sent_at, created_at)
SELECT
  v.id::uuid, r.id, v.type, v.subject, v.body, v.metadata::jsonb,
  CASE WHEN v.sent THEN now() - make_interval(days => v.days_ago) END,
  now() - make_interval(days => v.days_ago)
FROM (VALUES
  ('f5eed006-0000-4000-8000-000000000001', 'parent',  'enrollment_pending',
   'Demande d''inscription reçue',
   'Bonjour, votre demande d''inscription a bien été reçue et sera examinée par le bureau. (message fictif)',
   '{"seed": true, "group": "7 – 9 ans Mercredi 15h00"}', true, 25),
  ('f5eed006-0000-4000-8000-000000000002', 'parent',  'enrollment_confirmed',
   'Inscription confirmée',
   'Bonjour, l''inscription a été confirmée. À bientôt sur les murs ! (message fictif)',
   '{"seed": true, "group": "7 – 9 ans Mercredi 15h00"}', true, 24),
  ('f5eed006-0000-4000-8000-000000000003', 'camille', 'enrollment_confirmed',
   'Inscription confirmée',
   'Bonjour Camille, votre inscription au groupe Adultes (1) est confirmée. (message fictif)',
   '{"seed": true, "group": "Adultes (1)"}', true, 39),
  ('f5eed006-0000-4000-8000-000000000004', 'hugo',    'enrollment_pending',
   'Demande d''inscription reçue',
   'Bonjour Hugo, votre demande est en attente de validation. (message fictif)',
   '{"seed": true, "group": "Adultes (1)"}', false, 3),
  ('f5eed006-0000-4000-8000-000000000005', 'ines',    'event_registration_confirmed',
   'Inscription à la sortie confirmée',
   'Bonjour Inès, votre inscription à la sortie de Fontainebleau est confirmée. (message fictif)',
   '{"seed": true, "event": "seed-sortie-fontainebleau"}', true, 57)
) AS v(id, recipient_key, type, subject, body, metadata, sent, days_ago)
JOIN seed_actors r ON r.key = v.recipient_key
ON CONFLICT DO NOTHING;

COMMIT;
