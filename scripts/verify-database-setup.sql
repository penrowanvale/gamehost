-- Database Setup Verification Script
-- Run this after completing the database setup to verify everything is working correctly

-- ===== BASIC TABLE VERIFICATION =====
SELECT '=== TABLE COUNTS ===' as info;

SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Organisers', count(*) FROM organisers
UNION ALL
SELECT 'Games', count(*) FROM games
UNION ALL
SELECT 'Game Participants', count(*) FROM game_participants
UNION ALL
SELECT 'Game Winners', count(*) FROM game_winners
UNION ALL
SELECT 'Sponsored Ads', count(*) FROM sponsored_ads
UNION ALL
SELECT 'News Banner', count(*) FROM news_banner
UNION ALL
SELECT 'Admin Settings', count(*) FROM admin_settings
UNION ALL
SELECT 'Ad Scripts', count(*) FROM ad_scripts
UNION ALL
SELECT 'Notifications', count(*) FROM notifications;

-- ===== USER ROLE DISTRIBUTION =====
SELECT '=== USER ROLES ===' as info;
SELECT role, count(*) as count FROM users GROUP BY role ORDER BY role;

-- ===== ORGANISER STATUS =====
SELECT '=== ORGANISER STATUS ===' as info;
SELECT 
    o.organiser_name,
    u.email,
    o.is_approved,
    o.monthly_fee_paid
FROM organisers o 
JOIN users u ON o.user_id = u.id
ORDER BY o.organiser_name;

-- ===== TODAY'S GAMES =====
SELECT '=== TODAY''S GAMES ===' as info;
SELECT 
    g.name,
    o.organiser_name,
    g.total_prize,
    g.game_time,
    g.status,
    g.is_featured,
    g.is_top_game
FROM games g 
JOIN organisers o ON g.organiser_id = o.id 
WHERE g.game_date = CURRENT_DATE
ORDER BY g.game_time;

-- ===== ADMIN SETTINGS =====
SELECT '=== ADMIN SETTINGS ===' as info;
SELECT setting_key, setting_value FROM admin_settings ORDER BY setting_key;

-- ===== NEWS BANNER ITEMS =====
SELECT '=== NEWS BANNER ===' as info;
SELECT display_order, text, is_active FROM news_banner ORDER BY display_order;

-- ===== AD NETWORKS =====
SELECT '=== AD NETWORKS ===' as info;
SELECT network_name, is_active, 
       CASE WHEN LENGTH(script_content) > 0 THEN 'Has Script' ELSE 'Empty Script' END as script_status
FROM ad_scripts ORDER BY network_name;

-- ===== CONSTRAINT VERIFICATION =====
SELECT '=== CONSTRAINT VERIFICATION ===' as info;

-- Check unique constraints
SELECT 'Email uniqueness' as check_name, 
       CASE WHEN count(*) = count(DISTINCT email) THEN 'PASS' ELSE 'FAIL' END as status
FROM users
UNION ALL
SELECT 'Username uniqueness', 
       CASE WHEN count(*) = count(DISTINCT username) THEN 'PASS' ELSE 'FAIL' END
FROM users
UNION ALL
SELECT 'Phone uniqueness', 
       CASE WHEN count(*) = count(DISTINCT phone) THEN 'PASS' ELSE 'FAIL' END
FROM users
UNION ALL
SELECT 'Organiser user_id uniqueness', 
       CASE WHEN count(*) = count(DISTINCT user_id) THEN 'PASS' ELSE 'FAIL' END
FROM organisers;

-- ===== FOREIGN KEY VERIFICATION =====
SELECT '=== FOREIGN KEY VERIFICATION ===' as info;

-- Check organiser-user relationships
SELECT 'Organiser-User FK' as check_name,
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM organisers o 
LEFT JOIN users u ON o.user_id = u.id 
WHERE u.id IS NULL
UNION ALL
-- Check game-organiser relationships
SELECT 'Game-Organiser FK',
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END
FROM games g 
LEFT JOIN organisers o ON g.organiser_id = o.id 
WHERE o.id IS NULL;

-- ===== FINAL STATUS =====
SELECT '=== SETUP STATUS ===' as info;
SELECT 
    CASE 
        WHEN (SELECT count(*) FROM users WHERE role = 'admin') >= 1 
         AND (SELECT count(*) FROM organisers) >= 2
         AND (SELECT count(*) FROM games WHERE game_date = CURRENT_DATE) >= 6
         AND (SELECT count(*) FROM admin_settings) >= 7
         AND (SELECT count(*) FROM news_banner) >= 5
         AND (SELECT count(*) FROM ad_scripts) >= 3
        THEN '✅ DATABASE SETUP COMPLETE - READY FOR USE!'
        ELSE '❌ SETUP INCOMPLETE - CHECK ABOVE RESULTS'
    END as final_status;

-- Display login credentials reminder
SELECT '=== LOGIN CREDENTIALS ===' as info;
SELECT 'Admin Login: admin@gameblast.com / AdminPass123!' as credentials
UNION ALL
SELECT 'User Login: player1@example.com / password123'
UNION ALL
SELECT 'Organiser Login: organiser1@example.com / organiser123';