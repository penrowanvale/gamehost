const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is required in environment variables');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in environment variables');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ SUPABASE_ANON_KEY is required in environment variables');
  process.exit(1);
}

console.log('✅ Supabase configuration loaded successfully');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = {
  supabase,
  supabaseAdmin
};