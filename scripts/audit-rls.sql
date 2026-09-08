-- ==============================================================================
-- RLS (Row Level Security) Audit Script
-- Run this in your Supabase SQL Editor to verify RLS configuration.
-- ==============================================================================

-- 1. Check all tables in the 'public' schema and see if RLS is enabled and forced
SELECT 
    c.relname AS "Table Name",
    c.relrowsecurity AS "RLS Enabled",
    c.relforcerowsecurity AS "RLS Forced"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r' 
  AND c.relname NOT LIKE '_prisma%'
ORDER BY c.relname;

-- 2. View all active RLS policies on 'public' tables
SELECT 
    schemaname AS "Schema",
    tablename AS "Table",
    policyname AS "Policy Name",
    permissive AS "Permissive",
    roles AS "Roles",
    cmd AS "Command",
    qual AS "Using Expression",
    with_check AS "With Check Expression"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
