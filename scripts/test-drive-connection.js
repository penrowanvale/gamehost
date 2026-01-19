// Load environment variables
require('dotenv').config();

const { GoogleDriveStorage } = require('../config/google-drive-storage');
const fs = require('fs');
const path = require('path');

async function testGoogleDriveConnection() {
  console.log('🧪 Testing Google Drive Storage Connection...\n');

  try {
    // Initialize Google Drive Storage
    const driveStorage = new GoogleDriveStorage();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Step 1: Google Drive Storage initialized');

    // Test folder creation
    console.log('🔍 Step 2: Testing folder creation...');
    const testFolderId = await driveStorage.createFolder('GameHost-Test-' + Date.now());
    console.log(`✅ Step 2: Test folder created with ID: ${testFolderId}`);

    // Create a test file
    console.log('📄 Step 3: Creating test file...');
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, `Test file created at ${new Date().toISOString()}\nGoogle Drive Storage Test`);
    console.log('✅ Step 3: Test file created locally');

    // Test file upload
    console.log('☁️ Step 4: Testing file upload...');
    const uploadResult = await driveStorage.uploadFile(
      testFilePath,
      'test-file.txt',
      testFolderId,
      'text/plain'
    );
    console.log('✅ Step 4: File uploaded successfully');
    console.log(`   File ID: ${uploadResult.fileId}`);
    console.log(`   Download URL: ${uploadResult.downloadUrl}`);

    // Test file listing (get old files)
    console.log('📋 Step 5: Testing file listing...');
    const oldFiles = await driveStorage.getOldFiles(0, testFolderId); // Get all files
    console.log(`✅ Step 5: Found ${oldFiles.length} files in test folder`);

    // Test file deletion
    console.log('🗑️ Step 6: Testing file deletion...');
    await driveStorage.deleteFile(uploadResult.fileId);
    console.log('✅ Step 6: Test file deleted successfully');

    // Test folder deletion
    console.log('🗂️ Step 7: Cleaning up test folder...');
    await driveStorage.deleteFile(testFolderId);
    console.log('✅ Step 7: Test folder deleted successfully');

    // Clean up local test file
    fs.unlinkSync(testFilePath);
    console.log('✅ Step 8: Local test file cleaned up');

    console.log('\n🎉 ALL TESTS PASSED! Google Drive Storage is working correctly.');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Configured' : 'Missing'}`);
    console.log(`   Storage Folder: ${process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID || 'Not configured'}`);
    
    console.log('\n✅ Your Google Drive storage system is ready to use!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n🔧 Troubleshooting:');
    
    if (error.message.includes('ENOENT')) {
      console.error('   - Check GOOGLE_SERVICE_ACCOUNT_KEY path in .env file');
      console.error('   - Ensure the service account JSON file exists');
    } else if (error.message.includes('403')) {
      console.error('   - Check service account permissions');
      console.error('   - Ensure Google Drive API is enabled');
      console.error('   - Verify folder is shared with service account');
    } else if (error.message.includes('404')) {
      console.error('   - Check GOOGLE_DRIVE_STORAGE_FOLDER_ID in .env file');
      console.error('   - Ensure the folder exists and is accessible');
    } else {
      console.error('   - Check your internet connection');
      console.error('   - Verify Google Cloud project is active');
      console.error('   - Check service account key is valid');
    }
    
    console.error('\n📖 See GOOGLE_DRIVE_STORAGE_SETUP.md for detailed setup instructions');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testGoogleDriveConnection();
}

module.exports = testGoogleDriveConnection;