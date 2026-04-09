-- Migration : support des profils enfants sans compte auth
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Supprime la contrainte FK profiles.id → auth.users.id
--    Permet de créer des profils enfants avec un UUID autonome
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

-- 2. Rend l'email nullable
--    Les profils enfants n'ont pas d'adresse email
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
