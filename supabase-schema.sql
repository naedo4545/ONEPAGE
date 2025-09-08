-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Cards table
CREATE TABLE business_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_data JSONB NOT NULL,
    theme JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Samples table
CREATE TABLE media_samples (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    src TEXT NOT NULL,
    type VARCHAR(10) CHECK (type IN ('image', 'video')) NOT NULL,
    ratings JSONB DEFAULT '{}',
    liked_by TEXT[] DEFAULT '{}',
    avg_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Requests table
CREATE TABLE video_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    selected_sample_ids TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX idx_business_cards_public ON business_cards(is_public) WHERE is_public = true;
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_video_requests_username ON video_requests(username);

-- Functions for rating and liking
CREATE OR REPLACE FUNCTION update_rating(sample_id UUID, user_id TEXT, rating INTEGER)
RETURNS JSONB AS $$
DECLARE
    current_ratings JSONB;
BEGIN
    SELECT ratings INTO current_ratings FROM media_samples WHERE id = sample_id;
    current_ratings := COALESCE(current_ratings, '{}'::jsonb);
    current_ratings := jsonb_set(current_ratings, ARRAY[user_id], to_jsonb(rating));
    RETURN current_ratings;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION toggle_like(sample_id UUID, user_id TEXT)
RETURNS TEXT[] AS $$
DECLARE
    current_likes TEXT[];
BEGIN
    SELECT liked_by INTO current_likes FROM media_samples WHERE id = sample_id;
    current_likes := COALESCE(current_likes, ARRAY[]::TEXT[]);
    
    IF user_id = ANY(current_likes) THEN
        current_likes := array_remove(current_likes, user_id);
    ELSE
        current_likes := array_append(current_likes, user_id);
    END IF;
    
    RETURN current_likes;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Business cards policies (수정된 버전)
CREATE POLICY "Users can view own cards" ON business_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public cards" ON business_cards
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own cards" ON business_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON business_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON business_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Media samples are public read-only
CREATE POLICY "Anyone can view media samples" ON media_samples
    FOR SELECT USING (true);

-- Video requests are public (for now)
CREATE POLICY "Anyone can view video requests" ON video_requests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create video requests" ON video_requests
    FOR INSERT WITH CHECK (true);

-- Insert some sample media data
INSERT INTO media_samples (name, src, type) VALUES
('Sample Video 1', 'https://example.com/sample1.mp4', 'video'),
('Sample Image 1', 'https://example.com/sample1.jpg', 'image'),
('Sample Video 2', 'https://example.com/sample2.mp4', 'video'),
('Sample Image 2', 'https://example.com/sample2.jpg', 'image');
