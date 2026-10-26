export USER_EMAIL="user3@test.com"
export USER_PASSWORD="123456"

BASE_URL="http://localhost:3000"

: "${USER_EMAIL:?Set USER_EMAIL first}"
: "${USER_PASSWORD:?Set USER_PASSWORD first}"

echo "Getting auth token..."
LOGIN_RESPONSE=$(curl -fsS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}") || {
    echo "Login request failed."
    exit 1
  }

TOKEN=$(printf '%s' "$LOGIN_RESPONSE" |
  node -e 'let s=""; process.stdin.on("data", d => s += d).on("end", () => {
    try { process.stdout.write(JSON.parse(s).access_token || "") }
    catch { process.exit(1) }
  })')

if [ -z "$TOKEN" ]; then
  echo "Login did not return an access_token."
  exit 1
fi

echo "Running Room API benchmark..."
npx autocannon -c 100 -d 20 --renderStatusCodes \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/rooms/1"