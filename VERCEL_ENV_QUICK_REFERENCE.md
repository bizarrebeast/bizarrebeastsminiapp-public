# 🚀 Vercel Environment Variables - Quick Reference

## 📍 Where to Set Them
**Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

## 🔑 Critical Variables to Set NOW

### Public (Safe) Variables - Use "Plaintext"
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_EMPIRE_API_URL`
- `NEXT_PUBLIC_FARCASTER_MANIFEST_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_WALLETS`
- `R2_ENDPOINT`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### Private (Sensitive) Variables - Use "Encrypted"
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️
- `RITUAL_ADMIN_PRIVATE_KEY` ⚠️
- `R2_ACCESS_KEY_ID` ⚠️
- `R2_SECRET_ACCESS_KEY` ⚠️

## ⚡ Quick Copy-Paste for Vercel

```bash
# These are the NAMES ONLY - Add your actual values in Vercel Dashboard

# Public Variables (Plaintext)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_EMPIRE_API_URL
NEXT_PUBLIC_FARCASTER_MANIFEST_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ADMIN_WALLETS

# Private Variables (Encrypted)
SUPABASE_SERVICE_ROLE_KEY
RITUAL_ADMIN_PRIVATE_KEY
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_BUCKET_NAME
R2_PUBLIC_URL
```

## 🚨 CRITICAL: Security Checklist

- [ ] Using DIFFERENT keys for production vs local development
- [ ] All sensitive keys set as "Encrypted" in Vercel
- [ ] NO private keys in GitHub/git history
- [ ] Rotation reminder set for every 30 days

## 🔄 After Setting Variables

1. Trigger new deployment
2. Check build logs for errors
3. Test production functionality
4. Verify no console errors about missing env vars

---

⏰ **SET A REMINDER**: Rotate your production keys every 30 days!