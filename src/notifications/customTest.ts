import dotenv from 'dotenv';
import { handleNewEnquiryEmailNotification } from './mailNotifications';

// Load environment variables
dotenv.config();

/**
 * Custom test function with your specific enquiry data
 */
async function customEmailTest() {
  console.log('Starting custom email notification test...');
  
  try {
    // Create a custom enquiry object with your test data
    const customEnquiry = {
      id: 'custom-test-id',
      first_name: 'John',
      last_name: 'Doe',
      email: process.env.TEST_EMAIL || 'vineshk83@gmail.com', // Replace with your email or use TEST_EMAIL env var
      phone: '0412345678',
      service_type: 'Web Development',
      budget_range: '$10,000 - $20,000',
      additional_info: 'I need a responsive website for my business',
      state: 'VIC'
    };
    
    console.log('Testing email notification with custom enquiry data');
    console.log(JSON.stringify(customEnquiry, null, 2));
    
    // Send the notification
    await handleNewEnquiryEmailNotification(customEnquiry);
    
    console.log('Test completed. Check your email inbox.');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
customEmailTest()
  .then(() => {
    console.log('Custom test completed.');
  })
  .catch(err => {
    console.error('Unhandled error in custom test:', err);
    process.exit(1);
  });