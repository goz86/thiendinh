import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rhsntjttypfceqloyezb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc250anR0eXBmY2VxbG95ZXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Nzk5ODAsImV4cCI6MjA5MTA1NTk4MH0.ymjgK8NuEdwnh7_HWbQZ-wPTTPpXvICSWv3uH7BtOFU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('meditation_sessions').select('*').limit(2);
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
