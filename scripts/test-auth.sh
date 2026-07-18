#!/bin/bash
# Run all auth tests against the live dev server in one shot.
# Usage: bash scripts/test-auth.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"

echo "=== Test 1: Superadmin login (correct credentials) — expect 200 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"akashperera@shield.com","password":"akashperera123*#"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 2: Random email/password — expect 401 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"randomuser@example.com","password":"anything"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 3: Empty body — expect 400 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 4: Wrong password for superadmin — expect 401 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"akashperera@shield.com","password":"wrongpassword"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 5: Existing admin (Daniel) wrong password — expect 401 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"daniel@theshield.agency","password":"guess"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 6: Create a new admin via API — expect 201 ==="
curl -s -X POST "$BASE/api/team" \
  -H "Content-Type: application/json" \
  -d '{"uid":"u_test01","name":"Test Admin","email":"testadmin@theshield.agency","username":"testadmin","mobile":"0712345678","jobField":"Software Development","role":"admin","createdAt":"2026-07-18","password":"testpass123"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 7: Login as the new admin — expect 200 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testadmin@theshield.agency","password":"testpass123"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 8: Login as new admin with WRONG password — expect 401 ==="
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testadmin@theshield.agency","password":"wrongpass"}' \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== Test 9: Cleanup — delete the test admin — expect 200 ==="
curl -s -X DELETE "$BASE/api/team/u_test01" \
  -w "\nHTTP: %{http_code}\n"
echo ""

echo "=== All tests complete ==="
