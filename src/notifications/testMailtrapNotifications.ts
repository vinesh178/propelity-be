import dotenv from 'dotenv';
import { handleNewEnquiryEmailNotification } from './mailtrapNotifications';

// Load environment variables
dotenv.config();

/**
 * Test function to simulate a new enquiry and send a test email notification using Mailtrap
 * This can be run directly to test the email notification system
 */
async function testMailtrapNotification() {
  console.log('Starting Mailtrap email notification test...');
  
  // Check if required environment variables are set
  const requiredVars = [
    'MAILTRAP_API_TOKEN',
    'SEND_TEST_MAIL_TO'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please add these variables to your .env file and try again.');
    return;
  }
  
  try {
    // Create a test enquiry object
    const testEnquiry = {
      id: 'test-enquiry-id',
      first_name: 'Test',
      last_name: 'User',
      email: process.env.SEND_TEST_MAIL_TO,
      phone: '0400123456',
      service_type: 'buyer_agent',
      budget_range: '$5,000 - $10,000',
      additional_info: 'This is a test enquiry for Mailtrap',
      user: {
        first_name: 'Test',
        last_name: 'User',
        email: process.env.SEND_TEST_MAIL_TO
      }
    };
    
    console.log('Testing Mailtrap email notification with test enquiry data:');
    console.log(JSON.stringify(testEnquiry, null, 2));
    
    // Call the notification handler with the test enquiry
    await handleNewEnquiryEmailNotification(testEnquiry);
    
    console.log('Test completed. Check your Mailtrap inbox for the test email.');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Execute the test function if this file is run directly
if (require.main === module) {
  testMailtrapNotification()
    .then(() => {
      console.log('Test script execution completed.');
    })
    .catch(err => {
      console.error('Unhandled error in test script:', err);
      process.exit(1);
    });
}

// Export the test function so it can be imported and used elsewhere if needed
export { testMailtrapNotification }; 