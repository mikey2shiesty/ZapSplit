const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnect() {
  console.log('Testing create-connect-account...');
  
  const { data, error } = await supabase.functions.invoke('create-connect-account', {
    body: {
      userId: 'test-user-id',
      email: 'test@example.com'
    }
  });
  
  console.log('Response data:', JSON.stringify(data, null, 2));
  console.log('Response error:', JSON.stringify(error, null, 2));
}

testConnect();
