// Quick script to check for profiles with whiteboards
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, name, show_whiteboard, whiteboard_data')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Profiles:');
  data.forEach(profile => {
    console.log(`- ${profile.name || 'No name'} (${profile.username || 'no-username'})`);
    console.log(`  ID: ${profile.id}`);
    console.log(`  Has whiteboard: ${!!profile.whiteboard_data}`);
    console.log(`  Show whiteboard: ${profile.show_whiteboard}`);
    console.log(`  URL: /profile/${profile.id} or /p/${profile.username}`);
    console.log('');
  });
}

checkProfiles();
