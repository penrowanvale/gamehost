const cron = require('node-cron');
const { GoogleDriveStorage } = require('../config/google-drive-storage');

class CleanupScheduler {
  constructor() {
    this.driveStorage = new GoogleDriveStorage();
    this.setupScheduler();
  }

  setupScheduler() {
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID) {
      console.log('⚠️ SCHEDULER: Google Drive not configured - cleanup scheduler disabled');
      return;
    }

    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 SCHEDULER: Starting daily cleanup at 2 AM...');
      await this.runDailyCleanup();
    });

    cron.schedule('0 */6 * * *', async () => {
      console.log('🕐 SCHEDULER: Starting 6-hourly cleanup...');
      await this.runDailyCleanup();
    });

    console.log('✅ SCHEDULER: Cleanup scheduler initialized');
    console.log('📅 SCHEDULE: Daily cleanup at 2 AM');
    console.log('📅 SCHEDULE: 6-hourly cleanup for frequent maintenance');
  }

  async runDailyCleanup() {
    try {
      const folderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID;
      
      console.log('🧹 CLEANUP: Starting automated cleanup...');
      
      const result = await this.driveStorage.cleanupOldFiles(2, folderId);
      
      if (result.deletedCount > 0) {
        console.log(`✅ CLEANUP: Deleted ${result.deletedCount} files`);
        console.log(`💾 STORAGE: Freed ${(result.totalSize / (1024 * 1024)).toFixed(2)} MB`);

        await this.logCleanupResult(result);
      } else {
        console.log('🧹 CLEANUP: No old files to delete');
      }
      
    } catch (error) {
      console.error('❌ CLEANUP ERROR:', error);
      
    }
  }

  async logCleanupResult(result) {
    
    console.log('📊 CLEANUP STATS:', {
      timestamp: new Date().toISOString(),
      deletedFiles: result.deletedCount,
      totalFiles: result.totalFiles,
      storageFreed: result.totalSize,
      errors: result.errors || 0
    });
  }

  async runManualCleanup() {
    console.log('🔧 MANUAL CLEANUP: Starting manual cleanup...');
    return await this.runDailyCleanup();
  }
}

if (require.main === module) {
  const scheduler = new CleanupScheduler();
  console.log('🚀 Cleanup scheduler started');

  process.on('SIGINT', () => {
    console.log('👋 Cleanup scheduler shutting down...');
    process.exit(0);
  });
}

module.exports = CleanupScheduler;