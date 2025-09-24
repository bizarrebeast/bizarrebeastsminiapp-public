-- Fix active_contests_view to include banner_image_url
-- This recreates the view with all columns from the contests table

DROP VIEW IF EXISTS active_contests_view CASCADE;

CREATE VIEW active_contests_view AS
SELECT
  c.*,
  COUNT(DISTINCT s.wallet_address) as participant_count,
  MAX(s.score) as high_score
FROM contests c
LEFT JOIN contest_submissions s ON c.id = s.contest_id AND s.status = 'approved'
WHERE c.status = 'active'
  AND (c.start_date IS NULL OR c.start_date <= CURRENT_TIMESTAMP)
  AND (c.end_date IS NULL OR c.end_date >= CURRENT_TIMESTAMP)
GROUP BY c.id, c.name, c.description, c.type, c.game_name, c.start_date, c.end_date,
         c.min_bb_required, c.max_bb_required, c.prize_amount, c.prize_type,
         c.nft_contract_address, c.status, c.rules, c.max_entries_per_wallet,
         c.is_recurring, c.recurrence_interval, c.is_test, c.created_at,
         c.created_by, c.updated_at, c.banner_image_url, c.voting_enabled,
         c.voting_start_date, c.voting_end_date, c.min_votes_required,
         c.voting_type, c.cta_url, c.cta_button_text, c.cta_type,
         c.cta_new_tab, c.track_cta_clicks, c.gallery_enabled,
         c.display_votes, c.gallery_view_type;

-- Grant permissions
GRANT SELECT ON active_contests_view TO authenticated;
GRANT SELECT ON active_contests_view TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ active_contests_view has been fixed to include banner_image_url and all other contest columns';
END $$;