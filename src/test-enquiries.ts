import { getAllEnquiries, debugSupabaseConnection } from './enquiries';
import { supabase } from './supabase/supabaseClient';

// Function to test direct query to the database
async function testDirectQuery() {
  console.log('\n=== Testing Direct Query to Inquiries Table ===');
  try {
    const { data, error, count } = await supabase
      .from('enquiries')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error with direct query:', error);
      
      // Check for specific permission errors
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('PERMISSION DENIED: The service role key does not have access to the inquiries table.');
        console.error('Please check that:');
        console.error('1. You have added the correct service role key in the .env file');
        console.error('2. The inquiries table exists in your Supabase project');
        console.error('3. The service role has the necessary permissions to access this table');
      }
      
      return { success: false, error };
    }
    
    console.log(`Direct query successful. Found ${count} records.`);
    if (data && data.length > 0) {
      console.log('First record from direct query:', data[0]);
    }
    return { success: true, count, data };
  } catch (err) {
    console.error('Exception during direct query:', err);
    return { success: false, error: err };
  }
}

// Function to check if the table exists
async function checkTableExists() {
  console.log('\n=== Checking if Inquiries Table Exists ===');
  try {
    // Query the information schema to check if the table exists
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'enquiries');
    
    if (error) {
      console.error('Error checking if table exists:', error);
      return { exists: false, error };
    }
    
    const exists = data && data.length > 0;
    console.log(`Table 'enquiries' ${exists ? 'exists' : 'does not exist'} in the database.`);
    return { exists, error: null };
  } catch (err) {
    console.error('Exception checking if table exists:', err);
    return { exists: false, error: err };
  }
}

// Main test function
async function runTests() {
  console.log('Starting enquiries test...');
  
  try {
    // First, debug the Supabase connection
    console.log('\n=== Testing Supabase Connection ===');
    const debugResult = await debugSupabaseConnection();
    console.log('Debug result:', debugResult);
    
    // Check if the table exists
    const tableCheck = await checkTableExists();
    
    // Try a direct query to the database
    const directQueryResult = await testDirectQuery();
    
    // Then, try to fetch all enquiries using the getAllEnquiries function
    console.log('\n=== Fetching All Enquiries ===');
    const { data, error } = await getAllEnquiries();
    
    if (error) {
      console.error('Error fetching enquiries:', error);
    } else if (data && data.length > 0) {
      console.log(`Successfully fetched ${data.length} enquiries`);
      console.log('First 3 enquiries:');
      data.slice(0, 3).forEach((enquiry, index) => {
        console.log(`\nEnquiry ${index + 1}:`);
        console.log(`ID: ${enquiry.id}`);
        console.log(`Name: ${enquiry.first_name} ${enquiry.last_name}`);
        console.log(`Email: ${enquiry.email}`);
        console.log(`Created: ${enquiry.created_at}`);
      });
    } else {
      console.log('No enquiries found in the database');
    }
    
    console.log('\nTest completed.');
  } catch (err) {
    console.error('Unhandled error in test function:', err);
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Fatal error in test script:', err);
});