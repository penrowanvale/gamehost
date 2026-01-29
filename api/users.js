const express = require('express');
const { supabase } = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

router.get('/leaderboard', async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from('game_winners')
      .select(`
        *,
        users (
          username
        ),
        games (
          name,
          game_date,
          organisers (
            organiser_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ winners });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/public/sponsored-ads', async (req, res) => {
  try {
    const { data: ads, error } = await supabase
      .from('sponsored_ads')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(4);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ ads });
  } catch (error) {
    console.error('Error fetching sponsored ads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/public/news-banner', async (req, res) => {
  try {
    const { data: newsItems, error } = await supabase
      .from('news_banner')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(10);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ newsItems });
  } catch (error) {
    console.error('Error fetching news banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/public/ad-scripts', async (req, res) => {
  try {
    const { data: scripts, error } = await supabase
      .from('ad_scripts')
      .select('network_name, script_content')
      .eq('is_active', true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ scripts });
  } catch (error) {
    console.error('Error fetching ad scripts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/public/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('*')
      .in('setting_key', [
        'platform_name',
        'platform_tagline', 
        'disclaimer_text',
        'organiser_monthly_fee'
      ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;