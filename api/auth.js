const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/database');
const router = express.Router();

// Middleware to verify JWT token
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

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, userType } = req.body;

    // Validate input
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},phone.eq.${phone},username.eq.${username}`)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email, phone, or username' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        phone,
        password_hash: passwordHash,
        role: userType === 'organiser' ? 'organiser' : 'user'
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Organiser Registration (Extended)
router.post('/register-organiser', async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      realName,
      organiserName,
      personalPhone,
      aadhaarFrontUrl,
      aadhaarBackUrl
    } = req.body;

    // Validate input
    if (!username || !email || !phone || !password || !realName || !organiserName || !personalPhone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},phone.eq.${phone},username.eq.${username}`)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email, phone, or username' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        phone,
        password_hash: passwordHash,
        role: 'organiser'
      }])
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // Create organiser profile
    const { data: organiser, error: organiserError } = await supabase
      .from('organisers')
      .insert([{
        user_id: user.id,
        real_name: realName,
        organiser_name: organiserName,
        personal_phone: personalPhone,
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        is_approved: false,
        monthly_fee_paid: false
      }])
      .select()
      .single();

    if (organiserError) {
      // Rollback user creation if organiser creation fails
      await supabase.from('users').delete().eq('id', user.id);
      return res.status(400).json({ error: organiserError.message });
    }

    // Send notification to admin
    try {
      const emailService = require('../config/email');
      await emailService.sendOrganiserSignupNotification(organiser, user);
      console.log('Admin notification sent for organiser signup:', user.email);
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the registration if email fails
    }
    
    res.status(201).json({
      message: 'Organiser registration request submitted. Admin will review and approve within 24-48 hours.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organiserName: organiser.organiser_name,
        isApproved: organiser.is_approved
      }
    });
  } catch (error) {
    console.error('Organiser registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    console.log('🔐 Login attempt for:', identifier);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required' });
    }

    // Find user by email or phone
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .single();

    console.log('👤 User lookup result:', { found: !!user, error: error?.message });

    if (error || !user) {
      console.log('❌ User not found for identifier:', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('🚫 User account is deactivated:', user.email);
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔑 Password validation:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For organisers, check if approved
    let organiserData = null;
    if (user.role === 'organiser') {
      const { data: organiser } = await supabase
        .from('organisers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      organiserData = organiser;
      console.log('🏢 Organiser data:', { found: !!organiser, approved: organiser?.is_approved });
      
      if (!organiser || !organiser.is_approved) {
        return res.status(401).json({ 
          error: 'Organiser account is pending approval or not approved',
          isPending: !organiser?.is_approved 
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', user.email, 'Role:', user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organiserData: organiserData
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, phone, role, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If organiser, get organiser data
    let organiserData = null;
    if (user.role === 'organiser') {
      const { data: organiser } = await supabase
        .from('organisers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      organiserData = organiser;
    }

    res.json({
      user: {
        ...user,
        organiserData
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;