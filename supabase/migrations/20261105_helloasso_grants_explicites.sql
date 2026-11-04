-- ============================================================================
-- Migration D (securite-bdd) : droits explicites sur les tables HelloAsso
-- ============================================================================
-- Prérequis : 20261025 (tables helloasso_tokens et helloasso_sync_runs).
--
-- Pourquoi : « Automatically expose new tables » est désactivé (dev et prod) :
-- plus aucun droit n'est accordé automatiquement à anon, authenticated ni
-- service_role. 20261025 ne faisait que des REVOKE et s'appuyait sur les
-- privilèges par défaut pour service_role ; sans eux, la service role n'a aucun
-- accès à ces tables en prod. Cette migration repart de zéro (REVOKE ALL) puis
-- accorde, rôle par rôle, le strict nécessaire.
--
-- service_role : SELECT, INSERT, UPDATE sur les deux tables (jamais DELETE,
--   TRUNCATE, REFERENCES, TRIGGER).
--   * helloasso_tokens : lecture et mise à jour du jeton, et verrou
--     helloasso_acquire_token_lock (SECURITY INVOKER : INSERT ... ON CONFLICT
--     DO UPDATE exécuté avec les droits de service_role).
--   * helloasso_sync_runs : aucune écriture dans server/ aujourd'hui ; les droits
--     anticipent les écritures de la synchronisation (ligne `running`, puis fin
--     de passage).
-- authenticated : SELECT seul sur helloasso_sync_runs (policy staff
--   helloasso_sync_runs_select_staff), rien sur helloasso_tokens.
-- anon : rien.
--
-- EXECUTE de helloasso_acquire_token_lock pour service_role : déjà explicite
-- dans 20261025 (REVOKE PUBLIC/anon/authenticated puis GRANT service_role),
-- conservé par la migration B ; rien à refaire ici.
--
-- Idempotente : REVOKE ALL puis GRANT, rejouable sans erreur.
-- ============================================================================

BEGIN;

REVOKE ALL ON TABLE public.helloasso_tokens
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.helloasso_sync_runs
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.helloasso_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.helloasso_sync_runs TO service_role;
GRANT SELECT ON TABLE public.helloasso_sync_runs TO authenticated;

COMMIT;
