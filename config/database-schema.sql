-- Gaming Platform Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
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
CREATE TABLE organisers (
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
CREATE TABLE games (
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
    sheets_folder_id TEXT, -- Google Drive folder ID for sheets
    sheets_folder_url TEXT, -- Original Google Drive folder URL
    sheet_file_format TEXT DEFAULT 'Sheet_{number}.pdf', -- File naming format
    total_sheets INTEGER DEFAULT 0,
    registered_participants INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_top_game BOOLEAN DEFAULT false,
    featured_order INTEGER,
    top_game_order INTEGER,
    has_glow_dot BOOLEAN DEFAULT false,
    has_glow_shadow BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game participants (users who registered for games)
-- Note: Removed UNIQUE(game_id, user_id) to allow multiple sheet purchases for same game
CREATE TABLE game_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sheets_selected INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    utr_id VARCHAR(50),
    payment_phone VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
    sheets_downloaded BOOLEAN DEFAULT false,
    selected_sheet_numbers TEXT[], -- Array of selected sheet numbers
    downloaded_sheet_numbers INTEGER[] DEFAULT '{}', -- Array of downloaded sheet numbers for individual tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- UNIQUE constraint removed to allow multiple purchases per game per user
);

-- Game winners
CREATE TABLE game_winners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- 1st, 2nd, 3rd
    prize_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsored ads
CREATE TABLE sponsored_ads (
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
CREATE TABLE news_banner (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    text VARCHAR(500) NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER UNIQUE DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings
CREATE TABLE admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad network scripts
CREATE TABLE ad_scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    network_name VARCHAR(50) UNIQUE NOT NULL, -- 'google_adsense', 'tapjoy', 'meta'
    script_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    placement_info TEXT, -- Description of where ads are placed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'game_live', 'payment_approved', etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_games_organiser ON games(organiser_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_featured ON games(is_featured);
CREATE INDEX idx_games_top ON games(is_top_game);
CREATE INDEX idx_participants_game ON game_participants(game_id);
CREATE INDEX idx_participants_user ON game_participants(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('platform_name', 'GameBlast Mobile', 'Platform name displayed across the site'),
('platform_tagline', 'Your Ultimate Mobile Gaming Experience', 'Platform tagline'),
('disclaimer_text', 'This platform is a SaaS service. We are not responsible for any monetary losses. Play responsibly.', 'Disclaimer text for banner'),
('admin_email', 'managervcreation@gmail.com', 'Admin email for notifications'),
('organiser_monthly_fee', '2500', 'Monthly fee for organisers in INR'),
('max_featured_games', '15', 'Maximum number of featured games'),
('max_ads', '4', 'Maximum number of sponsored ads');

-- Insert default ad network scripts (empty initially)
INSERT INTO ad_scripts (network_name, script_content, is_active, placement_info) VALUES
('google_adsense', '', false, 'Header, sidebar, and footer ad placements'),
('tapjoy', '', false, 'Mobile interstitial and banner ads'),
('meta', '', false, 'Facebook audience network integration');

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Organisers can read their own data
CREATE POLICY "Organisers can read own data" ON organisers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Organisers can update own data" ON organisers FOR UPDATE USING (user_id = auth.uid());

-- Games are publicly readable, organisers can manage their own
CREATE POLICY "Games are publicly readable" ON games FOR SELECT USING (true);
CREATE POLICY "Organisers can manage own games" ON games FOR ALL USING (
    organiser_id IN (SELECT id FROM organisers WHERE user_id = auth.uid())
);

-- Participants can read their own participation data
CREATE POLICY "Users can read own participation" ON game_participants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own participation" ON game_participants FOR INSERT WITH CHECK (user_id = auth.uid());

-- Winners are publicly readable
CREATE POLICY "Winners are publicly readable" ON game_winners FOR SELECT USING (true);

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());