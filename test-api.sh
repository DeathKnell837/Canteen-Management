#!/bin/bash

# Canteen Management System - API Testing Script
# This script tests all endpoints and validates the system

BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""
CUSTOMER_TOKEN=""
TEST_ORDER_ID=""
TEST_ITEM_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Canteen Management System - API Tests${NC}"
echo -e "${BLUE}========================================${NC}"

# ============================================
# TEST 1: AUTH ENDPOINTS
# ============================================
echo -e "\n${YELLOW}[TEST 1] Testing Auth Endpoints${NC}"

# Test Admin Login
echo -e "\n${BLUE}1.1: Admin Login${NC}"
ADMIN_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@canteen.local",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}✗ Admin login failed${NC}"
  echo "$ADMIN_LOGIN"
else
  echo -e "${GREEN}✓ Admin login successful${NC}"
  echo "Token: $ADMIN_TOKEN"
fi

# Test Customer Login
echo -e "\n${BLUE}1.2: Customer Login${NC}"
CUSTOMER_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "user123"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$CUSTOMER_TOKEN" ]; then
  echo -e "${RED}✗ Customer login failed${NC}"
  echo "$CUSTOMER_LOGIN"
else
  echo -e "${GREEN}✓ Customer login successful${NC}"
fi

# Test Get Profile
echo -e "\n${BLUE}1.3: Get User Profile${NC}"
PROFILE=$(curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo "$PROFILE" | grep -q '"email"'; then
  echo -e "${GREEN}✓ Get profile successful${NC}"
else
  echo -e "${RED}✗ Get profile failed${NC}"
  echo "$PROFILE"
fi

# ============================================
# TEST 2: MENU ENDPOINTS
# ============================================
echo -e "\n${YELLOW}[TEST 2] Testing Menu Endpoints${NC}"

# Get Categories
echo -e "\n${BLUE}2.1: Get Menu Categories${NC}"
CATEGORIES=$(curl -s -X GET $BASE_URL/menu/categories)

if echo "$CATEGORIES" | grep -q '"data"'; then
  echo -e "${GREEN}✓ Get categories successful${NC}"
  CATEGORY_COUNT=$(echo "$CATEGORIES" | grep -o '"category_id"' | wc -l)
  echo "Found $CATEGORY_COUNT categories"
else
  echo -e "${RED}✗ Get categories failed${NC}"
  echo "$CATEGORIES"
fi

# Get Menu Items
echo -e "\n${BLUE}2.2: Get Menu Items${NC}"
ITEMS=$(curl -s -X GET $BASE_URL/menu/items)

if echo "$ITEMS" | grep -q '"item_id"'; then
  echo -e "${GREEN}✓ Get menu items successful${NC}"
  ITEM_COUNT=$(echo "$ITEMS" | grep -o '"item_id"' | wc -l)
  TEST_ITEM_ID=$(echo "$ITEMS" | grep -o '"item_id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "Found $ITEM_COUNT items"
  echo "Using item ID: $TEST_ITEM_ID for testing"
else
  echo -e "${RED}✗ Get menu items failed${NC}"
  echo "$ITEMS"
fi

# Search Items
echo -e "\n${BLUE}2.3: Search Menu Items${NC}"
SEARCH=$(curl -s -X GET "$BASE_URL/menu/search?q=Idli")

if echo "$SEARCH" | grep -q '"data"'; then
  echo -e "${GREEN}✓ Search items successful${NC}"
else
  echo -e "${RED}✗ Search items failed${NC}"
fi

# Create Menu Item (Admin only)
echo -e "\n${BLUE}2.4: Create Menu Item (Admin)${NC}"
CREATE_ITEM=$(curl -s -X POST $BASE_URL/menu/items \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "name": "Test Item",
    "description": "Test Description",
    "price": 150,
    "isVegetarian": true,
    "prepTime": 20
  }')

if echo "$CREATE_ITEM" | grep -q '"item_id"'; then
  echo -e "${GREEN}✓ Create menu item successful${NC}"
else
  echo -e "${RED}✗ Create menu item failed${NC}"
  echo "$CREATE_ITEM"
fi

# ============================================
# TEST 3: ORDER ENDPOINTS
# ============================================
echo -e "\n${YELLOW}[TEST 3] Testing Order Endpoints${NC}"

# Create Order
echo -e "\n${BLUE}3.1: Create Order${NC}"
if [ -n "$TEST_ITEM_ID" ]; then
  CREATE_ORDER=$(curl -s -X POST $BASE_URL/orders \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"items\": [{\"item_id\": $TEST_ITEM_ID, \"quantity\": 2}],
      \"deliveryType\": \"PICKUP\",
      \"specialInstructions\": \"No onions\"
    }")

  if echo "$CREATE_ORDER" | grep -q '"order_id"'; then
    echo -e "${GREEN}✓ Create order successful${NC}"
    TEST_ORDER_ID=$(echo "$CREATE_ORDER" | grep -o '"order_id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Order ID: $TEST_ORDER_ID"
  else
    echo -e "${RED}✗ Create order failed${NC}"
    echo "$CREATE_ORDER"
  fi
else
  echo -e "${RED}✗ Skipping order test - no item ID available${NC}"
fi

# Get User Orders
echo -e "\n${BLUE}3.2: Get User Orders${NC}"
USER_ORDERS=$(curl -s -X GET $BASE_URL/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo "$USER_ORDERS" | grep -q '"data"'; then
  echo -e "${GREEN}✓ Get user orders successful${NC}"
  ORDER_COUNT=$(echo "$USER_ORDERS" | grep -o '"order_id"' | wc -l)
  echo "Found $ORDER_COUNT orders"
else
  echo -e "${RED}✗ Get user orders failed${NC}"
fi

# Get Order Detail
echo -e "\n${BLUE}3.3: Get Order Detail${NC}"
if [ -n "$TEST_ORDER_ID" ]; then
  ORDER_DETAIL=$(curl -s -X GET $BASE_URL/orders/$TEST_ORDER_ID \
    -H "Authorization: Bearer $CUSTOMER_TOKEN")

  if echo "$ORDER_DETAIL" | grep -q '"order_id"'; then
    echo -e "${GREEN}✓ Get order detail successful${NC}"
  else
    echo -e "${RED}✗ Get order detail failed${NC}"
    echo "$ORDER_DETAIL"
  fi
else
  echo -e "${RED}✗ Skipping order detail test - no order ID available${NC}"
fi

# Update Order Status (Admin only)
echo -e "\n${BLUE}3.4: Update Order Status (Admin)${NC}"
if [ -n "$TEST_ORDER_ID" ]; then
  UPDATE_ORDER=$(curl -s -X PUT $BASE_URL/orders/$TEST_ORDER_ID/status \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "CONFIRMED"
    }')

  if echo "$UPDATE_ORDER" | grep -q '"status"'; then
    echo -e "${GREEN}✓ Update order status successful${NC}"
  else
    echo -e "${RED}✗ Update order status failed${NC}"
    echo "$UPDATE_ORDER"
  fi
else
  echo -e "${RED}✗ Skipping order status update - no order ID available${NC}"
fi

# ============================================
# TEST 4: PAYMENT ENDPOINTS
# ============================================
echo -e "\n${YELLOW}[TEST 4] Testing Payment Endpoints${NC}"

# Get Wallet Balance
echo -e "\n${BLUE}4.1: Get Wallet Balance${NC}"
WALLET=$(curl -s -X GET $BASE_URL/payments/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo "$WALLET" | grep -q '"wallet_balance"'; then
  echo -e "${GREEN}✓ Get wallet balance successful${NC}"
  BALANCE=$(echo "$WALLET" | grep -o '"wallet_balance":[0-9]*' | cut -d':' -f2)
  echo "Wallet Balance: ₹$BALANCE"
else
  echo -e "${RED}✗ Get wallet balance failed${NC}"
  echo "$WALLET"
fi

# Process Payment
echo -e "\n${BLUE}4.2: Process Payment${NC}"
if [ -n "$TEST_ORDER_ID" ]; then
  PROCESS_PAYMENT=$(curl -s -X POST $BASE_URL/payments/process \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"orderId\": $TEST_ORDER_ID,
      \"paymentMethod\": \"WALLET\",
      \"amount\": 300
    }")

  if echo "$PROCESS_PAYMENT" | grep -q '"payment_id"'; then
    echo -e "${GREEN}✓ Process payment successful${NC}"
  else
    echo -e "${YELLOW}⚠ Process payment returned${NC}"
    echo "$PROCESS_PAYMENT"
  fi
else
  echo -e "${RED}✗ Skipping payment test - no order ID available${NC}"
fi

# Top-up Wallet
echo -e "\n${BLUE}4.3: Top-up Wallet${NC}"
TOPUP=$(curl -s -X POST $BASE_URL/payments/wallet/topup \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500
  }')

if echo "$TOPUP" | grep -q '"wallet_balance"'; then
  echo -e "${GREEN}✓ Wallet top-up successful${NC}"
  NEW_BALANCE=$(echo "$TOPUP" | grep -o '"wallet_balance":[0-9]*' | cut -d':' -f2)
  echo "New Wallet Balance: ₹$NEW_BALANCE"
else
  echo -e "${YELLOW}⚠ Wallet top-up returned${NC}"
  echo "$TOPUP"
fi

# ============================================
# TEST 5: INVENTORY ENDPOINTS
# ============================================
echo -e "\n${YELLOW}[TEST 5] Testing Inventory Endpoints${NC}"

# Get All Inventory
echo -e "\n${BLUE}5.1: Get All Inventory${NC}"
INVENTORY=$(curl -s -X GET $BASE_URL/inventory \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$INVENTORY" | grep -q '"item_id"'; then
  echo -e "${GREEN}✓ Get inventory successful${NC}"
  INVENTORY_COUNT=$(echo "$INVENTORY" | grep -o '"item_id"' | wc -l)
  echo "Found $INVENTORY_COUNT items in inventory"
else
  echo -e "${RED}✗ Get inventory failed${NC}"
  echo "$INVENTORY"
fi

# Get Low Stock Items
echo -e "\n${BLUE}5.2: Get Low Stock Items${NC}"
LOW_STOCK=$(curl -s -X GET "$BASE_URL/inventory/low-stock?threshold=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$LOW_STOCK" | grep -q '"data"'; then
  echo -e "${GREEN}✓ Get low stock items successful${NC}"
  LOW_COUNT=$(echo "$LOW_STOCK" | grep -o '"item_id"' | wc -l)
  echo "Found $LOW_COUNT items below threshold"
else
  echo -e "${RED}✗ Get low stock items failed${NC}"
fi

# Add Stock
echo -e "\n${BLUE}5.3: Add Stock${NC}"
if [ -n "$TEST_ITEM_ID" ]; then
  ADD_STOCK=$(curl -s -X POST $BASE_URL/inventory/items/$TEST_ITEM_ID/stock-in \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "quantity": 50,
      "reason": "New delivery"
    }')

  if echo "$ADD_STOCK" | grep -q '"quantity_available"'; then
    echo -e "${GREEN}✓ Add stock successful${NC}"
  else
    echo -e "${RED}✗ Add stock failed${NC}"
    echo "$ADD_STOCK"
  fi
else
  echo -e "${RED}✗ Skipping add stock test - no item ID${NC}"
fi

# ============================================
# TEST SUMMARY
# ============================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All critical tests completed${NC}"
echo -e "Admin Token: ${ADMIN_TOKEN:0:30}..."
echo -e "Customer Token: ${CUSTOMER_TOKEN:0:30}..."
echo -e "Test Order ID: $TEST_ORDER_ID"
echo -e "Test Item ID: $TEST_ITEM_ID"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Verify all responses are successful"
echo "2. Check database for created records"
echo "3. Run integration tests"
echo "4. Test error scenarios"
echo -e "\n${BLUE}========================================${NC}"
