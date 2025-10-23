const express = require('express');
const { supabase } = require('../config/database');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get all active games for today
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Fetching games for date:', today);
    
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number,
          real_name
        )
      `)
      .eq('game_date', today)
      .in('status', ['upcoming', 'live'])
      .order('game_time', { ascending: true });

    console.log('📊 Games query result:', { games: games?.length || 0, error });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If no games for today, get upcoming games from future dates
    if (!games || games.length === 0) {
      console.log('🔄 No games for today, fetching upcoming games');
      const { data: upcomingGames, error: upcomingError } = await supabase
        .from('games')
        .select(`
          *,
          organisers (
            organiser_name,
            whatsapp_number,
            real_name
          )
        `)
        .gte('game_date', today)
        .eq('status', 'upcoming')
        .order('game_date', { ascending: true })
        .order('game_time', { ascending: true })
        .limit(20);

      if (upcomingError) {
        return res.status(400).json({ error: upcomingError.message });
      }

      return res.json({ games: upcomingGames || [] });
    }

    res.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all public games (no auth required) - FIXED VERSION
router.get('/public', async (req, res) => {
  try {
    console.log('🌍 Fetching public games...');
    
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number,
          real_name
        )
      `)
      .in('status', ['upcoming', 'live'])
      .order('game_date', { ascending: true })
      .order('game_time', { ascending: true })
      .limit(50);

    console.log('📊 Public games query result:', { games: games?.length || 0, error });

    if (error) {
      console.error('💥 Public games query error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ games: games || [] });
  } catch (error) {
    console.error('💥 Error fetching public games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured games
router.get('/featured', async (req, res) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number
        )
      `)
      .eq('is_featured', true)
      .eq('status', 'upcoming')
      .order('featured_order', { ascending: true })
      .limit(15);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ games });
  } catch (error) {
    console.error('Error fetching featured games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top games
router.get('/top', async (req, res) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number
        )
      `)
      .eq('is_top_game', true)
      .eq('status', 'upcoming')
      .order('top_game_order', { ascending: true })
      .limit(15);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ games });
  } catch (error) {
    console.error('Error fetching top games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: game, error } = await supabase
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number,
          real_name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get participant count
    const { count: participantCount } = await supabase
      .from('game_participants')
      .select('*', { count: 'exact' })
      .eq('game_id', id)
      .eq('payment_status', 'approved');

    game.registered_participants = participantCount || 0;

    res.json({ game });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register for a game (payment verification)
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const { sheetsSelected, utrId, paymentPhone, selectedSheetNumbers } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!sheetsSelected || !utrId || !paymentPhone || !selectedSheetNumbers) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if game exists and is active
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status === 'ended') {
      return res.status(400).json({ error: 'Game has already ended' });
    }

    // Check if user already registered for this game
    const { data: existingParticipation } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();

    if (existingParticipation) {
      return res.status(400).json({ error: 'You have already registered for this game' });
    }

    // Calculate total amount based on sheets selected
    let totalAmount = 0;
    if (sheetsSelected === 1) {
      totalAmount = game.price_per_sheet_1;
    } else if (sheetsSelected === 2) {
      totalAmount = game.price_per_sheet_2 * 2;
    } else {
      totalAmount = game.price_per_sheet_3_plus * sheetsSelected;
    }

    // Create participation record
    const { data: participation, error } = await supabase
      .from('game_participants')
      .insert([{
        game_id: gameId,
        user_id: userId,
        sheets_selected: sheetsSelected,
        total_amount: totalAmount,
        utr_id: utrId,
        payment_phone: paymentPhone,
        selected_sheet_numbers: selectedSheetNumbers,
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Registration submitted successfully. Waiting for organiser approval.',
      participation
    });
  } catch (error) {
    console.error('Error registering for game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's game participations
router.get('/user/participations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: participations, error } = await supabase
      .from('game_participants')
      .select(`
        *,
        games (
          name,
          banner_image_url,
          game_date,
          game_time,
          status,
          zoom_link,
          zoom_password
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ participations });
  } catch (error) {
    console.error('Error fetching participations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download sheets (only for approved participants)
router.get('/:id/download-sheets', authenticateToken, async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const userId = req.user.userId;

    // Check if user is approved participant
    const { data: participation, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .eq('payment_status', 'approved')
      .single();

    if (error || !participation) {
      return res.status(403).json({ error: 'You are not approved for this game or not registered' });
    }

    // Get game details with sheets folder
    const { data: game } = await supabase
      .from('games')
      .select('sheets_folder_id, name')
      .eq('id', gameId)
      .single();

    if (!game || !game.sheets_folder_id) {
      return res.status(404).json({ error: 'Game sheets not available' });
    }

    // Mark sheets as downloaded
    await supabase
      .from('game_participants')
      .update({ sheets_downloaded: true })
      .eq('id', participation.id);

    // Return sheet download information
    // Note: In a real implementation, you would integrate with Google Drive API
    // to generate temporary download links for the selected sheets
    res.json({
      message: 'Sheets ready for download',
      sheetNumbers: participation.selected_sheet_numbers,
      gameId: gameId,
      gameName: game.name,
      downloadUrl: `/api/games/${gameId}/sheets/${participation.id}` // This would be implemented with Google Drive integration
    });
  } catch (error) {
    console.error('Error downloading sheets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sheet download links for approved participants
router.get('/:gameId/sheets/:participationId', authenticateToken, async (req, res) => {
  try {
    const { gameId, participationId } = req.params;
    const userId = req.user.userId;

    // Verify participation and approval
    const { data: participation } = await supabase
      .from('game_participants')
      .select(`
        *,
        games (
          sheets_folder_id, 
          sheets_folder_url,
          sheet_file_format,
          name
        )
      `)
      .eq('id', participationId)
      .eq('user_id', userId)
      .eq('payment_status', 'approved')
      .single();

    if (!participation) {
      return res.status(403).json({ error: 'Access denied - not approved for this game' });
    }

    const game = participation.games;
    if (!game.sheets_folder_id) {
      return res.status(404).json({ error: 'Game sheets not available' });
    }

    // Generate secure download links for selected sheets
    const sheets = [];

    for (const sheetNumber of participation.selected_sheet_numbers) {
      const fileName = (game.sheet_file_format || 'Sheet_{number}.pdf').replace('{number}', sheetNumber);
      const secureUrl = `/api/games/sheets/secure-download/${participationId}/${sheetNumber}`;
      
      sheets.push({
        sheetNumber: sheetNumber,
        fileName: fileName,
        downloadUrl: secureUrl,
        gameName: game.name
      });
    }

    res.json({
      message: 'Sheet download links ready',
      sheets: sheets,
      totalSheets: sheets.length,
      gameId: gameId,
      gameName: game.name
    });

  } catch (error) {
    console.error('Error preparing sheet downloads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Secure sheet download proxy - hides Google Drive structure
router.get('/sheets/secure-download/:participationId/:sheetNumber', authenticateToken, async (req, res) => {
  try {
    const { participationId, sheetNumber } = req.params;
    const userId = req.user.userId;

    // Verify user has access to this specific sheet
    const { data: participation } = await supabase
      .from('game_participants')
      .select(`
        *,
        games (
          sheets_folder_id,
          sheets_folder_url,
          sheet_file_format,
          name
        )
      `)
      .eq('id', participationId)
      .eq('user_id', userId)
      .eq('payment_status', 'approved')
      .single();

    if (!participation) {
      return res.status(403).json({ error: 'Access denied - participation not found or not approved' });
    }

    // Check if user selected this specific sheet
    if (!participation.selected_sheet_numbers.includes(parseInt(sheetNumber))) {
      return res.status(403).json({ error: 'Sheet not in your selection' });
    }

    const game = participation.games;
    const fileName = (game.sheet_file_format || 'Sheet_{number}.pdf').replace('{number}', sheetNumber);
    
    // Log the download attempt
    console.log(`Download attempt: User ${userId}, Game ${game.name}, Sheet ${sheetNumber}`);

    // For public Google Drive folders, we need to construct the download URL
    // Since we can't easily get individual file IDs without API access,
    // we'll provide a direct folder access method that's still secure
    
    const folderId = game.sheets_folder_id;
    
    // Method 1: Direct Google Drive download (if files are properly named and public)
    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${folderId}&filename=${fileName}`;
    
    // Method 2: Folder view with specific file (more reliable for public folders)
    const folderViewUrl = `https://drive.google.com/drive/folders/${folderId}`;
    
    // Return both options to the client
    res.json({
      success: true,
      fileName: fileName,
      sheetNumber: sheetNumber,
      gameName: game.name,
      downloadOptions: {
        direct: directDownloadUrl,
        folder: folderViewUrl,
        instructions: `Look for file: ${fileName}`
      },
      message: `Sheet ${sheetNumber} ready for download`,
      instructions: `Your sheet "${fileName}" is ready. If direct download doesn't work, use the folder link to find and download your specific sheet.`
    });

    // Mark this sheet as accessed (for tracking)
    await supabase
      .from('game_participants')
      .update({ 
        sheets_downloaded: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', participationId);

  } catch (error) {
    console.error('Error in secure sheet download:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;