#!/usr/bin/env bash
# =============================================================================
# seed.sh — Crée le compte admin de test pour les tests E2E Playwright
# =============================================================================
# Prérequis : la stack Docker doit être démarrée (`docker compose up -d`)
# Usage     : bash supabase/seed.sh
# =============================================================================

set -e

SUPABASE_URL="http://localhost:8000"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"

ADMIN_EMAIL="e2e-admin@test.asc-escalade.fr"
ADMIN_PASSWORD="TestAdmin2026!"

echo ""
echo "==> Création du compte admin de test..."

# ─── 1. Créer l'utilisateur via GoTrue Admin API ──────────────────────────────
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": { \"full_name\": \"Admin E2E\" }
  }")

# Extraire l'ID (format : "id":"xxxx")
USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

if [ -z "$USER_ID" ]; then
  echo ""
  echo "ERREUR — Réponse de GoTrue :"
  echo "$RESPONSE"
  echo ""
  echo "Vérifiez que la stack Docker est bien démarrée :"
  echo "  cd supabase && docker compose up -d"
  exit 1
fi

echo "    Utilisateur créé : ${USER_ID}"

# ─── 2. Assigner le rôle admin via PostgREST ─────────────────────────────────
ROLE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/rest/v1/user_roles" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "[{\"user_id\": \"${USER_ID}\", \"role_code\": \"admin\"}]")

if [ "$ROLE_RESPONSE" != "201" ]; then
  echo "ERREUR — Impossible d'assigner le rôle admin (HTTP ${ROLE_RESPONSE})"
  exit 1
fi

echo "    Rôle admin assigné"
echo ""
echo "==> Compte admin prêt !"
echo ""
echo "    Email    : ${ADMIN_EMAIL}"
echo "    Password : ${ADMIN_PASSWORD}"
echo ""
echo "    Ces valeurs doivent correspondre à TEST_ADMIN_EMAIL et"
echo "    TEST_ADMIN_PASSWORD dans votre .env.test"
