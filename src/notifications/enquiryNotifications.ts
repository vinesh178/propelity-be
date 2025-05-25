import { supabase } from '../supabase/supabaseClient';
import { sendEnquiryNotificationToSlack } from './slackWebhook';
import { handleNewEnquiryEmailNotification } from './mailtrapNotifications';

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
 * @returns {Promise<{success: boolean, data?: EnquiryWithUser}>} Object containing success status and enquiry data
 */
export async function notifySlackAboutEnquiry(enquiryId: string): Promise<{success: boolean, data?: EnquiryWithUser}> {
  console.log(`Fetching enquiry with ID ${enquiryId} for Slack notification...`);
  
  try {
    // Fetch the enquiry with user data using the correct table name
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', enquiryId)
      .single();
    
    if (enquiryError) {
      console.error(`Error fetching enquiry with ID ${enquiryId}:`, enquiryError);
      return { success: false };
    }
    
    if (!enquiryData) {
      console.error(`No enquiry found with ID ${enquiryId}`);
      return { success: false };
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
    
    // Send notification to Slack
    const notificationSent = await sendEnquiryNotificationToSlack(combinedData);
    
    if (notificationSent) {
      console.log('Slack notification sent successfully');
      return { success: true, data: combinedData };
    } else {
      console.warn('Failed to send Slack notification');
      return { success: false, data: combinedData };
    }
  } catch (err) {
    console.error('Exception when sending Slack notification:', err);
    return { success: false };
  }
}

/**
 * Listens for new enquiries and sends Slack notifications
 * This function can be called after a new enquiry is created
 * @param {string} enquiryId - The ID of the newly created enquiry
 */
export async function handleNewEnquiryNotification(enquiryId: string): Promise<void> {
  try {
    // Send Slack notification to admin and get enquiry data
    const { success: slackSuccess, data: enquiryData } = await notifySlackAboutEnquiry(enquiryId);
    
    if (slackSuccess) {
      console.log(`Successfully notified Slack about enquiry ${enquiryId}`);
    } else {
      console.error(`Failed to notify Slack about enquiry ${enquiryId}`);
    }

    // If we have enquiry data, send email notification to user
    if (enquiryData) {
      await handleNewEnquiryEmailNotification(enquiryData);
    } else {
      console.error('Cannot send email notification: No enquiry data available');
    }
  } catch (error) {
    console.error('Error in handleNewEnquiryNotification:', error);
  }
}