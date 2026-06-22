#!/usr/bin/env bash
# Seeds a pre-confirmed test user into the LOCAL Supabase so you can sign in
# without going through the email-confirmation flow. Safe to re-run (idempotent).
#
# Usage: ./scripts/seed-test-user.sh [email] [password] [name]
set -euo pipefail

EMAIL="${1:-test@parallax.app}"
PASSWORD="${2:-parallax123}"
NAME="${3:-Test User}"

eval "$(supabase status -o env | sed 's/^/export /')"
URL="${API_URL:-http://127.0.0.1:54321}"

if [ -z "${SERVICE_ROLE_KEY:-}" ]; then
  echo "❌ Could not read SERVICE_ROLE_KEY — is 'supabase start' running?"
  exit 1
fi

echo "🌱 Seeding confirmed user: $EMAIL"
RESP=$(curl -s -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"display_name\":\"$NAME\"}}")

if echo "$RESP" | grep -q '"id"'; then
  echo "✅ Done. Sign in with:"
  echo "   email:    $EMAIL"
  echo "   password: $PASSWORD"
elif echo "$RESP" | grep -qi "already been registered\|already exists"; then
  echo "ℹ️  $EMAIL already exists — just sign in with your known password (default: $PASSWORD)."
else
  echo "⚠️  Unexpected response:"; echo "$RESP"
fi
