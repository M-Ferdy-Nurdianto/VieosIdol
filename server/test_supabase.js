const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('members').select('*').limit(1);
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Data:', data);
        }
    } catch (e) {
        console.error('Crash:', e);
    }
}

test();
