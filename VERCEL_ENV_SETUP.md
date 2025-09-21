# 🔐 Vercel Environment Variables Setup Guide

## 🚨 IMPORTANT: Production Security

This guide helps you properly configure environment variables in Vercel for secure production deployment.

## 📋 Required Environment Variables

### 1. Go to Vercel Dashboard
Navigate to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### 2. Add These Environment Variables

#### Core Application
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: [Your WalletConnect Project ID]
```

```
NEXT_PUBLIC_EMPIRE_API_URL
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: https://bizarrebeasts.win/api
```

```
NEXT_PUBLIC_FARCASTER_MANIFEST_URL
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: /farcaster.json
```

#### Supabase Configuration (Required for unified auth & contests)
```
NEXT_PUBLIC_SUPABASE_URL
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: [Your Supabase Project URL]
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: [Your Supabase Anon Key - safe for frontend]
```

```
SUPABASE_SERVICE_ROLE_KEY
- Type: Encrypted (SENSITIVE!)
- Environments: Production only
- Value: [Your Supabase Service Role Key]
- ⚠️ NEVER expose this publicly - required for admin operations and bypassing RLS
```

#### Unified Authentication (Farcaster Integration)
```
NEYNAR_API_KEY
- Type: Encrypted (SENSITIVE!)
- Environments: Production only
- Value: [Your Neynar API Key]
- ⚠️ Server-side only - required for Farcaster profile data
```

```
NEXT_PUBLIC_NEYNAR_CLIENT_ID
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: [Your Neynar Client ID]
```

```
NEXT_PUBLIC_APP_URL
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: [Your app URL - https://bbapp.bizarrebeasts.io for production]
```

#### Admin Configuration
```
NEXT_PUBLIC_ADMIN_WALLETS
- Type: Plaintext
- Environments: Production, Preview
- Value: [comma,separated,admin,wallet,addresses]
```

```
NEXT_PUBLIC_CONTEST_ADMIN_WALLET
- Type: Plaintext
- Environments: Production, Preview
- Value: [Single contest admin wallet address]
```

```
RITUAL_ADMIN_PRIVATE_KEY
- Type: Encrypted (SENSITIVE!)
- Environments: Production only
- Value: [Admin wallet private key]
- ⚠️ CRITICAL: Use a different key than local development
```

#### Feature Flags
```
NEXT_PUBLIC_ENABLE_CONTESTS
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: true (default: enabled)
```

```
NEXT_PUBLIC_ENABLE_CONTEST_ADMIN
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: true (default: enabled)
```

```
NEXT_PUBLIC_ENABLE_CONTEST_VOTING
- Type: Plaintext
- Environments: Production, Preview, Development
- Value: true (default: enabled)
```

#### Cloudflare R2 Storage (if using)
```
R2_ACCESS_KEY_ID
- Type: Encrypted
- Environments: Production only
- Value: [Your R2 Access Key ID]
```

```
R2_SECRET_ACCESS_KEY
- Type: Encrypted (SENSITIVE!)
- Environments: Production only
- Value: [Your R2 Secret Access Key]
```

```
R2_ENDPOINT
- Type: Plaintext
- Environments: Production, Preview
- Value: [Your R2 Endpoint URL]
```

```
R2_BUCKET_NAME
- Type: Plaintext
- Environments: Production, Preview
- Value: [Your R2 Bucket Name]
```

```
R2_PUBLIC_URL
- Type: Plaintext
- Environments: Production, Preview
- Value: [Your R2 Public URL]
```

## 🔄 Different Keys for Different Environments

### Development (.env.local)
- Use test/development keys
- Can be less secure (but still protect them!)
- Never commit to git

### Production (Vercel)
- Use production-specific keys
- Rotate regularly
- Use Vercel's encrypted environment variables for sensitive data

## ✅ Setup Checklist

1. [ ] Log into Vercel Dashboard
2. [ ] Navigate to project settings
3. [ ] Add all NEXT_PUBLIC_ variables (safe for frontend)
4. [ ] Add sensitive variables as Encrypted type
5. [ ] Use different keys for production vs development
6. [ ] Test deployment with new variables
7. [ ] Verify no sensitive keys in git history
8. [ ] Set up rotation schedule for sensitive keys

## 🚀 Deployment Commands

After setting up environment variables:

```bash
# Deploy to Vercel
vercel --prod

# Or push to main branch if connected to GitHub
git push origin main
```

## 🔐 Security Best Practices

1. **Never use the same private keys in production and development**
2. **Rotate sensitive keys every 30-90 days**
3. **Use Vercel's encrypted environment variables for all sensitive data**
4. **Monitor access logs for unusual activity**
5. **Set up alerts for failed authentication attempts**

## 📊 Variable Types in Vercel

- **Plaintext**: For non-sensitive data, visible in dashboard
- **Encrypted**: For sensitive data, hidden from dashboard view
- **Sensitive**: Alias for Encrypted, extra security measures

## 🔑 Key Rotation Schedule

Create a calendar reminder to rotate these keys:

- **Every 30 days**:
  - RITUAL_ADMIN_PRIVATE_KEY
  - SUPABASE_SERVICE_ROLE_KEY

- **Every 90 days**:
  - R2_SECRET_ACCESS_KEY
  - R2_ACCESS_KEY_ID

- **Every 6 months**:
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Review all other keys

## 🆘 Troubleshooting

### Environment variables not working?
1. Check variable names match exactly (case-sensitive)
2. Redeploy after adding/changing variables
3. Clear build cache if needed: Settings → Functions → Clear Cache

### Build failing?
1. Ensure all required variables are set
2. Check for typos in variable names
3. Verify values don't contain invalid characters

### Still using local keys in production?
1. IMMEDIATELY rotate compromised keys
2. Update Vercel environment variables
3. Redeploy application
4. Monitor for unauthorized access

## 📝 Notes

- Vercel automatically injects these variables at build time
- NEXT_PUBLIC_ prefix makes variables available to browser code
- Variables without NEXT_PUBLIC_ are server-side only
- Changes to environment variables require a new deployment

## 🔗 Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Security Best Practices](https://vercel.com/docs/security)

---

**Remember**: Your production environment should NEVER share keys with your local development environment!