const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const connectDB = async () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your environment variables.');
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test connection by querying a table
    const { data, error } = await supabase.from('bounties').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" - table might not be created yet
      console.warn('⚠️  Supabase connection warning:', error.message);
      console.log('📝 Note: Make sure to run the SQL migration to create the tables.');
    } else {
      console.log('✓ Database connection test successful');
    }

    console.log(`📦 Supabase Connected: ${supabaseUrl}`);
    return supabase;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    throw error;
  }
};

const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Call connectDB() first.');
  }
  return supabase;
};

module.exports = { connectDB, getSupabase };

