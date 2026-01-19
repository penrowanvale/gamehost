# 🚀 Google Drive Setup Guide - Shared Workspace Configuration

## 🚨 IMPORTANT: Your Service Account Key is Invalid!

The test showed an "Invalid JWT Signature" error, which means you need to **generate a new service account key**. Follow the steps below.

---

## 📋 Your Current Configuration

| Setting | Value |
|---------|-------|
| **New Folder URL** | `https://drive.google.com/drive/u/3/folders/12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W` |
| **Folder ID** | `12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W` |
| **Service Account Email** | Will be shown after creating new key |

---

## 🔧 STEP-BY-STEP: Generate New Service Account Key

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Select your project (or create new one)

### Step 2: Enable Google Drive API
1. Go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click **Enable** (if not already enabled)

### Step 3: Create Service Account (if needed)
1. Go to **IAM & Admin** → **Service Accounts**
2. If you have an existing service account, skip to Step 4
3. Otherwise click **+ CREATE SERVICE ACCOUNT**
   - Name: `gamehost-drive-storage`
   - Description: `Service account for GameHost file uploads`
4. Click **CREATE AND CONTINUE**
5. Skip the optional roles (just click **DONE**)

### Step 4: Generate New Key
1. Click on your service account (e.g., `gamehost-drive-storage@...`)
2. Go to **Keys** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format
5. Click **CREATE**
6. A `.json` file will download automatically
7. **SAVE THIS FILE SECURELY!**

### Step 5: Copy the JSON File to Project
1. Rename the downloaded file to `gameblast-service-account.json`
2. Copy it to your project root folder
3. Update `.env` file:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY=./gameblast-service-account.json
   ```

### Step 6: Get the Service Account Email
1. Open the JSON file
2. Find the `client_email` field
3. Copy this email (looks like: `name@project.iam.gserviceaccount.com`)

---

## 🔑 Understanding: Regular Folder vs Shared Drive

### Option A: Regular Google Drive Folder (What you created now)
- Located inside someone's personal "My Drive"
- One person owns the folder
- Service account must be explicitly shared with the folder
- Works with any Google account (personal or Workspace)

### Option B: Shared Drive (Google Workspace Only)
- Requires Google Workspace (paid plan)
- Separate organizational storage space
- No single owner - organization owns it
- Service account added as a member
- Better for teams/organizations

**Your current setup uses Option A (Regular Folder)** - which works perfectly fine!

---

## ✅ REQUIRED SETUP STEPS (After Generating New Key)

### Step 1: Share Folder with Service Account ⚠️ CRITICAL!

This is the most important step. Without this, uploads will fail!

1. **Go to your Google Drive folder:**
   ```
   https://drive.google.com/drive/u/3/folders/12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W
   ```

2. **Click the "Share" button** (person icon with + sign)

3. **Add the service account email:**
   - Open your newly downloaded JSON file
   - Find the `client_email` field
   - Copy the email (e.g., `gamehost-drive-storage@your-project.iam.gserviceaccount.com`)
   - Paste it in the sharing dialog

4. **Set permission to "Editor"** (NOT Viewer!)
   - Click the dropdown next to the email
   - Select "Editor"

5. **UNCHECK "Notify people"** (service accounts don't read emails)

6. **Click "Share"**

### Step 2: Verify Sharing Settings

After sharing, you should see:
- ✅ The service account email listed under "People with access"
- ✅ Permission shows "Editor"
- ✅ Your personal account should show "Owner"

---

## 🌐 Vercel Environment Variables

For production deployment, set these in Vercel Dashboard → Settings → Environment Variables:

### Variable 1: GOOGLE_SERVICE_ACCOUNT_KEY

**Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`

**Value:** (Copy the ENTIRE JSON content from your newly generated service account key file)

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

⚠️ **Important:** Copy the ENTIRE content including all brackets and quotes!

### Variable 2: GOOGLE_DRIVE_STORAGE_FOLDER_ID

**Name:** `GOOGLE_DRIVE_STORAGE_FOLDER_ID`

**Value:** `12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W`

(Or you can use the full URL - the code accepts both)

---

## 🖥️ Local Development (.env file)

Your `.env` file should contain:

```env
# Google Drive Storage Configuration
# Point to your service account JSON file (update filename as needed)
GOOGLE_SERVICE_ACCOUNT_KEY=./gameblast-service-account.json
GOOGLE_DRIVE_STORAGE_FOLDER_ID=12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W

# Optional settings
COMPRESSION_QUALITY=75
AUTO_CLEANUP_DAYS=2
```

**Note:** Update `GOOGLE_SERVICE_ACCOUNT_KEY` to match your JSON filename.

---

## 🧪 Testing the Connection

Run this command to test your Google Drive setup:

```bash
node scripts/test-drive-connection.js
```

Expected output:
```
✅ Google Drive connection successful!
✅ Folder access verified: 12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W
✅ Can create files: Yes
✅ Can list files: Yes
```

---

## 🚨 Troubleshooting

### Error: "Invalid JWT Signature" ⚠️ CURRENT ISSUE
**Cause:** The service account key is invalid, expired, or has been revoked
**Fix:** 
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Click on your service account
3. Go to **Keys** tab
4. Delete any old keys
5. Click **ADD KEY** → **Create new key** → **JSON**
6. Download and use the new JSON file

### Error: "Service Accounts do not have storage quota"
**Cause:** Folder is not shared with the service account
**Fix:** Share the folder with the service account email (Editor permission)

### Error: "File not found" (404)
**Cause:** Folder doesn't exist or service account doesn't have access
**Fix:** 
1. Verify the folder ID is correct
2. Make sure folder is shared with service account

### Error: "Permission denied" (403)
**Cause:** Service account has "Viewer" instead of "Editor" permission
**Fix:** Change permission to "Editor"

### Error: "ENOENT: no such file or directory"
**Cause:** (Local dev) Service account JSON file not found
**Fix:** 
1. Verify the JSON file exists in project root
2. Update `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env` with correct filename

### Error: "Google Drive API has not been enabled"
**Cause:** The Google Drive API is not enabled for your project
**Fix:**
1. Go to Google Cloud Console
2. Navigate to APIs & Services → Library
3. Search "Google Drive API"
4. Click Enable

---

## 📂 Folder Structure

When you upload files, the system automatically creates this structure:

```
📂 Your Folder (12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W)
  │
  ├── 📂 Game_1_GameName_Org5
  │    ├── 📊 sheets/
  │    │    └── sheet1.pdf, sheet2.pdf...
  │    ├── 🎨 banners/
  │    │    └── banner.png
  │    └── 📸 images/
  │         └── promo.jpg
  │
  └── 📂 Game_2_AnotherGame_Org7
       ├── 📊 sheets/
       ├── 🎨 banners/
       └── 📸 images/
```

---

## 🔄 If You Want to Use Shared Drive Instead

If you have Google Workspace and want to use a Shared Drive:

1. **Create a Shared Drive** in Google Drive
2. **Add the service account as a member:**
   - Open Shared Drive settings
   - Click "Manage members"
   - Add: `gamehost-drive-storage@gameblast.iam.gserviceaccount.com`
   - Set role to "Content Manager" or "Contributor"
3. **Create a folder inside the Shared Drive**
4. **Copy the folder ID** from the URL
5. **Update `GOOGLE_DRIVE_STORAGE_FOLDER_ID`** with the new ID

The code already supports Shared Drives with `supportsAllDrives: true`.

---

## ✅ Quick Checklist

### Google Cloud Setup
- [ ] Google Cloud project created/selected
- [ ] Google Drive API enabled
- [ ] Service account created (or existing one selected)
- [ ] **NEW key generated** (JSON format) - ⚠️ Old key is invalid!
- [ ] JSON key file downloaded and saved securely

### Local Setup
- [ ] JSON key file copied to project root
- [ ] `.env` file updated with correct filename in `GOOGLE_SERVICE_ACCOUNT_KEY`
- [ ] `GOOGLE_DRIVE_STORAGE_FOLDER_ID=12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W`

### Google Drive Sharing
- [ ] Folder exists: `https://drive.google.com/drive/u/3/folders/12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W`
- [ ] Folder shared with service account email from JSON file
- [ ] Permission set to: **Editor** (not Viewer!)

### Testing
- [ ] Run: `node scripts/test-drive-connection.js`
- [ ] All tests pass ✅

### Vercel Deployment
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` set with full JSON content
- [ ] `GOOGLE_DRIVE_STORAGE_FOLDER_ID` set with folder ID
- [ ] Redeployed after setting environment variables

---

## 🎉 Success!

Once configured correctly, you'll see these logs:
```
📝 Using Google service account from file path (local mode)
✅ Google Drive Storage initialized successfully
✅ Google Drive upload folder configured: 12SJbU1xr6AGA1S2t0kcafFMO2iAUix_W
```

Your files will be automatically:
- ✅ Compressed (images: 30-70% size reduction)
- ✅ Organized in game-specific folders
- ✅ Auto-deleted after 2 days (configurable)
- ✅ Securely accessible only to authorized users
