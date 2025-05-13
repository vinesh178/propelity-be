import dotenv from 'dotenv';
import { supabase } from '../supabase/supabaseClient';
import { handleNewEnquiryEmailNotification } from './mailNotifications';

// Load environment variables
dotenv.config();

/**
 * Creates a mock enquiry in the database for testing purposes
 * @returns {Promise<string|null>} The ID of the created enquiry, or null if creation failed
 */
async function createMockEnquiry() {
  console.log('Creating a mock enquiry for testing...');
  
  try {
    // First, check if we need to create a test user
    let userId = process.env.TEST_USER_ID;
    
    if (!userId) {
      // Create a test user if no test user ID is provided
      const { data: userData, error: userError } = await supabase
        .from('propelity_users')
        .insert([
          {
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            phone: '0400000000',
            issubscribed: false,
            isAdmin: false
          }
        ])
        .select()
        .single();
      
      if (userError) {
        console.error('Error creating test user:', userError);
        return null;
      }
      
      userId = userData.id;
      console.log(`Created test user with ID: ${userId}`);
    }
    
    // Now create a test enquiry
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiries')
      .insert([
        {
          user_id: userId,
          service_type: 'Test Service',
          budget_range: '$1,000 - $5,000',
          additional_info: 'This is a test enquiry created for email notification testing.',
          recaptcha_token: null
        }
      ])
      .select()
      .single();
    
    if (enquiryError) {
      console.error('Error creating test enquiry:', enquiryError);
      return null;
    }
    
    console.log(`Created test enquiry with ID: ${enquiryData.id}`);
    return enquiryData.id;
  } catch (error) {
    console.error('Exception when creating mock data:', error);
    return null;
  }
}

/**
 * Comprehensive test function that creates a mock enquiry and tests the email notification
 */
async function runComprehensiveTest() {
  console.log('Starting comprehensive email notification test...');
  
  // Check if required environment variables are set
  const requiredVars = [
    'ZOHO_MAIL_HOST',
    'ZOHO_MAIL_PORT',
    'ZOHO_MAIL_USER',
    'ZOHO_MAIL_PASSWORD'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please add these variables to your .env file and try again.');
    return;
  }
  
  try {
    // Determine which enquiry ID to use
    let enquiryId = process.env.TEST_ENQUIRY_ID;
    
    if (!enquiryId) {
      console.log('No TEST_ENQUIRY_ID found in environment variables. Creating a mock enquiry...');
      enquiryId = await createMockEnquiry();
      
      if (!enquiryId) {
        console.error('Failed to create mock enquiry. Test aborted.');
        return;
      }
    }
    
    console.log(`Testing email notification with enquiry ID: ${enquiryId}`);
    
    // Call the notification handler
    await handleNewEnquiryEmailNotification(enquiryId);
    
    console.log('Test completed. Check the console output above for results.');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Execute the test function if this file is run directly
if (require.main === module) {
  runComprehensiveTest()
    .then(() => {
      console.log('Test script execution completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Unhandled error in test script:', err);
      process.exit(1);
    });
}

// Export the test functions so they can be imported and used elsewhere if needed
export { createMockEnquiry, runComprehensiveTest };