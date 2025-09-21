# Farcaster Miniapp Integration

## Overview
This document describes the integration of BizarreBeasts with the Farcaster Mini App SDK, enabling seamless authentication and wallet connection when running inside the Farcaster mobile app.

## Problem Solved
When users accessed BizarreBeasts through the Farcaster mobile app's miniapp browser:
1. WalletConnect was prompting to switch to Base chain despite being hardcoded
2. Wallet connections were not persisting between sessions
3. Users had to manually connect both Farcaster and wallet separately
4. The app wasn't recognizing the Farcaster context

## Solution Implementation

### 1. Official SDK Integration
We integrated the official `@farcaster/miniapp-sdk` which provides:
- Reliable detection of miniapp context
- Direct access to Farcaster user data
- Built-in wallet integration
- Proper session management

### 2. Key Components

#### `/lib/farcaster-miniapp.ts`
Core utilities for miniapp detection and SDK interaction:
- `isInFarcasterMiniapp()` - Detects if running in Farcaster
- `initializeFarcasterSDK()` - Initializes SDK and signals app readiness
- `getFarcasterDataFromUrl()` - Gets user data from SDK or URL
- `requestFarcasterWallet()` - Uses SDK wallet provider

#### `/components/auth/UnifiedAuthButton.tsx`
Updated authentication flow:
- Auto-detects Farcaster miniapp context
- Automatically authenticates with Farcaster user data
- Uses Farcaster's verified wallet address
- Shows simplified UI in miniapp (no WalletConnect modal)

#### `/hooks/useWallet.ts`
Modified wallet connection logic:
- Skips WalletConnect initialization in miniapp
- Uses Farcaster-provided wallet address
- Prevents conflicting wallet prompts

## How It Works

### In Farcaster Mobile App:
1. App detects it's running in Farcaster miniapp
2. SDK automatically initializes and retrieves user context
3. User is auto-authenticated with their Farcaster profile
4. Wallet address from verified Farcaster addresses is used
5. No WalletConnect prompts or chain switching issues

### In Regular Browser:
1. App detects it's NOT in miniapp context
2. Standard authentication flow is used
3. Users can connect via Neynar button or WalletConnect
4. Full wallet connection options available

## Benefits

1. **Seamless Authentication** - Users are automatically logged in with their Farcaster identity
2. **No Wallet Prompts** - Uses Farcaster's verified wallet, no chain switching issues
3. **Persistent Sessions** - Authentication persists properly in miniapp context
4. **Better UX** - One-click experience for Farcaster users
5. **Fallback Support** - Still works normally outside Farcaster

## Testing

To test the miniapp integration:

### In Farcaster Mobile App:
1. Open Farcaster mobile app
2. Navigate to BizarreBeasts miniapp URL
3. Should auto-authenticate without prompts
4. Profile should show Farcaster data
5. No wallet connection prompts

### In Browser:
1. Open app in regular browser
2. Should show standard Connect button
3. Can connect via Farcaster or wallet
4. Full authentication options available

## Technical Details

### SDK Methods Used:
- `sdk.isInMiniApp()` - Detection
- `sdk.actions.ready()` - Signal app ready
- `sdk.context` - Get user/session data
- `sdk.wallet.ethProvider` - Wallet interaction

### Data Flow:
1. SDK provides user context with FID, username, profile
2. Verified addresses extracted from context
3. Store updated with Farcaster and wallet data
4. UI reflects authenticated state
5. No additional auth steps required

## Debugging

Console logs to check:
- "🔍 Farcaster Miniapp Detection (SDK)" - Shows detection result
- "✅ Farcaster SDK initialized" - SDK ready
- "📱 Farcaster context" - User data from SDK
- "📱 In Farcaster miniapp - skipping web3" - Wallet init skipped

## Future Improvements

1. Add support for SDK wallet transactions
2. Implement frame-specific actions
3. Add analytics for miniapp usage
4. Support for multiple verified addresses
5. Enhanced error handling for SDK failures

## References

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz)
- [SDK GitHub Repository](https://github.com/farcasterxyz/miniapp-sdk)
- [Integration Examples](https://docs.farcaster.xyz/miniapps)