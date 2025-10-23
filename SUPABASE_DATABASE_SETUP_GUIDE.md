# 🚀 Complete Supabase Database Setup Guide for GameBlast Mobile

This guide will help you set up your Supabase database with all tables, constraints, and dummy data for your GameBlast Mobile platform.

## 📋 Prerequisites

1. ✅ Supabase project created
2. ✅ Supabase project URL and API keys ready
3. ✅ Access to Supabase SQL Editor
4. ✅ All database files in your repository

## 🔧 Step-by-Step Setup Process

### Step 1: Clear Existing Data (If Any)

If you have any existing tables or data, first clean them up:

```sql
-- Run this in Supabase SQL Editor to clean up existing tables
-- ⚠️ WARNING: This will delete all existing data!

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

-- Drop the UUID extension if it exists
DROP EXTENSION IF EXISTS "uuid-ossp";
```

### Step 2: Create Database Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Copy and Paste Schema**
   - Open the file: `config/database-schema.sql`
   - Copy the ENTIRE content of this file
   - Paste it into the Supabase SQL Editor
   - Click "Run" button

3. **Verify Schema Creation**
   After running, you should see:
   - ✅ Extension "uuid-ossp" created
   - ✅ 10 tables created successfully
   - ✅ All constraints and indexes created
   - ✅ Row Level Security (RLS) policies created
   - ✅ Initial admin settings and ad scripts inserted

### Step 3: Insert Dummy Data

1. **Open New Query in SQL Editor**
   - Click "New Query" again in Supabase SQL Editor

2. **Copy and Paste Setup Script**
   - Open the file: `scripts/setup-database.sql`
   - Copy the ENTIRE content of this file
   - Paste it into the new SQL Editor window
   - Click "Run" button

3. **Verify Data Insertion**
   After running, you should see output messages like:
   ```
   NOTICE: Admin user created/updated with ID: [uuid]
   NOTICE: Dummy users created
   NOTICE: Dummy organisers created
   NOTICE: Dummy games created for today: [date]
   NOTICE: Database setup completed successfully!
   NOTICE: Admin Login: admin@gameblast.com / AdminPass123!
   NOTICE: User Login: player1@example.com / password123
   NOTICE: Organiser Login: organiser1@example.com / organiser123
   ```

### Step 4: Verify Database Setup

Run these verification queries to ensure everything is set up correctly:

```sql
-- Check all tables exist and have data
SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Organisers', count(*) FROM organisers
UNION ALL
SELECT 'Games', count(*) FROM games
UNION ALL
SELECT 'Admin Settings', count(*) FROM admin_settings
UNION ALL
SELECT 'News Banner', count(*) FROM news_banner
UNION ALL
SELECT 'Ad Scripts', count(*) FROM ad_scripts;

-- Check user roles
SELECT role, count(*) as count FROM users GROUP BY role;

-- Check games for today
SELECT g.name, o.organiser_name, g.total_prize, g.game_time 
FROM games g 
JOIN organisers o ON g.organiser_id = o.id 
WHERE g.game_date = CURRENT_DATE
ORDER BY g.game_time;
```

Expected results:
- **Users**: 5 (1 admin, 2 regular users, 2 organisers)
- **Organisers**: 2
- **Games**: 6 (3 from each organiser)
- **Admin Settings**: 7 settings
- **News Banner**: 5 items
- **Ad Scripts**: 3 networks

## 🔐 Default Login Credentials

After successful setup, you can use these credentials:

### Admin Access
- **Email**: `admin@gameblast.com`
- **Password**: `AdminPass123!`
- **Role**: `admin`

### Test User Accounts
- **User 1**: `player1@example.com` / `password123`
- **User 2**: `player2@example.com` / `password123`

### Test Organiser Accounts
- **Organiser 1**: `organiser1@example.com` / `organiser123`
- **Organiser 2**: `organiser2@example.com` / `organiser123`

## 🎮 Sample Data Created

### Games Created
- **TambolaKing Games** (3 games): ₹10,000 - ₹20,000 prizes
- **NumberMaster Games** (3 games): ₹12,000 - ₹25,000 prizes
- All games scheduled for today with different time slots

### Platform Settings
- Platform name: "GameBlast Mobile"
- Organiser monthly fee: ₹2,500
- Support contact details
- Featured/Top games limits

### News Banner Items
- 5 promotional messages with links
- Proper display order set

## 🚨 Troubleshooting Common Issues

### Issue 1: "Extension uuid-ossp does not exist"
**Solution**: Make sure you run the schema file first, which includes:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue 2: "Constraint violation" errors
**Solution**: Make sure you cleared all existing data first (Step 1)

### Issue 3: "Table does not exist" errors
**Solution**: Run the schema file (`database-schema.sql`) before the setup file (`setup-database.sql`)

### Issue 4: "ON CONFLICT" errors
**Solution**: This should be fixed in the latest version. Make sure you're using the updated files.

## 🔍 Verification Checklist

After setup, verify these items:

- [ ] All 10 tables created successfully
- [ ] UUID extension enabled
- [ ] 5 users created (1 admin, 2 users, 2 organisers)
- [ ] 2 organiser profiles created
- [ ] 6 games created for today
- [ ] 7 admin settings configured
- [ ] 5 news banner items active
- [ ] 3 ad network scripts configured
- [ ] RLS policies enabled on all tables
- [ ] All constraints working properly

## 🎯 Next Steps

After successful database setup:

1. **Update Environment Variables**
   - Set your Supabase URL and API keys in your `.env` file
   - Update any connection strings in your application

2. **Test API Connections**
   - Test user authentication
   - Test data retrieval from your application
   - Verify all CRUD operations work

3. **Customize Data**
   - Update admin settings as needed
   - Modify news banner messages
   - Add your actual ad network scripts
   - Update organiser and game information

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all files are the latest version from the repository
3. Ensure you followed each step in order
4. Check Supabase logs for detailed error messages

---

**✅ Database setup complete!** Your GameBlast Mobile platform is now ready for development and testing.