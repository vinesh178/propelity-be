import { handleNewEnquiryNotification } from './notifications/enquiryNotifications';

/**
 * Test function to directly trigger a Slack notification for an existing enquiry
 */
async function testNotification() {
  // Replace with an actual enquiry ID from your database
  const enquiryId = 'YOUR_ENQUIRY_ID';
  
  console.log(`Testing notification for enquiry ID: ${enquiryId}`);
  
  try {
    await handleNewEnquiryNotification(enquiryId);
    console.log('Notification process completed');
  } catch (err) {
    console.error('Exception during notification test:', err);
  }
}

// Uncomment to run the test
// testNotification();