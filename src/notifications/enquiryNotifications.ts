import { supabase } from '../supabase/supabaseClient';
import { sendEnquiryNotificationToSlack } from './slackWebhook';

// Define interfaces based on the actual database schema for notification purposes only
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  issubscribed: boolean;
  isAdmin: boolean;
}

interface EnquiryWithUser {
  id: string;
  additional_info: string | null;
  budget_range: string;
  created_at: string;
  user_id: string;
  recaptcha_token: string | null;
  service_type: string;
  user?: User;
}

/**
 * Fetches an enquiry with its associated user data and sends a Slack notification
 * @param {string} enquiryId - The ID of the enquiry to fetch and notify about
 * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise
 */
export async function notifySlackAboutEnquiry(enquiryId: string): Promise<boolean> {
  console.log(`Fetching enquiry with ID ${enquiryId} for Slack notification...`);
  
  try {
    // Fetch the enquiry with user data
    const { data, error } = await supabase
      .from('enquiries')
      .select(`
        *,
        user:propelity_users(*)
      `)
      .eq('id', enquiryId)
      .single();
    
    if (error) {
      console.error(`Error fetching enquiry with ID ${enquiryId}:`, error);
      return false;
    }
    
    if (!data) {
      console.error(`No enquiry found with ID ${enquiryId}`);
      return false;
    }
    
    // Send notification to Slack
    const notificationSent = await sendEnquiryNotificationToSlack(data as EnquiryWithUser);
    
    if (notificationSent) {
      console.log('Slack notification sent successfully');
      return true;
    } else {
      console.warn('Failed to send Slack notification');
      return false;
    }
  } catch (err) {
    console.error('Exception when sending Slack notification:', err);
    return false;
  }
}

/**
 * Listens for new enquiries and sends Slack notifications
 * This function can be called after a new enquiry is created
 * @param {string} enquiryId - The ID of the newly created enquiry
 */
export async function handleNewEnquiryNotification(enquiryId: string): Promise<void> {
  try {
    const success = await notifySlackAboutEnquiry(enquiryId);
    if (success) {
      console.log(`Successfully notified Slack about enquiry ${enquiryId}`);
    } else {
      console.error(`Failed to notify Slack about enquiry ${enquiryId}`);
    }
  } catch (error) {
    console.error('Error in handleNewEnquiryNotification:', error);
  }
}