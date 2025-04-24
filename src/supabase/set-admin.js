const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = '';
const serviceRoleKey = '';
const userId = 'c2a85125-53a7-4b80-b14c-f9bd301d6600'; // Your user's ID

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateUserMetadata() {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { isAdmin: true }
  });
  if (error) {
    console.error('Error updating user metadata:', error);
  } else {
    console.log('User metadata updated:', data);
  }
}

updateUserMetadata();