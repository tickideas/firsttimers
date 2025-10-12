-- PostgreSQL initialization script for local development
-- Grant necessary permissions for local development

-- Create extension if not exists (for citext, pg_trgm, pgcrypto)
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant additional permissions for development
GRANT USAGE ON SCHEMA public TO firsttimers_user;
GRANT CREATE ON SCHEMA public TO firsttimers_user;
