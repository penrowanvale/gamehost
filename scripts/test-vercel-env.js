#!/usr/bin/env node

console.log('🔍 VERCEL ENVIRONMENT DIAGNOSTIC\n');
console.log('=' .repeat(60));

console.log('\n✓ CHECK 1: GOOGLE_SERVICE_ACCOUNT_KEY');
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.log('❌ NOT SET');
  console.log('   Fix: Set this in Vercel → Settings → Environment Variables');
} else if (serviceAccountKey.startsWith('{')) {
  console.log('✅ CORRECTLY SET (JSON format)');
  try {
    const parsed = JSON.parse(serviceAccountKey);
    console.log(`   ✓ Valid JSON`);
    console.log(`   ✓ Service Account Email: ${parsed.client_email}`);
    console.log(`   ✓ Project ID: ${parsed.project_id}`);
  } catch (e) {
    console.log('❌ INVALID JSON - Cannot parse');
    console.log(`   Error: ${e.message}`);
  }
} else {
  console.log('⚠️  SET BUT WRONG FORMAT');
  console.log(`   Current value starts with: "${serviceAccountKey.substring(0, 50)}..."`);
  console.log('   Expected: Should start with { (JSON object)');
  console.log('   Fix: Set the FULL JSON content from your .json file');
}

console.log('\n✓ CHECK 2: GOOGLE_DRIVE_STORAGE_FOLDER_ID');
const folderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID;

if (!folderId) {
  console.log('❌ NOT SET');
  console.log('   This is why uploads fail!');
  console.log('   Service accounts cannot upload without a target folder.');
  console.log('   Fix: Set this in Vercel → Settings → Environment Variables');
} else if (folderId.trim() === '') {
  console.log('❌ SET BUT EMPTY');
  console.log('   Fix: Provide a valid folder ID or URL');
} else if (folderId.includes('drive.google.com')) {
  console.log('✅ SET (URL format)');
  console.log(`   Value: ${folderId}`);
  const match = folderId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) {
    console.log(`   ✓ Extracted ID: ${match[1]}`);
  } else {
    console.log('   ⚠️  Could not extract folder ID from URL');
  }
} else {
  console.log('✅ SET (ID format)');
  console.log(`   Value: ${folderId}`);
}

console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY\n');

const serviceAccountOK = serviceAccountKey && serviceAccountKey.startsWith('{');
const folderIdOK = folderId && folderId.trim() !== '';

if (serviceAccountOK && folderIdOK) {
  console.log('✅ CONFIGURATION LOOKS GOOD!');
  console.log('\nIf uploads still fail, check:');
  console.log('1. Folder sharing: Is the folder shared with the service account email?');
  console.log('2. Permission level: Does the service account have "Editor" access?');
  console.log('3. Folder exists: Does the folder exist in Google Drive?');
  console.log('\nService Account Email to share with:');
  if (serviceAccountKey && serviceAccountKey.startsWith('{')) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      console.log(`   📧 ${parsed.client_email}`);
      console.log('\nSteps:');
      console.log('1. Open Google Drive');
      console.log(`2. Find folder: ${folderId}`);
      console.log('3. Right-click → Share');
      console.log(`4. Add: ${parsed.client_email}`);
      console.log('5. Set permission to: Editor');
      console.log('6. Uncheck "Notify people"');
      console.log('7. Click Share');
    } catch (e) {
      console.log('   (Could not extract email from invalid JSON)');
    }
  }
} else {
  console.log('❌ CONFIGURATION INCOMPLETE\n');
  console.log('Missing:');
  if (!serviceAccountOK) {
    console.log('- GOOGLE_SERVICE_ACCOUNT_KEY (must be full JSON)');
  }
  if (!folderIdOK) {
    console.log('- GOOGLE_DRIVE_STORAGE_FOLDER_ID (folder ID or URL)');
  }
  console.log('\nFix these in: Vercel Dashboard → Project → Settings → Environment Variables');
}

console.log('\n' + '='.repeat(60));
console.log('💡 For detailed setup instructions, see:');
console.log('   - GOOGLE_DRIVE_SERVICE_ACCOUNT_FIX.md');
console.log('   - VERCEL_GOOGLE_DRIVE_SETUP.md');
console.log('=' .repeat(60) + '\n');
