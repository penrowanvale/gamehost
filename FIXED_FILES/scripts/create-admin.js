const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/database');
require('dotenv').config();

async function createAdminUser() {
  try {
    console.log('🔍 Checking for admin user...');
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPhone = process.env.ADMIN_PHONE;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPhone || !adminUsername || !adminPassword) {
      console.error('❌ Admin credentials not found in environment variables');
      return;
    }
    
    // Check if admin user already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .single();
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      
      // Update password if needed
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await supabaseAdmin
        .from('users')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAdmin.id);
      
      console.log('🔑 Admin password updated');
      return;
    }
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const { data: admin, error } = await supabaseAdmin
      .from('users')
      .insert([{
        username: adminUsername,
        email: adminEmail,
        phone: adminPhone,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('💥 Error creating admin user:', error);
      return;
    }
    
    console.log('✅ Admin user created successfully:', admin.email);
    
    // Create default admin settings
    const defaultSettings = [
      { setting_key: 'platform_name', setting_value: process.env.PLATFORM_NAME || 'GameBlast Mobile' },
      { setting_key: 'platform_tagline', setting_value: process.env.PLATFORM_TAGLINE || 'Ultimate Mobile Gaming Experience' },
      { setting_key: 'organiser_monthly_fee', setting_value: process.env.ORGANISER_MONTHLY_FEE || '2500' },
      { setting_key: 'disclaimer_text', setting_value: 'This platform is a SaaS service. We are not responsible for any monetary losses. Play responsibly.' }
    ];
    
    for (const setting of defaultSettings) {
      await supabaseAdmin
        .from('admin_settings')
        .upsert(setting);
    }
    
    console.log('⚙️ Default admin settings created');
    
  } catch (error) {
    console.error('💥 Error in createAdminUser:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser().then(() => {
    console.log('🎉 Admin setup complete');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Admin setup failed:', error);
    process.exit(1);
  });
}

module.exports = { createAdminUser };