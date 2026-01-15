-- =============================================
-- COMPLETE DATABASE SETUP FOR NEW DEPLOYMENTS
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'organiser', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organisers table (extended profile for organisers)
CREATE TABLE IF NOT EXISTS organisers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    real_name VARCHAR(100) NOT NULL,
    organiser_name VARCHAR(100) NOT NULL,
    personal_phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    aadhaar_front_url TEXT,
    aadhaar_back_url TEXT,
    is_approved BOOLEAN DEFAULT false,
    monthly_fee_paid BOOLEAN DEFAULT false,
    google_drive_folder_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organiser_id UUID REFERENCES organisers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    banner_image_url TEXT,
    total_prize DECIMAL(10,2) NOT NULL,
    price_per_sheet_1 DECIMAL(10,2) NOT NULL,
    price_per_sheet_2 DECIMAL(10,2) NOT NULL,
    price_per_sheet_3_plus DECIMAL(10,2) NOT NULL,
    payment_qr_code_url TEXT,
    zoom_link TEXT,
    zoom_password VARCHAR(50),
    game_date DATE NOT NULL,
    game_time TIME,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
    sheets_folder_id TEXT,
    sheets_folder_url TEXT,
    sheet_file_format TEXT DEFAULT 'Sheet_{number}.pdf',
    total_sheets INTEGER DEFAULT 0,
    registered_participants INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_top_game BOOLEAN DEFAULT false,
    featured_order INTEGER,
    top_game_order INTEGER,
    has_glow_dot BOOLEAN DEFAULT false,
    has_glow_shadow BOOLEAN DEFAULT false,
    individual_sheet_files JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game participants
CREATE TABLE IF NOT EXISTS game_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sheets_selected INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    utr_id VARCHAR(50),
    payment_phone VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
    sheets_downloaded BOOLEAN DEFAULT false,
    selected_sheet_numbers TEXT[],
    downloaded_sheet_numbers INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game winners
CREATE TABLE IF NOT EXISTS game_winners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    prize_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsored ads
CREATE TABLE IF NOT EXISTS sponsored_ads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200),
    banner_image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News banner items
CREATE TABLE IF NOT EXISTS news_banner (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    text VARCHAR(500) NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad network scripts
CREATE TABLE IF NOT EXISTS ad_scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_name VARCHAR(50) UNIQUE NOT NULL,
    script_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    placement_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_games_organiser ON games(organiser_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_participants_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON game_participants(user_id);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('platform_name', 'GameBlast Mobile', 'Platform name displayed across the site'),
('platform_tagline', 'Your Ultimate Mobile Gaming Experience', 'Platform tagline'),
('disclaimer_text', 'This platform is a SaaS service. We are not responsible for any monetary losses. Play responsibly.', 'Disclaimer text for banner'),
('organiser_monthly_fee', '2500', 'Monthly fee for organisers in INR'),
('max_featured_games', '15', 'Maximum number of featured games'),
('max_ads', '4', 'Maximum number of sponsored ads')
ON CONFLICT (setting_key) DO NOTHING;

-- Success message
SELECT 'Database setup complete! Now create admin user via API.' as status;
