# 🗄️ Supabase Complete Setup Guide - Click by Click

## 📋 **Complete Step-by-Step Supabase Setup for GameBlast Mobile**

Follow this guide **exactly** - every click, every command, every step documented!

---

## 🚀 **PART 1: Create Supabase Account & Project (5 minutes)**

### **Step 1.1: Create Supabase Account**
```
1. Open your web browser
2. Go to: https://supabase.com
3. You'll see the Supabase homepage
4. Click the "Start your project" button (green button in center)
5. You'll be redirected to the sign-up page
```

### **Step 1.2: Sign Up Process**
```
Option A - GitHub (Recommended):
1. Click "Continue with GitHub" button
2. If not logged into GitHub, enter your GitHub credentials
3. Click "Authorize supabase" when prompted
4. You'll be redirected back to Supabase

Option B - Email:
1. Click "Sign up with email" 
2. Enter your email address
3. Enter a strong password
4. Click "Sign up"
5. Check your email for verification link
6. Click the verification link in your email
7. You'll be redirected to Supabase dashboard
```

### **Step 1.3: Create New Organization (if needed)**
```
1. After login, you'll see "Create a new project" page
2. If you see "Select an organization" dropdown:
   - Click the dropdown
   - If you want to create new org, click "New organization"
   - Enter organization name: "GameBlast"
   - Click "Create organization"
3. If no dropdown appears, you're using your personal organization (that's fine)
```

### **Step 1.4: Create New Project**
```
1. You'll see "Create a new project" form with these fields:

   Name: gameblast-mobile
   
   Database Password: 
   - Click "Generate a password" button (recommended)
   - OR create your own strong password (save it somewhere safe!)
   - IMPORTANT: Copy and save this password - you'll need it later
   
   Region: 
   - Click the dropdown
   - Select closest region to your users (e.g., "Southeast Asia (Singapore)" for India)
   
   Pricing Plan:
   - Leave "Free" selected (it's perfect for starting)

2. Click "Create new project" button
3. You'll see "Setting up your project..." with a progress bar
4. Wait 2-3 minutes for project creation to complete
5. You'll see "Project created successfully!" message
```

---

## 🔑 **PART 2: Get Your Supabase Credentials (2 minutes)**

### **Step 2.1: Navigate to API Settings**
```
1. After project creation, you'll be in the Supabase dashboard
2. Look at the left sidebar menu
3. Scroll down and click "Settings" (gear icon)
4. In the Settings submenu, click "API"
5. You'll see the "API Settings" page
```

### **Step 2.2: Copy Your Credentials**
```
You'll see several important values on this page:

1. Project URL:
   - Look for "Project URL" section
   - You'll see something like: https://abcdefghijklmnop.supabase.co
   - Click the "Copy" button next to it
   - Paste it somewhere safe and label it as "SUPABASE_URL"

2. API Keys section - you'll see two keys:

   anon/public key:
   - Look for "anon public" key (starts with "eyJ...")
   - Click "Copy" button next to it
   - Paste it somewhere safe and label it as "SUPABASE_ANON_KEY"
   
   service_role key:
   - Look for "service_role" key (starts with "eyJ..." but different from anon)
   - Click "Copy" button next to it  
   - Paste it somewhere safe and label it as "SUPABASE_SERVICE_ROLE_KEY"
   - ⚠️ IMPORTANT: This is your secret key - never expose it publicly!
```

### **Step 2.3: Save Your Credentials**
```
Create a temporary text file with your credentials:

SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-role-key

Keep this file safe - you'll need these values later!
```

---

## 🗄️ **PART 3: Set Up Database Schema (5 minutes)**

### **Step 3.1: Open SQL Editor**
```
1. In your Supabase dashboard, look at the left sidebar
2. Click "SQL Editor" (icon looks like </> )
3. You'll see the SQL Editor interface
4. Click "New query" button (usually in top-left)
5. You'll see an empty SQL editor window
```

### **Step 3.2: Create Database Tables**
```
1. Go to your GameBlast project folder on your computer
2. Open the file: config/database-schema.sql
3. Select ALL the content in this file (Ctrl+A or Cmd+A)
4. Copy it (Ctrl+C or Cmd+C)
5. Go back to Supabase SQL Editor
6. Paste the content in the empty editor (Ctrl+V or Cmd+V)
7. Click "Run" button (or press Ctrl+Enter)
8. Wait for execution to complete
9. You should see "Success. No rows returned" message
10. If you see any errors, double-check you copied the entire file content
```

### **Step 3.3: Verify Tables Were Created**
```
1. In the left sidebar, click "Table Editor" (grid icon)
2. You should see a list of tables created:
   - users
   - organisers  
   - games
   - game_participants
   - game_winners
   - sponsored_ads
   - news_banner
   - admin_settings
   - ad_scripts
3. If you see all these tables, the schema was created successfully!
4. If some tables are missing, go back to SQL Editor and re-run the schema
```

---

## 👤 **PART 4: Create Admin User & Dummy Data (3 minutes)**

### **Step 4.1: Run Setup Script**
```
1. Go back to "SQL Editor" (click it in left sidebar)
2. Click "New query" button again
3. Go to your GameBlast project folder
4. Open the file: scripts/setup-database.sql
5. Select ALL the content (Ctrl+A or Cmd+A)
6. Copy it (Ctrl+C or Cmd+C)
7. Paste in the SQL Editor (Ctrl+V or Cmd+V)
8. Click "Run" button (or press Ctrl+Enter)
9. Wait for execution (may take 30-60 seconds)
10. You should see multiple "Success" messages and some "NOTICE" messages
```

### **Step 4.2: Verify Data Creation**
```
Check Users Table:
1. Click "Table Editor" in left sidebar
2. Click "users" table
3. You should see 5 users:
   - admin (role: admin)
   - player1 (role: user)  
   - player2 (role: user)
   - organiser1 (role: organiser)
   - organiser2 (role: organiser)

Check Organisers Table:
1. Click "organisers" table
2. You should see 2 organisers:
   - TambolaKing (approved: true)
   - NumberMaster (approved: true)

Check Games Table:
1. Click "games" table  
2. You should see 6 games:
   - 3 games from TambolaKing
   - 3 games from NumberMaster
   - All with today's date

If you see all this data, setup was successful!
```

---

## ⚙️ **PART 5: Configure Row Level Security (2 minutes)**

### **Step 5.1: Check RLS Policies**
```
1. In Table Editor, click on "users" table
2. Click the "..." menu (three dots) next to the table name
3. Select "View policies" 
4. You should see RLS policies already created by the setup script
5. If no policies are visible, that's okay - the API will handle permissions
```

### **Step 5.2: Test Database Connection**
```
1. Click "SQL Editor" in sidebar
2. Click "New query"
3. Type this simple test query:
   SELECT COUNT(*) as total_users FROM users;
4. Click "Run"
5. You should see result showing: total_users: 5
6. If you get this result, your database is working perfectly!
```

---

## 🔧 **PART 6: Configure Project Settings (2 minutes)**

### **Step 6.1: Update Project Settings**
```
1. Click "Settings" in left sidebar
2. Click "General" in the settings submenu
3. You'll see project details:
   - Project name: gameblast-mobile (already set)
   - Organization: (your organization)
   - Region: (already selected)
4. Scroll down to "Custom domain" (optional for now)
5. Leave everything as default for now
```

### **Step 6.2: Check Authentication Settings**
```
1. In Settings, click "Authentication"
2. You'll see Auth settings page
3. Under "Site URL", you should see your project URL
4. Under "Redirect URLs", add these (click "Add URL" for each):
   - http://localhost:3000
   - https://your-domain.vercel.app (you'll get this later)
5. Leave other settings as default
6. Click "Save" if you made changes
```

---

## ✅ **PART 7: Final Verification (2 minutes)**

### **Step 7.1: Test All Credentials**
```
1. Go back to "Settings" → "API"
2. Double-check all three values are available:
   ✅ Project URL
   ✅ anon public key  
   ✅ service_role key
3. Copy these again if needed
```

### **Step 7.2: Test Database Access**
```
Run this final test query in SQL Editor:

SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM organisers) as organisers_count,
  (SELECT COUNT(*) FROM games) as games_count,
  (SELECT COUNT(*) FROM admin_settings) as settings_count;

Expected results:
- users_count: 5
- organisers_count: 2  
- games_count: 6
- settings_count: 9

If you see these numbers, everything is perfect! ✅
```

---

## 📝 **PART 8: Update Your .env File**

### **Step 8.1: Open Your Project**
```
1. Open your GameBlast project folder
2. Find the .env file in the root directory
3. Open it in your code editor
```

### **Step 8.2: Replace Placeholder Values**
```
Replace these lines with your actual Supabase values:

# BEFORE (placeholders):
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AFTER (your actual values):
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-role-key

Save the file (Ctrl+S or Cmd+S)
```

---

## 🧪 **PART 9: Test Your Setup**

### **Step 9.1: Test Locally**
```
1. Open terminal/command prompt in your project folder
2. Run: npm install
3. Run: npm run dev
4. Open browser: http://localhost:3000
5. You should see your homepage load
6. Click "Login" → "Admin Login"
7. Use: admin@gameblast.com / AdminPass123!
8. If you can login and see admin panel, SUCCESS! 🎉
```

### **Step 9.2: Test User Registration**
```
1. Go to Login page
2. Click "User Login" tab
3. Click "Sign Up" link
4. Fill in test details:
   - Username: testuser
   - Email: test@example.com
   - Phone: +919999999999
   - Password: test123
5. Click "Sign Up"
6. If registration works, your database is fully functional!
```

---

## 🎉 **SUCCESS! Your Supabase is Ready!**

### **✅ What You've Accomplished:**
- ✅ Created Supabase project
- ✅ Set up complete database schema (9 tables)
- ✅ Created admin user and test accounts
- ✅ Added 6 dummy games with organisers
- ✅ Configured authentication
- ✅ Got all required credentials
- ✅ Tested database connectivity

### **🔑 Your Credentials (keep safe):**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### **👤 Test Accounts Ready:**
- **Admin**: admin@gameblast.com / AdminPass123!
- **User 1**: player1@example.com / password123  
- **User 2**: player2@example.com / password123
- **Organiser 1**: organiser1@example.com / organiser123
- **Organiser 2**: organiser2@example.com / organiser123

---

## 🚀 **Next Steps:**

1. ✅ **Supabase Setup Complete** (you just finished this!)
2. 🔑 **Generate JWT Secret** (next step)
3. 🚀 **Deploy to Vercel** (final step)

**Your database is now ready for your GameBlast Mobile platform!** 🎉

---

## 🐛 **Troubleshooting Common Issues**

### **Problem: "Project creation failed"**
```
Solution:
1. Try a different project name
2. Check your internet connection
3. Try a different region
4. Wait 5 minutes and try again
```

### **Problem: "SQL execution failed"**
```
Solution:
1. Make sure you copied the ENTIRE file content
2. Check for any missing characters at the end
3. Try running the schema file first, then the setup file
4. Clear the editor and paste again
```

### **Problem: "No tables visible"**
```
Solution:
1. Refresh the page (F5)
2. Click "Table Editor" again
3. Check if the SQL query showed "Success"
4. Re-run the database-schema.sql file
```

### **Problem: "Can't find credentials"**
```
Solution:
1. Go to Settings → API in your Supabase dashboard
2. The credentials are always available there
3. Make sure you're copying the full keys (they're long!)
4. Check you're not including extra spaces
```

**Need help? All credentials and test data are ready to use!** 🎯