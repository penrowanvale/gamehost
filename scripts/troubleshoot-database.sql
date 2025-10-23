-- Database Troubleshooting Script
-- Run this if you encounter issues during setup

-- ===== CHECK EXTENSIONS =====
SELECT '=== EXTENSIONS ===' as info;
SELECT extname as extension_name, extversion as version 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- If uuid-ossp is missing, run this:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== CHECK TABLE EXISTENCE =====
SELECT '=== TABLES ===' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'organisers', 'games', 'game_participants', 
    'game_winners', 'sponsored_ads', 'news_banner', 
    'admin_settings', 'ad_scripts', 'notifications'
)
ORDER BY table_name;

-- ===== CHECK CONSTRAINTS =====
SELECT '=== CONSTRAINTS ===' as info;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name IN (
    'users', 'organisers', 'games', 'game_participants', 
    'game_winners', 'sponsored_ads', 'news_banner', 
    'admin_settings', 'ad_scripts', 'notifications'
)
ORDER BY tc.table_name, tc.constraint_type;

-- ===== CHECK FOREIGN KEYS =====
SELECT '=== FOREIGN KEYS ===' as info;
SELECT 
    kcu.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu 
    ON kcu.constraint_name = ccu.constraint_name
JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND kcu.table_schema = 'public'
ORDER BY kcu.table_name, kcu.column_name;

-- ===== CHECK UNIQUE CONSTRAINTS =====
SELECT '=== UNIQUE CONSTRAINTS ===' as info;
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===== CHECK RLS POLICIES =====
SELECT '=== ROW LEVEL SECURITY ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===== COMMON FIXES =====
SELECT '=== COMMON FIXES ===' as info;
SELECT 'If tables are missing, run: config/database-schema.sql' as fix
UNION ALL
SELECT 'If data is missing, run: scripts/setup-database.sql'
UNION ALL
SELECT 'If constraints fail, check for existing conflicting data'
UNION ALL
SELECT 'If UUID errors occur, ensure uuid-ossp extension is installed'
UNION ALL
SELECT 'If RLS errors occur, check authentication context';

-- ===== RESET SCRIPT (USE WITH CAUTION) =====
/*
-- UNCOMMENT AND RUN ONLY IF YOU NEED TO COMPLETELY RESET THE DATABASE
-- ⚠️ WARNING: This will delete ALL data!

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS game_winners CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS organisers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sponsored_ads CASCADE;
DROP TABLE IF EXISTS news_banner CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS ad_scripts CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp";

-- After running this, you need to run both:
-- 1. config/database-schema.sql
-- 2. scripts/setup-database.sql
*/