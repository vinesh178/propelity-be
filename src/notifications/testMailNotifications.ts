import dotenv from 'dotenv';
import { handleNewEnquiryEmailNotification } from './mailNotifications';

// Load environment variables
dotenv.config();

/**
 * Test function to simulate a new enquiry and send a test email notification
 * This can be run directly to test the email notification system
 */
async function testEmailNotification() {
  console.log('Starting email notification test...');
  
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
    // If you have a specific enquiry ID you want to test with, replace this with that ID
    // Otherwise, this will attempt to use a test ID which may not exist in your database
    const testEnquiryId = process.env.TEST_ENQUIRY_ID || 'test-enquiry-id';
    
    console.log(`Testing email notification with enquiry ID: ${testEnquiryId}`);
    
    // Call the notification handler
    await handleNewEnquiryEmailNotification(testEnquiryId);
    
    console.log('Test completed. Check the console output above for results.');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Execute the test function if this file is run directly
if (require.main === module) {
  testEmailNotification()
    .then(() => {
      console.log('Test script execution completed.');
    })
    .catch(err => {
      console.error('Unhandled error in test script:', err);
      process.exit(1);
    });
}

// Export the test function so it can be imported and used elsewhere if needed
export { testEmailNotification };