-- Create table for tracking ritual completions
CREATE TABLE IF NOT EXISTS public.ritual_completions (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  ritual_id INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  shared BOOLEAN DEFAULT FALSE,

  -- Ensure unique completion per wallet per ritual per day
  UNIQUE(wallet_address, ritual_id, date)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ritual_completions_wallet ON public.ritual_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_ritual_completions_date ON public.ritual_completions(date);
CREATE INDEX IF NOT EXISTS idx_ritual_completions_wallet_date ON public.ritual_completions(wallet_address, date);

-- Create table for tracking featured ritual completions
CREATE TABLE IF NOT EXISTS public.featured_ritual_completions (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  featured_ritual_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,

  -- Ensure unique completion per wallet per featured ritual per day
  UNIQUE(wallet_address, featured_ritual_id, date)
);

-- Create index for featured ritual lookups
CREATE INDEX IF NOT EXISTS idx_featured_ritual_wallet_date ON public.featured_ritual_completions(wallet_address, date);

-- Enable RLS
ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_ritual_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for ritual_completions
CREATE POLICY "Users can view their own ritual completions" ON public.ritual_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ritual completions" ON public.ritual_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own ritual completions" ON public.ritual_completions
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true));

-- Create policies for featured_ritual_completions
CREATE POLICY "Users can view featured ritual completions" ON public.featured_ritual_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert featured ritual completions" ON public.featured_ritual_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own featured ritual completions" ON public.featured_ritual_completions
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true));

-- Grant permissions
GRANT ALL ON public.ritual_completions TO anon, authenticated;
GRANT ALL ON public.featured_ritual_completions TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;