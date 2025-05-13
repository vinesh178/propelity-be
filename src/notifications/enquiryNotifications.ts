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
    console.log('NOTIFICATION: Starting handleNewEnquiryNotification for enquiry:', enquiryId);
    
    // Fetch the enquiry data once
    const enquiryData = await fetchEnquiryWithUserData(enquiryId);
    
    if (!enquiryData) {
      console.error(`Failed to fetch data for enquiry ${enquiryId}`);
      return;
    }
    
    console.log('NOTIFICATION: Enquiry data fetched successfully:', JSON.stringify({
      id: enquiryData.id,
      service_type: enquiryData.service_type,
      user_id: enquiryData.user_id,
      has_user: !!enquiryData.user
    }));
    
    // Send Slack notification
    const slackSuccess = await notifySlackAboutEnquiry(enquiryData);
    if (slackSuccess) {
      console.log(`Successfully notified Slack about enquiry ${enquiryId}`);
    } else {
      console.error(`Failed to notify Slack about enquiry ${enquiryId}`);
    }
    
    // Send email notification
    console.log('NOTIFICATION: Preparing data for email notification');
    
    // Ensure all required data is present for the email
    const emailData = {
      id: enquiryData.id,
      service_type: enquiryData.service_type,
      budget_range: enquiryData.budget_range || 'Not specified',
      additional_info: enquiryData.additional_info || '',
      // Use both direct fields and user fields to ensure maximum compatibility
      first_name: enquiryData.user?.first_name || '',
      last_name: enquiryData.user?.last_name || '',
      email: enquiryData.user?.email || '', // Primary email source from user
      phone: enquiryData.user?.phone || '',
      // Keep the user object for backward compatibility
      user: enquiryData.user
    };
    
    console.log('NOTIFICATION: Email data prepared:', JSON.stringify({
      id: emailData.id,
      email: emailData.email,
      user_email: emailData.user?.email,
      first_name: emailData.first_name,
      service_type: emailData.service_type,
      has_required_fields: !!(emailData.service_type && emailData.budget_range)
    }));
    
    // If no email is available directly, try to extract it from other sources
    if (!emailData.email && !emailData.user?.email) {
      console.error('NOTIFICATION: No email address found in enquiry data');
      
      // Try to fetch a valid email from the database if needed
      if (enquiryData.user_id) {
        console.log('NOTIFICATION: Attempting to fetch user email from user_id:', enquiryData.user_id);
        const { data: userData, error } = await supabase
          .from('propelity_users')
          .select('email')
          .eq('id', enquiryData.user_id)
          .single();
          
        if (userData?.email) {
          console.log('NOTIFICATION: Found user email from database lookup:', userData.email);
          emailData.email = userData.email;
        } else {
          console.error('NOTIFICATION: Could not find user email in database:', error?.message || 'No user found');
        }
      }
    }
    
    // Final check before sending email
    if (!emailData.email && !emailData.user?.email) {
      console.error('NOTIFICATION: Cannot send email notification - no valid email address found');
      return;
    }
    
    try {
      console.log('NOTIFICATION: Calling notifyUserAboutEnquiry');
      const emailSuccess = await notifyUserAboutEnquiry(emailData);
      console.log('NOTIFICATION: notifyUserAboutEnquiry returned:', emailSuccess);
      
      if (emailSuccess) {
        console.log(`Successfully sent email notification for enquiry ${enquiryId}`);
      } else {
        console.error(`Failed to send email notification for enquiry ${enquiryId}`);
      }
    } catch (emailError) {
      console.error('NOTIFICATION ERROR: Exception when sending email notification:', emailError);
    }
  } catch (error) {
    console.error('Error in handleNewEnquiryNotification:', error);
  }
}