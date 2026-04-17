const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No members found in table.');
      return;
    }

    console.log('--- Sample Member (Keys) ---');
    console.log(Object.keys(data[0]));
    console.log('--- Sample Member (Values) ---');
    console.log(JSON.stringify(data[0], null, 2));

    const maru = data.find(m => m.nickname === 'Maru');
    if (maru) {
        console.log('--- MARU Found ---');
        console.log(JSON.stringify(maru, null, 2));
    } else {
        console.log('--- MARU Not Found ---');
    }
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

checkMembers();
