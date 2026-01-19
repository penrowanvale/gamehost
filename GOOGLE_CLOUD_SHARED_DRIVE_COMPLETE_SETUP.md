# 🚀 Complete Google Cloud & Shared Drive Setup Guide

This guide walks you through setting up Google Cloud and a Shared Drive from scratch.

---

## 📋 Prerequisites

- **Google Workspace account** (Business Starter, Standard, Plus, or Enterprise)
  - Shared Drives are NOT available on personal Gmail accounts
  - You need admin access or permission to create Shared Drives
- A web browser
- About 15-20 minutes

---

## Part 1: Google Cloud Console Setup

### Step 1.1: Create or Select a Google Cloud Project

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Sign in** with your Google Workspace account

3. **Create a new project** (or select existing):
   - Click the project dropdown at the top (next to "Google Cloud")
   - Click **"NEW PROJECT"**
   - Enter project details:
     - **Project name:** `GameBlast` (or your preferred name)
     - **Organization:** Select your organization
     - **Location:** Select your organization folder
   - Click **"CREATE"**

4. **Wait** for the project to be created (30 seconds to 1 minute)

5. **Select the project** from the dropdown if not already selected

---

### Step 1.2: Enable Google Drive API

1. **Go to API Library:**
   ```
   https://console.cloud.google.com/apis/library
   ```
   Or: Click hamburger menu (☰) → **APIs & Services** → **Library**

2. **Search for "Google Drive API"**

3. **Click on "Google Drive API"** in the results

4. **Click the blue "ENABLE" button**

5. **Wait** for it to enable (a few seconds)

✅ You should see "API enabled" confirmation

---

### Step 1.3: Create a Service Account

1. **Go to Service Accounts:**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts
   ```
   Or: Click hamburger menu (☰) → **IAM & Admin** → **Service Accounts**

2. **Click "+ CREATE SERVICE ACCOUNT"** at the top

3. **Fill in Service Account Details:**
   - **Service account name:** `gamehost-drive-storage`
   - **Service account ID:** (auto-filled, e.g., `gamehost-drive-storage`)
   - **Description:** `Service account for GameHost file uploads to Shared Drive`

4. **Click "CREATE AND CONTINUE"**

5. **Grant Access (Optional)** - Skip this step:
   - Just click **"CONTINUE"** (no roles needed for Drive API)

6. **Grant Users Access (Optional)** - Skip this step:
   - Just click **"DONE"**

✅ Your service account is created!

---

### Step 1.4: Generate Service Account Key (JSON)

1. **In the Service Accounts list**, click on your newly created service account:
   ```
   gamehost-drive-storage@your-project.iam.gserviceaccount.com
   ```

2. **Go to the "KEYS" tab**

3. **Click "ADD KEY" → "Create new key"**

4. **Select "JSON"** format

5. **Click "CREATE"**

6. **The JSON file will download automatically** - SAVE THIS FILE!
   - It will be named something like: `your-project-abc123.json`
   - ⚠️ **KEEP THIS FILE SECURE** - it provides access to your Drive!

7. **Copy the `client_email`** from the JSON file - you'll need it later:
   ```
   Example: gamehost-drive-storage@your-project.iam.gserviceaccount.com
   ```

---

## Part 2: Google Shared Drive Setup

### Step 2.1: Create a Shared Drive

1. **Go to Google Drive:**
   ```
   https://drive.google.com/
   ```

2. **Look at the left sidebar** for "Shared drives"
   - If you don't see it, your account may not support Shared Drives
   - Contact your Google Workspace admin

3. **Click "Shared drives"** in the left sidebar

4. **Click "+ New"** (or right-click in empty area → "New shared drive")

5. **Enter a name for your Shared Drive:**
   ```
   GameBlast Storage
   ```

6. **Click "Create"**

✅ Your Shared Drive is created!

---

### Step 2.2: Add Service Account to Shared Drive

**This is the critical step that allows your application to upload files!**

1. **Open your new Shared Drive** ("GameBlast Storage")

2. **Click on the Shared Drive name** at the top (or click the dropdown arrow)

3. **Click "Manage members"**

4. **In the "Add people and groups" field**, paste your **service account email**:
   ```
   gamehost-drive-storage@your-project.iam.gserviceaccount.com
   ```
   (Use the email from your JSON file's `client_email` field)

5. **Set the permission level:**
   - Click the dropdown next to the email
   - Select **"Content Manager"** (recommended) or **"Contributor"**
   
   | Role | Can Upload | Can Delete | Can Manage Members |
   |------|-----------|------------|-------------------|
   | Contributor | ✅ | Own files only | ❌ |
   | Content Manager | ✅ | ✅ All files | ❌ |
   | Manager | ✅ | ✅ | ✅ |

6. **Click "Send"** (or "Share")
   - Note: It won't actually send an email to the service account

✅ Service account now has access to the Shared Drive!

---

### Step 2.3: Create a Folder for Uploads (Recommended)

1. **Inside your Shared Drive**, click **"+ New"** → **"Folder"**

2. **Name the folder:**
   ```
   GameHost-Uploads
   ```

3. **Click "Create"**

4. **Open the folder** you just created

5. **Copy the Folder ID from the URL:**
   ```
   https://drive.google.com/drive/folders/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                                          ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                          This is your FOLDER ID
   ```

   Example URL:
   ```
   https://drive.google.com/drive/folders/1ABC123xyz456DEF789ghi
   ```
   Folder ID: `1ABC123xyz456DEF789ghi`

📝 **Write down your Folder ID** - you'll need it for configuration!

---

## Part 3: Configure Your Application

### Step 3.1: Add Service Account Key to Project

1. **Rename** your downloaded JSON key file:
   ```
   gameblast-service-account.json
   ```

2. **Copy the file** to your project root folder:
   ```
   /workspace/gameblast-service-account.json
   ```

3. **Verify** the file is in place:
   ```bash
   ls -la gameblast-service-account.json
   ```

---

### Step 3.2: Update .env File (Local Development)

Edit your `.env` file with these values:

```env
# ===== GOOGLE DRIVE STORAGE CONFIGURATION =====
# Path to your service account key file
GOOGLE_SERVICE_ACCOUNT_KEY=./gameblast-service-account.json

# Your Shared Drive folder ID (from Step 2.3)
GOOGLE_DRIVE_STORAGE_FOLDER_ID=YOUR_FOLDER_ID_HERE

# Optional settings
COMPRESSION_QUALITY=75
AUTO_CLEANUP_DAYS=2
```

**Replace `YOUR_FOLDER_ID_HERE`** with your actual folder ID!

---

### Step 3.3: Configure Vercel Environment Variables (Production)

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select your project**

3. **Go to Settings → Environment Variables**

4. **Add Variable #1:**
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value:** Copy the **ENTIRE content** of your JSON file
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

5. **Add Variable #2:**
   - **Name:** `GOOGLE_DRIVE_STORAGE_FOLDER_ID`
   - **Value:** Your folder ID (e.g., `1ABC123xyz456DEF789ghi`)
   - **Environment:** Select all
   - Click **Save**

6. **Redeploy** your application

---

## Part 4: Test the Setup

### Step 4.1: Run the Test Script

```bash
cd /workspace
node scripts/test-drive-connection.js
```

### Expected Success Output:

```
🧪 Testing Google Drive Storage Connection...

📝 Using Google service account from file path (local mode)
✅ Google Drive Storage initialized successfully
✅ Step 1: Google Drive Storage initialized
🔍 Step 2: Testing folder creation...
✅ Step 2: Test folder created with ID: 1xyz...
📄 Step 3: Creating test file...
✅ Step 3: Test file created locally
☁️ Step 4: Testing file upload...
✅ Step 4: File uploaded successfully
   File ID: 1abc...
   Download URL: https://drive.google.com/...
📋 Step 5: Testing file listing...
✅ Step 5: Found 1 files in test folder
🗑️ Step 6: Testing file deletion...
✅ Step 6: Test file deleted successfully
🗂️ Step 7: Cleaning up test folder...
✅ Step 7: Test folder deleted successfully
✅ Step 8: Local test file cleaned up

🎉 ALL TESTS PASSED! Google Drive Storage is working correctly.
```

---

## 📋 Complete Configuration Checklist

### Google Cloud Console
- [ ] Project created/selected
- [ ] Google Drive API enabled
- [ ] Service account created: `gamehost-drive-storage@...`
- [ ] JSON key downloaded and saved securely

### Google Shared Drive
- [ ] Shared Drive created: "GameBlast Storage"
- [ ] Service account added as **Content Manager**
- [ ] Upload folder created: "GameHost-Uploads"
- [ ] Folder ID copied from URL

### Application Configuration
- [ ] JSON key file in project root
- [ ] `.env` file updated with:
  - [ ] `GOOGLE_SERVICE_ACCOUNT_KEY=./gameblast-service-account.json`
  - [ ] `GOOGLE_DRIVE_STORAGE_FOLDER_ID=your-folder-id`
- [ ] Test script passes: `node scripts/test-drive-connection.js`

### Vercel (Production)
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` set with full JSON content
- [ ] `GOOGLE_DRIVE_STORAGE_FOLDER_ID` set with folder ID
- [ ] Application redeployed

---

## 🔧 Troubleshooting

### Error: "Shared drives not available"
**Cause:** Your Google account doesn't support Shared Drives
**Solution:** You need Google Workspace (Business, Enterprise, etc.)

### Error: "Invalid JWT Signature"
**Cause:** Service account key is invalid or expired
**Solution:** Generate a new key in Google Cloud Console

### Error: "File not found" (404)
**Cause:** Folder ID is wrong or service account doesn't have access
**Solution:** 
1. Verify folder ID from URL
2. Check service account is member of Shared Drive

### Error: "Permission denied" (403)
**Cause:** Service account doesn't have sufficient permissions
**Solution:** Change role to "Content Manager" in Shared Drive settings

### Error: "Service accounts do not have storage quota"
**Cause:** Uploading to "My Drive" instead of Shared Drive
**Solution:** Make sure you're using a Shared Drive folder ID

### Error: "The user does not have sufficient permissions"
**Cause:** Service account not added to Shared Drive
**Solution:** Add service account email to Shared Drive members

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Application                             │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │   Organizer  │───▶│  Upload API      │───▶│ Google Drive  │ │
│  │   Dashboard  │    │  (with Service   │    │ Storage       │ │
│  └──────────────┘    │   Account Auth)  │    │ Module        │ │
│                      └──────────────────┘    └───────┬───────┘ │
└──────────────────────────────────────────────────────┼─────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Shared Drive                          │
│                                                                  │
│  📁 GameBlast Storage (Shared Drive)                            │
│      │                                                           │
│      └── 📁 GameHost-Uploads (Your Folder ID)                   │
│           │                                                      │
│           ├── 📁 Game_1_ChristmasLottery_Org5                   │
│           │    ├── 📊 sheets/                                    │
│           │    ├── 🎨 banners/                                   │
│           │    └── 📸 images/                                    │
│           │                                                      │
│           └── 📁 Game_2_NewYearRaffle_Org7                      │
│                ├── 📊 sheets/                                    │
│                ├── 🎨 banners/                                   │
│                └── 📸 images/                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Best Practices

1. **Never commit the JSON key file to Git**
   - Add to `.gitignore`: `*.json` or specific filename

2. **Use environment variables in production**
   - Store JSON content as env var in Vercel

3. **Limit service account permissions**
   - Use "Content Manager" not "Manager" role

4. **Rotate keys periodically**
   - Delete old keys and generate new ones

5. **Monitor usage**
   - Check Google Cloud Console for API usage

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| Google Cloud Console | https://console.cloud.google.com/ |
| Google Drive | https://drive.google.com/ |
| API Library | https://console.cloud.google.com/apis/library |
| Service Accounts | https://console.cloud.google.com/iam-admin/serviceaccounts |
| Vercel Dashboard | https://vercel.com/dashboard |

---

## 🎉 Success!

Once everything is configured:

1. **Organizers** can upload files through your app
2. **Files** are automatically organized by game
3. **Images** are compressed to save space
4. **Old files** are auto-deleted after 2 days
5. **Secure access** - only authorized users can download

Your Google Shared Drive setup is complete! 🚀
