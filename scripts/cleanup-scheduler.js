// node-cron is optional - only works on traditional servers, not serverless
let cron = null;
try {
  cron = require('node-cron');
} catch (error) {
  console.warn('⚠️ node-cron not available - scheduler disabled');
}

// GoogleDriveStorage is also optional
let GoogleDriveStorage = null;
try {
  GoogleDriveStorage = require('../config/google-drive-storage').GoogleDriveStorage;
} catch (error) {
  console.warn('⚠️ GoogleDriveStorage not available - scheduler disabled');
}

class CleanupScheduler {
  constructor() {
    // Check if we're in serverless mode - don't run scheduler
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
    if (isServerless) {
      console.log('⚠️ SCHEDULER: Running in serverless mode - cron scheduler disabled');
      console.log('💡 TIP: Use Vercel Cron Jobs for scheduled cleanup: https://vercel.com/docs/cron-jobs');
      this.driveStorage = null;
      return;
    }

    // Check if dependencies are available
    if (!cron) {
      console.log('⚠️ SCHEDULER: node-cron not available - cleanup scheduler disabled');
      this.driveStorage = null;
      return;
    }

    if (!GoogleDriveStorage) {
      console.log('⚠️ SCHEDULER: GoogleDriveStorage not available - cleanup scheduler disabled');
      this.driveStorage = null;
      return;
    }

    try {
      this.driveStorage = new GoogleDriveStorage();
      this.setupScheduler();
    } catch (error) {
      console.error('❌ SCHEDULER: Failed to initialize Google Drive storage:', error.message);
      this.driveStorage = null;
    }
  }

  setupScheduler() {
    // Check if Google Drive is configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID) {
      console.log('⚠️ SCHEDULER: Google Drive not configured - cleanup scheduler disabled');
      return;
    }

    if (!cron) {
      console.log('⚠️ SCHEDULER: Cron library not available');
      return;
    }

    // Run cleanup every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 SCHEDULER: Starting daily cleanup at 2 AM...');
      await this.runDailyCleanup();
    });

    // Run cleanup every 6 hours for more frequent cleanup
    cron.schedule('0 */6 * * *', async () => {
      console.log('🕐 SCHEDULER: Starting 6-hourly cleanup...');
      await this.runDailyCleanup();
    });

    console.log('✅ SCHEDULER: Cleanup scheduler initialized');
    console.log('📅 SCHEDULE: Daily cleanup at 2 AM');
    console.log('📅 SCHEDULE: 6-hourly cleanup for frequent maintenance');
  }

  async runDailyCleanup() {
    // Check if driveStorage is available
    if (!this.driveStorage) {
      console.log('⚠️ CLEANUP: Drive storage not initialized - skipping cleanup');
      return { deletedCount: 0, totalSize: 0, skipped: true };
    }

    try {
      const folderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID;
      
      console.log('🧹 CLEANUP: Starting automated cleanup...');
      
      const result = await this.driveStorage.cleanupOldFiles(2, folderId);
      
      if (result.deletedCount > 0) {
        console.log(`✅ CLEANUP: Deleted ${result.deletedCount} files`);
        console.log(`💾 STORAGE: Freed ${(result.totalSize / (1024 * 1024)).toFixed(2)} MB`);
        
        // Log to database or send notification if needed
        await this.logCleanupResult(result);
      } else {
        console.log('🧹 CLEANUP: No old files to delete');
      }

      return result;
      
    } catch (error) {
      console.error('❌ CLEANUP ERROR:', error);
      // In production, you might want to send an alert here
      return { deletedCount: 0, totalSize: 0, error: error.message };
    }
  }

  async logCleanupResult(result) {
    // This could log to your database or send notifications
    console.log('📊 CLEANUP STATS:', {
      timestamp: new Date().toISOString(),
      deletedFiles: result.deletedCount,
      totalFiles: result.totalFiles,
      storageFreed: result.totalSize,
      errors: result.errors || 0
    });
  }

  // Manual cleanup trigger
  async runManualCleanup() {
    console.log('🔧 MANUAL CLEANUP: Starting manual cleanup...');
    return await this.runDailyCleanup();
  }
}

// Initialize scheduler if this file is run directly
if (require.main === module) {
  const scheduler = new CleanupScheduler();
  console.log('🚀 Cleanup scheduler started');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('👋 Cleanup scheduler shutting down...');
    process.exit(0);
  });
}

module.exports = CleanupScheduler;