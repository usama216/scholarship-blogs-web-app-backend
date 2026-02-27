-- Jobs Schema
-- Run this in Supabase SQL Editor after main schema and countries
-- Adds jobs table for national and international job postings

-- Employment types (Full-time, Part-time, Contract, etc.)
CREATE TABLE IF NOT EXISTS employment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO employment_types (name, slug, description) VALUES
  ('Full-time', 'full-time', 'Full-time employment'),
  ('Part-time', 'part-time', 'Part-time employment'),
  ('Contract', 'contract', 'Contract-based work'),
  ('Internship', 'internship', 'Internship position'),
  ('Freelance', 'freelance', 'Freelance or gig work'),
  ('Volunteer', 'volunteer', 'Volunteer position'),
  ('Temporary', 'temporary', 'Temporary position')
ON CONFLICT (slug) DO NOTHING;

-- Jobs table
-- location_type: 'national' | 'international' - for filtering
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  author_id TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views INTEGER DEFAULT 0,
  meta_description TEXT,
  meta_keywords TEXT,
  seo_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Job-specific fields
  company_name TEXT NOT NULL,
  company_logo TEXT,
  location_type TEXT NOT NULL CHECK (location_type IN ('national', 'international')),
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
  salary_range TEXT,
  remote_work TEXT CHECK (remote_work IN ('onsite', 'remote', 'hybrid')),
  application_deadline DATE,
  apply_link TEXT,
  contact_email TEXT,
  job_requirements TEXT,
  job_responsibilities TEXT,
  benefits TEXT,
  experience_level TEXT,
  scheduled_publish_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_location_type ON jobs(location_type);
CREATE INDEX IF NOT EXISTS idx_jobs_country_id ON jobs(country_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(application_deadline);

-- Trigger for updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Jobs schema completed successfully!' AS status;
