-- ════════════════════════════════════════════════════════════════════════════
-- Import des groupes ASC Escalade — saison de référence
-- day_of_week : 1=Lundi  2=Mardi  3=Mercredi  4=Jeudi  5=Vendredi  6=Samedi
-- Niveaux     : 1=Débutant  2=Intermédiaire  3=Confirmé  4=Compétition
-- min_birth_date = année de naissance la plus ancienne (ex : 2016-01-01)
-- max_birth_date = année de naissance la plus récente  (ex : 2018-12-31)
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── Remise à zéro ────────────────────────────────────────────────────────────
TRUNCATE public.group_schedules, public.group_members, public.group_instructors, public.groups RESTART IDENTITY CASCADE;

-- ─── 1. Baby 4 – 6 ans Mercredi 11h30 ───────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('Baby 4 – 6 ans Mercredi 11h30', 9, '2019-01-01', '2021-12-31', 'Débutant', 155)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 3, '11:30:00', '12:30:00' FROM g;

-- ─── 2. Baby 5 – 6 ans Mercredi 14h00 ───────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('Baby 5 – 6 ans Mercredi 14h00', 12, '2019-01-01', '2020-12-31', 'Intermédiaire', 155)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 3, '14:00:00', '15:00:00' FROM g;

-- ─── 3. Baby 5 – 6 ans Samedi 9h30 ──────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('Baby 5 – 6 ans Samedi 9h30', 9, '2019-01-01', '2020-12-31', 'Débutant', 155)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 6, '09:30:00', '10:30:00' FROM g;

-- ─── 4. 7 – 9 ans Lundi 17h30 ────────────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('7 – 9 ans Lundi 17h30', 12, '2016-01-01', '2018-12-31', 'Débutant', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 1, '17:30:00', '19:00:00' FROM g;

-- ─── 5. 7 – 9 ans Mardi 17h30 ────────────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('7 – 9 ans Mardi 17h30', 16, '2016-01-01', '2018-12-31', 'Intermédiaire', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 2, '17:30:00', '19:00:00' FROM g;

-- ─── 6. 7 – 9 ans Mercredi 15h00 ─────────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('7 – 9 ans Mercredi 15h00', 16, '2016-01-01', '2018-12-31', 'Intermédiaire', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 3, '15:00:00', '16:30:00' FROM g;

-- ─── 7. 7 – 9 ans Jeudi 17h30 (Débutant) ────────────────────────────────────
-- Deux groupes Jeudi 17h30 avec niveaux différents → ajout du niveau dans le nom
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('7 – 9 ans Jeudi 17h30 (Débutant)', 12, '2016-01-01', '2018-12-31', 'Débutant', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 4, '17:30:00', '19:00:00' FROM g;

-- ─── 8. 7 – 9 ans Jeudi 17h30 (Confirmé) ────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('7 – 9 ans Jeudi 17h30 (Confirmé)', 12, '2016-01-01', '2018-12-31', 'Confirmé', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 4, '17:30:00', '19:00:00' FROM g;

-- ─── 9. 10 – 13 ans Lundi 18h00 ──────────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('10 – 13 ans Lundi 18h00', 12, '2012-01-01', '2015-12-31', 'Intermédiaire', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 1, '18:00:00', '19:30:00' FROM g;

-- ─── 10. 10 – 13 ans Mercredi 16h30 ──────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('10 – 13 ans Mercredi 16h30', 16, '2012-01-01', '2015-12-31', 'Confirmé', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 3, '16:30:00', '18:30:00' FROM g;

-- ─── 11. 10 – 13 ans Mercredi 18h30 ──────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('10 – 13 ans Mercredi 18h30', 16, '2012-01-01', '2015-12-31', 'Débutant', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 3, '18:30:00', '20:00:00' FROM g;

-- ─── 12. 10 – 13 ans Vendredi 17h30 ──────────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('10 – 13 ans Vendredi 17h30', 16, '2012-01-01', '2015-12-31', 'Intermédiaire', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 5, '17:30:00', '19:00:00' FROM g;

-- ─── 13. 14 – 17 ans (1) Mardi 19h00 ────────────────────────────────────────
-- Niveaux 1 + 2 → on prend le plus faible = Débutant
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('14 – 17 ans (1) Mardi 19h00', 16, '2008-01-01', '2011-12-31', 'Débutant', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 2, '19:00:00', '21:00:00' FROM g;

-- ─── 14. 14 – 17 ans (1) Vendredi 19h00 ─────────────────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('14 – 17 ans (1) Vendredi 19h00', 16, '2008-01-01', '2011-12-31', 'Confirmé', 225)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 5, '19:00:00', '21:00:00' FROM g;

-- ─── 15. 10 – 13 ans Entraînement Niv 4 — 2 créneaux ─────────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('10 – 13 ans Entraînement Niv 4', 12, '2012-01-01', '2015-12-31', 'Compétition', 255)
  RETURNING id
),
s1 AS (
  INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
  SELECT id, 3, '16:15:00', '18:00:00' FROM g  -- Mercredi
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 5, '17:30:00', '19:30:00' FROM g;   -- Vendredi

-- ─── 16. 14 – 17 ans (1) Entraînement Niv 4 — 2 créneaux ────────────────────
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('14 – 17 ans (1) Entraînement Niv 4', 12, '2008-01-01', '2011-12-31', 'Compétition', 255)
  RETURNING id
),
s1 AS (
  INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
  SELECT id, 2, '18:30:00', '20:30:00' FROM g  -- Mardi
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 5, '18:30:00', '20:30:00' FROM g;   -- Vendredi

-- ─── 17. Adultes Entraînement Niv 4 — 2 créneaux ─────────────────────────────
-- "Nés avant le 01/09/2008" → max_birth_date = 2008-08-31, min_birth_date = NULL
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('Adultes Entraînement Niv 4', 20, NULL, '2008-08-31', 'Compétition', 270)
  RETURNING id
),
s1 AS (
  INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
  SELECT id, 1, '19:00:00', '21:00:00' FROM g  -- Lundi
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 4, '19:00:00', '21:30:00' FROM g;   -- Jeudi

-- ─── 18. Adultes (1) — 3 créneaux ────────────────────────────────────────────
-- effectif "/" → 100 comme convenu
-- "Nés avant le 01/09/2008" → max_birth_date = 2008-08-31, min_birth_date = NULL
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('Adultes (1)', 100, NULL, '2008-08-31', 'Tous niveaux', 240)
  RETURNING id
),
s1 AS (
  INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
  SELECT id, 1, '19:30:00', '22:00:00' FROM g  -- Lundi
),
s2 AS (
  INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
  SELECT id, 3, '20:00:00', '22:00:00' FROM g  -- Mercredi
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 5, '20:00:00', '22:30:00' FROM g;   -- Vendredi

-- ─── 19. Escalade famille Samedi 19h00 ───────────────────────────────────────
-- Effectif "sur inscription" → 100 par défaut, pas de restriction d'âge ni de tarif
WITH g AS (
  INSERT INTO public.groups (name, max_members, min_birth_date, max_birth_date, level, price)
  VALUES ('Escalade famille Samedi 19h00', 100, NULL, NULL, 'Tous niveaux', NULL)
  RETURNING id
)
INSERT INTO public.group_schedules (group_id, day_of_week, start_time, end_time)
SELECT id, 6, '19:00:00', '21:00:00' FROM g;

COMMIT;
