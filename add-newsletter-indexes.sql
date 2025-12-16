-- Migration: Add indexes for newsletter_subscribers table
-- Run this in your Supabase SQL Editor for better query performance

-- Index for filtering by is_active (used frequently for email sending)
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_is_active 
ON newsletter_subscribers(is_active) 
WHERE is_active = true;

-- Index for ordering by subscribed_at (used in admin panel)
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at 
ON newsletter_subscribers(subscribed_at DESC);

-- Note: email column already has a UNIQUE constraint which creates an index automatically
-- So we don't need to create an index for email lookups

