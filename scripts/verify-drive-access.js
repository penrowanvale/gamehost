#!/usr/bin/env node

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

console.log('🔍 GOOGLE DRIVE FOLDER ACCESS VERIFICATION\n');
console.log('='.repeat(70));

async function verifyAccess() {
  try {
    
    console.log('\n📋 STEP 1: Checking Environment Variables...\n');
    
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const folderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID;
    
    if (!serviceAccountKey) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not set!');
      process.exit(1);
    }
    
    if (!folderId) {
      console.error('❌ GOOGLE_DRIVE_STORAGE_FOLDER_ID not set!');
      process.exit(1);
    }
    
    console.log('✅ GOOGLE_SERVICE_ACCOUNT_KEY: Set');
    console.log('✅ GOOGLE_DRIVE_STORAGE_FOLDER_ID:', folderId);

    console.log('\n📋 STEP 2: Initializing Google Drive Authentication...\n');
    
    let auth;
    if (serviceAccountKey.trim().startsWith('{')) {
      console.log('✅ Using JSON string format (Vercel mode)');
      const credentials = JSON.parse(serviceAccountKey);
      console.log(`✅ Service Account Email: ${credentials.client_email}`);
      console.log(`✅ Project ID: ${credentials.project_id}`);
      
      auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    } else {
      console.log('✅ Using file path format (local mode)');
      console.log(`✅ Key file: ${serviceAccountKey}`);
      
      if (!fs.existsSync(serviceAccountKey)) {
        console.error('❌ Service account key file not found!');
        process.exit(1);
      }
      
      auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    }
    
    const drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive API initialized');

    let cleanFolderId = folderId;
    const urlMatch = folderId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      cleanFolderId = urlMatch[1];
      console.log(`✅ Extracted folder ID: ${cleanFolderId}`);
    }

    console.log('\n📋 STEP 3: Testing Folder Access...\n');
    
    try {
      const folderResponse = await drive.files.get({
        fileId: cleanFolderId,
        fields: 'id, name, owners, permissions, capabilities'
      });
      
      console.log('✅ FOLDER FOUND!');
      console.log(`   Name: ${folderResponse.data.name}`);
      console.log(`   ID: ${folderResponse.data.id}`);
      
      if (folderResponse.data.owners) {
        console.log(`   Owner: ${folderResponse.data.owners[0]?.emailAddress || 'Unknown'}`);
      }

      const canEdit = folderResponse.data.capabilities?.canAddChildren;
      console.log(`   Can Upload Files: ${canEdit ? '✅ YES' : '❌ NO'}`);
      
      if (!canEdit) {
        console.log('\n❌ PROBLEM FOUND: Service account cannot add files to this folder!');
        console.log('   This is why uploads fail.');
        console.log('\n💡 SOLUTION:');
        console.log('   1. Go to Google Drive');
        console.log(`   2. Find folder: ${folderResponse.data.name}`);
        console.log('   3. Right-click → Share');
        console.log('   4. Add your service account email with "Editor" permission');
        console.log('   5. NOT "Viewer" - it MUST be "Editor"!');
        return;
      }
      
    } catch (error) {
      if (error.code === 404) {
        console.error('❌ FOLDER NOT FOUND!');
        console.error(`   Folder ID: ${cleanFolderId}`);
        console.error('\n💡 POSSIBLE CAUSES:');
        console.error('   1. Folder ID is incorrect');
        console.error('   2. Folder is not shared with service account');
        console.error('   3. Folder was deleted');
        return;
      } else if (error.code === 403) {
        console.error('❌ PERMISSION DENIED!');
        console.error('   Service account cannot access this folder.');
        console.error('\n💡 SOLUTION:');
        console.error('   The folder must be shared with the service account email!');
        return;
      } else {
        throw error;
      }
    }

    console.log('\n📋 STEP 4: Testing File Upload...\n');
    
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testContent = `Test file created at ${new Date().toISOString()}\n\nThis is a test upload to verify Google Drive access.\n`;

    const tempFile = path.join('/tmp', testFileName);
    fs.writeFileSync(tempFile, testContent);
    
    try {
      console.log(`📤 Uploading test file: ${testFileName}`);
      
      const fileMetadata = {
        name: testFileName,
        parents: [cleanFolderId]
      };
      
      const media = {
        mimeType: 'text/plain',
        body: fs.createReadStream(tempFile)
      };
      
      const uploadResponse = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });
      
      console.log('✅ UPLOAD SUCCESSFUL!');
      console.log(`   File ID: ${uploadResponse.data.id}`);
      console.log(`   File Name: ${uploadResponse.data.name}`);
      console.log(`   View Link: ${uploadResponse.data.webViewLink}`);

      console.log('\n🧹 Cleaning up test file...');
      await drive.files.delete({ fileId: uploadResponse.data.id });
      console.log('✅ Test file deleted from Drive');

      fs.unlinkSync(tempFile);
      
    } catch (error) {
      if (error.message && error.message.includes('storage quota')) {
        console.error('\n❌ UPLOAD FAILED: Storage Quota Error!');
        console.error('   This means the folder is NOT properly shared with the service account.');
        console.error('\n💡 SOLUTION:');
        console.error('   1. The folder must be EXPLICITLY shared with the service account email');
        console.error('   2. "Anyone with the link" does NOT work!');
        console.error('   3. You must add the service account email directly');
        console.error('   4. Permission must be "Editor" (not "Viewer")');

        const client = await auth.getClient();
        if (client.email) {
          console.error(`\n📧 Share the folder with this email: ${client.email}`);
        }
        return;
      } else {
        throw error;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! Everything is working correctly!\n');
    console.log('✅ Environment variables are set correctly');
    console.log('✅ Service account authentication works');
    console.log('✅ Folder is accessible');
    console.log('✅ Service account can upload files');
    console.log('✅ Your upload system should work now!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error('\nFull error details:', error);
    process.exit(1);
  }
}

verifyAccess().catch(console.error);
