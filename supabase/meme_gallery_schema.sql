-- Meme Gallery Database Schema
-- Run this in Supabase SQL editor to create the meme gallery tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Meme Gallery Tables
CREATE TABLE IF NOT EXISTS user_memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  template_id UUID,
  share_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  is_nft BOOLEAN DEFAULT FALSE,
  nft_contract TEXT,
  nft_token_id TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meme Collections
CREATE TABLE IF NOT EXISTS meme_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  meme_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES meme_collections(id) ON DELETE CASCADE,
  meme_id UUID REFERENCES user_memes(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, meme_id)
);

-- Meme Reactions
CREATE TABLE IF NOT EXISTS meme_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID REFERENCES user_memes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- 'like', 'fire', 'laugh', 'mind_blown', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meme_id, user_id, reaction_type)
);

-- Meme Comments
CREATE TABLE IF NOT EXISTS meme_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meme_id UUID REFERENCES user_memes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES meme_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meme Templates
CREATE TABLE IF NOT EXISTS meme_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(100),
  is_premium BOOLEAN DEFAULT FALSE,
  required_tier VARCHAR(50), -- 'MISFIT', 'ODDBALL', 'WEIRDO', 'BIZARRE'
  use_count INT DEFAULT 0,
  created_by UUID REFERENCES unified_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Meme Stats (aggregated for performance)
CREATE TABLE IF NOT EXISTS user_meme_stats (
  user_id UUID PRIMARY KEY REFERENCES unified_users(id) ON DELETE CASCADE,
  total_memes INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_views INT DEFAULT 0,
  featured_count INT DEFAULT 0,
  nft_count INT DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_memes_user_id ON user_memes(user_id);
CREATE INDEX idx_user_memes_created_at ON user_memes(created_at DESC);
CREATE INDEX idx_user_memes_featured ON user_memes(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_user_memes_public ON user_memes(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_meme_reactions_meme_id ON meme_reactions(meme_id);
CREATE INDEX idx_meme_reactions_user_id ON meme_reactions(user_id);
CREATE INDEX idx_collection_memes_collection ON collection_memes(collection_id);
CREATE INDEX idx_meme_comments_meme_id ON meme_comments(meme_id);

-- Row Level Security (RLS)
ALTER TABLE user_memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meme_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Memes: Users can view public memes, manage their own
CREATE POLICY "Public memes are viewable by everyone" ON user_memes
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own memes" ON user_memes
  FOR SELECT USING (auth.uid()::UUID = user_id);

CREATE POLICY "Users can insert their own memes" ON user_memes
  FOR INSERT WITH CHECK (auth.uid()::UUID = user_id);

CREATE POLICY "Users can update their own memes" ON user_memes
  FOR UPDATE USING (auth.uid()::UUID = user_id);

CREATE POLICY "Users can delete their own memes" ON user_memes
  FOR DELETE USING (auth.uid()::UUID = user_id);

-- Collections: Similar to memes
CREATE POLICY "Public collections are viewable by everyone" ON meme_collections
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can manage their own collections" ON meme_collections
  FOR ALL USING (auth.uid()::UUID = user_id);

-- Collection Items: Viewable if collection is public or owned
CREATE POLICY "Collection items viewable based on collection" ON collection_memes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meme_collections c
      WHERE c.id = collection_id
      AND (c.is_public = TRUE OR c.user_id = auth.uid()::UUID)
    )
  );

CREATE POLICY "Users can manage items in their collections" ON collection_memes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meme_collections c
      WHERE c.id = collection_id
      AND c.user_id = auth.uid()::UUID
    )
  );

-- Reactions: Anyone can react to public memes
CREATE POLICY "Users can view all reactions" ON meme_reactions
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can add reactions to public memes" ON meme_reactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_memes m
      WHERE m.id = meme_id
      AND (m.is_public = TRUE OR m.user_id = auth.uid()::UUID)
    )
  );

CREATE POLICY "Users can manage their own reactions" ON meme_reactions
  FOR UPDATE USING (auth.uid()::UUID = user_id);

CREATE POLICY "Users can delete their own reactions" ON meme_reactions
  FOR DELETE USING (auth.uid()::UUID = user_id);

-- Comments: Similar to reactions
CREATE POLICY "Comments viewable on public memes" ON meme_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_memes m
      WHERE m.id = meme_id
      AND (m.is_public = TRUE OR m.user_id = auth.uid()::UUID)
    )
  );

CREATE POLICY "Users can comment on public memes" ON meme_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_memes m
      WHERE m.id = meme_id
      AND (m.is_public = TRUE OR m.user_id = auth.uid()::UUID)
    )
  );

CREATE POLICY "Users can edit their own comments" ON meme_comments
  FOR UPDATE USING (auth.uid()::UUID = user_id);

-- Templates: Everyone can view, only admins can modify
CREATE POLICY "Templates are viewable by everyone" ON meme_templates
  FOR SELECT USING (TRUE);

-- Stats: Users can view their own stats
CREATE POLICY "Users can view their own meme stats" ON user_meme_stats
  FOR SELECT USING (auth.uid()::UUID = user_id);

-- Functions for updating stats
CREATE OR REPLACE FUNCTION update_user_meme_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_meme_stats (user_id, total_memes, last_upload_at)
    VALUES (NEW.user_id, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_memes = user_meme_stats.total_memes + 1,
      last_upload_at = NOW(),
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_meme_stats SET
      total_memes = GREATEST(0, total_memes - 1),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating stats
CREATE TRIGGER update_meme_stats_on_change
  AFTER INSERT OR DELETE ON user_memes
  FOR EACH ROW EXECUTE FUNCTION update_user_meme_stats();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_meme_view(meme_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_memes
  SET view_count = view_count + 1
  WHERE id = meme_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update collection meme count
CREATE OR REPLACE FUNCTION update_collection_meme_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE meme_collections
    SET meme_count = meme_count + 1, updated_at = NOW()
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE meme_collections
    SET meme_count = GREATEST(0, meme_count - 1), updated_at = NOW()
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for collection meme count
CREATE TRIGGER update_collection_count_on_change
  AFTER INSERT OR DELETE ON collection_memes
  FOR EACH ROW EXECUTE FUNCTION update_collection_meme_count();