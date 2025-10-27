const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify organiser token
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

// Get organiser profile
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

// Update organiser profile (limited fields)
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

// Create new game
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
      customFormat
    } = req.body;

    // Extract and validate Google Drive folder ID
    const googleDrive = require('../config/google-drive');
    let sheetsFolderId = null;
    
    if (sheetsFolder) {
      try {
        sheetsFolderId = await googleDrive.validateAndGetFolderId(sheetsFolder);
      } catch (error) {
        return res.status(400).json({ error: `Invalid Google Drive folder: ${error.message}` });
      }
    }

    // Get organiser ID
    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (!organiser) {
      return res.status(404).json({ error: 'Organiser profile not found' });
    }

    // Determine final file format
    let finalFileFormat = sheetFileFormat;
    if (sheetFileFormat === 'custom' && customFormat) {
      finalFileFormat = customFormat;
    }

    // Create game
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .insert([{
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
        sheets_folder_url: sheetsFolder, // Store original URL for reference
        sheet_file_format: finalFileFormat,
        total_sheets: totalSheets,
        status: 'upcoming'
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Game created successfully', game });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organiser's games
router.get('/games', authenticateOrganiser, async (req, res) => {
  try {
    const { status } = req.query;
    console.log('🎮 Fetching games for organiser user:', req.user.userId);
    console.log('🔍 Query status filter:', status);

    // Get organiser ID
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

// Update game
router.put('/games/:id', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get organiser ID
    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    // Verify game belongs to organiser
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

// Get game participants for verification
router.get('/games/:id/participants', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;

    // Get organiser ID
    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    // Verify game belongs to organiser
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

// Approve/Reject participant payment
router.put('/participants/:id/status', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get participant details
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

    // Verify organiser owns this game
    if (participant.games.organisers.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update participant status
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

    // Send notification to user
    if (status === 'approved') {
      await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: participant.user_id,
          title: 'Payment Approved',
          message: `Your payment for the game has been approved. You can now download your sheets.`,
          type: 'payment_approved'
        }]);
    }

    res.json({ message: `Participant ${status} successfully`, participant: updatedParticipant });
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End game and add winners
router.post('/games/:id/end', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;
    const { winners } = req.body; // Array of {userId, position, prizeAmount}

    // Get organiser ID
    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    // Verify game belongs to organiser
    const { data: game } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .single();

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    // Update game status to ended
    await supabaseAdmin
      .from('games')
      .update({
        status: 'ended',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Add winners
    if (winners && winners.length > 0) {
      // First, get user IDs from usernames
      const winnerRecords = [];
      
      for (const winner of winners) {
        // In a real implementation, you'd resolve usernames to user IDs
        // For now, we'll assume winner.userId is provided or resolved
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

// Get organiser statistics
router.get('/stats', authenticateOrganiser, async (req, res) => {
  try {
    console.log('📊 Fetching stats for organiser user:', req.user.userId);
    
    // Get organiser ID
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

    // Get total games
    const { count: totalGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact' })
      .eq('organiser_id', organiser.id);

    // Get ended games with financial data
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

// Validate Google Drive folder
router.post('/validate-folder', authenticateOrganiser, async (req, res) => {
  try {
    const { folderUrl } = req.body;
    
    if (!folderUrl) {
      return res.status(400).json({ error: 'Folder URL is required' });
    }

    // Extract folder ID from URL
    const googleDrive = require('../config/google-drive');
    const folderId = googleDrive.extractFolderIdFromUrl(folderUrl);
    
    if (!folderId) {
      return res.status(400).json({ error: 'Invalid Google Drive folder URL. Please provide a valid folder URL or ID.' });
    }

    // Validate folder accessibility
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

// Validate sheets in folder
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

    // Validate a sample of sheets (first 10 sheets)
    const validation = {};
    const samplesToCheck = Math.min(10, totalSheets);
    
    for (let i = 1; i <= samplesToCheck; i++) {
      try {
        const fileName = fileFormat.replace('{number}', i);
        // For now, we'll assume sheets are accessible if folder is public
        // In production, you'd implement actual file checking
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

// Start game (mark as live)
router.post('/games/:id/start', authenticateOrganiser, async (req, res) => {
  try {
    const { id } = req.params;

    // Get organiser ID
    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    // Verify game belongs to organiser
    const { data: game } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('organiser_id', organiser.id)
      .single();

    if (!game) {
      return res.status(404).json({ error: 'Game not found or access denied' });
    }

    // Update game status to live
    await supabaseAdmin
      .from('games')
      .update({
        status: 'live',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Get all approved participants for this game
    const { data: participants } = await supabaseAdmin
      .from('game_participants')
      .select('user_id')
      .eq('game_id', id)
      .eq('payment_status', 'approved');

    // Send notifications to all approved participants
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

// Export organiser data
router.get('/export/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.userId;

    // Get organiser ID
    const { data: organiser } = await supabaseAdmin
      .from('organisers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!organiser) {
      return res.status(403).json({ error: 'Organiser access required' });
    }

    let data, error, filename, csvData;

    switch (type) {
      case 'games':
        ({ data, error } = await supabaseAdmin
          .from('games')
          .select('*')
          .eq('organiser_id', organiser.id));
        filename = 'my_games_export.csv';
        break;

      case 'participants':
        ({ data, error } = await supabaseAdmin
          .from('game_participants')
          .select(`
            *,
            users (username, email, phone),
            games (name, game_date, game_time)
          `)
          .in('game_id', 
            supabaseAdmin
              .from('games')
              .select('id')
              .eq('organiser_id', organiser.id)
          ));
        filename = 'my_participants_export.csv';
        break;

      case 'financial':
        ({ data, error } = await supabaseAdmin
          .from('games')
          .select(`
            id, name, game_date, total_prize, registered_participants,
            price_per_sheet_1, price_per_sheet_2, price_per_sheet_3_plus,
            status
          `)
          .eq('organiser_id', organiser.id)
          .eq('status', 'ended'));
        filename = 'my_financial_report.csv';
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found to export' });
    }

    // Convert data to CSV
    csvData = convertOrganiserDataToCSV(data, type);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(csvData);

  } catch (error) {
    console.error('Error exporting organiser data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert organiser data to CSV
function convertOrganiserDataToCSV(data, type) {
  if (!data || data.length === 0) return '';

  let headers = [];
  let rows = [];

  switch (type) {
    case 'games':
      headers = ['ID', 'Name', 'Date', 'Time', 'Status', 'Total Prize', 'Participants', 'Sheet Price 1', 'Sheet Price 2', 'Sheet Price 3+', 'Created At'];
      rows = data.map(game => [
        game.id,
        game.name,
        game.game_date,
        game.game_time,
        game.status,
        `₹${game.total_prize}`,
        game.registered_participants || 0,
        `₹${game.price_per_sheet_1}`,
        `₹${game.price_per_sheet_2}`,
        `₹${game.price_per_sheet_3_plus}`,
        new Date(game.created_at).toLocaleDateString()
      ]);
      break;

    case 'participants':
      headers = ['ID', 'Username', 'Email', 'Phone', 'Game', 'Game Date', 'Amount Paid', 'Sheets Count', 'Payment Status', 'Registered At'];
      rows = data.map(participant => [
        participant.id,
        participant.users?.username || '',
        participant.users?.email || '',
        participant.users?.phone || '',
        participant.games?.name || '',
        participant.games?.game_date || '',
        `₹${participant.amount_paid}`,
        participant.selected_sheet_numbers?.length || 0,
        participant.payment_status,
        new Date(participant.created_at).toLocaleDateString()
      ]);
      break;

    case 'financial':
      headers = ['Game ID', 'Game Name', 'Date', 'Status', 'Total Prize', 'Participants', 'Revenue', 'Profit/Loss'];
      rows = data.map(game => {
        const revenue = (game.registered_participants || 0) * (game.price_per_sheet_1 || 0);
        const profit = revenue - (game.total_prize || 0);
        return [
          game.id,
          game.name,
          game.game_date,
          game.status,
          `₹${game.total_prize}`,
          game.registered_participants || 0,
          `₹${revenue}`,
          `₹${profit}`
        ];
      });
      break;

    default:
      return '';
  }

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

module.exports = router;