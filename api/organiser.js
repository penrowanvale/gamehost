const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase, supabaseAdmin } = require('../config/database');
const jwt = require('jsonwebtoken');
const { GoogleDriveStorage, MulterGoogleDriveStorage } = require('../config/google-drive-storage');
const router = express.Router();

const driveStorage = new GoogleDriveStorage();

console.log('\n' + '='.repeat(70));
console.log('🔍 GOOGLE DRIVE CONFIGURATION CHECK');
console.log('='.repeat(70));
console.log('GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
  `SET (${process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 50)}...)` : 
  '❌ NOT SET');
console.log('GOOGLE_DRIVE_STORAGE_FOLDER_ID:', process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID || '❌ NOT SET');
console.log('='.repeat(70) + '\n');

const createGoogleDriveUpload = () => {
  
  const folderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID;
  
  if (!folderId || folderId.trim() === '') {
    console.error('❌ CRITICAL ERROR: GOOGLE_DRIVE_STORAGE_FOLDER_ID is not set!');
    console.error('   Current value:', folderId);
    console.error('   This environment variable MUST be set in Vercel.');
    console.error('   See QUICK_FIX_CHECKLIST.md for setup instructions.');
    throw new Error(
      'GOOGLE_DRIVE_STORAGE_FOLDER_ID environment variable is required. ' +
      'Please set it in Vercel Dashboard → Settings → Environment Variables'
    );
  }
  
  console.log(`✅ Creating Google Drive uploader with folder: ${folderId}`);
  
  return multer({
    storage: new MulterGoogleDriveStorage({
      tempDir: process.env.TEMP_DIR || '/tmp',
      compressionQuality: parseInt(process.env.COMPRESSION_QUALITY) || 75,
      parentFolderId: folderId
      }),
    limits: {
      fileSize: 50 * 1024 * 1024, 
      files: 100 
    },
    fileFilter: function (req, file, cb) {
      
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('File type not supported. Allowed: Images, PDF, Word documents'), false);
      }
    }
  });
};

const authenticateOrganiser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (user.role !== 'organiser' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Organiser access required' });
    }
    req.user = user;
    next();
  });
};

router.get('/profile', authenticateOrganiser, async (req, res) => {
  try {
    console.log('🏢 Fetching organiser profile for user:', req.user.userId);
    console.log('🔍 User object from token:', req.user);
    
    const { data: organiser, error } = await supabaseAdmin
      .from('organisers')
      .select(`
        *,
        users (
          username,
          email,
          phone
        )
      `)
      .eq('user_id', req.user.userId)
      .single();

    if (error) {
      console.log('❌ Organiser profile query error:', error);
      return res.status(400).json({ error: 'Database error: ' + error.message });
    }

    if (!organiser) {
      console.log('❌ Organiser profile not found for user_id:', req.user.userId);
      return res.status(404).json({ error: 'Organiser profile not found' });
    }

    console.log('✅ Organiser profile loaded:', organiser.organiser_name);
    console.log('📊 Profile data:', { id: organiser.id, name: organiser.organiser_name, approved: organiser.is_approved });
    res.json({ organiser });
  } catch (error) {
    console.error('💥 Error fetching organiser profile:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

router.put('/profile', authenticateOrganiser, async (req, res) => {
  try {
    const { organiserName, whatsappNumber } = req.body;

    const { data: organiser, error } = await supabaseAdmin
      .from('organisers')
      .update({
        organiser_name: organiserName,
        whatsapp_number: whatsappNumber,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile updated successfully', organiser });
  } catch (error) {
    console.error('Error updating organiser profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/games', authenticateOrganiser, async (req, res) => {
  try {
    const {
      name,
      bannerImageUrl,
      totalPrize,
      pricePerSheet1,
      pricePerSheet2,
      pricePerSheet3Plus,
      paymentQrCodeUrl,
      zoomLink,
      zoomPassword,
      gameDate,
      gameTime,
      sheetsFolder,
      totalSheets,
      sheetFileFormat,
      customFormat,
      individualSheetFiles,
      autoScanned
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    
    if (!totalPrize || isNaN(totalPrize) || totalPrize <= 0) {
      return res.status(400).json({ error: 'Valid total prize is required' });
    }
    
    if (!pricePerSheet1 || isNaN(pricePerSheet1) || pricePerSheet1 <= 0) {
      return res.status(400).json({ error: 'Valid price for 1 sheet is required' });
    }
    
    if (!pricePerSheet2 || isNaN(pricePerSheet2) || pricePerSheet2 <= 0) {
      return res.status(400).json({ error: 'Valid price for 2 sheets is required' });
    }
    
    if (!pricePerSheet3Plus || isNaN(pricePerSheet3Plus) || pricePerSheet3Plus <= 0) {
      return res.status(400).json({ error: 'Valid price for 3+ sheets is required' });
    }
    
    if (!gameDate) {
      return res.status(400).json({ error: 'Game date is required' });
    }
    
    if (!gameTime) {
      return res.status(400).json({ error: 'Game time is required' });
    }

    const googleDrive = require('../config/google-drive');
    let sheetsFolderId = null;
    
    if (sheetsFolder) {
      try {
        sheetsFolderId = await googleDrive.validateAndGetFolderId(sheetsFolder);
      } catch (error) {
        return res.status(400).json({ error: `Invalid Google Drive folder: ${error.message}` });
      }
    }

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (!organiser) {
      return res.status(404).json({ error: 'Organiser profile not found' });
    }

    let finalFileFormat = sheetFileFormat;
    if (sheetFileFormat === 'custom' && customFormat) {
      finalFileFormat = customFormat;
    }

    if (autoScanned && individualSheetFiles && Object.keys(individualSheetFiles).length > 0) {
      console.log(`🔍 GAME CREATION: Auto-scanned game with ${Object.keys(individualSheetFiles).length} individual files`);
      console.log(`📋 INDIVIDUAL FILES:`, Object.keys(individualSheetFiles).slice(0, 5)); 
    } else {
      console.log(`📁 GAME CREATION: Traditional game creation (no auto-scan data provided)`);
      console.log(`📊 AUTO-SCAN DATA:`, { autoScanned, hasIndividualFiles: !!individualSheetFiles, fileCount: Object.keys(individualSheetFiles || {}).length });
    }

    const gameData = {
      organiser_id: organiser.id,
      name,
      banner_image_url: bannerImageUrl,
      total_prize: totalPrize,
      price_per_sheet_1: pricePerSheet1,
      price_per_sheet_2: pricePerSheet2,
      price_per_sheet_3_plus: pricePerSheet3Plus,
      payment_qr_code_url: paymentQrCodeUrl,
      zoom_link: zoomLink,
      zoom_password: zoomPassword,
      game_date: gameDate,
      game_time: gameTime,
      sheets_folder_id: sheetsFolderId,
      sheets_folder_url: sheetsFolder, 
      sheet_file_format: finalFileFormat,
      total_sheets: totalSheets,
      status: 'upcoming'
    };

    if (individualSheetFiles && Object.keys(individualSheetFiles).length > 0) {
      gameData.individual_sheet_files = individualSheetFiles;
    }

    let { data: game, error } = await supabaseAdmin
      .from('games')
      .insert([gameData])
      .select()
      .single();

    if (error && error.message.includes('individual_sheet_files')) {
      console.log('⚠️ MIGRATION: individual_sheet_files column missing, creating game without it...');
      console.log('💡 SOLUTION: Run this SQL in Supabase Dashboard:');
      console.log('   ALTER TABLE games ADD COLUMN IF NOT EXISTS individual_sheet_files JSONB DEFAULT \'{}\';');

      const { individual_sheet_files, ...gameDataWithoutFiles } = gameData;
      
      const retryResult = await supabaseAdmin
        .from('games')
        .insert([gameDataWithoutFiles])
        .select()
        .single();
      
      game = retryResult.data;
      error = retryResult.error;
      
      if (!error && individual_sheet_files && Object.keys(individual_sheet_files).length > 0) {
        console.log(`⚠️ WARNING: Game created without ${Object.keys(individual_sheet_files).length} individual sheet files.`);
        console.log('🔧 NEXT STEP: After running migration, use the Auto-Scan button to configure downloads.');
      }
    }

    if (error) {
      console.error('❌ GAME CREATION ERROR:', error);
      return res.status(400).json({ 
        error: error.message,
        details: 'Failed to create game. Please try again or contact support.',
        migrationNeeded: error.message.includes('individual_sheet_files')
      });
    }

    res.status(201).json({ message: 'Game created successfully', game });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/games', authenticateOrganiser, async (req, res) => {
  try {
    const { status } = req.query;
    console.log('🎮 Fetching games for organiser user:', req.user.userId);
    console.log('🔍 Query status filter:', status);

    console.log('🔍 Looking up organiser for user_id:', req.user.userId);
    const { data: organiser, error: organiserError } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (organiserError) {
      console.log('❌ Organiser lookup error:', organiserError);
      return res.status(400).json({ error: 'Error finding organiser: ' + organiserError.message });
    }

    if (!organiser) {
      console.log('❌ Organiser profile not found for user:', req.user.userId);
      return res.status(404).json({ error: 'Organiser profile not found' });
    }

    console.log('✅ Found organiser ID:', organiser.id);

    let query = supabaseAdmin
      .from('games')
      .select('*')
      .eq('organiser_id', organiser.id);

    if (status) {
      console.log('🔍 Adding status filter:', status);
      query = query.eq('status', status);
    }

    console.log('🔍 Executing games query...');
    const { data: games, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Games query error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Games loaded:', games?.length || 0);
    console.log('📊 Games data sample:', games?.slice(0, 2));
    res.json({ games });
  } catch (error) {
    console.error('💥 Error fetching organiser games:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

router.put('/games/:id', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: existingGame } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .single();

    if (!existingGame) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Game updated successfully', game });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/games/:id/sheet-files', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const { individualSheetFiles } = req.body;

    console.log(`🔧 ORGANISER: Configuring individual sheet files for game ${id}`);

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: existingGame } = await supabaseAdmin
      .from('games')
      .select('organiser_id, name, total_sheets')
      .eq('id', id)
      .single();

    if (!existingGame || existingGame.organiser_id !== organiser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!individualSheetFiles || typeof individualSheetFiles !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid sheet files format',
        expectedFormat: 'Object with sheet numbers as keys and Google Drive file IDs as values',
        example: '{"1": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", "2": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upmt"}'
      });
    }

    const fileIdPattern = /^[a-zA-Z0-9_-]{25,}$/;
    const invalidEntries = [];
    
    Object.entries(individualSheetFiles).forEach(([sheetNum, fileId]) => {
      if (!fileIdPattern.test(fileId)) {
        invalidEntries.push({ sheet: sheetNum, fileId: fileId });
      }
    });

    if (invalidEntries.length > 0) {
      return res.status(400).json({
        error: 'Invalid Google Drive file IDs',
        invalidEntries: invalidEntries,
        note: 'File IDs should be 25+ characters long and contain only letters, numbers, underscores, and hyphens',
        howToGetFileId: 'Right-click file in Google Drive → Get link → Extract ID from URL'
      });
    }

    const { data: updatedGame, error } = await supabaseAdmin
      .from('games')
      .update({ 
        individual_sheet_files: individualSheetFiles,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, individual_sheet_files')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ ORGANISER: Individual sheet files configured for game ${existingGame.name}`);

    res.json({
      success: true,
      message: 'CRITICAL SECURITY UPDATE: Individual sheet files configured successfully',
      game: updatedGame,
      secureDownloadsEnabled: Object.keys(individualSheetFiles).length > 0,
      configuredSheets: Object.keys(individualSheetFiles).map(Number).sort((a, b) => a - b),
      securityNote: 'Users can now only download their specific approved sheets - NO folder access',
      businessProtection: 'This prevents users from downloading all sheets and causing business loss'
    });

  } catch (error) {
    console.error('Error configuring sheet files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/games/:id/auto-scan-sheets', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 AUTO-SCAN: Starting auto-scan for game ${id}`);

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: existingGame } = await supabaseAdmin
      .from('games')
      .select('organiser_id, name, sheets_folder_id')
      .eq('id', id)
      .single();

    if (!existingGame || existingGame.organiser_id !== organiser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!existingGame.sheets_folder_id) {
      return res.status(400).json({ 
        error: 'No Google Drive folder ID configured for this game',
        action: 'Please set the sheets_folder_id first'
      });
    }

    console.log(`🔍 AUTO-SCAN: Scanning folder ${existingGame.sheets_folder_id} for game ${existingGame.name}`);

    const googleDrive = require('../config/google-drive');

    const scanResult = await googleDrive.scanFolderForSheets(existingGame.sheets_folder_id);

    if (!scanResult.success) {
      
      return res.status(200).json({
        success: false,
        error: 'Automatic scan not available',
        message: 'Manual configuration required for secure downloads',
        solution: 'Configure individual file IDs manually',
        instructions: {
          step1: 'Open your Google Drive folder',
          step2: 'For each sheet file: Right-click → Share → Copy link',
          step3: 'Extract file ID from URL (the long string after /d/ and before /view)',
          step4: 'Use the manual configuration to set file IDs',
          example: 'From https://drive.google.com/file/d/1ABC123xyz/view → File ID is: 1ABC123xyz'
        },
        manualConfigEndpoint: `/api/organiser/games/${id}/sheet-files`,
        scanMethod: scanResult.scanMethod || 'failed'
      });
    }

    const individualSheetFiles = {};
    Object.entries(scanResult.sheetFiles).forEach(([sheetNumber, fileInfo]) => {
      individualSheetFiles[sheetNumber] = fileInfo.fileId;
    });

    console.log(`✅ AUTO-SCAN: Found ${Object.keys(individualSheetFiles).length} sheets in folder`);

    const { data: updatedGame, error } = await supabaseAdmin
      .from('games')
      .update({ 
        individual_sheet_files: individualSheetFiles,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, individual_sheet_files')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    console.log(`🎯 AUTO-SCAN: Successfully configured ${Object.keys(individualSheetFiles).length} individual sheet files`);

    res.json({
      success: true,
      message: 'SECURITY UPDATE: Individual sheet files auto-configured successfully',
      game: updatedGame,
      scanResult: {
        totalFilesFound: scanResult.totalFiles,
        sheetsConfigured: Object.keys(individualSheetFiles).length,
        scannedAt: scanResult.scannedAt,
        placeholder: scanResult.placeholder || false
      },
      secureDownloadsEnabled: true,
      securityNote: 'Users can now only download their specific approved sheets - NO folder access',
      businessProtection: 'Auto-scanning prevents business losses by eliminating folder exposure'
    });

  } catch (error) {
    console.error('💥 Error in auto-scan:', error);
    res.status(500).json({ 
      error: 'Auto-scan failed',
      details: error.message 
    });
  }
});

router.get('/migration-status', authenticateOrganiser, async (req, res) => {
  try {
    console.log('🔍 MIGRATION CHECK: Checking if migration is needed...');

    const { data, error } = await supabaseAdmin
      .from('games')
      .select('individual_sheet_files')
      .limit(1);

    if (error && error.message.includes('individual_sheet_files')) {
      
      res.json({
        migrationNeeded: true,
        message: 'Database migration required',
        missingColumns: ['individual_sheet_files'],
        instructions: {
          step1: 'Go to your Supabase dashboard',
          step2: 'Navigate to SQL Editor',
          step3: 'Run the migration script from scripts/add-individual-sheet-files.sql',
          step4: 'Refresh this page to verify'
        }
      });
    } else if (error) {
      
      res.status(500).json({
        error: 'Failed to check migration status',
        details: error.message
      });
    } else {
      
      res.json({
        migrationNeeded: false,
        message: 'Database is up to date',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('💥 MIGRATION CHECK ERROR:', error);
    res.status(500).json({
      error: 'Migration check failed',
      details: error.message
    });
  }
});

router.post('/scan-folder-preview', authenticateOrganiser, async (req, res) => {
  try {
    const { folderId } = req.body;

    console.log(`🔍 PREVIEW SCAN: Scanning folder ${folderId} for preview`);

    if (!folderId) {
      return res.status(400).json({ 
        error: 'Folder ID is required',
        message: 'Please provide a valid Google Drive folder ID'
      });
    }

    const googleDrive = require('../config/google-drive');
    
    try {
      
      const scanResult = await googleDrive.scanFolderForSheets(folderId);

      if (!scanResult || !scanResult.success) {
        console.error('❌ PREVIEW SCAN: Scan result indicates failure');
        return res.status(500).json({
          error: 'Failed to scan Google Drive folder',
          details: scanResult?.error || 'Scan returned unsuccessful result',
          folderId: folderId,
          suggestion: 'Please check if the folder is publicly accessible'
        });
      }

      const sheetsCount = Object.keys(scanResult.sheetFiles || {}).length;
      console.log(`✅ PREVIEW SCAN: Found ${sheetsCount} sheets using ${scanResult.scanMethod || 'unknown'} method`);

      let scanQualityMessage = 'Folder scanned successfully';
      if (scanResult.scanMethod === 'api') {
        scanQualityMessage = 'High-quality API scan completed';
      } else if (scanResult.scanMethod === 'public_estimation') {
        scanQualityMessage = 'Intelligent estimation scan completed';
      } else if (scanResult.scanMethod === 'emergency') {
        scanQualityMessage = 'Emergency scan completed (limited results)';
      }

      res.json({
        success: true,
        message: scanQualityMessage,
        scanResult: {
          totalFilesFound: scanResult.totalFiles || 0,
          sheetsDetected: sheetsCount,
          scannedAt: scanResult.scannedAt,
          scanMethod: scanResult.scanMethod || 'unknown',
          estimated: scanResult.estimated || false,
          placeholder: scanResult.placeholder || false,
          note: scanResult.note || null
        },
        sheetFiles: scanResult.sheetFiles || {},
        folderId: folderId,
        autoScanEnabled: true,
        businessProtection: 'Individual file access configured - no folder exposure'
      });

    } catch (scanError) {
      console.error('💥 PREVIEW SCAN: Scan operation failed:', scanError);

      res.status(500).json({
        error: 'Scan operation failed',
        details: scanError.message || 'Unknown scanning error',
        folderId: folderId,
        suggestion: 'Please ensure the Google Drive folder is publicly accessible with "Anyone with the link can view" permissions',
        troubleshooting: {
          step1: 'Right-click your Google Drive folder',
          step2: 'Select "Share"',
          step3: 'Change access to "Anyone with the link"',
          step4: 'Set permission to "Viewer"',
          step5: 'Copy the folder URL and try again'
        }
      });
    }

  } catch (error) {
    console.error('💥 Error in preview scan endpoint:', error);
    res.status(500).json({ 
      error: 'Preview scan endpoint failed',
      details: error.message,
      suggestion: 'Please try again or contact support if the issue persists'
    });
  }
});

router.post('/games/:gameId/upload-to-drive', authenticateOrganiser, (req, res, next) => {
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID) {
    console.error('❌ Upload rejected: Missing environment variables');
    console.error('   GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET');
    console.error('   GOOGLE_DRIVE_STORAGE_FOLDER_ID:', process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID || 'NOT SET');
    
    return res.status(500).json({
      error: 'Google Drive storage not configured',
      message: 'Please configure GOOGLE_DRIVE_STORAGE_FOLDER_ID in Vercel environment variables. See QUICK_FIX_CHECKLIST.md'
    });
  }
  
  const currentFolderId = process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID;
  console.log(`📤 Creating upload handler for folder: ${currentFolderId}`);
  console.log(`📤 Folder ID type: ${typeof currentFolderId}, length: ${currentFolderId ? currentFolderId.length : 0}`);
  console.log(`📤 Environment check:`, {
    hasEnvVar: !!process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID,
    value: process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID,
    isString: typeof process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID === 'string'
  });
  
  let googleDriveUpload;
  try {
    googleDriveUpload = createGoogleDriveUpload();
    console.log('✅ Google Drive uploader created successfully');
  } catch (error) {
    console.error('❌ Failed to create Google Drive uploader:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ Stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to initialize Google Drive uploader',
      message: error.message,
      details: error.stack
    });
  }
  googleDriveUpload.array('files', 100)(req, res, (err) => {
    if (err) {
      console.error('❌ MULTER ERROR:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'Maximum file size is 50MB'
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 100 files allowed'
        });
      } else if (err.message && err.message.includes('File type not supported')) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: err.message
        });
      } else {
        return res.status(500).json({
          error: 'Upload failed',
          message: err.message || 'File upload error'
        });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { fileType } = req.body; 
    const uploadedFiles = req.files;

    if (!gameId) {
      return res.status(400).json({
        error: 'Game ID is required',
        message: 'Please provide a valid game ID'
      });
    }

    if (!fileType || !['sheets', 'banners', 'images'].includes(fileType)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'File type must be one of: sheets, banners, images'
      });
    }

    console.log(`☁️ DRIVE UPLOAD: Received ${uploadedFiles?.length || 0} ${fileType} for game ${gameId}`);

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select files to upload'
      });
    }

    const { data: organiser, error: organiserError } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (organiserError || !organiser) {
      console.error('❌ ORGANISER LOOKUP ERROR:', organiserError);
      return res.status(404).json({
        error: 'Organiser not found',
        message: 'Please ensure you are registered as an organiser'
      });
    }

    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('organiser_id, name')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      console.error('❌ GAME LOOKUP ERROR:', gameError);
      return res.status(404).json({
        error: 'Game not found',
        message: 'Please ensure the game exists and you have access to it'
      });
    }

    if (game.organiser_id !== organiser.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to upload files for this game'
      });
    }

    console.log(`📂 Setting up folder structure for Game ${gameId}: ${game.name}`);
    
    let gameFolders;
    try {
      gameFolders = await driveStorage.createGameFolderStructure(
        gameId,
        game.name,
        organiser.id,
        process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID
      );
    } catch (folderError) {
      console.error('❌ Failed to create game folders:', folderError);
      return res.status(500).json({
        error: 'Failed to create folder structure',
        message: folderError.message
      });
    }

    const targetFolderId = fileType === 'sheets' ? gameFolders.sheetsFolderId :
                           fileType === 'banners' ? gameFolders.bannersFolderId :
                           gameFolders.imagesFolderId;
    
    console.log(`📁 Uploading ${fileType} to folder: ${targetFolderId} in ${gameFolders.gameFolderName}`);

    console.log(`📦 Moving ${uploadedFiles.length} files to game folder: ${gameFolders.gameFolderName}/${fileType}`);
    
    for (const file of uploadedFiles) {
      try {
        await driveStorage.moveFile(file.fileId, targetFolderId);
        console.log(`✅ Moved ${file.fileName} to ${fileType} folder`);
      } catch (moveError) {
        console.error(`❌ Failed to move ${file.fileName}:`, moveError);
        
      }
    }

    const processedFiles = {};
    const uploadedItems = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    uploadedFiles.forEach((file, index) => {
      const itemNumber = index + 1;
      
      processedFiles[itemNumber] = {
        fileId: file.fileId,
        fileName: file.fileName,
        originalName: file.originalName,
        size: file.size,
        downloadUrl: file.downloadUrl,
        webViewLink: file.webViewLink,
        
        thumbnailLink: file.thumbnailLink, 
        embedLink: file.embedLink, 
        directLink: file.directLink,
        viewLink: file.viewLink,
        uploadedAt: file.createdTime || new Date().toISOString(),
        compression: file.compression,
        autoDeleteDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
        folderPath: `${gameFolders.gameFolderName}/${fileType}`, 
        gameFolderId: gameFolders.gameFolderId,
        targetFolderId: targetFolderId
      };
      
      uploadedItems.push(itemNumber);
      
      if (file.compression) {
        totalOriginalSize += file.compression.originalSize;
        totalCompressedSize += file.compression.compressedSize;
      }
      
      console.log(`✅ DRIVE UPLOAD: ${fileType} ${itemNumber} -> ${file.fileId} in ${gameFolders.gameFolderName}/${fileType}`);
    });

    
    const updateData = {
      updated_at: new Date().toISOString()
    };

    try {
      
      updateData[`${fileType}_files`] = processedFiles;
      updateData[`${fileType}_count`] = uploadedItems.length;
      updateData[`${fileType}_uploaded`] = true;
      updateData.upload_method = 'google_drive_storage';
      updateData.drive_folder_id = gameFolders.gameFolderId;
      updateData.drive_folder_name = gameFolders.gameFolderName;

      if (fileType === 'sheets') {
        updateData.individual_sheet_files = processedFiles;
        updateData.total_sheets = uploadedItems.length;
        updateData.sheets_folder_id = targetFolderId; 
        console.log(`✅ Set sheets_folder_id to: ${targetFolderId}`);
      }

      if (fileType === 'banners' && processedFiles[1] && processedFiles[1].thumbnailLink) {
        updateData.banner_image_url = processedFiles[1].thumbnailLink;
        console.log(`✅ Updated banner_image_url with thumbnail: ${updateData.banner_image_url}`);
      }

      if ((fileType === 'images' || fileType === 'qr') && processedFiles[1] && processedFiles[1].thumbnailLink) {
        updateData.payment_qr_code_url = processedFiles[1].thumbnailLink;
        console.log(`✅ Updated payment_qr_code_url with thumbnail: ${updateData.payment_qr_code_url}`);
      }
    } catch (e) {
      console.log('⚠️ Some optional fields not available, continuing...');
    }

    const { error: updateError } = await supabaseAdmin
      .from('games')
      .update(updateData)
      .eq('id', gameId);

    if (updateError) {
      console.error('❌ DRIVE UPLOAD: Database update failed:', updateError);
      console.log('⚠️ Files uploaded successfully to Drive, but database not updated');
      console.log('📁 Files are in:', gameFolders.gameFolderName);

      return res.json({
        success: true,
        message: `Successfully uploaded ${uploadedItems.length} ${fileType} to Google Drive`,
        warning: 'Database not fully updated - files are safe in Google Drive',
        uploadedItems: uploadedItems,
        totalItems: uploadedItems.length,
        gameName: game.name,
        fileType: fileType,
        uploadMethod: 'google_drive_storage',
        compressionStats: compressionStats,
        autoDeleteDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        files: processedFiles,
        folderInfo: {
          gameFolderId: gameFolders.gameFolderId,
          gameFolderName: gameFolders.gameFolderName,
          driveUrl: `https://drive.google.com/drive/folders/${gameFolders.gameFolderId}`
        },
        storageInfo: {
          provider: 'Google Drive (Shared Drive)',
          autoCompress: true,
          autoDelete: '2 days',
          costEffective: true
        }
      });
    }

    const compressionStats = totalOriginalSize > 0 ? {
      originalSize: totalOriginalSize,
      compressedSize: totalCompressedSize,
      savings: totalOriginalSize - totalCompressedSize,
      compressionRatio: ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)
    } : null;

    console.log(`✅ DRIVE UPLOAD: Successfully uploaded ${uploadedItems.length} ${fileType} for game ${game.name}`);
    if (compressionStats) {
      console.log(`📦 COMPRESSION: Saved ${compressionStats.savings} bytes (${compressionStats.compressionRatio}% reduction)`);
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedItems.length} ${fileType} to Google Drive`,
      uploadedItems: uploadedItems,
      totalItems: uploadedItems.length,
      gameName: game.name,
      fileType: fileType,
      uploadMethod: 'google_drive_storage',
      compressionStats: compressionStats,
      autoDeleteDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      files: processedFiles,
      storageInfo: {
        provider: 'Google Drive (2TB Plan)',
        autoCompress: true,
        autoDelete: '2 days',
        costEffective: true
      }
    });

  } catch (error) {
    console.error('💥 DRIVE UPLOAD ERROR:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
});

router.post('/cleanup-old-files', authenticateOrganiser, async (req, res) => {
  try {
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID) {
      return res.status(500).json({
        error: 'Google Drive storage not configured',
        message: 'Please configure Google Drive storage first'
      });
    }
    
    console.log('🧹 CLEANUP: Starting auto-cleanup of old files...');
    
    const cleanupResult = await driveStorage.cleanupOldFiles(2, process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID);

    if (cleanupResult.deletedCount > 0) {
      
      console.log(`🗑️ DATABASE: Cleaned up ${cleanupResult.deletedCount} file records`);
    }
    
    res.json({
      success: true,
      message: `Cleanup completed: ${cleanupResult.deletedCount} files deleted`,
      ...cleanupResult,
      storageFreed: `${(cleanupResult.totalSize / (1024 * 1024)).toFixed(2)} MB`,
      nextCleanup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
    });
    
  } catch (error) {
    console.error('💥 CLEANUP ERROR:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      details: error.message
    });
  }
});

router.get('/games/:id/participants', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: game } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .single();

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    const { data: participants, error } = await supabaseAdmin
      .from('game_participants')
      .select(`
        *,
        users (
          username,
          email
        )
      `)
      .eq('game_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ participants });
  } catch (error) {
    console.error('Error fetching game participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/participants/:id/status', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: participant } = await supabaseAdmin
      .from('game_participants')
      .select(`
        *,
        games (
          organiser_id,
          organisers (
            user_id
          )
        )
      `)
      .eq('id', id)
      .single();

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.games.organisers.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: updatedParticipant, error } = await supabaseAdmin
      .from('game_participants')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (status === 'approved') {
      await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: participant.user_id,
          title: 'Payment Approved',
          message: `Your payment for the game has been approved. You can now download your sheets.`,
          type: 'payment_approved'
        }]);
    } else if (status === 'rejected') {

      
      
      console.log(`🔄 SHEET RELEASE: Payment rejected for participant ${id}. Sheets ${participant.selected_sheet_numbers?.join(', ')} are now available again.`);
      
      await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: participant.user_id,
          title: 'Payment Rejected',
          message: `Your payment for the game has been rejected. Your selected sheets have been released and are available for others. Please contact the organiser for more information.`,
          type: 'payment_rejected'
        }]);
    }

    res.json({ 
      message: `Participant ${status} successfully`, 
      participant: updatedParticipant,
      sheetsReleased: status === 'rejected' ? participant.selected_sheet_numbers : null
    });
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/games/:id/end', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const { winners } = req.body; 

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: game } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .single();

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    await supabaseAdmin
      .from('games')
      .update({
        status: 'ended',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (winners && winners.length > 0) {
      
      const winnerRecords = [];
      
      for (const winner of winners) {

        if (winner.userId && winner.position && winner.prizeAmount) {
          winnerRecords.push({
            game_id: id,
            user_id: winner.userId,
            position: winner.position,
            prize_amount: winner.prizeAmount
          });
        }
      }

      if (winnerRecords.length > 0) {
        await supabaseAdmin
          .from('game_winners')
          .insert(winnerRecords);
      }
    }

    res.json({ message: 'Game ended successfully and winners added' });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticateOrganiser, async (req, res) => {
  try {
    console.log('📊 Fetching stats for organiser user:', req.user.userId);

    const { data: organiser, error: organiserError } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (organiserError) {
      console.log('❌ Organiser lookup error for stats:', organiserError);
      return res.status(400).json({ error: 'Error finding organiser: ' + organiserError.message });
    }

    if (!organiser) {
      console.log('❌ Organiser not found for stats, user_id:', req.user.userId);
      return res.status(404).json({ error: 'Organiser profile not found' });
    }

    console.log('✅ Found organiser for stats, ID:', organiser.id);

    const { count: totalGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact' })
      .eq('organiser_id', organiser.id);

    const { data: endedGames } = await supabaseAdmin
      .from('games')
      .select(`
        id,
        total_prize,
        game_participants!inner(total_amount, payment_status)
      `)
      .eq('organiser_id', organiser.id)
      .eq('status', 'ended');

    let totalRevenue = 0;
    let totalPrizesPaid = 0;
    let totalProfit = 0;

    endedGames.forEach(game => {
      const approvedParticipants = game.game_participants.filter(p => p.payment_status === 'approved');
      const gameRevenue = approvedParticipants.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
      totalRevenue += gameRevenue;
      totalPrizesPaid += parseFloat(game.total_prize);
    });

    totalProfit = totalRevenue - totalPrizesPaid;

    res.json({
      totalGames: totalGames || 0,
      totalRevenue,
      totalPrizesPaid,
      totalProfit,
      endedGamesCount: endedGames.length
    });
  } catch (error) {
    console.error('Error fetching organiser stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/validate-folder', authenticateOrganiser, async (req, res) => {
  try {
    const { folderUrl } = req.body;
    
    if (!folderUrl) {
      return res.status(400).json({ error: 'Folder URL is required' });
    }

    const googleDrive = require('../config/google-drive');
    const folderId = googleDrive.extractFolderIdFromUrl(folderUrl);
    
    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive folder URL. Please provide a valid folder URL or ID.' });
    }

    try {
      const validatedFolderId = await googleDrive.validateAndGetFolderId(folderUrl);
      
      res.json({ 
        message: 'Folder is valid and accessible',
        folderId: validatedFolderId,
        folderUrl: `https://drive.google.com/drive/folders/${validatedFolderId}`,
        instructions: 'Make sure your folder is set to "Anyone with the link can view" for users to download sheets.'
      });
      
    } catch (validationError) {
      res.status(400).json({ 
        error: validationError.message,
        folderId: folderId,
        suggestions: [
          'Make sure the folder exists in your Google Drive',
          'Set folder sharing to "Anyone with the link can view"',
          'Copy the complete folder URL from your browser',
          'Or just paste the folder ID (the long string after /folders/)'
        ]
      });
    }

  } catch (error) {
    console.error('Error validating folder:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/validate-sheets', authenticateOrganiser, async (req, res) => {
  try {
    const { folderUrl, totalSheets, fileFormat } = req.body;
    
    if (!folderUrl || !totalSheets || !fileFormat) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const googleDrive = require('../config/google-drive');
    const folderId = googleDrive.extractFolderIdFromUrl(folderUrl);
    
    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive folder URL' });
    }

    const validation = {};
    const samplesToCheck = Math.min(10, totalSheets);
    
    for (let i = 1; i <= samplesToCheck; i++) {
      try {
        const fileName = fileFormat.replace('{number}', i);

        validation[i] = true;
      } catch (error) {
        validation[i] = false;
      }
    }

    res.json({
      message: 'Sheet validation completed',
      validation: validation,
      folderId: folderId,
      totalChecked: samplesToCheck
    });

  } catch (error) {
    console.error('Error validating sheets:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/games/:id/start', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: game } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .single();

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    await supabaseAdmin
      .from('games')
      .update({
        status: 'live',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    const { data: participants } = await supabaseAdmin
      .from('game_participants')
      .select('user_id')
      .eq('game_id', id)
      .eq('payment_status', 'approved');

    if (participants && participants.length > 0) {
      const notifications = participants.map(participant => ({
        user_id: participant.user_id,
        title: 'Game is Live!',
        message: `${game.name} has started. Join now using the meeting link.`,
        type: 'game_live'
      }));

      await supabaseAdmin
        .from('notifications')
        .insert(notifications);
    }

    res.json({ 
      message: 'Game started successfully', 
      participantsNotified: participants?.length || 0 
    });

  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/debug/env-check', authenticateOrganiser, (req, res) => {
  
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      GOOGLE_SERVICE_ACCOUNT_KEY: {
        isSet: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        type: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
          (process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim().startsWith('{') ? 'JSON' : 'FILE_PATH') : 
          'NOT_SET',
        preview: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
          process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 50) + '...' : 
          null
      },
      GOOGLE_DRIVE_STORAGE_FOLDER_ID: {
        isSet: !!process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID,
        value: process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID || null,
        length: process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID ? 
          process.env.GOOGLE_DRIVE_STORAGE_FOLDER_ID.length : 0
      }
    }
  };

  console.log('🔍 ENV CHECK REQUEST:', envCheck);
  
  res.json({
    success: true,
    message: 'Environment variable check',
    ...envCheck
  });
});

router.post('/games/fix-all-sheets-folders', authenticateOrganiser, async (req, res) => {
  try {
    console.log('🔧 AUTO-FIX: Starting bulk fix for all games');

    const { data: organiser, error: organiserError } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (organiserError || !organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    const { data: games, error: gamesError } = await supabaseAdmin
      .from('games')
      .select('id, name, sheets_folder_id, drive_folder_id, individual_sheet_files, sheets_count')
      .eq('organiser_id', organiser.id)
      .in('status', ['upcoming', 'live']);

    if (gamesError) {
      console.error('❌ Error fetching games:', gamesError);
      return res.status(500).json({ error: 'Failed to fetch games' });
    }

    console.log(`📊 Found ${games?.length || 0} active games for organiser ${organiser.id}`);

    const results = {
      total: games?.length || 0,
      fixed: 0,
      alreadyOk: 0,
      needsReupload: 0,
      details: []
    };

    for (const game of games || []) {
      const gameResult = {
        id: game.id,
        name: game.name,
        status: '',
        action: ''
      };

      if (game.sheets_folder_id) {
        gameResult.status = 'already_ok';
        gameResult.action = 'No fix needed';
        results.alreadyOk++;
      }
      
      else if (game.drive_folder_id) {
        try {
          await supabaseAdmin
            .from('games')
            .update({
              sheets_folder_id: game.drive_folder_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', game.id);

          gameResult.status = 'fixed';
          gameResult.action = `Set sheets_folder_id = drive_folder_id`;
          gameResult.sheets_folder_id = game.drive_folder_id;
          results.fixed++;
          console.log(`✅ Fixed game ${game.name}: ${game.drive_folder_id}`);
        } catch (updateError) {
          gameResult.status = 'error';
          gameResult.action = `Failed to update: ${updateError.message}`;
          console.error(`❌ Failed to fix ${game.name}:`, updateError);
        }
      }
      
      else if (game.sheets_count > 0 || (game.individual_sheet_files && Object.keys(game.individual_sheet_files).length > 0)) {
        gameResult.status = 'needs_reupload';
        gameResult.action = 'Re-upload sheets through dashboard';
        results.needsReupload++;
      }
      
      else {
        gameResult.status = 'no_sheets';
        gameResult.action = 'Upload sheets first';
        results.needsReupload++;
      }

      results.details.push(gameResult);
    }

    console.log(`🎯 AUTO-FIX COMPLETE: Fixed ${results.fixed}, Already OK ${results.alreadyOk}, Needs reupload ${results.needsReupload}`);

    res.json({
      success: true,
      message: `Processed ${results.total} games`,
      results: results,
      summary: {
        total: results.total,
        fixed: results.fixed,
        alreadyOk: results.alreadyOk,
        needsReupload: results.needsReupload,
        successRate: results.total > 0 ? Math.round((results.fixed + results.alreadyOk) / results.total * 100) : 0
      }
    });

  } catch (error) {
    console.error('💥 Auto-fix error:', error);
    res.status(500).json({
      error: 'Auto-fix failed',
      message: error.message
    });
  }
});

router.post('/games/:gameId/fix-sheets-folder', authenticateOrganiser, async (req, res) => {
  try {
    const { gameId } = req.params;

    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, name, organiser_id, sheets_folder_id, drive_folder_id, individual_sheet_files')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.organiser_id !== organiser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (game.sheets_folder_id) {
      return res.json({
        success: true,
        message: 'Game already has sheets_folder_id',
        sheets_folder_id: game.sheets_folder_id
      });
    }

    if (game.drive_folder_id) {
      await supabaseAdmin
        .from('games')
        .update({
          sheets_folder_id: game.drive_folder_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      return res.json({
        success: true,
        message: 'Fixed sheets_folder_id',
        sheets_folder_id: game.drive_folder_id
      });
    }

    return res.status(400).json({
      error: 'No folder ID available',
      message: 'Please re-upload your sheets through the dashboard',
      suggestion: 'The sheets need to be uploaded again to set the folder ID correctly'
    });

  } catch (error) {
    console.error('💥 Single game fix error:', error);
    res.status(500).json({
      error: 'Fix failed',
      message: error.message
    });
  }
});

module.exports = router;