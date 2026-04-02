-- ============================================================================
-- Migration 001 — Schéma complet ASC Escalade
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Fonction updated_at ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text        NOT NULL UNIQUE,
  full_name         text,
  first_name        text,
  last_name         text,
  birth_date        date,
  gender            text,
  address           text,
  postal_code       text,
  city              text,
  phone             text,
  mobile            text,
  licence_number    integer,
  licence_type      text,
  passport          text,
  notes             text,
  club_group        text,
  avatar_url        text,
  emergency_contact text,
  status            text        DEFAULT 'Actif' CHECK (status IN ('Actif', 'Inactif', 'En attente')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger : crée automatiquement un profil minimal à l'inscription Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── User roles ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_roles (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_code   text        NOT NULL CHECK (role_code IN ('admin', 'secretary', 'parent')),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role_code)
);

-- ─── Parent access ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.parent_access (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_type text        NOT NULL DEFAULT 'full' CHECK (access_type IN ('read', 'register', 'full')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

-- ─── Groups ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.groups (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text        NOT NULL,
  max_members     integer     NOT NULL DEFAULT 20,
  min_birth_date  date,
  max_birth_date  date,
  level           text,
  referent_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  description     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Group schedules ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_schedules (
  id           uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id     uuid    NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  day_of_week  integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time   time    NOT NULL,
  end_time     time    NOT NULL
);

-- ─── Group instructors ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_instructors (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id  uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE (group_id, user_id)
);

-- ─── Group members ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_members (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id     uuid        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  enrolled_at  timestamptz DEFAULT now(),
  status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_note   text,
  reviewed_at  timestamptz,
  reviewed_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (group_id, user_id)
);

-- ─── Events ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text        NOT NULL,
  starts_at        timestamptz NOT NULL,
  slug             text        UNIQUE,
  location         text,
  category         text,
  difficulty       text,
  max_participants integer,
  price            numeric(8,2),
  description      text,
  created_at       timestamptz DEFAULT now()
);

-- ─── Registrations ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.registrations (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id        uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  registered_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes           text,
  admin_note      text,
  reviewed_at     timestamptz,
  reviewed_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  registered_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- ─── Notification logs ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  type         text        NOT NULL,
  subject      text,
  body         text,
  metadata     jsonb,
  sent_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- Grants PostgREST
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- Row Level Security (RLS)
-- service_role bypass RLS automatiquement — les policies ci-dessous couvrent
-- les accès depuis l'app (rôle authenticated / anon).
-- ============================================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_access     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_schedules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Utilisateurs authentifiés peuvent lire tous les profils"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles
CREATE POLICY "Utilisateurs authentifiés peuvent lire les rôles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Groupes (lecture publique)
CREATE POLICY "Lecture publique des groupes"
  ON public.groups FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Lecture publique des créneaux"
  ON public.group_schedules FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Lecture publique des initiateurs"
  ON public.group_instructors FOR SELECT TO anon, authenticated USING (true);

-- Group members
CREATE POLICY "Authentifiés peuvent lire les inscriptions"
  ON public.group_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authentifiés peuvent s'inscrire"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = enrolled_by);

-- Events (lecture publique)
CREATE POLICY "Lecture publique des événements"
  ON public.events FOR SELECT TO anon, authenticated USING (true);

-- Registrations
CREATE POLICY "Authentifiés peuvent voir leurs inscriptions événement"
  ON public.registrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = registered_by);

-- Parent access
CREATE POLICY "Parents peuvent voir leurs liens"
  ON public.parent_access FOR SELECT TO authenticated
  USING (auth.uid() = parent_id);
