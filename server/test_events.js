const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('events').select('*').limit(1);
        if (error) {
            console.error('Supabase Error (events):', error);
        } else {
            console.log('Success! Events Data:', data);
        }
    } catch (e) {
        console.error('Crash:', e);
    }
}

test();
