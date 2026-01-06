#!/bin/bash
# =========================================================
#  Marketplace API Full Integration Test (Safe + Confirmed)
# =========================================================

BASE_URL="http://localhost:8080/api"  # Updated for Fastify migration
EMAIL="vendor@example.com"
PASSWORD="password"

# 🚨 SAFETY GUARD — Prevent running against production
if [[ "$BASE_URL" == *"takedetroit.com"* ]]; then
  echo "❌ WARNING: You are trying to run this test on PRODUCTION."
  echo "Aborting to protect live data."
  exit 1
fi

# 🚨 SECOND GUARD — Require explicit YES confirmation
echo "⚠️  This script will DELETE all listings and variants in: $BASE_URL"
read -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "❌ Aborted. No actions taken."
  exit 1
fi

divider="------------------------------------------------------------"
green="\033[0;32m"
red="\033[0;31m"
cyan="\033[0;36m"
reset="\033[0m"

check_response() {
  local response=$1
  local expected=$2
  local msg=$3
  if echo "$response" | grep -q "$expected"; then
    echo -e "${green}✅ $msg${reset}"
  else
    echo -e "${red}❌ $msg${reset}"
    echo "Response: $response"
  fi
}

# =========================================================
echo $divider
echo -e "${cyan}🔐 Logging in as vendor...${reset}"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  $BASE_URL/auth/login)

TOKEN=$(echo $LOGIN_RESPONSE | grep -oE '"token":"[^"]+' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo -e "${red}❌ Login failed.${reset}"
  echo "$LOGIN_RESPONSE"
  exit 1
else
  echo -e "${green}✅ Login successful.${reset}"
fi

# =========================================================
echo $divider
echo -e "${cyan}🧹 Cleaning old listings before test...${reset}"
OLD_LISTINGS=$(curl -s $BASE_URL/listings | jq -r '.[].id')
for id in $OLD_LISTINGS; do
  if [ -n "$id" ]; then
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" $BASE_URL/listings/$id > /dev/null
  fi
done
echo -e "${green}✅ Database cleaned.${reset}"

# =========================================================
echo $divider
echo -e "${cyan}🛍️ Creating new listing...${reset}"
CREATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Awesome T-Shirt",
    "description": "A really cool t-shirt.",
    "category": "Apparel",
    "variants": [
      { "name": "Small / Red", "price": 19.99, "stock": 100, "attributes": { "size": "S", "color": "Red" } },
      { "name": "Medium / Blue", "price": 22.99, "stock": 50, "attributes": { "size": "M", "color": "Blue" } }
    ]
  }' \
  $BASE_URL/listings)

LISTING_ID=$(echo $CREATE_RESPONSE | grep -oE '"id":[0-9]+' | cut -d':' -f2)
check_response "$CREATE_RESPONSE" '"id":' "Listing created (ID: $LISTING_ID)"

# =========================================================
echo $divider
echo -e "${cyan}📜 Fetching all listings...${reset}"
ALL_RESPONSE=$(curl -s $BASE_URL/listings)
check_response "$ALL_RESPONSE" "My Awesome T-Shirt" "Fetched all listings"

echo $divider
echo -e "${cyan}🔍 Fetching single listing (ID: $LISTING_ID)...${reset}"
SINGLE_RESPONSE=$(curl -s $BASE_URL/listings/$LISTING_ID)
check_response "$SINGLE_RESPONSE" "My Awesome T-Shirt" "Fetched single listing"

VARIANT_IDS=$(echo $SINGLE_RESPONSE | grep -oE '"id":[0-9]+' | awk -F: '{print $2}' | tail -n +2)
VARIANT_ID=$(echo "$VARIANT_IDS" | head -n 1)
if [ -z "$VARIANT_ID" ]; then
  echo -e "${red}❌ Could not extract variant ID.${reset}"
  exit 1
else
  echo -e "${green}✅ Extracted variant ID: $VARIANT_ID${reset}"
fi

# =========================================================
echo $divider
echo -e "${cyan}✏️ Updating listing...${reset}"
UPDATE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Updated T-Shirt",
    "description": "An even cooler t-shirt.",
    "variants": [
      { "name": "Large / Green", "price": 25.99, "stock": 25, "attributes": { "size": "L", "color": "Green" } },
      { "name": "XL / Black", "price": 29.99, "stock": 10, "attributes": { "size": "XL", "color": "Black" } }
    ]
  }' \
  $BASE_URL/listings/$LISTING_ID)
check_response "$UPDATE_RESPONSE" "id" "Updated listing successfully"

# ✅ Reselect valid variant after update
UPDATED_RESPONSE=$(curl -s $BASE_URL/listings/$LISTING_ID)
VARIANT_IDS=$(echo $UPDATED_RESPONSE | grep -oE '"id":[0-9]+' | awk -F: '{print $2}' | tail -n +2)
VARIANT_ID=$(echo "$VARIANT_IDS" | head -n 1)
echo -e "${green}✅ New variant ID selected: $VARIANT_ID${reset}"

# =========================================================
echo $divider
echo -e "${cyan}🧩 Deleting one variant (ID: $VARIANT_ID)...${reset}"
VARIANT_DELETE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/listings/variants/$VARIANT_ID)
check_response "$VARIANT_DELETE" "message" "Deleted variant successfully"

echo $divider
echo -e "${cyan}🔄 Verifying variant deletion...${reset}"
VERIFY_VARIANT=$(curl -s $BASE_URL/listings/$LISTING_ID)
if echo "$VERIFY_VARIANT" | grep -q "$VARIANT_ID"; then
  echo -e "${red}❌ Variant still present after deletion.${reset}"
else
  echo -e "${green}✅ Variant deletion confirmed.${reset}"
fi

# =========================================================
echo $divider
echo -e "${cyan}🗑️ Deleting listing...${reset}"
DELETE_RESPONSE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/listings/$LISTING_ID)
check_response "$DELETE_RESPONSE" "message" "Deleted listing"

# =========================================================
echo $divider
echo -e "${cyan}🔄 Verifying cleanup...${reset}"
VERIFY_RESPONSE=$(curl -s $BASE_URL/listings)
if [[ "$VERIFY_RESPONSE" == "[]" ]]; then
  echo -e "${green}✅ All clean. No listings remain.${reset}"
else
  echo -e "${red}❌ Cleanup incomplete.${reset}"
  echo "Response: $VERIFY_RESPONSE"
fi

echo $divider
echo -e "${green}🏁 Test complete.${reset}"
