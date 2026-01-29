#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const migrationPath = path.join(__dirname, 'add-individual-sheet-files.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded:');
    console.log(migrationSQL);

    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Result:', data);

    console.log('🔍 Verifying column was added...');
    const { data: testData, error: testError } = await supabase
      .from('games')
      .select('individual_sheet_files')
      .limit(1);
    
    if (testError) {
      console.error('❌ Column verification failed:', testError);
    } else {
      console.log('✅ Column verification successful!');
      console.log('🎯 individual_sheet_files column is now available');
    }
    
  } catch (error) {
    console.error('💥 Migration error:', error);
    process.exit(1);
  }
}

runMigration();