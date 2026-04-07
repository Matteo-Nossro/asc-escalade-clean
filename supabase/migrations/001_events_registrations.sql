-- Migration 001 : Adaptation des tables existantes pour les inscriptions HelloAsso via Storyblok
--
-- Les tables `events` et `registrations` existent déjà dans le schéma public.
-- Cette migration ajoute uniquement les colonnes manquantes et ajuste les contraintes.

-- ============================================================
-- Table events : colonnes Storyblok + compteur de participants
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS storyblok_uuid       TEXT,
  ADD COLUMN IF NOT EXISTS event_date           DATE,
  ADD COLUMN IF NOT EXISTS current_participants INT NOT NULL DEFAULT 0;

-- Supprime la contrainte UNIQUE globale sur slug (elle bloque l'upsert Storyblok
-- quand un event identique a été créé manuellement sans storyblok_uuid)
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_slug_key;

-- Remplace par un index partiel : slug unique uniquement parmi les events Storyblok.
-- Les events manuels (storyblok_uuid IS NULL) peuvent partager un slug sans conflit.
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_storyblok_idx
  ON public.events(slug)
  WHERE storyblok_uuid IS NOT NULL;

-- Index unique sur storyblok_uuid (pour les upserts ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS events_storyblok_uuid_idx
  ON public.events(storyblok_uuid)
  WHERE storyblok_uuid IS NOT NULL;

-- ============================================================
-- Table registrations : inscriptions sans compte (HelloAsso)
-- ============================================================

-- user_id devient nullable : les inscrits via HelloAsso n'ont pas forcément un compte Supabase
ALTER TABLE public.registrations
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS user_name          TEXT,
  ADD COLUMN IF NOT EXISTS user_email         TEXT,
  ADD COLUMN IF NOT EXISTS helloasso_order_id TEXT;

-- ============================================================
-- RPC check_and_register
-- Vérifie atomiquement les places disponibles puis inscrit.
-- Lève 'event_full' si l'événement est complet.
-- Retourne l'UUID de la registration créée.
-- ============================================================
CREATE OR REPLACE FUNCTION check_and_register(
  p_event_id UUID,
  p_name     TEXT,
  p_email    TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_event           public.events%ROWTYPE;
  v_registration_id UUID;
BEGIN
  -- Verrou exclusif sur la ligne de l'event (atomique)
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  -- Vérification des places (0 = illimité)
  IF v_event.max_participants > 0
     AND v_event.current_participants >= v_event.max_participants THEN
    RAISE EXCEPTION 'event_full';
  END IF;

  -- Inscription (user_id NULL = inscription sans compte)
  INSERT INTO public.registrations (event_id, user_id, user_name, user_email, status)
  VALUES (p_event_id, NULL, p_name, p_email, 'pending'::registration_status)
  RETURNING id INTO v_registration_id;

  -- Mise à jour du compteur
  UPDATE public.events
  SET current_participants = current_participants + 1
  WHERE id = p_event_id;

  RETURN v_registration_id;
END;
$$;
