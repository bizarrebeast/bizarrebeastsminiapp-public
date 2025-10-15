#!/bin/bash

API_KEY="4B434078-F819-4A4E-AE1D-0A2A0E276C13"

# Array of usernames
usernames=(
  "siadude"
  "degencummunist"
  "dribble"
  "listne2mm"
  "evogsr"
  "lisashin"
  "jinwoopark"
  "seonghyeon"
  "siablo"
  "jiablo"
  "pedronosandrine"
  "bbrown"
  "artstudio48"
  "heyake"
  "crezzang"
  "kateyarter"
  "sausagedad"
  "whittanyarter"
  "literalpanther"
  "mustycarlos"
  "bulgakov-vlad"
)

echo "# Beta Tester Wallets"
echo ""

for username in "${usernames[@]}"; do
  # Clean username
  clean_user=$(echo $username | tr -d '@')

  # Make API call
  response=$(curl -s "https://api.neynar.com/v2/farcaster/user/by_username?username=$clean_user" \
    -H "accept: application/json" \
    -H "x-api-key: $API_KEY")

  # Extract data
  if echo "$response" | jq -e '.user' > /dev/null 2>&1; then
    username_actual=$(echo "$response" | jq -r '.user.username')
    fid=$(echo "$response" | jq -r '.user.fid')
    wallet=$(echo "$response" | jq -r '.user.verified_addresses.eth_addresses[0] // "no wallet"')

    if [ "$wallet" != "no wallet" ]; then
      wallet_lower=$(echo "$wallet" | tr '[:upper:]' '[:lower:]')
      echo "  '$wallet_lower', // @$username_actual (FID: $fid)"
    else
      echo "  // @$username_actual (FID: $fid) - NO VERIFIED WALLET"
    fi
  else
    echo "  // @$clean_user - NOT FOUND"
  fi

  # Small delay to avoid rate limiting
  sleep 0.5
done

echo ""
echo "# Add these to BETA_TESTERS array in lib/beta-testers.ts"