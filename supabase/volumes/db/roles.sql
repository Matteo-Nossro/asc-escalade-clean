-- Définit les mots de passe des rôles internes Supabase.
-- Exécuté à l'initialisation du container supabase/postgres.
-- La variable POSTGRES_PASSWORD est injectée par l'env du container.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator           WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin     WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin  WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
