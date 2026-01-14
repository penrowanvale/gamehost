const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Track missing environment variables (don't crash serverless function)
const missingEnvVars = [];

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is required in environment variables');
  missingEnvVars.push('SUPABASE_URL');
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in environment variables');
  missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY');
}

if (!supabaseAnonKey) {
  console.error('❌ SUPABASE_ANON_KEY is required in environment variables');
  missingEnvVars.push('SUPABASE_ANON_KEY');
}

// Create clients only if all required variables are present
let supabaseAdmin = null;
let supabase = null;

if (missingEnvVars.length === 0) {
  console.log('✅ Supabase configuration loaded successfully');
  // Admin client with service role key
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  // Public client with anon key
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error('⚠️ Supabase not initialized - missing environment variables:', missingEnvVars.join(', '));
  console.error('📖 Please configure these in your Vercel Environment Variables');
  
  // Create mock clients that return helpful errors
  const mockClient = {
    from: () => ({
      select: () => Promise.reject(new Error(`Database not configured. Missing: ${missingEnvVars.join(', ')}`)),
      insert: () => Promise.reject(new Error(`Database not configured. Missing: ${missingEnvVars.join(', ')}`)),
      update: () => Promise.reject(new Error(`Database not configured. Missing: ${missingEnvVars.join(', ')}`)),
      delete: () => Promise.reject(new Error(`Database not configured. Missing: ${missingEnvVars.join(', ')}`)),
    })
  };
  supabaseAdmin = mockClient;
  supabase = mockClient;
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured: missingEnvVars.length === 0,
  missingEnvVars
};