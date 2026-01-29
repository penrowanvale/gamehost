SELECT '=== EXTENSIONS ===' as info;
SELECT extname as extension_name, extversion as version 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

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
