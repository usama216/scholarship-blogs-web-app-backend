-- Add Countries System to Existing Database
-- Run this in Supabase SQL Editor after running the main schema

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- ISO country code (e.g., 'US', 'UK', 'CA')
  flag_emoji TEXT, -- Optional: 🇺🇸, 🇬🇧, etc.
  region TEXT, -- e.g., 'North America', 'Europe', 'Asia'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add country_id to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE SET NULL;

-- Add index for country-based filtering
CREATE INDEX IF NOT EXISTS idx_posts_country_id ON posts(country_id);

-- Insert popular scholarship countries
INSERT INTO countries (name, slug, code, flag_emoji, region, description) VALUES
  ('United States', 'united-states', 'US', '🇺🇸', 'North America', 'Scholarships for studying in the USA'),
  ('United Kingdom', 'united-kingdom', 'GB', '🇬🇧', 'Europe', 'Scholarships for studying in the UK'),
  ('Canada', 'canada', 'CA', '🇨🇦', 'North America', 'Scholarships for studying in Canada'),
  ('Germany', 'germany', 'DE', '🇩🇪', 'Europe', 'Scholarships for studying in Germany'),
  ('Australia', 'australia', 'AU', '🇦🇺', 'Oceania', 'Scholarships for studying in Australia'),
  ('France', 'france', 'FR', '🇫🇷', 'Europe', 'Scholarships for studying in France'),
  ('Netherlands', 'netherlands', 'NL', '🇳🇱', 'Europe', 'Scholarships for studying in the Netherlands'),
  ('Sweden', 'sweden', 'SE', '🇸🇪', 'Europe', 'Scholarships for studying in Sweden'),
  ('Norway', 'norway', 'NO', '🇳🇴', 'Europe', 'Scholarships for studying in Norway'),
  ('Denmark', 'denmark', 'DK', '🇩🇰', 'Europe', 'Scholarships for studying in Denmark'),
  ('Switzerland', 'switzerland', 'CH', '🇨🇭', 'Europe', 'Scholarships for studying in Switzerland'),
  ('Japan', 'japan', 'JP', '🇯🇵', 'Asia', 'Scholarships for studying in Japan'),
  ('South Korea', 'south-korea', 'KR', '🇰🇷', 'Asia', 'Scholarships for studying in South Korea'),
  ('China', 'china', 'CN', '🇨🇳', 'Asia', 'Scholarships for studying in China'),
  ('Singapore', 'singapore', 'SG', '🇸🇬', 'Asia', 'Scholarships for studying in Singapore'),
  ('New Zealand', 'new-zealand', 'NZ', '🇳🇿', 'Oceania', 'Scholarships for studying in New Zealand'),
  ('Ireland', 'ireland', 'IE', '🇮🇪', 'Europe', 'Scholarships for studying in Ireland'),
  ('Belgium', 'belgium', 'BE', '🇧🇪', 'Europe', 'Scholarships for studying in Belgium'),
  ('Finland', 'finland', 'FI', '🇫🇮', 'Europe', 'Scholarships for studying in Finland'),
  ('Austria', 'austria', 'AT', '🇦🇹', 'Europe', 'Scholarships for studying in Austria'),
  ('Italy', 'italy', 'IT', '🇮🇹', 'Europe', 'Scholarships for studying in Italy'),
  ('Spain', 'spain', 'ES', '🇪🇸', 'Europe', 'Scholarships for studying in Spain'),
  ('Poland', 'poland', 'PL', '🇵🇱', 'Europe', 'Scholarships for studying in Poland'),
  ('Czech Republic', 'czech-republic', 'CZ', '🇨🇿', 'Europe', 'Scholarships for studying in Czech Republic'),
  ('Hungary', 'hungary', 'HU', '🇭🇺', 'Europe', 'Scholarships for studying in Hungary'),
  ('Turkey', 'turkey', 'TR', '🇹🇷', 'Asia/Europe', 'Scholarships for studying in Turkey'),
  ('Malaysia', 'malaysia', 'MY', '🇲🇾', 'Asia', 'Scholarships for studying in Malaysia'),
  ('Thailand', 'thailand', 'TH', '🇹🇭', 'Asia', 'Scholarships for studying in Thailand'),
  ('United Arab Emirates', 'uae', 'AE', '🇦🇪', 'Middle East', 'Scholarships for studying in UAE'),
  ('Saudi Arabia', 'saudi-arabia', 'SA', '🇸🇦', 'Middle East', 'Scholarships for studying in Saudi Arabia'),
  ('Russia', 'russia', 'RU', '🇷🇺', 'Europe/Asia', 'Scholarships for studying in Russia'),
  ('Brazil', 'brazil', 'BR', '🇧🇷', 'South America', 'Scholarships for studying in Brazil'),
  ('South Africa', 'south-africa', 'ZA', '🇿🇦', 'Africa', 'Scholarships for studying in South Africa'),
  ('Multiple Countries', 'multiple-countries', 'XX', '🌍', 'Global', 'Scholarships valid for multiple countries'),
  ('Any Country', 'any-country', 'WW', '🌎', 'Worldwide', 'Scholarships for any country')
ON CONFLICT (code) DO NOTHING;

-- Success message
SELECT 'Countries table created and populated successfully!' AS status;

