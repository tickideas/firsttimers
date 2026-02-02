-- PostgreSQL initialization script
-- This runs after the POSTGRES_USER is created by the container

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: The default user created by POSTGRES_USER env var already has 
-- full permissions on the POSTGRES_DB database, so no additional grants needed.
