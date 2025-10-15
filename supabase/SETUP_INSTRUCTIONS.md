# Supabase Setup Instructions for Bizarre Attestations

## Prerequisites
You already have Supabase configured with these environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Setup Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### 2. Run the Migration
1. Click **New query**
2. Copy the entire contents of `supabase/migrations/001_bizarre_attestations.sql`
3. Paste it into the SQL editor
4. Click **Run** to execute the migration

### 3. Verify Tables Created
After running the migration, you should see these new tables in your database:
- `bizarre_attestations` - Stores each attestation
- `bizarre_attestation_stats` - Aggregated stats per wallet
- `bizarre_attestation_leaderboard` - View for leaderboard queries

### 4. Test the Setup
1. Visit your app at http://localhost:3000/rituals/10
2. Make an attestation with a connected wallet
3. Check the Supabase table browser to see if the data was recorded

### 5. Check Table Data
In Supabase dashboard:
1. Go to **Table Editor**
2. Select `bizarre_attestations` to see attestation records
3. Select `bizarre_attestation_stats` to see aggregated stats
4. Run this query in SQL Editor to see the leaderboard:
   ```sql
   SELECT * FROM bizarre_attestation_leaderboard LIMIT 10;
   ```

## Database Schema

### bizarre_attestations
Stores individual attestations:
- `wallet_address` - User's wallet
- `tx_hash` - Blockchain transaction hash
- `attestation_date` - Date of attestation
- `farcaster_fid` - Optional Farcaster ID
- `username` - Optional username

### bizarre_attestation_stats
Aggregated statistics per user:
- `total_attestations` - Total number of attestations
- `current_streak` - Current daily streak
- `best_streak` - Best streak achieved
- `last_attestation_date` - Most recent attestation

### bizarre_attestation_leaderboard
View that provides ranked leaderboard data with all stats combined.

## Troubleshooting

If the API endpoints aren't working:
1. Check that all environment variables are set correctly
2. Verify tables were created in Supabase
3. Check browser console for errors
4. Check Supabase logs for any RLS policy issues

## Production Deployment

When deploying to production:
1. Run the same migration in your production Supabase project
2. Ensure production environment variables are set in Vercel
3. The app will automatically start recording attestations to the database