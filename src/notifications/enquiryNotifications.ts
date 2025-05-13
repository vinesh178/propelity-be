import { supabase } from '../supabase/supabaseClient';
import { sendEnquiryNotificationToSlack } from './slackWebhook';
import { notifyUserAboutEnquiry } from './mailNotifications';

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
 * Fetches an enquiry with its associated user data
 * @param {string} enquiryId - The ID of the enquiry to fetch
 * @returns {Promise<EnquiryWithUser | null>} The enquiry data with user data, or null if not found
 */
export async function fetchEnquiryWithUserData(enquiryId: string): Promise<EnquiryWithUser | null> {
  console.log(`Fetching enquiry with ID ${enquiryId}...`);
  
  try {
    // Fetch the enquiry with user data using the correct table name
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', enquiryId)
      .single();
    
    if (enquiryError) {
      console.error(`Error fetching enquiry with ID ${enquiryId}:`, enquiryError);
      return null;
    }
    
    if (!enquiryData) {
      console.error(`No enquiry found with ID ${enquiryId}`);
      return null;
    }
    
    console.log(`Found enquiry data:`, JSON.stringify(enquiryData, null, 2));
    
    // If there's a user_id, fetch the user separately
    let userData = null;
    if (enquiryData.user_id) {
      console.log(`Fetching user data for user ID: ${enquiryData.user_id}`);
      const { data: user, error: userError } = await supabase
        .from('propelity_users') // Using the correct table name 'propelity_users'
        .select('*')
        .eq('id', enquiryData.user_id)
        .single();
      
      if (userError) {
        console.warn(`Error fetching user with ID ${enquiryData.user_id}:`, userError);
        // Continue without user data
      } else {
        userData = user;
        console.log(`Found user data:`, JSON.stringify(userData, null, 2));
      }
    } else {
      console.log(`No user_id found in enquiry data`);
    }
    
    // Combine the data
    const combinedData: EnquiryWithUser = {
      ...enquiryData,
      user: userData
    };
    
    return combinedData;
  } catch (err) {
    console.error('Exception when fetching enquiry data:', err);
    return null;
  }
}

/**
 * Sends a Slack notification about an enquiry
 * @param {EnquiryWithUser} enquiryData - The enquiry data with user information
 * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise
 */
export async function notifySlackAboutEnquiry(enquiryData: EnquiryWithUser): Promise<boolean> {
  try {
    // Send notification to Slack
    const notificationSent = await sendEnquiryNotificationToSlack(enquiryData);
    
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
 * Listens for new enquiries and sends Slack and email notifications
 * This function can be called after a new enquiry is created
 * @param {string} enquiryId - The ID of the newly created enquiry
 */
export async function handleNewEnquiryNotification(enquiryId: string): Promise<void> {
  try {
    // Fetch the enquiry data once
    const enquiryData = await fetchEnquiryWithUserData(enquiryId);
    
    if (!enquiryData) {
      console.error(`Failed to fetch data for enquiry ${enquiryId}`);
      return;
    }
    
    // Send Slack notification
    const slackSuccess = await notifySlackAboutEnquiry(enquiryData);
    if (slackSuccess) {
      console.log(`Successfully notified Slack about enquiry ${enquiryId}`);
    } else {
      console.error(`Failed to notify Slack about enquiry ${enquiryId}`);
    }
    
    // Send email notification
    console.log('About to send email notification with data:', JSON.stringify({
      id: enquiryData.id,
      email: enquiryData.user?.email || 'No email found',
      service_type: enquiryData.service_type
    }));
    
    // Format the data for email notification
    const emailData = {
      ...enquiryData,
      // Add these fields at the root level if they exist in the user object
      first_name: enquiryData.user?.first_name,
      last_name: enquiryData.user?.last_name,
      email: enquiryData.user?.email,
      phone: enquiryData.user?.phone
    };
    
    const emailSuccess = await notifyUserAboutEnquiry(emailData);
    if (emailSuccess) {
      console.log(`Successfully sent email notification for enquiry ${enquiryId}`);
    } else {
      console.error(`Failed to send email notification for enquiry ${enquiryId}`);
    }
  } catch (error) {
    console.error('Error in handleNewEnquiryNotification:', error);
  }
}