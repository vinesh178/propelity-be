import { createEnquiry } from './enquiries';
import { supabase } from './supabase/supabaseClient';

// First, we need to create a test user or find an existing one
async function getOrCreateTestUser() {
  // Check if test user exists
  const { data: existingUser, error: searchError } = await supabase
    .from('propelity_users')
    .select('id')
    .eq('email', 'test@example.com')
    .single();
  
  if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is 'not found'
    console.error('Error searching for test user:', searchError);
    throw searchError;
  }
  
  if (existingUser) {
    console.log('Found existing test user:', existingUser.id);
    return existingUser.id;
  }
  
  // Create a new test user
  const { data: newUser, error: createError } = await supabase
    .from('propelity_users')
    .insert({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '123-456-7890',
      issubscribed: false,
      isAdmin: false
    })
    .select()
    .single();
  
  if (createError) {
    console.error('Error creating test user:', createError);
    throw createError;
  }
  
  console.log('Created new test user:', newUser.id);
  return newUser.id;
}

/**
 * Create an enquiry directly in the database with only the fields that exist in the table
 */
async function createTestEnquiryDirectly() {
  const userId = await getOrCreateTestUser();
  
  // Create the enquiry with only the fields that exist in the database table
  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      user_id: userId,
      budget_range: '$5,000 - $10,000',
      additional_info: 'This is a test enquiry to verify Slack webhook functionality.',
      service_type: 'Website Development',
      recaptcha_token: 'test-token'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating enquiry directly:', error);
    throw error;
  }
  
  console.log('Successfully created test enquiry directly:', data);
  return data;
}

/**
 * Manually send a Slack notification for the test enquiry
 */
async function sendManualSlackNotification(enquiryId: string) {
  try {
    // Fetch the enquiry data
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', enquiryId)
      .single();
      
    if (enquiryError) {
      console.error(`Error fetching enquiry ${enquiryId}:`, enquiryError);
      return false;
    }
    
    // Fetch the user data separately
    const { data: userData, error: userError } = await supabase
      .from('propelity_users')
      .select('*')
      .eq('id', enquiryData.user_id)
      .single();
      
    if (userError) {
      console.error(`Error fetching user ${enquiryData.user_id}:`, userError);
      return false;
    }
    
    // Combine the data
    const combinedData = {
      ...enquiryData,
      user: userData
    };
    
    // Import and call the Slack notification function
    const { sendEnquiryNotificationToSlack } = require('./notifications/slackWebhook');
    const success = await sendEnquiryNotificationToSlack(combinedData);
    
    if (success) {
      console.log('Successfully sent manual Slack notification');
      return true;
    } else {
      console.error('Failed to send manual Slack notification');
      return false;
    }
  } catch (err) {
    console.error('Exception when sending manual notification:', err);
    return false;
  }
}

/**
 * Test function to create an enquiry and trigger the Slack webhook
 */
async function testSlackWebhook() {
  console.log('Testing Slack webhook with a sample enquiry...');
  
  try {
    // Create the enquiry directly in the database
    const enquiryData = await createTestEnquiryDirectly();
    
    // Send a manual notification instead of using the built-in handler
    const success = await sendManualSlackNotification(enquiryData.id);
    
    if (success) {
      console.log('Test completed successfully. Check your Slack channel for the notification.');
    } else {
      console.log('Test completed but notification may not have been sent successfully.');
    }
  } catch (err) {
    console.error('Exception during test:', err);
  }
}

// Run the test
testSlackWebhook();