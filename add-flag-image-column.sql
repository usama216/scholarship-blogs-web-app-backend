-- Add flag_image column to countries table
-- Run this in Supabase SQL Editor

ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_image TEXT;

-- This column will store the URL of the uploaded flag image
-- The URL will be from Supabase Storage bucket

