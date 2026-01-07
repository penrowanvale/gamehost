const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify admin token
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  });
};

// Get all organisers
router.get('/organisers', authenticateAdmin, async (req, res) => {
  try {
    console.log('🏢 Fetching all organisers...');
    const { data: organisers, error } = await supabaseAdmin
      .from('organisers')
      .select(`
        *,
        users (
          username,
          email,
          phone,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Organisers query error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Organisers loaded:', organisers?.length || 0);
    res.json({ organisers });
  } catch (error) {
    console.error('💥 Error fetching organisers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all pending organiser applications
router.get('/organisers/pending', authenticateAdmin, async (req, res) => {
  try {
    const { data: organisers, error } = await supabaseAdmin
      .from('organisers')
      .select(`
        *,
        users (
          username,
          email,
          phone,
          created_at
        )
      `)
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ organisers });
  } catch (error) {
    console.error('Error fetching pending organisers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject organiser
router.put('/organisers/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    // For rejected organisers, we'll use a custom field to track rejection
    // Since we can't easily add a new column, we'll use a workaround
    const updateData = {
      is_approved: approved,
      updated_at: new Date().toISOString()
    };

    // If rejected, we'll set monthly_fee_paid to null as a marker for rejected status
    if (!approved) {
      updateData.monthly_fee_paid = null; // Use this as a rejection marker
    }

    const { data: organiser, error } = await supabaseAdmin
      .from('organisers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users (
          email,
          username
        )
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Send notification to organiser
    await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: organiser.user_id,
        title: approved ? 'Application Approved' : 'Application Rejected',
        message: approved 
          ? 'Congratulations! Your organiser application has been approved. You can now create games.'
          : 'Your organiser application has been rejected. Please contact support for more information.',
        type: approved ? 'application_approved' : 'application_rejected'
      }]);

    res.json({ 
      message: `Organiser ${approved ? 'approved' : 'rejected'} successfully`, 
      organiser 
    });
  } catch (error) {
    console.error('Error updating organiser status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (excluding organisers and admins)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, phone, role, is_active, created_at')
      .eq('role', 'user') // Only return regular users, not organisers or admins
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all games
router.get('/games', authenticateAdmin, async (req, res) => {
  try {
    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          real_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured games for management
router.get('/games/featured', authenticateAdmin, async (req, res) => {
  try {
    console.log('⭐ Fetching featured games for admin...');
    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number,
          real_name
        )
      `)
      .eq('is_featured', true)
      .order('featured_order', { ascending: true });

    if (error) {
      console.log('❌ Featured games query error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Featured games loaded:', games?.length || 0);
    res.json({ games });
  } catch (error) {
    console.error('💥 Error fetching featured games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top games for management
router.get('/games/top', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔥 Fetching top games for admin...');
    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select(`
        *,
        organisers (
          organiser_name,
          whatsapp_number,
          real_name
        )
      `)
      .eq('is_top_game', true)
      .order('top_game_order', { ascending: true });

    if (error) {
      console.log('❌ Top games query error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Top games loaded:', games?.length || 0);
    res.json({ games });
  } catch (error) {
    console.error('💥 Error fetching top games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add game to featured games
router.post('/featured-games', authenticateAdmin, async (req, res) => {
  try {
    const { gameId, order } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        is_featured: true,
        featured_order: order || 1
      })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Game added to featured successfully', game });
  } catch (error) {
    console.error('Error adding game to featured:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add game to top games
router.post('/top-games', authenticateAdmin, async (req, res) => {
  try {
    const { gameId, order } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        is_top_game: true,
        top_game_order: order || 1
      })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Game added to top games successfully', game });
  } catch (error) {
    console.error('Error adding game to top games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game featured/top status
router.put('/games/:id/promotion', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      isFeatured, 
      isTopGame, 
      featuredOrder, 
      topGameOrder, 
      hasGlowDot, 
      hasGlowShadow 
    } = req.body;

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        is_featured: isFeatured,
        is_top_game: isTopGame,
        featured_order: featuredOrder,
        top_game_order: topGameOrder,
        has_glow_dot: hasGlowDot,
        has_glow_shadow: hasGlowShadow,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Game promotion updated successfully', game });
  } catch (error) {
    console.error('Error updating game promotion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sponsored ads
router.get('/ads', authenticateAdmin, async (req, res) => {
  try {
    const { data: ads, error } = await supabaseAdmin
      .from('sponsored_ads')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ ads });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update sponsored ad
router.post('/ads', authenticateAdmin, async (req, res) => {
  try {
    const { title, bannerImageUrl, linkUrl, displayOrder, isActive } = req.body;

    const { data: ad, error } = await supabaseAdmin
      .from('sponsored_ads')
      .insert([{
        title,
        banner_image_url: bannerImageUrl,
        link_url: linkUrl,
        display_order: displayOrder || 0,
        is_active: isActive !== false
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Ad created successfully', ad });
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sponsored ad
router.put('/ads/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: ad, error } = await supabaseAdmin
      .from('sponsored_ads')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ad updated successfully', ad });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get news banners
router.get('/news-banners', authenticateAdmin, async (req, res) => {
  try {
    console.log('📰 Fetching news banners...');
    const { data: banners, error } = await supabaseAdmin
      .from('news_banner')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.log('❌ News banners query error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ News banners loaded:', banners?.length || 0);
    res.json({ banners });
  } catch (error) {
    console.error('💥 Error fetching news banners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update news banner
router.post('/news-banners', authenticateAdmin, async (req, res) => {
  try {
    const { text, linkUrl, displayOrder, isActive } = req.body;
    console.log('📰 Creating news banner:', text);

    const { data: banner, error } = await supabaseAdmin
      .from('news_banner')
      .insert([{
        text,
        link_url: linkUrl,
        display_order: displayOrder || 0,
        is_active: isActive !== undefined ? isActive : true
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ News banner creation error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ News banner created:', banner.id);
    res.json({ message: 'News banner created successfully', banner });
  } catch (error) {
    console.error('💥 Error creating news banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update news banner
router.put('/news-banners/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, linkUrl, displayOrder, isActive } = req.body;
    console.log('📰 Updating news banner:', id);

    const { data: banner, error } = await supabaseAdmin
      .from('news_banner')
      .update({
        text,
        link_url: linkUrl,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log('❌ News banner update error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ News banner updated:', banner.id);
    res.json({ message: 'News banner updated successfully', banner });
  } catch (error) {
    console.error('💥 Error updating news banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete news banner
router.delete('/news-banners/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📰 Deleting news banner:', id);

    const { error } = await supabaseAdmin
      .from('news_banner')
      .delete()
      .eq('id', id);

    if (error) {
      console.log('❌ News banner deletion error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ News banner deleted:', id);
    res.json({ message: 'News banner deleted successfully' });
  } catch (error) {
    console.error('💥 Error deleting news banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sponsored ad
router.delete('/ads/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('sponsored_ads')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get news banner items
router.get('/news-banner', authenticateAdmin, async (req, res) => {
  try {
    const { data: newsItems, error } = await supabaseAdmin
      .from('news_banner')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ newsItems });
  } catch (error) {
    console.error('Error fetching news banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create news banner item
router.post('/news-banner', authenticateAdmin, async (req, res) => {
  try {
    const { text, linkUrl, displayOrder, isActive } = req.body;

    const { data: newsItem, error } = await supabaseAdmin
      .from('news_banner')
      .insert([{
        text,
        link_url: linkUrl,
        display_order: displayOrder || 0,
        is_active: isActive !== false
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'News item created successfully', newsItem });
  } catch (error) {
    console.error('Error creating news item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ad network scripts
router.put('/ad-scripts/:network', authenticateAdmin, async (req, res) => {
  try {
    const { network } = req.params;
    const { scriptContent, isActive } = req.body;

    const { data: adScript, error } = await supabaseAdmin
      .from('ad_scripts')
      .upsert({
        network_name: network,
        script_content: scriptContent,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Ad script updated successfully', adScript });
  } catch (error) {
    console.error('Error updating ad script:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin settings
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('admin_settings')
      .select('*');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin setting
router.put('/settings/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data: setting, error } = await supabaseAdmin
      .from('admin_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics data
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching analytics data...');
    
    // Get user counts
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get organiser counts
    const { count: totalOrganisers } = await supabaseAdmin
      .from('organisers')
      .select('*', { count: 'exact', head: true });

    const { count: approvedOrganisers } = await supabaseAdmin
      .from('organisers')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);

    // Get game counts
    const { count: totalGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact', head: true });

    const { count: upcomingGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'upcoming');

    const { count: liveGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live');

    const { count: featuredGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true);

    const { count: topGames } = await supabaseAdmin
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('is_top_game', true);

    // Get participation counts
    const { count: totalParticipations } = await supabaseAdmin
      .from('game_participants')
      .select('*', { count: 'exact', head: true });

    console.log('✅ Analytics data compiled');
    
    res.json({
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0
      },
      organisers: {
        total: totalOrganisers || 0,
        approved: approvedOrganisers || 0
      },
      games: {
        total: totalGames || 0,
        upcoming: upcomingGames || 0,
        live: liveGames || 0,
        featured: featuredGames || 0,
        top: topGames || 0
      },
      participations: {
        total: totalParticipations || 0
      }
    });
  } catch (error) {
    console.error('💥 Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export all data
router.get('/export/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    let data, error;

    switch (type) {
      case 'users':
        ({ data, error } = await supabaseAdmin
          .from('users')
          .select('*'));
        break;
      case 'organisers':
        ({ data, error } = await supabaseAdmin
          .from('organisers')
          .select(`
            *,
            users (username, email, phone)
          `));
        break;
      case 'games':
        ({ data, error } = await supabaseAdmin
          .from('games')
          .select(`
            *,
            organisers (organiser_name, real_name)
          `));
        break;
      case 'participants':
        ({ data, error } = await supabaseAdmin
          .from('game_participants')
          .select(`
            *,
            users (username, email),
            games (name, game_date)
          `));
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;