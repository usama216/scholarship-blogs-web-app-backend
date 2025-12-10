-- Scholarship Schema Extension
-- Run this after the main supabase-schema.sql
-- This adds all scholarship-specific fields and tables

-- Degree Levels table
CREATE TABLE IF NOT EXISTS degree_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common degree levels
INSERT INTO degree_levels (name, slug, description) VALUES
  ('Bachelor', 'bachelor', 'Undergraduate degree programs'),
  ('Master', 'master', 'Graduate degree programs'),
  ('PhD', 'phd', 'Doctoral degree programs'),
  ('Postdoc', 'postdoc', 'Postdoctoral research positions'),
  ('Diploma', 'diploma', 'Diploma and certificate programs'),
  ('Associate', 'associate', 'Associate degree programs'),
  ('MBA', 'mba', 'Master of Business Administration'),
  ('LLM', 'llm', 'Master of Laws'),
  ('Short Course', 'short-course', 'Short-term courses and workshops')
ON CONFLICT (slug) DO NOTHING;

-- Funding Types table
CREATE TABLE IF NOT EXISTS funding_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common funding types
INSERT INTO funding_types (name, slug, description) VALUES
  ('Fully Funded', 'fully-funded', 'Covers tuition, living expenses, and travel'),
  ('Partial Funded', 'partial-funded', 'Covers partial expenses'),
  ('Self-Funded', 'self-funded', 'Student pays all expenses'),
  ('Grant', 'grant', 'Financial grant provided'),
  ('Fellowship', 'fellowship', 'Fellowship program'),
  ('Exchange Program', 'exchange-program', 'Student exchange program'),
  ('Research Grant', 'research-grant', 'Research funding'),
  ('Merit Scholarship', 'merit-scholarship', 'Based on academic merit'),
  ('Need-Based', 'need-based', 'Based on financial need')
ON CONFLICT (slug) DO NOTHING;

-- Add scholarship-specific columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scholarship_provider TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS funding_type_id UUID REFERENCES funding_types(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS application_deadline DATE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS program_duration TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS eligible_nationalities TEXT; -- JSON array or comma-separated
ALTER TABLE posts ADD COLUMN IF NOT EXISTS application_fee BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS application_fee_amount DECIMAL(10,2);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS official_website TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS apply_link TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scholarship_benefits TEXT; -- Rich text or JSON
ALTER TABLE posts ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT; -- Rich text
ALTER TABLE posts ADD COLUMN IF NOT EXISTS required_documents TEXT; -- Rich text or JSON
ALTER TABLE posts ADD COLUMN IF NOT EXISTS how_to_apply TEXT; -- Rich text
ALTER TABLE posts ADD COLUMN IF NOT EXISTS notes TEXT; -- Rich text
ALTER TABLE posts ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS application_mode TEXT CHECK (application_mode IN ('online', 'offline', 'both'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS available_seats INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS host_university_logo TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scholarship_brochure_pdf TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_embed TEXT; -- YouTube/Vimeo embed code
ALTER TABLE posts ADD COLUMN IF NOT EXISTS faq_data JSONB; -- FAQ questions and answers
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title TEXT; -- Override default title for SEO

-- Post Degree Levels junction table (many-to-many)
CREATE TABLE IF NOT EXISTS post_degree_levels (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  degree_level_id UUID REFERENCES degree_levels(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, degree_level_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_funding_type ON posts(funding_type_id);
CREATE INDEX IF NOT EXISTS idx_posts_deadline ON posts(application_deadline);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_publish ON posts(scheduled_publish_at);
CREATE INDEX IF NOT EXISTS idx_post_degree_levels_post_id ON post_degree_levels(post_id);
CREATE INDEX IF NOT EXISTS idx_post_degree_levels_degree_id ON post_degree_levels(degree_level_id);

-- Tags table already exists, but ensure it's properly set up
-- (Already in main schema)

-- Contact Messages table (for contact form submissions)
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website Settings table (for admin settings)
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT DEFAULT 'text', -- text, json, boolean, number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO website_settings (key, value, type) VALUES
  ('site_title', 'Abroad Scholarships', 'text'),
  ('site_description', 'Find international scholarships for students worldwide', 'text'),
  ('contact_email', 'contact@example.com', 'text'),
  ('logo_url', '', 'text'),
  ('favicon_url', '', 'text'),
  ('google_analytics_id', '', 'text'),
  ('google_adsense_id', '', 'text'),
  ('facebook_url', '', 'text'),
  ('twitter_url', '', 'text'),
  ('instagram_url', '', 'text'),
  ('linkedin_url', '', 'text'),
  ('youtube_url', '', 'text')
ON CONFLICT (key) DO NOTHING;

-- Function to update updated_at timestamp for settings
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for settings
CREATE TRIGGER update_website_settings_updated_at BEFORE UPDATE ON website_settings
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

-- Success message
SELECT 'Scholarship schema extension completed successfully!' AS status;

