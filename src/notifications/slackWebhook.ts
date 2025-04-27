import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SLACK_WEBHOOK_URL = process.env.SLACK_ENQUIRIES_WEBHOOK;

if (!SLACK_WEBHOOK_URL) {
  console.error('Missing Slack webhook URL in environment variables');
  throw new Error('SLACK_ENQUIRIES_WEBHOOK must be provided in .env file');
}

// Define a generic type that can handle both the original Enquiry and our EnquiryWithUser
type EnquiryData = {
  id: string;
  created_at: string;
  service_type: string;
  budget_range: string;
  additional_info?: string | null;
  // Fields that might be directly on the object or in a nested user object
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  state?: string;
  // Or might be in a nested user object
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
};

/**
 * Formats an enquiry object into a readable message for Slack
 * @param {EnquiryData} enquiry - The enquiry data to format
 * @returns {string} A formatted string with enquiry details
 */
const formatEnquiryForSlack = (enquiry: EnquiryData): string => {
  // Determine if user data is in the root object or nested
  const firstName = enquiry.user?.first_name || enquiry.first_name || 'Unknown';
  const lastName = enquiry.user?.last_name || enquiry.last_name || 'Unknown';
  const email = enquiry.user?.email || enquiry.email || 'Not provided';
  const phone = enquiry.user?.phone || enquiry.phone || 'Not provided';
  
  return `*New Enquiry Received*\n\n` +
    `*Name:* ${firstName} ${lastName}\n` +
    `*Email:* ${email}\n` +
    `*Phone:* ${phone}\n` +
    `*Service Type:* ${enquiry.service_type}\n` +
    `*Budget Range:* ${enquiry.budget_range}\n` +
    `*Additional Info:* ${enquiry.additional_info || 'None provided'}\n` +
    `*State:* ${enquiry.state || 'Not provided'}\n` +
    `*Submitted:* ${new Date(enquiry.created_at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}\n`;
};

/**
 * Sends a notification to Slack when a new enquiry is created
 * @param {EnquiryData} enquiry - The enquiry data to send to Slack
 * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise
 */
export const sendEnquiryNotificationToSlack = async (enquiry: EnquiryData): Promise<boolean> => {
  console.log('Sending enquiry notification to Slack...');
  
  try {
    const formattedMessage = formatEnquiryForSlack(enquiry);
    
    await axios.post(SLACK_WEBHOOK_URL, {
      text: formattedMessage
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Successfully sent enquiry notification to Slack');
    return true;
  } catch (error) {
    console.error('Error sending enquiry notification to Slack:', error);
    return false;
  }
};