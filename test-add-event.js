require('dotenv').config({ path: __dirname + '/server/.env' });
const { createClient } = require('./server/node_modules/@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddEvent() {
    console.log("Testing Supabase connection adding an event...");
    const payload = {
        name: "Test Event",
        type: "regular",
        event_date: "2024-12-12",
        event_time: "19:00",
        location: "Test Location",
        status: "ongoing",
        po_deadline: null,
        theme: "",
        lineup: ["GROUP"],
        available_members: ["GROUP"],
        special_prices: null
    };

    const { data, error } = await supabase
        .from('events')
        .insert(payload)
        .select()
        .single();
    
    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS:", data);
    }
}

testAddEvent();
