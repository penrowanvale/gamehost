# 🚀 GameBlast Mobile - Complete Environment Setup Guide

## 📋 **Step-by-Step Guide to Get All Environment Variables**

Follow this guide **command by command** to get your platform live in 30 minutes!

---

## 🗂️ **STEP 1: Create Supabase Project (5 minutes)**

### **1.1 Create Account & Project**
```bash
# 1. Go to https://supabase.com
# 2. Click "Start your project"
# 3. Sign up with GitHub/Google (recommended)
# 4. Click "New Project"
# 5. Choose your organization
# 6. Fill project details:
#    - Name: gameblast-mobile
#    - Database Password: (generate strong password - save it!)
#    - Region: (choose closest to your users)
# 7. Click "Create new project"
# 8. Wait 2-3 minutes for project setup
```

### **1.2 Get Supabase Credentials**
```bash
# Once project is ready:
# 1. Go to Settings → API (left sidebar)
# 2. Copy these values:

# Project URL (looks like):
SUPABASE_URL=https://abcdefghijk.supabase.co

# anon/public key (starts with eyJ...):
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (starts with eyJ... - different from anon):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **1.3 Set Up Database Schema**
```bash
# 1. In Supabase Dashboard, go to "SQL Editor" (left sidebar)
# 2. Click "New Query"
# 3. Copy the entire content from your project file: config/database-schema.sql
# 4. Paste it in the SQL editor
# 5. Click "Run" (or Ctrl+Enter)
# 6. Wait for "Success. No rows returned" message
# 7. Check "Table Editor" to verify tables are created
```

### **1.4 Create Admin User & Dummy Data**
```bash
# 1. In SQL Editor, click "New Query" again
# 2. Copy the entire content from: scripts/setup-database.sql
# 3. Paste it in the SQL editor
# 4. Click "Run" (or Ctrl+Enter)
# 5. Check for success messages in the output
# 6. Verify in Table Editor that data is created
```

---

## 🔐 **STEP 2: Generate JWT Secret (1 minute)**

### **2.1 Generate Strong JWT Secret**
```bash
# Run this command in your terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# This will output something like:
# a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Copy this value for JWT_SECRET
```

**Alternative methods if Node.js not available:**
```bash
# Using OpenSSL (Linux/Mac):
openssl rand -hex 32

# Using Python:
python -c "import secrets; print(secrets.token_hex(32))"

# Online generator (use only for testing):
# Go to https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
# Select "Encryption key" and "256-bit" then generate
```

---

## 📧 **STEP 3: Set Up Google Drive API (Optional - 10 minutes)**

### **3.1 Create Google Cloud Project**
```bash
# 1. Go to https://console.cloud.google.com
# 2. Click "Select a project" → "New Project"
# 3. Project name: gameblast-mobile
# 4. Click "Create"
# 5. Wait for project creation
```

### **3.2 Enable Google Drive API**
```bash
# 1. In Google Cloud Console, go to "APIs & Services" → "Library"
# 2. Search for "Google Drive API"
# 3. Click on "Google Drive API"
# 4. Click "Enable"
# 5. Wait for API to be enabled
```

### **3.3 Create OAuth 2.0 Credentials**
```bash
# 1. Go to "APIs & Services" → "Credentials"
# 2. Click "Create Credentials" → "OAuth client ID"
# 3. If prompted, configure OAuth consent screen:
#    - User Type: External
#    - App name: GameBlast Mobile
#    - User support email: your email
#    - Developer contact: your email
#    - Save and continue through all steps
# 4. Back to Credentials, click "Create Credentials" → "OAuth client ID"
# 5. Application type: "Web application"
# 6. Name: GameBlast Mobile
# 7. Authorized redirect URIs: 
#    - http://localhost:3000/auth/google/callback
#    - https://your-domain.vercel.app/auth/google/callback
# 8. Click "Create"
# 9. Copy Client ID and Client Secret
```

### **3.4 Get Google Drive Credentials**
```bash
# After creating OAuth credentials, you'll get:

GOOGLE_DRIVE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-abcdef123456789
```

---

## 📝 **STEP 4: Create Your .env File (2 minutes)**

### **4.1 Update .env File**
```bash
# In your project root, open the .env file and replace with your actual values:

# ===== SUPABASE CONFIGURATION =====
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-role-key

# ===== JWT CONFIGURATION =====
JWT_SECRET=your-generated-32-character-secret-from-step-2

# ===== ADMIN CONFIGURATION =====
ADMIN_EMAIL=admin@gameblast.com
ADMIN_PHONE=+919876543210
ADMIN_USERNAME=admin
ADMIN_PASSWORD=AdminPass123!

# ===== GOOGLE DRIVE API CONFIGURATION =====
GOOGLE_DRIVE_CLIENT_ID=your-google-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-client-secret

# ===== PLATFORM CONFIGURATION =====
PLATFORM_NAME=GameBlast Mobile
PLATFORM_TAGLINE=Ultimate Mobile Gaming Experience
ORGANISER_MONTHLY_FEE=2500

# ===== SUPPORT CONTACT =====
SUPPORT_EMAIL=support@gameblast.com
SUPPORT_WHATSAPP=+919876543210
SUPPORT_PHONE=+919876543210

# ===== ENVIRONMENT =====
NODE_ENV=development
PORT=3000
```

---

## 🧪 **STEP 5: Test Locally (5 minutes)**

### **5.1 Install Dependencies & Run**
```bash
# In your project directory:
npm install

# Start the development server:
npm run dev

# You should see:
# Server running on http://localhost:3000
```

### **5.2 Test Basic Functionality**
```bash
# 1. Open browser: http://localhost:3000
# 2. Verify homepage loads
# 3. Click "Login" → "Admin Login"
# 4. Use: admin@gameblast.com / AdminPass123!
# 5. Verify admin panel loads
# 6. Check games page shows dummy games
# 7. Test user registration
```

---

## 🚀 **STEP 6: Deploy to Vercel (10 minutes)**

### **6.1 Install Vercel CLI**
```bash
# Install Vercel CLI globally:
npm install -g vercel

# Login to Vercel:
vercel login
# Follow the prompts to authenticate
```

### **6.2 Deploy Project**
```bash
# In your project directory:
vercel

# Answer the prompts:
# ? Set up and deploy "~/gameblast-mobile"? [Y/n] y
# ? Which scope do you want to deploy to? (your account)
# ? Link to existing project? [y/N] n
# ? What's your project's name? gameblast-mobile
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n

# Wait for deployment to complete
# You'll get a URL like: https://gameblast-mobile-abc123.vercel.app
```

### **6.3 Add Environment Variables in Vercel**
```bash
# 1. Go to https://vercel.com/dashboard
# 2. Click on your project "gameblast-mobile"
# 3. Go to "Settings" tab
# 4. Click "Environment Variables" in sidebar
# 5. Add each variable one by one:

# Click "Add" and enter:
Name: SUPABASE_URL
Value: https://your-actual-project-id.supabase.co
Environment: Production, Preview, Development

# Repeat for all variables:
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
ADMIN_EMAIL
ADMIN_PHONE
ADMIN_USERNAME
ADMIN_PASSWORD
GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET
PLATFORM_NAME
PLATFORM_TAGLINE
ORGANISER_MONTHLY_FEE
SUPPORT_EMAIL
SUPPORT_WHATSAPP
SUPPORT_PHONE
NODE_ENV (set to "production")
```

### **6.4 Redeploy with Environment Variables**
```bash
# After adding all environment variables:
vercel --prod

# This will create your production deployment
# You'll get your final URL like: https://gameblast-mobile.vercel.app
```

---

## ✅ **STEP 7: Final Testing (5 minutes)**

### **7.1 Test Production Deployment**
```bash
# 1. Visit your Vercel URL
# 2. Test admin login: admin@gameblast.com / AdminPass123!
# 3. Test user registration
# 4. Test organiser login: organiser1@example.com / organiser123
# 5. Verify games display correctly
# 6. Test mobile responsiveness
# 7. Test PWA installation (Add to Home Screen)
```

### **7.2 Test Accounts Available**
```bash
# Admin Account:
Email: admin@gameblast.com
Password: AdminPass123!
Access: Full platform control

# Test Users:
Email: player1@example.com
Password: password123
Email: player2@example.com
Password: password123

# Test Organisers:
Email: organiser1@example.com (TambolaKing)
Password: organiser123
Email: organiser2@example.com (NumberMaster)
Password: organiser123

# Each organiser has 3 games with 30 sheets each
```

---

## 🎯 **STEP 8: Custom Domain (Optional - 5 minutes)**

### **8.1 Add Custom Domain**
```bash
# 1. In Vercel Dashboard → Your Project → Settings
# 2. Click "Domains" in sidebar
# 3. Enter your domain: gameblast.com
# 4. Click "Add"
# 5. Follow DNS configuration instructions
# 6. Add these DNS records in your domain provider:

# For root domain (gameblast.com):
Type: A
Name: @
Value: 76.76.19.61

# For www subdomain:
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# SSL certificate will be automatically provisioned
```

---

## 🔧 **Troubleshooting Common Issues**

### **Database Connection Issues**
```bash
# If you get database errors:
# 1. Check SUPABASE_URL is correct (no trailing slash)
# 2. Verify SUPABASE_SERVICE_ROLE_KEY is the service_role key, not anon key
# 3. Ensure database schema was created successfully
# 4. Check Supabase project is not paused (free tier pauses after 1 week inactivity)
```

### **JWT Token Issues**
```bash
# If authentication fails:
# 1. Ensure JWT_SECRET is exactly 32+ characters
# 2. Check no extra spaces in .env file
# 3. Restart server after changing .env
# 4. Clear browser cookies and localStorage
```

### **Google Drive Issues**
```bash
# If sheet downloads fail:
# 1. Verify Google Drive API is enabled
# 2. Check OAuth credentials are correct
# 3. Ensure redirect URIs include your domain
# 4. Test with public Google Drive folders first
```

### **Vercel Deployment Issues**
```bash
# If deployment fails:
# 1. Check all environment variables are added
# 2. Ensure NODE_ENV is set to "production"
# 3. Verify no syntax errors in code
# 4. Check Vercel function timeout limits
```

---

## 📞 **Support & Next Steps**

### **You're Now Live! 🎉**

Your GameBlast Mobile platform is now fully operational with:
- ✅ Complete user, organiser, and admin systems
- ✅ Payment verification workflow
- ✅ Google Drive integration for sheets
- ✅ Mobile-optimized PWA design
- ✅ All legal and contact pages
- ✅ Revenue streams ready

### **Immediate Next Steps:**
1. **Replace placeholder images** in `public/images/` folder
2. **Add your legal documents** (you mentioned you have Word files)
3. **Test with real organisers** and users
4. **Configure your actual support contacts**
5. **Start marketing** your platform!

### **Future Enhancements:**
- Add email notifications
- Implement push notifications
- Create native mobile apps
- Add advanced analytics
- Integrate payment gateways

**Congratulations! Your platform is live and ready for users!** 🚀

---

## 📋 **Quick Reference - All Environment Variables**

```env
# Copy these exact variable names to your .env file:
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PHONE=
ADMIN_USERNAME=
ADMIN_PASSWORD=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
PLATFORM_NAME=
PLATFORM_TAGLINE=
ORGANISER_MONTHLY_FEE=
SUPPORT_EMAIL=
SUPPORT_WHATSAPP=
SUPPORT_PHONE=
NODE_ENV=
PORT=
```

**Total Setup Time: ~30 minutes** ⏱️