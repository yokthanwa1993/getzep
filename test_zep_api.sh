#!/bin/bash

# Source the .env file directly to load variables
if [ -f .env ]; then
  source .env
else
  echo ".env file not found!"
  exit 1
fi

# Check if ZEP_API_KEY is set
if [ -z "$ZEP_API_KEY" ]; then
  echo "ZEP_API_KEY is not set in your .env file."
  exit 1
fi

USER_ID="neezs_user_yok"
BASE_URL="https://api.getzep.com/api/v2"

echo "--- 1. Searching for all memories for user: $USER_ID ---"
MEMORIES=$(curl -s -X POST \
  "$BASE_URL/graph/$USER_ID/search" \
  -H "Authorization: Bearer $ZEP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "*", "limit": 50}')

if ! echo "$MEMORIES" | grep -q '"edges"'; then
  echo "Error searching for memories or no memories found."
  echo "Response: $MEMORIES"
  exit 1
fi

echo "Available Memories:"
echo "$MEMORIES" | tr -d '[:space:]' | sed 's/},{/},\n{/g' | grep '"uuid"' | awk -F'"' '{print "  - UUID: " $4 ", Fact: " $20}'

echo ""
echo "--- 2. Select a Memory UUID to delete ---"
# Extract UUIDs and present them as a numbered list
UUIDS=($(echo "$MEMORIES" | tr -d '[:space:]' | sed 's/},{/},\n{/g' | grep '"uuid"' | awk -F'"' '{print $4}'))

if [ ${#UUIDS[@]} -eq 0 ]; then
    echo "No memories to delete."
    exit 0
fi

select UUID_TO_DELETE in "${UUIDS[@]}" "CANCEL"; do
  if [ "$UUID_TO_DELETE" == "CANCEL" ]; then
    echo "Operation cancelled."
    exit 0
  elif [ -n "$UUID_TO_DELETE" ]; then
    break
  else
    echo "Invalid selection. Please try again."
  fi
done

echo "You selected UUID: $UUID_TO_DELETE"
echo ""
echo "--- 3. Deleting selected memory... ---"

DELETE_RESPONSE=$(curl -s -X DELETE \
  "$BASE_URL/graph/$USER_ID/memory/$UUID_TO_DELETE" \
  -H "Authorization: Bearer $ZEP_API_KEY" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
HTTP_BODY=$(echo "$DELETE_RESPONSE" | sed '$d')

echo "Response Body: $HTTP_BODY"
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "Successfully sent delete request for memory $UUID_TO_DELETE."
else
  echo "Failed to delete memory $UUID_TO_DELETE."
fi

echo ""
echo "--- 4. Verifying deletion (searching again)... ---"
sleep 5 # Wait 5 seconds for potential eventual consistency

MEMORIES_AFTER_DELETE=$(curl -s -X POST \
  "$BASE_URL/graph/$USER_ID/search" \
  -H "Authorization: Bearer $ZEP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "*", "limit": 50}')

if echo "$MEMORIES_AFTER_DELETE" | grep -q "$UUID_TO_DELETE"; then
  echo "!!! VERIFICATION FAILED: Deleted UUID is still present in search results."
else
  echo "--- VERIFICATION SUCCESS: Deleted UUID is no longer in search results."
fi
