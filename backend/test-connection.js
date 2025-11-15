// Quick connection test script
// Run with: node test-connection.js

const { connectDB, getSupabase } = require('./config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    await connectDB();
    
    const supabase = getSupabase();
    
    // Test query
    console.log('🔍 Testing query...');
    const { data, error } = await supabase
      .from('bounties')
      .select('id, contract_id, accept_transaction_id, approve_transaction_id')
      .limit(1);
    
    if (error) {
      console.error('❌ Query error:', error);
      if (error.code === 'PGRST116') {
        console.log('💡 Table does not exist. Please run the SQL migration first.');
      } else if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('💡 Missing columns. Please run add_transaction_ids.sql migration.');
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Sample data:', data);
    }
    
    // Check if transaction_id columns exist
    console.log('\n🔍 Checking for transaction_id columns...');
    const { data: columns, error: colError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'bounties' 
          AND column_name LIKE '%transaction_id%'
        `
      })
      .catch(() => ({ data: null, error: { message: 'Cannot check columns directly' } }));
    
    if (!colError && columns) {
      console.log('✅ Transaction ID columns found:', columns);
    } else {
      console.log('⚠️  Could not verify columns. Please check manually in Supabase.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();

