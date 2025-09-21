# Neynar Authentication Setup Guide

## Critical Configuration for Production

### 1. Neynar Developer Portal Settings

Go to [dev.neynar.com](https://dev.neynar.com) and configure your app:

#### Authorized Origins (MUST BE EXACT):
- `https://bbapp.bizarrebeasts.io` (production domain)
- `https://www.bbapp.bizarrebeasts.io` (if using www)
- `https://bizarrebeastsminiapp.vercel.app` (Vercel deployment URL)
- `https://bbapp.bizarrebeastsminiapp.vercel.app` (if this is your URL)
- `http://localhost:3000` (for development)

**Important:**
- These URLs must be EXACT matches (no trailing slashes)
- Cannot use wildcards or IP addresses
- Must include the protocol (http/https)

### 2. Environment Variables

In Vercel/Production, ensure these are set:
```
NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_client_id_from_neynar
NEYNAR_API_KEY=your_api_key_from_neynar
```

### 3. How Authentication Works

1. User clicks "Sign in with Neynar" button
2. Popup opens to Neynar's auth page
3. User authorizes the app
4. Neynar redirects back to your app's origin
5. Authentication completes and popup closes

### 4. Troubleshooting

#### Stuck on "Give Access" Page:
- **Cause:** Authorized origins mismatch
- **Fix:** Ensure production URL exactly matches Neynar settings

#### QR Code Shows but Doesn't Connect:
- **Cause:** Mobile browser/PWA origin mismatch
- **Fix:** Add all possible origins to Neynar settings

#### Authentication Popup Doesn't Close:
- **Cause:** JavaScript callback issues
- **Fix:** Check browser console for errors

### 5. Testing Checklist

- [ ] Desktop browser authentication works
- [ ] Mobile browser authentication works
- [ ] Farcaster in-app browser works
- [ ] PWA authentication works
- [ ] Popup closes after successful auth
- [ ] User data is properly stored

### 6. Important Notes

- The NeynarAuthButton component handles the redirect automatically
- No explicit redirect URL needs to be passed to the component
- The SDK uses the current window origin for callbacks
- Ensure CORS is properly configured for API calls

### 7. For Different Environments

#### Production (bbapp.bizarrebeasts.io):
- Must be HTTPS
- Exact domain match required
- No port numbers

#### Staging/Preview:
- Add preview URLs to authorized origins
- Example: `https://preview-branch.vercel.app`

#### Local Development:
- `http://localhost:3000`
- Can use different ports if needed