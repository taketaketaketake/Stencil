#!/bin/bash
# =========================================================
#  Fastify Migration Test - Quick Endpoint Verification
# =========================================================

BASE_URL="http://localhost:8080/api"
EMAIL="vendor@example.com"
PASSWORD="password"

green="\033[0;32m"
red="\033[0;31m"
cyan="\033[0;36m"
reset="\033[0m"

echo -e "${cyan}🚀 Testing Fastify Migration...${reset}"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Public listings endpoint
echo -e "${cyan}📋 Test 1: GET /api/listings (public)${reset}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/listings")
http_code=$(echo $response | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
body=$(echo $response | sed -E 's/HTTPSTATUS:[0-9]{3}$//')

if [[ $http_code -eq 200 ]]; then
    echo -e "${green}✅ GET /listings works (Status: $http_code)${reset}"
    echo "Response: $(echo $body | jq -c '. | length') listings found"
else
    echo -e "${red}❌ GET /listings failed (Status: $http_code)${reset}"
    echo "Response: $body"
fi
echo ""

# Test 2: Register new vendor
echo -e "${cyan}👤 Test 2: POST /api/auth/register${reset}"
register_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Vendor\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    "$BASE_URL/auth/register")

register_code=$(echo $register_response | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
register_body=$(echo $register_response | sed -E 's/HTTPSTATUS:[0-9]{3}$//')

if [[ $register_code -eq 201 || $register_code -eq 409 ]]; then
    echo -e "${green}✅ POST /auth/register works (Status: $register_code)${reset}"
    if [[ $register_code -eq 409 ]]; then
        echo "Note: User already exists (expected)"
    fi
else
    echo -e "${red}❌ POST /auth/register failed (Status: $register_code)${reset}"
    echo "Response: $register_body"
fi
echo ""

# Test 3: Login
echo -e "${cyan}🔑 Test 3: POST /api/auth/login${reset}"
login_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    "$BASE_URL/auth/login")

login_code=$(echo $login_response | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
login_body=$(echo $login_response | sed -E 's/HTTPSTATUS:[0-9]{3}$//')

if [[ $login_code -eq 200 ]]; then
    echo -e "${green}✅ POST /auth/login works (Status: $login_code)${reset}"
    
    # Extract token from response
    TOKEN=$(echo $login_body | jq -r '.token')
    echo "Token: ${TOKEN:0:20}..."
    
    # Test 4: Protected endpoint - Create listing
    echo ""
    echo -e "${cyan}📝 Test 4: POST /api/listings (protected)${reset}"
    create_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "name": "Test Product",
            "description": "Migration test product",
            "category": "test",
            "variants": [{
                "name": "Default",
                "price": 29.99,
                "stock": 10,
                "attributes": {"color": "blue", "size": "M"}
            }]
        }' \
        "$BASE_URL/listings")

    create_code=$(echo $create_response | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    create_body=$(echo $create_response | sed -E 's/HTTPSTATUS:[0-9]{3}$//')

    if [[ $create_code -eq 201 ]]; then
        echo -e "${green}✅ POST /listings works (Status: $create_code)${reset}"
        LISTING_ID=$(echo $create_body | jq -r '.id')
        echo "Created listing ID: $LISTING_ID"
        
        # Test 5: Get single listing
        echo ""
        echo -e "${cyan}🔍 Test 5: GET /api/listings/$LISTING_ID${reset}"
        get_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/listings/$LISTING_ID")
        get_code=$(echo $get_response | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
        
        if [[ $get_code -eq 200 ]]; then
            echo -e "${green}✅ GET /listings/:id works (Status: $get_code)${reset}"
        else
            echo -e "${red}❌ GET /listings/:id failed (Status: $get_code)${reset}"
        fi
        
    else
        echo -e "${red}❌ POST /listings failed (Status: $create_code)${reset}"
        echo "Response: $create_body"
    fi
    
else
    echo -e "${red}❌ POST /auth/login failed (Status: $login_code)${reset}"
    echo "Response: $login_body"
fi

echo ""
echo -e "${cyan}🏁 Migration Test Complete!${reset}"