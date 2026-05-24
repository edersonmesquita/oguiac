-- Add website column to companies table
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "website" TEXT; 