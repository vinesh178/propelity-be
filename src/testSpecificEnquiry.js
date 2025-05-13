const dotenv = require('dotenv');
const path = require('path');
require('ts-node').register();

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import the notification handler 
const { handleNewEnquiryNotification } = require('./notifications/enquiryNotifications');

// Enquiry ID from the logs
const enquiryId = '208c7632-898d-4eed-bb1c-e145f100ef5f';

async function testSpecificEnquiry() {
  console.log(`Testing notification for specific enquiry ID: ${enquiryId}`);
  
  try {
    // Call the notification handler
    await handleNewEnquiryNotification(enquiryId);
    console.log('Notification handler completed');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testSpecificEnquiry().catch(console.error); 