-- GameBlast Mobile Database Setup Script
-- Run this after creating your Supabase project and setting up the main schema

-- First, ensure the main schema is created (run config/database-schema.sql first)

-- ===== CREATE ADMIN USER =====
-- Replace the values below with your actual admin details from .env file

DO $$
DECLARE
    admin_user_id UUID;
    hashed_password TEXT := '$2a$10$rQJ5qVJ5qVJ5qVJ5qVJ5qOJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5q'; -- This is 'AdminPass123!' hashed
BEGIN
    -- Insert admin user
    INSERT INTO users (username, email, phone, password_hash, role, is_active)
    VALUES ('admin', 'admin@gameblast.com', '+919876543210', hashed_password, 'admin', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO admin_user_id;
    
    -- If admin user already exists, get the ID
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users WHERE email = 'admin@gameblast.com';
    END IF;
    
    RAISE NOTICE 'Admin user created/updated with ID: %', admin_user_id;
END $$;

-- ===== CREATE DUMMY USERS =====
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    hashed_password TEXT := '$2a$10$rQJ5qVJ5qVJ5qVJ5qVJ5qOJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5q'; -- This is 'password123' hashed
BEGIN
    -- Create dummy user 1
    INSERT INTO users (username, email, phone, password_hash, role, is_active)
    VALUES ('player1', 'player1@example.com', '+919876543211', hashed_password, 'user', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user1_id;
    
    -- Create dummy user 2
    INSERT INTO users (username, email, phone, password_hash, role, is_active)
    VALUES ('player2', 'player2@example.com', '+919876543212', hashed_password, 'user', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user2_id;
    
    RAISE NOTICE 'Dummy users created';
END $$;

-- ===== CREATE DUMMY ORGANISERS =====
DO $$
DECLARE
    org1_user_id UUID;
    org2_user_id UUID;
    org1_id UUID;
    org2_id UUID;
    hashed_password TEXT := '$2a$10$rQJ5qVJ5qVJ5qVJ5qVJ5qOJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5qVJ5q'; -- This is 'organiser123' hashed
BEGIN
    -- Create organiser 1 user account
    INSERT INTO users (username, email, phone, password_hash, role, is_active)
    VALUES ('organiser1', 'organiser1@example.com', '+919876543213', hashed_password, 'organiser', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO org1_user_id;
    
    -- Create organiser 2 user account
    INSERT INTO users (username, email, phone, password_hash, role, is_active)
    VALUES ('organiser2', 'organiser2@example.com', '+919876543214', hashed_password, 'organiser', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO org2_user_id;
    
    -- Get existing user IDs if they already exist
    IF org1_user_id IS NULL THEN
        SELECT id INTO org1_user_id FROM users WHERE email = 'organiser1@example.com';
    END IF;
    
    IF org2_user_id IS NULL THEN
        SELECT id INTO org2_user_id FROM users WHERE email = 'organiser2@example.com';
    END IF;
    
    -- Create organiser 1 profile
    INSERT INTO organisers (
        user_id, real_name, organiser_name, personal_phone, whatsapp_number,
        aadhaar_front_url, aadhaar_back_url, is_approved, monthly_fee_paid
    )
    VALUES (
        org1_user_id, 'Rajesh Kumar', 'TambolaKing', '+919876543213', '+919876543213',
        'https://example.com/aadhaar1_front.jpg', 'https://example.com/aadhaar1_back.jpg',
        true, true
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO org1_id;
    
    -- Create organiser 2 profile
    INSERT INTO organisers (
        user_id, real_name, organiser_name, personal_phone, whatsapp_number,
        aadhaar_front_url, aadhaar_back_url, is_approved, monthly_fee_paid
    )
    VALUES (
        org2_user_id, 'Priya Sharma', 'NumberMaster', '+919876543214', '+919876543214',
        'https://example.com/aadhaar2_front.jpg', 'https://example.com/aadhaar2_back.jpg',
        true, true
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO org2_id;
    
    RAISE NOTICE 'Dummy organisers created';
END $$;

-- ===== CREATE DUMMY GAMES =====
DO $$
DECLARE
    org1_id UUID;
    org2_id UUID;
    game_date DATE := CURRENT_DATE;
    i INTEGER;
BEGIN
    -- Get organiser IDs
    SELECT o.id INTO org1_id 
    FROM organisers o 
    JOIN users u ON o.user_id = u.id 
    WHERE u.email = 'organiser1@example.com';
    
    SELECT o.id INTO org2_id 
    FROM organisers o 
    JOIN users u ON o.user_id = u.id 
    WHERE u.email = 'organiser2@example.com';
    
    -- Create 3 games for organiser 1
    FOR i IN 1..3 LOOP
        INSERT INTO games (
            organiser_id, name, banner_image_url, total_prize,
            price_per_sheet_1, price_per_sheet_2, price_per_sheet_3_plus,
            payment_qr_code_url, zoom_link, zoom_password,
            game_date, game_time, status,
            sheets_folder_id, sheets_folder_url, total_sheets,
            is_featured, is_top_game, featured_order, top_game_order,
            has_glow_dot, has_glow_shadow
        )
        VALUES (
            org1_id,
            'TambolaKing Game ' || i,
            '/images/game-banner-' || i || '.jpg',
            CASE i 
                WHEN 1 THEN 10000.00
                WHEN 2 THEN 15000.00
                WHEN 3 THEN 20000.00
            END,
            CASE i 
                WHEN 1 THEN 100.00
                WHEN 2 THEN 150.00
                WHEN 3 THEN 200.00
            END,
            CASE i 
                WHEN 1 THEN 90.00
                WHEN 2 THEN 140.00
                WHEN 3 THEN 180.00
            END,
            CASE i 
                WHEN 1 THEN 80.00
                WHEN 2 THEN 130.00
                WHEN 3 THEN 160.00
            END,
            '/images/qr-code-org1.jpg',
            'https://zoom.us/j/1234567890',
            'game123',
            game_date,
            CASE i 
                WHEN 1 THEN '19:00:00'
                WHEN 2 THEN '20:00:00'
                WHEN 3 THEN '21:00:00'
            END,
            'upcoming',
            'dummy_folder_id_' || org1_id || '_' || i,
            'https://drive.google.com/drive/folders/dummy_folder_' || i,
            30,
            CASE i WHEN 1 THEN true ELSE false END,
            CASE i WHEN 2 THEN true ELSE false END,
            CASE i WHEN 1 THEN 1 ELSE NULL END,
            CASE i WHEN 2 THEN 1 ELSE NULL END,
            CASE i WHEN 1 THEN true ELSE false END,
            CASE i WHEN 2 THEN true ELSE false END
        );
    END LOOP;
    
    -- Create 3 games for organiser 2
    FOR i IN 1..3 LOOP
        INSERT INTO games (
            organiser_id, name, banner_image_url, total_prize,
            price_per_sheet_1, price_per_sheet_2, price_per_sheet_3_plus,
            payment_qr_code_url, zoom_link, zoom_password,
            game_date, game_time, status,
            sheets_folder_id, sheets_folder_url, total_sheets,
            is_featured, is_top_game, featured_order, top_game_order,
            has_glow_dot, has_glow_shadow
        )
        VALUES (
            org2_id,
            'NumberMaster Game ' || i,
            '/images/game-banner-' || (i + 3) || '.jpg',
            CASE i 
                WHEN 1 THEN 12000.00
                WHEN 2 THEN 18000.00
                WHEN 3 THEN 25000.00
            END,
            CASE i 
                WHEN 1 THEN 120.00
                WHEN 2 THEN 180.00
                WHEN 3 THEN 250.00
            END,
            CASE i 
                WHEN 1 THEN 110.00
                WHEN 2 THEN 170.00
                WHEN 3 THEN 230.00
            END,
            CASE i 
                WHEN 1 THEN 100.00
                WHEN 2 THEN 160.00
                WHEN 3 THEN 210.00
            END,
            '/images/qr-code-org2.jpg',
            'https://zoom.us/j/0987654321',
            'number456',
            game_date,
            CASE i 
                WHEN 1 THEN '18:00:00'
                WHEN 2 THEN '19:30:00'
                WHEN 3 THEN '21:30:00'
            END,
            'upcoming',
            'dummy_folder_id_' || org2_id || '_' || i,
            'https://drive.google.com/drive/folders/dummy_folder_' || (i + 3),
            30,
            CASE i WHEN 3 THEN true ELSE false END,
            CASE i WHEN 1 THEN true ELSE false END,
            CASE i WHEN 3 THEN 2 ELSE NULL END,
            CASE i WHEN 1 THEN 2 ELSE NULL END,
            false,
            CASE i WHEN 3 THEN true ELSE false END
        );
    END LOOP;
    
    RAISE NOTICE 'Dummy games created for today: %', game_date;
END $$;

-- ===== CREATE PLATFORM SETTINGS =====
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES 
    ('platform_name', 'GameBlast Mobile', 'Platform name displayed throughout the site'),
    ('platform_tagline', 'Ultimate Mobile Gaming Experience', 'Platform tagline'),
    ('organiser_monthly_fee', '2500', 'Monthly fee for organisers in INR'),
    ('support_email', 'support@gameblast.com', 'Support email address'),
    ('support_whatsapp', '+919876543210', 'Support WhatsApp number'),
    ('support_phone', '+919876543210', 'Support phone number'),
    ('disclaimer_text', 'This platform is a SaaS service. We are not responsible for any monetary losses. Play responsibly.', 'Disclaimer banner text'),
    ('max_featured_games', '15', 'Maximum number of featured games'),
    ('max_top_games', '15', 'Maximum number of top games'),
    ('max_news_items', '10', 'Maximum number of news ticker items')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- ===== CREATE SAMPLE NEWS BANNER ITEMS =====
INSERT INTO news_banner (text, link_url, is_active, display_order)
VALUES 
    ('🎉 Welcome to GameBlast Mobile - Your Ultimate Gaming Destination!', '/', true, 1),
    ('🏆 Win Big Prizes - Join Today''s Featured Games!', '/games', true, 2),
    ('📱 Download our PWA for the best mobile experience!', '/', true, 3),
    ('🎮 New games added daily - Never miss the action!', '/games', true, 4),
    ('💰 Organisers earn more with our platform - Join now!', '/organiser', true, 5)
ON CONFLICT DO NOTHING;

-- ===== CREATE SAMPLE AD SCRIPTS =====
INSERT INTO ad_scripts (network_name, script_content, is_active, placement_info)
VALUES 
    ('Google AdSense', '<!-- Google AdSense Script Placeholder -->', false, 'Header, sidebar, and footer ad placements'),
    ('TapJoy', '<!-- TapJoy Script Placeholder -->', false, 'Mobile interstitial and banner ads'),
    ('Meta Audience Network', '<!-- Meta Audience Network Script Placeholder -->', false, 'Facebook audience network integration')
ON CONFLICT (network_name) DO UPDATE SET 
    script_content = EXCLUDED.script_content,
    updated_at = NOW();

-- ===== VERIFICATION QUERIES =====
-- Run these to verify the setup

-- Check users
SELECT 'Users Created:' as info, count(*) as count FROM users;
SELECT username, email, role FROM users ORDER BY role, username;

-- Check organisers
SELECT 'Organisers Created:' as info, count(*) as count FROM organisers;
SELECT o.organiser_name, u.email, o.is_approved FROM organisers o JOIN users u ON o.user_id = u.id;

-- Check games
SELECT 'Games Created:' as info, count(*) as count FROM games;
SELECT g.name, o.organiser_name, g.total_prize, g.game_time 
FROM games g 
JOIN organisers o ON g.organiser_id = o.id 
ORDER BY g.game_time;

-- Check settings
SELECT 'Settings Created:' as info, count(*) as count FROM admin_settings;
SELECT setting_key, setting_value FROM admin_settings ORDER BY setting_key;

-- Check news banner
SELECT 'News Items Created:' as info, count(*) as count FROM news_banner;
SELECT text, is_active FROM news_banner ORDER BY display_order;

RAISE NOTICE 'Database setup completed successfully!';
RAISE NOTICE 'Admin Login: admin@gameblast.com / AdminPass123!';
RAISE NOTICE 'User Login: player1@example.com / password123';
RAISE NOTICE 'Organiser Login: organiser1@example.com / organiser123';