-- ============================================================================
-- 2026-01-01 — Rattrapage du schéma de base (créé à la main en prod)
-- ============================================================================
-- Source : dump RÉEL du schéma public de prod (prod_schema.sql, non versionné).
-- Les définitions ci-dessous sont celles du dump, à l'identique.
--
-- Ce fichier ne contient QUE ce que les migrations suivantes ne créent pas :
--   • 20260409 : retire profiles_id_fkey et NOT NULL sur profiles.email
--   • 20260411 : seed des groupes
--   • 20260426 : policies profiles_select_self_or_family, profiles_select_staff,
--                profiles_update_family, parent_access_insert_parent, vue
--                member_directory, fonction + trigger registrations_block_user_status
--   • 20260520 : profiles.payment_amount, policy profiles_update_staff,
--                helloasso_forms, profile_payments (+ policies), fonction +
--                trigger profiles_block_payment
--   → tous ces objets sont donc volontairement ABSENTS d'ici.
--
-- Il pose en revanche ce que ces migrations attendent déjà en place :
--   • profiles avec la FK profiles_id_fkey vers auth.users (20260409 fait
--     DROP CONSTRAINT sans IF EXISTS) ;
--   • is_admin_or_secretary() (20260426, 20260520), les tables parent_access,
--     registrations, groups, group_*, les types access_type / registration_status ;
--   • les privilèges par défaut du schéma public (les tables / la vue créées
--     ensuite par 20260426 et 20260520 héritent ainsi des mêmes droits qu'en prod).
--
-- Idempotence : CREATE ... IF NOT EXISTS, CREATE OR REPLACE, tests sur pg_type,
-- DROP POLICY IF EXISTS + CREATE POLICY. Sur la prod (objets déjà présents) il
-- n'a aucun effet de structure ; la FK profiles_id_fkey n'est posée que si la
-- table profiles est créée par ce fichier.
--
-- Hors dump (schéma auth) : le trigger on_auth_user_created sur auth.users,
-- relevé en prod via pg_trigger, est repris à l'identique (section 7).
-- Données (roles, ...) : absentes du dump, donc non seedées ici.
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extensions (préinstallées sur Supabase ; IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Droits par défaut du schéma public (identiques au dump)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Types
-- ─────────────────────────────────────────────────────────────────────────────

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE n.nspname = 'public' AND t.typname = 'access_type') THEN
    CREATE TYPE "public"."access_type" AS ENUM ('read', 'register', 'full');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE n.nspname = 'public' AND t.typname = 'registration_status') THEN
    CREATE TYPE "public"."registration_status" AS ENUM ('pending', 'confirmed', 'cancelled');
  END IF;
END $do$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Tables (ordre des dépendances ; contraintes nommées comme dans le dump)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "firstName" "text",
    "lastName" "text",
    "birthDate" timestamp without time zone,
    "sex" "text",
    "phone" "text",
    "licenseNumber" "text",
    "licenceType" "text",
    "address" "text",
    "cp" integer,
    "city" "text",
    "role" "text" DEFAULT 'user'::"text",
    "paid" boolean DEFAULT false,
    "Observation" "text",
    "Active" boolean DEFAULT true,
    "createdAt" timestamp without time zone DEFAULT "now"(),
    "updatedAt" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "User_email_key" UNIQUE ("email"),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "slug" "text",
    "location" "text",
    "category" "text",
    "difficulty" "text",
    "max_participants" integer,
    "price" numeric(8,2),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "events_slug_key" UNIQUE ("slug")
);

CREATE TABLE IF NOT EXISTS "public"."roles" (
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("code")
);

CREATE TABLE IF NOT EXISTS "public"."temps_user" (
    "Numero_Licence_Origine" bigint NOT NULL,
    "Nom_Final" "text",
    "Prenom_Final" "text",
    "Date_Naissance_Final" "date",
    "Sexe_Final" "text",
    "Adresse_Final" "text",
    "CodePostal_Final" bigint,
    "Ville_Final" "text",
    "Telephone_Final" "text",
    "Portable_Final" "text",
    "Email_Final" "text",
    "TypeLicence_Final" "text",
    "Passeport_Final" "text",
    "Observation_Final" "text",
    "Groupe_Final" "text",
    CONSTRAINT "temps user_pkey" PRIMARY KEY ("Numero_Licence_Origine")
);

-- profiles : sans payment_amount (ajouté par 20260520). La FK profiles_id_fkey
-- (supprimée en prod par 20260409) n'est posée que si la table est créée ici,
-- pour que 20260409 puisse la supprimer. email nullable comme dans le dump.
DO $do$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    CREATE TABLE "public"."profiles" (
        "id" "uuid" NOT NULL,
        "email" "text",
        "full_name" "text" DEFAULT ''::"text" NOT NULL,
        "licence_number" bigint,
        "first_name" "text",
        "last_name" "text",
        "birth_date" "date",
        "gender" "text",
        "address" "text",
        "postal_code" "text",
        "city" "text",
        "phone" "text",
        "mobile" "text",
        "licence_type" "text",
        "passport" "text",
        "notes" "text",
        "club_group" "text",
        "avatar_url" "text",
        "emergency_contact" "text",
        "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
        "status" "text" DEFAULT 'Actif'::"text" NOT NULL,
        "payment_done" boolean DEFAULT false,
        "medical_certificate" "text",
        "registration_form" boolean DEFAULT false,
        "ffme_insurance" "text",
        "category" "text",
        "tshirt" "text",
        CONSTRAINT "profiles_ffme_insurance_check" CHECK ((("ffme_insurance" IS NULL) OR ("ffme_insurance" = ANY (ARRAY['certificat_renouvellement'::"text", 'mail_renouvellement'::"text", 'non'::"text"])))),
        CONSTRAINT "profiles_medical_certificate_check" CHECK ((("medical_certificate" IS NULL) OR ("medical_certificate" = ANY (ARRAY['fiche_attestation'::"text", 'certificat_medical'::"text", 'non'::"text"])))),
        CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['Actif'::"text", 'Inactif'::"text", 'En attente'::"text"]))),
        CONSTRAINT "profiles_licence_number_key" UNIQUE ("licence_number"),
        CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
    );
  END IF;
END $do$;

CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "max_members" integer DEFAULT 20 NOT NULL,
    "min_birth_date" "date",
    "max_birth_date" "date",
    "level" "text",
    "referent_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "price" numeric(8,2) DEFAULT NULL::numeric,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "groups_referent_id_fkey" FOREIGN KEY ("referent_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "public"."group_instructors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    CONSTRAINT "group_instructors_group_id_user_id_key" UNIQUE ("group_id", "user_id"),
    CONSTRAINT "group_instructors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "group_instructors_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE,
    CONSTRAINT "group_instructors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "enrolled_by" "uuid",
    "enrolled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."registration_status" DEFAULT 'pending'::"public"."registration_status" NOT NULL,
    "admin_note" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id"),
    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "group_members_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE,
    CONSTRAINT "group_members_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."group_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    CONSTRAINT "group_schedules_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "group_schedules_day_of_week_check" CHECK ((("day_of_week" >= 1) AND ("day_of_week" <= 7))),
    CONSTRAINT "group_schedules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "group_schedules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "metadata" "jsonb",
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_logs_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."parent_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "child_id" "uuid" NOT NULL,
    "access_type" "public"."access_type" DEFAULT 'read'::"public"."access_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "parent_access_check" CHECK (("parent_id" <> "child_id")),
    CONSTRAINT "parent_access_parent_id_child_id_key" UNIQUE ("parent_id", "child_id"),
    CONSTRAINT "parent_access_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "parent_access_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "parent_access_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "status" "public"."registration_status" DEFAULT 'pending'::"public"."registration_status" NOT NULL,
    "registered_by" "uuid",
    "notes" "text",
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_note" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "registrations_user_id_event_id_key" UNIQUE ("user_id", "event_id"),
    CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE,
    CONSTRAINT "registrations_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "registrations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_code" "text" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid",
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_roles_user_id_role_code_key" UNIQUE ("user_id", "role_code"),
    CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "user_roles_role_code_fkey" FOREIGN KEY ("role_code") REFERENCES "public"."roles"("code") ON DELETE CASCADE,
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Index
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_events_slug" ON "public"."events" USING "btree" ("slug");
CREATE INDEX IF NOT EXISTS "idx_events_starts_at" ON "public"."events" USING "btree" ("starts_at");
CREATE INDEX IF NOT EXISTS "idx_group_instructors_group" ON "public"."group_instructors" USING "btree" ("group_id");
CREATE INDEX IF NOT EXISTS "idx_group_members_group" ON "public"."group_members" USING "btree" ("group_id");
CREATE INDEX IF NOT EXISTS "idx_group_members_user" ON "public"."group_members" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_group_schedules_group" ON "public"."group_schedules" USING "btree" ("group_id");
CREATE INDEX IF NOT EXISTS "idx_notification_logs_recipient" ON "public"."notification_logs" USING "btree" ("recipient_id");
CREATE INDEX IF NOT EXISTS "idx_notification_logs_sent" ON "public"."notification_logs" USING "btree" ("sent_at");
CREATE INDEX IF NOT EXISTS "idx_parent_access_child" ON "public"."parent_access" USING "btree" ("child_id");
CREATE INDEX IF NOT EXISTS "idx_parent_access_parent" ON "public"."parent_access" USING "btree" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");
CREATE INDEX IF NOT EXISTS "idx_profiles_licence" ON "public"."profiles" USING "btree" ("licence_number");
CREATE INDEX IF NOT EXISTS "idx_registrations_event" ON "public"."registrations" USING "btree" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_registrations_status" ON "public"."registrations" USING "btree" ("status");
CREATE INDEX IF NOT EXISTS "idx_registrations_user" ON "public"."registrations" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role_code");
CREATE INDEX IF NOT EXISTS "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Fonctions (corps identiques au dump). Créées après les tables : les
--    fonctions SQL (has_role, is_admin_or_secretary) sont validées à la création.
--    profiles_block_payment_change / registrations_block_user_status_change :
--    créées par 20260520 / 20260426.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."enrich_profile_from_temps_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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

-- Appelée par le trigger on_auth_user_created sur auth.users (section 7).
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."has_role"("_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_code = _role
  );
$$;

CREATE OR REPLACE FUNCTION "public"."is_admin_or_secretary"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_code IN ('admin', 'secretary')
  );
$$;

GRANT ALL ON FUNCTION "public"."enrich_profile_from_temps_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."enrich_profile_from_temps_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enrich_profile_from_temps_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."has_role"("_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_role" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_admin_or_secretary"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_secretary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_secretary"() TO "service_role";

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Triggers (profiles_block_payment : 20260520 ; registrations_block_user_status : 20260426)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER "on_events_updated" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "on_groups_updated" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "on_profile_enrich" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."enrich_profile_from_temps_user"();
CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "on_registrations_updated" BEFORE UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Trigger sur auth.users (schéma auth, absent du dump) : définition relevée en prod
-- le 2026-10-25 via pg_trigger, reprise à l'identique.
CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS + policies (DROP IF EXISTS puis CREATE = idempotent)
--    Absentes ici car créées par les migrations suivantes : profiles_select_self_or_family,
--    profiles_select_staff, profiles_update_family, parent_access_insert_parent (20260426) ;
--    profiles_update_staff, helloasso_forms_*, profile_payments_* (20260520).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."User"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_instructors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_members"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_schedules"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."groups"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."parent_access"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."registrations"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roles"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."temps_user"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_roles"        ENABLE ROW LEVEL SECURITY;

-- events
DROP POLICY IF EXISTS "events_manage_staff" ON "public"."events";
CREATE POLICY "events_manage_staff" ON "public"."events" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());
DROP POLICY IF EXISTS "events_select_public" ON "public"."events";
CREATE POLICY "events_select_public" ON "public"."events" FOR SELECT TO "authenticated", "anon" USING (true);

-- group_instructors
DROP POLICY IF EXISTS "group_instructors_manage_staff" ON "public"."group_instructors";
CREATE POLICY "group_instructors_manage_staff" ON "public"."group_instructors" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());
DROP POLICY IF EXISTS "group_instructors_select_public" ON "public"."group_instructors";
CREATE POLICY "group_instructors_select_public" ON "public"."group_instructors" FOR SELECT TO "authenticated", "anon" USING (true);

-- group_members
DROP POLICY IF EXISTS "group_members_delete_own" ON "public"."group_members";
CREATE POLICY "group_members_delete_own" ON "public"."group_members" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("enrolled_by" = "auth"."uid"())));

DROP POLICY IF EXISTS "group_members_insert_own" ON "public"."group_members";
CREATE POLICY "group_members_insert_own" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR (("enrolled_by" = "auth"."uid"()) AND ("user_id" IN ( SELECT "parent_access"."child_id"
   FROM "public"."parent_access"
  WHERE (("parent_access"."parent_id" = "auth"."uid"()) AND ("parent_access"."access_type" = ANY (ARRAY['register'::"public"."access_type", 'full'::"public"."access_type"]))))))));

DROP POLICY IF EXISTS "group_members_manage_staff" ON "public"."group_members";
CREATE POLICY "group_members_manage_staff" ON "public"."group_members" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());

DROP POLICY IF EXISTS "group_members_select_own" ON "public"."group_members";
CREATE POLICY "group_members_select_own" ON "public"."group_members" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("enrolled_by" = "auth"."uid"()) OR ("user_id" IN ( SELECT "parent_access"."child_id"
   FROM "public"."parent_access"
  WHERE ("parent_access"."parent_id" = "auth"."uid"())))));

DROP POLICY IF EXISTS "group_members_select_staff" ON "public"."group_members";
CREATE POLICY "group_members_select_staff" ON "public"."group_members" FOR SELECT TO "authenticated" USING ("public"."is_admin_or_secretary"());

-- group_schedules
DROP POLICY IF EXISTS "group_schedules_manage_staff" ON "public"."group_schedules";
CREATE POLICY "group_schedules_manage_staff" ON "public"."group_schedules" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());
DROP POLICY IF EXISTS "group_schedules_select_public" ON "public"."group_schedules";
CREATE POLICY "group_schedules_select_public" ON "public"."group_schedules" FOR SELECT TO "authenticated", "anon" USING (true);

-- groups
DROP POLICY IF EXISTS "groups_manage_staff" ON "public"."groups";
CREATE POLICY "groups_manage_staff" ON "public"."groups" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());
DROP POLICY IF EXISTS "groups_select_public" ON "public"."groups";
CREATE POLICY "groups_select_public" ON "public"."groups" FOR SELECT TO "authenticated", "anon" USING (true);

-- notification_logs
DROP POLICY IF EXISTS "notifications_manage_staff" ON "public"."notification_logs";
CREATE POLICY "notifications_manage_staff" ON "public"."notification_logs" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());
DROP POLICY IF EXISTS "notifications_select_own" ON "public"."notification_logs";
CREATE POLICY "notifications_select_own" ON "public"."notification_logs" FOR SELECT TO "authenticated" USING (("recipient_id" = "auth"."uid"()));

-- parent_access (parent_access_insert_parent : 20260426)
DROP POLICY IF EXISTS "parent_access_delete_parent" ON "public"."parent_access";
CREATE POLICY "parent_access_delete_parent" ON "public"."parent_access" FOR DELETE TO "authenticated" USING (("parent_id" = "auth"."uid"()));
DROP POLICY IF EXISTS "parent_access_select_own" ON "public"."parent_access";
CREATE POLICY "parent_access_select_own" ON "public"."parent_access" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) OR ("child_id" = "auth"."uid"())));
DROP POLICY IF EXISTS "parent_access_staff" ON "public"."parent_access";
CREATE POLICY "parent_access_staff" ON "public"."parent_access" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());

-- profiles (select_self_or_family / select_staff / update_family : 20260426 ; update_staff : 20260520)
DROP POLICY IF EXISTS "profiles_delete_staff" ON "public"."profiles";
CREATE POLICY "profiles_delete_staff" ON "public"."profiles" FOR DELETE TO "authenticated" USING ("public"."is_admin_or_secretary"());
DROP POLICY IF EXISTS "profiles_update_own" ON "public"."profiles";
CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));

-- registrations
DROP POLICY IF EXISTS "registrations_count_anon" ON "public"."registrations";
CREATE POLICY "registrations_count_anon" ON "public"."registrations" FOR SELECT TO "anon" USING (true);

DROP POLICY IF EXISTS "registrations_insert_own" ON "public"."registrations";
CREATE POLICY "registrations_insert_own" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR (("registered_by" = "auth"."uid"()) AND ("user_id" IN ( SELECT "parent_access"."child_id"
   FROM "public"."parent_access"
  WHERE (("parent_access"."parent_id" = "auth"."uid"()) AND ("parent_access"."access_type" = ANY (ARRAY['register'::"public"."access_type", 'full'::"public"."access_type"]))))))));

DROP POLICY IF EXISTS "registrations_manage_staff" ON "public"."registrations";
CREATE POLICY "registrations_manage_staff" ON "public"."registrations" TO "authenticated" USING ("public"."is_admin_or_secretary"()) WITH CHECK ("public"."is_admin_or_secretary"());

DROP POLICY IF EXISTS "registrations_select_own" ON "public"."registrations";
CREATE POLICY "registrations_select_own" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("registered_by" = "auth"."uid"()) OR ("user_id" IN ( SELECT "parent_access"."child_id"
   FROM "public"."parent_access"
  WHERE ("parent_access"."parent_id" = "auth"."uid"())))));

DROP POLICY IF EXISTS "registrations_select_staff" ON "public"."registrations";
CREATE POLICY "registrations_select_staff" ON "public"."registrations" FOR SELECT TO "authenticated" USING ("public"."is_admin_or_secretary"());

DROP POLICY IF EXISTS "registrations_update_own" ON "public"."registrations";
CREATE POLICY "registrations_update_own" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("registered_by" = "auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("registered_by" = "auth"."uid"())));

-- roles
DROP POLICY IF EXISTS "roles_admin_manage" ON "public"."roles";
CREATE POLICY "roles_admin_manage" ON "public"."roles" TO "authenticated" USING ("public"."has_role"('admin'::"text")) WITH CHECK ("public"."has_role"('admin'::"text"));
DROP POLICY IF EXISTS "roles_select_all" ON "public"."roles";
CREATE POLICY "roles_select_all" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);

-- user_roles
DROP POLICY IF EXISTS "user_roles_manage_admin" ON "public"."user_roles";
CREATE POLICY "user_roles_manage_admin" ON "public"."user_roles" TO "authenticated" USING ("public"."has_role"('admin'::"text")) WITH CHECK ("public"."has_role"('admin'::"text"));
DROP POLICY IF EXISTS "user_roles_select_own" ON "public"."user_roles";
CREATE POLICY "user_roles_select_own" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
DROP POLICY IF EXISTS "user_roles_select_staff" ON "public"."user_roles";
CREATE POLICY "user_roles_select_staff" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ("public"."is_admin_or_secretary"());

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Droits sur les tables (identiques au dump ; helloasso_forms, profile_payments
--    et member_directory héritent des privilèges par défaut posés plus haut)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";

GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";

GRANT ALL ON TABLE "public"."group_instructors" TO "anon";
GRANT ALL ON TABLE "public"."group_instructors" TO "authenticated";
GRANT ALL ON TABLE "public"."group_instructors" TO "service_role";

GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";

GRANT ALL ON TABLE "public"."group_schedules" TO "anon";
GRANT ALL ON TABLE "public"."group_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."group_schedules" TO "service_role";

GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";

GRANT ALL ON TABLE "public"."parent_access" TO "anon";
GRANT ALL ON TABLE "public"."parent_access" TO "authenticated";
GRANT ALL ON TABLE "public"."parent_access" TO "service_role";

GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";

GRANT ALL ON TABLE "public"."temps_user" TO "anon";
GRANT ALL ON TABLE "public"."temps_user" TO "authenticated";
GRANT ALL ON TABLE "public"."temps_user" TO "service_role";

GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";

COMMIT;
