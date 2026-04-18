const supabase = require('./server/supabaseClient');

async function testSettings() {
    try {
        console.log('Testing Supabase settings table...');
        console.log('Using URL:', process.env.SUPABASE_URL);
        
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Error fetching settings:', error);
            if (error.message.includes('relation "settings" does not exist')) {
                console.log('HINT: Table "settings" is missing!');
            }
        } else {
            console.log('Settings data:', data);
        }
    } catch (err) {
        console.error('Crash testing settings:', err);
    }
}

testSettings();
