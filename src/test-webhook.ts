import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * This script simulates a Supabase webhook event for testing purposes
 * It sends a POST request to your webhook endpoint with a sample payload
 */
async function testWebhook() {
  const webhookUrl = process.env.WEBHOOK_TEST_URL || 'http://localhost:3000/api/webhooks/supabase';
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  
  // Create a sample webhook payload
  const payload = {
    type: 'INSERT',
    table: 'enquiries',
    schema: 'public',
    record: {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      service_type: 'Website Development',
      budget_range: '$5,000 - $10,000',
      additional_info: 'This is a test webhook event',
      user_id: 'some-user-id',  // Replace with an actual user ID from your database
      recaptcha_token: 'test-token'
    },
    old_record: null
  };
  
  console.log('Sending test webhook event to:', webhookUrl);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    // Create headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add signature if webhook secret is provided
    if (webhookSecret) {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const signature = hmac.update(JSON.stringify(payload)).digest('hex');
      headers['x-supabase-signature'] = signature;
    }
    
    // Send the request
    const response = await axios.post(webhookUrl, payload, { headers });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error sending test webhook:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testWebhook();