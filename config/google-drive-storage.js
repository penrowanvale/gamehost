const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');

class GoogleDriveStorage {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.initializeAuth();
  }

  extractFolderId(folderInput) {
    if (!folderInput) return null;

    if (/^[a-zA-Z0-9_-]+$/.test(folderInput)) {
      return folderInput;
    }

    const patterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,  
      /id=([a-zA-Z0-9_-]+)/,          
      /^([a-zA-Z0-9_-]+)$/            
    ];
    
    for (const pattern of patterns) {
      const match = folderInput.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  async initializeAuth() {
    try {

      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
      }
      
      let authConfig;

      if (serviceAccountKey.trim().startsWith('{')) {
        
        console.log('📝 Using Google service account from JSON string (Vercel mode)');
        const credentials = JSON.parse(serviceAccountKey);
        
        authConfig = {
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/drive']
        };
      } else {
        
        console.log('📁 Using Google service account from file path (local mode)');

        if (!fs.existsSync(serviceAccountKey)) {
          throw new Error(`Service account key file not found: ${serviceAccountKey}`);
        }
        
        authConfig = {
          keyFile: serviceAccountKey,
          scopes: ['https://www.googleapis.com/auth/drive']
        };
      }
      
      this.auth = new google.auth.GoogleAuth(authConfig);
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      console.log('✅ Google Drive Storage initialized successfully');
    } catch (error) {
      console.error('❌ Google Drive Storage initialization failed:', error.message);
      console.error('💡 TIP: Set GOOGLE_SERVICE_ACCOUNT_KEY to either:');
      console.error('   1. Full JSON string (for Vercel): {"type":"service_account",...}');
      console.error('   2. File path (for local): /path/to/service-account.json');
      throw error;
    }
  }

  async compressImage(inputPath, outputPath, quality = 80) {
    try {
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file does not exist: ${inputPath}`);
      }
      
      const stats = fs.statSync(inputPath);
      const originalSize = stats.size;

      const ext = path.extname(inputPath).toLowerCase();
      let sharpInstance = sharp(inputPath);
      
      if (ext === '.jpg' || ext === '.jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality: quality, progressive: true });
      } else if (ext === '.png') {
        sharpInstance = sharpInstance.png({ compressionLevel: 9, progressive: true });
      } else if (ext === '.webp') {
        sharpInstance = sharpInstance.webp({ quality: quality });
      } else {
        
        sharpInstance = sharpInstance.jpeg({ quality: quality, progressive: true });
      }
      
      await sharpInstance.toFile(outputPath);

      const compressedStats = fs.statSync(outputPath);
      const compressedSize = compressedStats.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      console.log(`📦 COMPRESSION: ${path.basename(inputPath)} - ${originalSize} → ${compressedSize} bytes (${compressionRatio}% reduction)`);
      
      return {
        originalSize,
        compressedSize,
        compressionRatio: parseFloat(compressionRatio),
        outputPath
      };
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      throw error;
    }
  }

  async compressPDF(inputPath, outputPath) {
    try {
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file does not exist: ${inputPath}`);
      }

      
      fs.copyFileSync(inputPath, outputPath);
      
      const stats = fs.statSync(inputPath);
      console.log(`📄 PDF: ${path.basename(inputPath)} - ${stats.size} bytes (no compression applied)`);
      
      return {
        originalSize: stats.size,
        compressedSize: stats.size,
        compressionRatio: 0,
        outputPath
      };
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      throw error;
    }
  }

  async uploadFile(filePath, fileName, parentFolderIdOrUrl = null, mimeType = null) {
    
    const parentFolderId = parentFolderIdOrUrl ? this.extractFolderId(parentFolderIdOrUrl) : null;
    
    try {
      if (!this.drive) {
        throw new Error('Google Drive not initialized');
      }
      
      console.log('🔍 UPLOAD DEBUG:', {
        inputFolderId: parentFolderIdOrUrl,
        extractedFolderId: parentFolderId,
        fileName: fileName
      });

      if (!parentFolderId) {
        throw new Error(
          '❌ CRITICAL: No parent folder specified!\n' +
          'Service accounts cannot upload to "My Drive" - they have no storage quota.\n' +
          'You MUST specify a folder ID that is shared with the service account.\n' +
          'Check GOOGLE_DRIVE_STORAGE_FOLDER_ID environment variable.\n' +
          'See GOOGLE_DRIVE_SERVICE_ACCOUNT_FIX.md for setup.'
        );
      }

      const fileMetadata = {
        name: fileName,
        parents: [parentFolderId] 
      };

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      console.log(`☁️  Uploading to folder: ${parentFolderId}`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, size, createdTime, webViewLink, webContentLink',
        supportsAllDrives: true,  
        supportsTeamDrives: true  
      });

      try {
        await this.drive.permissions.create({
          fileId: response.data.id,
          resource: {
            role: 'reader',
            type: 'anyone'
          },
          supportsAllDrives: true,  
          supportsTeamDrives: true  
        });
        console.log(`✅ PUBLIC: File ${response.data.id} is now publicly accessible`);
      } catch (permError) {
        console.error('⚠️ WARNING: Could not set public permission:', permError.message);
        console.log('📝 File is accessible to Shared Drive members only');
        
      }

      console.log(`✅ UPLOADED: ${fileName} - ID: ${response.data.id}`);

      const fileId = response.data.id;
      
      return {
        fileId: fileId,
        fileName: response.data.name,
        size: response.data.size,
        createdTime: response.data.createdTime,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        
        directLink: `https://drive.google.com/uc?id=${fileId}`,
        
        thumbnailLink: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        
        viewLink: `https://drive.google.com/file/d/${fileId}/view`,
        
        embedLink: `https://drive.google.com/file/d/${fileId}/preview`
      };

    } catch (error) {
      console.error('❌ Google Drive upload failed:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Folder ID that was used:', parentFolderId);

      if (error.message && error.message.includes('storage quota')) {
        console.error('');
        console.error('💡 SOLUTION: The folder must be SHARED with the service account email!');
        console.error('   1. Open your service account JSON file');
        console.error('   2. Find the "client_email" field');
        console.error('   3. Go to Google Drive and share the folder with that email');
        console.error('   4. Give it "Editor" permission (not Viewer!)');
        console.error('   5. The email looks like: name@project.iam.gserviceaccount.com');
        console.error('');
        console.error('📖 See QUICK_FIX_CHECKLIST.md for detailed instructions');
        console.error('');
      } else if (error.code === 404) {
        console.error('');
        console.error('🚨 FOLDER NOT FOUND (404 Error)');
        console.error(`   Folder ID: ${parentFolderId}`);
        console.error('');
        console.error('💡 POSSIBLE CAUSES:');
        console.error('   1. Folder does not exist in Google Drive');
        console.error('   2. Folder is not shared with the service account');
        console.error('   3. Folder ID is incorrect');
        console.error('   4. Folder is in "My Drive" instead of Shared Drive');
        console.error('');
        console.error('💡 SOLUTION:');
        console.error('   1. Go to Google Drive and verify the folder exists');
        console.error('   2. Copy the folder ID from the URL');
        console.error('   3. Share the folder with your service account email (Editor permission)');
        console.error('   4. Update GOOGLE_DRIVE_STORAGE_FOLDER_ID with correct ID');
        console.error('   5. Redeploy in Vercel');
        console.error('');
      } else if (error.code === 403) {
        console.error('');
        console.error('🚨 PERMISSION DENIED (403 Error)');
        console.error(`   Folder ID: ${parentFolderId}`);
        console.error('');
        console.error('💡 SOLUTION:');
        console.error('   - Service account needs "Editor" permission (not "Viewer")');
        console.error('   - Share the folder directly with the service account email');
        console.error('   - "Anyone with the link" does NOT work for service accounts!');
        console.error('');
      }
      
      throw error;
    }
  }

  async moveFile(fileId, newParentFolderId) {
    try {
      if (!this.drive) {
        throw new Error('Google Drive not initialized');
      }

      const file = await this.drive.files.get({
        fileId: fileId,
        fields: 'parents, name',
        supportsAllDrives: true,  
        supportsTeamDrives: true  
      });

      const previousParents = file.data.parents ? file.data.parents.join(',') : '';

      const result = await this.drive.files.update({
        fileId: fileId,
        addParents: newParentFolderId,
        removeParents: previousParents,
        fields: 'id, parents, name',
        supportsAllDrives: true,  
        supportsTeamDrives: true  
      });

      console.log(`📦 MOVED: ${file.data.name} to folder ${newParentFolderId}`);
      return result.data;

    } catch (error) {
      console.error('❌ File move failed:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.drive) {
        throw new Error('Google Drive not initialized');
      }

      await this.drive.files.delete({
        fileId: fileId,
        supportsAllDrives: true,  
        supportsTeamDrives: true  
      });

      console.log(`🗑️ DELETED: File ${fileId} from Google Drive`);
      return true;

    } catch (error) {
      console.error('❌ Google Drive deletion failed:', error);
      throw error;
    }
  }

  async createFolder(folderName, parentFolderIdOrUrl = null) {
    try {
      if (!this.drive) {
        throw new Error('Google Drive not initialized');
      }

      const parentFolderId = parentFolderIdOrUrl ? this.extractFolderId(parentFolderIdOrUrl) : null;

      if (parentFolderId) {
        const query = `name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const existingFolders = await this.drive.files.list({
          q: query,
          fields: 'files(id, name)',
          spaces: 'drive',
          supportsAllDrives: true,  
          supportsTeamDrives: true,  
          includeItemsFromAllDrives: true  
        });
        
        if (existingFolders.data.files && existingFolders.data.files.length > 0) {
          console.log(`📁 FOLDER EXISTS: ${folderName} - ID: ${existingFolders.data.files[0].id}`);
          return existingFolders.data.files[0].id;
        }
      }

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name',
        supportsAllDrives: true,  
        supportsTeamDrives: true  
      });

      console.log(`📁 CREATED FOLDER: ${folderName} - ID: ${response.data.id}`);
      return response.data.id;

    } catch (error) {
      console.error('❌ Folder creation failed:', error);
      throw error;
    }
  }

  async createGameFolderStructure(gameId, gameName, organiserId, rootFolderId) {
    try {
      console.log(`📂 Creating folder structure for Game ${gameId}: ${gameName}`);

      const sanitizedGameName = gameName.replace(/[<>:"/\\|?*]/g, '-').substring(0, 50);
      const gameFolderName = `Game_${gameId}_${sanitizedGameName}_Org${organiserId}`;
      const gameFolderId = await this.createFolder(gameFolderName, rootFolderId);

      const sheetsFolderId = await this.createFolder('sheets', gameFolderId);
      const bannersFolderId = await this.createFolder('banners', gameFolderId);
      const imagesFolderId = await this.createFolder('images', gameFolderId);
      
      console.log(`✅ FOLDER STRUCTURE CREATED for ${gameFolderName}`);
      console.log(`   📊 Sheets folder: ${sheetsFolderId}`);
      console.log(`   🎨 Banners folder: ${bannersFolderId}`);
      console.log(`   📸 Images folder: ${imagesFolderId}`);
      
      return {
        gameFolderId,
        sheetsFolderId,
        bannersFolderId,
        imagesFolderId,
        gameFolderName
      };
      
    } catch (error) {
      console.error('❌ Failed to create game folder structure:', error);
      throw error;
    }
  }

  async getOldFiles(daysOld = 2, folderIdOrUrl = null) {
    try {
      if (!this.drive) {
        throw new Error('Google Drive not initialized');
      }

      const folderId = folderIdOrUrl ? this.extractFolderId(folderIdOrUrl) : null;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffISO = cutoffDate.toISOString();

      let query = `createdTime < '${cutoffISO}' and trashed = false`;
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, createdTime, size)',
        pageSize: 1000,
        supportsAllDrives: true,  
        supportsTeamDrives: true,  
        includeItemsFromAllDrives: true  
      });

      return response.data.files || [];

    } catch (error) {
      console.error('❌ Failed to get old files:', error);
      throw error;
    }
  }

  async cleanupOldFiles(daysOld = 2, folderId = null) {
    try {
      const oldFiles = await this.getOldFiles(daysOld, folderId);
      
      if (oldFiles.length === 0) {
        console.log('🧹 CLEANUP: No old files to delete');
        return { deletedCount: 0, totalSize: 0 };
      }

      let deletedCount = 0;
      let totalSize = 0;

      console.log(`🧹 CLEANUP: Found ${oldFiles.length} files older than ${daysOld} days`);

      for (const file of oldFiles) {
        try {
          await this.deleteFile(file.id);
          deletedCount++;
          totalSize += parseInt(file.size || 0);
          console.log(`🗑️ DELETED: ${file.name} (${file.size} bytes)`);
        } catch (error) {
          console.error(`❌ Failed to delete ${file.name}:`, error.message);
        }
      }

      console.log(`✅ CLEANUP COMPLETE: Deleted ${deletedCount}/${oldFiles.length} files (${totalSize} bytes freed)`);

      return {
        deletedCount,
        totalFiles: oldFiles.length,
        totalSize,
        errors: oldFiles.length - deletedCount
      };

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }
}

class MulterGoogleDriveStorage {
  constructor(options = {}) {
    console.log('🔧 MulterGoogleDriveStorage constructor called with options:', {
      tempDir: options.tempDir,
      compressionQuality: options.compressionQuality,
      parentFolderId: options.parentFolderId,
      hasParentFolderId: !!options.parentFolderId
    });
    
    this.driveStorage = new GoogleDriveStorage();
    this.tempDir = options.tempDir || '/tmp';
    this.compressionQuality = options.compressionQuality || 80;

    const rawFolderId = options.parentFolderId;
    
    console.log('🔍 Raw folder ID value:', {
      value: rawFolderId,
      type: typeof rawFolderId,
      isUndefined: rawFolderId === undefined,
      isNull: rawFolderId === null,
      isEmpty: rawFolderId === '',
      length: rawFolderId ? rawFolderId.length : 0
    });
    
    if (!rawFolderId || rawFolderId.trim() === '') {
      console.error('❌ CRITICAL ERROR: parentFolderId is missing or empty!');
      console.error('   Received value:', rawFolderId);
      console.error('   Type:', typeof rawFolderId);
      console.error('   From environment variable: GOOGLE_DRIVE_STORAGE_FOLDER_ID');
      console.error('   Current env value:', process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID);
      
      throw new Error(
        '❌ GOOGLE_DRIVE_STORAGE_FOLDER_ID is required!\n' +
        `Received value: ${JSON.stringify(rawFolderId)}\n` +
        `Type: ${typeof rawFolderId}\n` +
        `Environment variable value: ${process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID || 'NOT SET'}\n` +
        'Service accounts cannot upload to "My Drive" - you must specify a shared folder.\n' +
        'Set GOOGLE_DRIVE_STORAGE_FOLDER_ID in your environment variables.\n' +
        'See GOOGLE_DRIVE_SERVICE_ACCOUNT_FIX.md for setup instructions.\n' +
        'Visit /test-env.html to verify your environment variables.'
      );
    }

    this.parentFolderId = this.driveStorage.extractFolderId(rawFolderId);
    
    if (!this.parentFolderId) {
      console.error('❌ Failed to extract folder ID from:', rawFolderId);
      throw new Error(
        `❌ Invalid GOOGLE_DRIVE_STORAGE_FOLDER_ID: "${rawFolderId}"\n` +
        'Please provide either:\n' +
        '  - Folder ID: 1PIgEhMR2-rVHbbfpELSYDakzYlEkWBXM\n' +
        '  - Full URL: https://drive.google.com/drive/folders/1PIgEhMR2-rVHbbfpELSYDakzYlEkWBXM'
      );
    }
    
    console.log(`✅ Google Drive upload folder configured: ${this.parentFolderId}`);
  }

  _handleFile(req, file, cb) {
    
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(this.tempDir, `temp_${Date.now()}_${file.originalname}`);
    const compressedFilePath = path.join(this.tempDir, `compressed_${Date.now()}_${file.originalname}`);

    const writeStream = fs.createWriteStream(tempFilePath);
    file.stream.pipe(writeStream);

    writeStream.on('error', cb);
    writeStream.on('finish', async () => {
      try {
        let finalFilePath = tempFilePath;
        let compressionInfo = null;

        if (file.mimetype.startsWith('image/')) {
          compressionInfo = await this.driveStorage.compressImage(tempFilePath, compressedFilePath, this.compressionQuality);
          finalFilePath = compressedFilePath;
        } else if (file.mimetype === 'application/pdf') {
          compressionInfo = await this.driveStorage.compressPDF(tempFilePath, compressedFilePath);
          finalFilePath = compressedFilePath;
        } else {
          
          finalFilePath = tempFilePath;
          compressionInfo = {
            originalSize: fs.statSync(tempFilePath).size,
            compressedSize: fs.statSync(tempFilePath).size,
            compressionRatio: 0,
            outputPath: tempFilePath
          };
        }

        console.log(`📤 Multer: Uploading ${file.originalname} to folder: ${this.parentFolderId}`);
        
        const uploadResult = await this.driveStorage.uploadFile(
          finalFilePath,
          file.originalname,
          this.parentFolderId,
          file.mimetype
        );

        fs.unlinkSync(tempFilePath);
        if (finalFilePath !== tempFilePath) {
          fs.unlinkSync(finalFilePath);
        }

        cb(null, {
          ...uploadResult,
          originalName: file.originalname,
          mimetype: file.mimetype,
          compression: compressionInfo
        });

      } catch (error) {
        
        try {
          fs.unlinkSync(tempFilePath);
          if (fs.existsSync(compressedFilePath)) {
            fs.unlinkSync(compressedFilePath);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        cb(error);
      }
    });
  }

  _removeFile(req, file, cb) {
    
    this.driveStorage.deleteFile(file.fileId)
      .then(() => cb(null))
      .catch(cb);
  }
}

module.exports = {
  GoogleDriveStorage,
  MulterGoogleDriveStorage
};