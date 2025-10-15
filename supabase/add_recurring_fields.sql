-- Add recurring contest fields to contests table
ALTER TABLE contests
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_interval TEXT DEFAULT NULL;

-- Add check constraint for valid recurrence intervals
ALTER TABLE contests
ADD CONSTRAINT valid_recurrence_interval
CHECK (recurrence_interval IN ('daily', 'weekly', 'monthly') OR recurrence_interval IS NULL);

-- Comment on columns for documentation
COMMENT ON COLUMN contests.is_recurring IS 'Whether this contest should automatically recur';
COMMENT ON COLUMN contests.recurrence_interval IS 'How often the contest should recur (daily, weekly, monthly)';