import { supabase } from '../supabase/supabaseClient';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define interfaces based on the actual database schema for notification purposes only
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface EnquiryWithUser {
  id: string;
  additional_info: string | null;
  budget_range: string;
  created_at: string;
  user_id: string;
  service_type: string;
  user?: User;
  state?: string
}

/**
 * Creates and returns a configured nodemailer transporter for Zoho Mail
 * @returns {nodemailer.Transporter} Configured nodemailer transporter
 */
function createZohoMailTransporter() {
  // Zoho Mail SMTP configuration
  return nodemailer.createTransport({
    host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.ZOHO_MAIL_PORT || '465'), // Changed default to 465 (SSL)
    secure: process.env.ZOHO_MAIL_SECURE !== 'false', // Default to true for secure connection
    auth: {
      user: process.env.ZOHO_MAIL_USER, // Your Zoho email address
      pass: process.env.ZOHO_MAIL_PASSWORD, // Your Zoho email password or app-specific password
    },
    // Add timeout options to prevent premature socket close
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 30000, // 30 seconds
    debug: true, // Enable debug output
    logger: true, // Log information to console
  });
}

/**
 * Sends an email notification about a new enquiry
 * @param {EnquiryWithUser} enquiryData - The enquiry data with user information
 * @returns {Promise<boolean>} True if the email was sent successfully, false otherwise
 */
async function sendEnquiryNotificationByEmail(enquiryData: EnquiryWithUser): Promise<boolean> {
  try {
    // Create a transporter using Zoho Mail configuration
    const transporter = createZohoMailTransporter();

    // Format user information
    const userName = enquiryData.user 
      ? `${enquiryData.user.first_name} ${enquiryData.user.last_name}` 
      : 'Unknown User';
    
    const userEmail = enquiryData.user?.email || 'Not provided';
    const userPhone = enquiryData.user?.phone || 'Not provided';

    // Format the email content
    const emailContent = `
      <h1>New Enquiry Received</h1>
      <p><strong>Enquiry ID:</strong> ${enquiryData.id}</p>
      <p><strong>Service Type:</strong> ${enquiryData.service_type}</p>
      <p><strong>Budget Range:</strong> ${enquiryData.budget_range}</p>
      <p><strong>State:</strong> ${enquiryData.state || 'Not provided'}</p>       
      <p><strong>Additional Information:</strong> ${enquiryData.additional_info || 'None provided'}</p>
      <h2>User Information</h2>
      <p><strong>Name:</strong> ${userName}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Phone:</strong> ${userPhone}</p>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER, // Use the configured sender or fall back to the auth user
      to: 'vineshkkmr@gmail.com',
      subject: 'New enquiry',
      html: emailContent,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Fetches an enquiry with its associated user data and sends an email notification
 * @param {string} enquiryId - The ID of the enquiry to fetch and notify about
 * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise
 */
export async function notifyEmailAboutEnquiry(enquiryId: string): Promise<boolean> {
  console.log(`Fetching enquiry with ID ${enquiryId} for email notification...`);
  
  try {
    // Fetch the enquiry with user data using the correct table name
    const { data: enquiryData, error: enquiryError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', enquiryId)
      .single();
    
    if (enquiryError) {
      console.error(`Error fetching enquiry with ID ${enquiryId}:`, enquiryError);
      return false;
    }
    
    if (!enquiryData) {
      console.error(`No enquiry found with ID ${enquiryId}`);
      return false;
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
    
    // Send notification by email
    const notificationSent = await sendEnquiryNotificationByEmail(combinedData);
    
    if (notificationSent) {
      console.log('Email notification sent successfully');
      return true;
    } else {
      console.warn('Failed to send email notification');
      return false;
    }
  } catch (err: any) {
    console.error('Exception when sending email notification:', err);
    return false;
  }
}

/**
 * Listens for new enquiries and sends email notifications
 * This function can be called after a new enquiry is created
 * @param {string} enquiryId - The ID of the newly created enquiry
 */
export async function handleNewEnquiryEmailNotification(enquiryId: string): Promise<void> {
  try {
    const success = await notifyEmailAboutEnquiry(enquiryId);
    if (success) {
      console.log(`Successfully sent email notification about enquiry ${enquiryId}`);
    } else {
      console.error(`Failed to send email notification about enquiry ${enquiryId}`);
    }
  } catch (error: any) {
    console.error('Error in handleNewEnquiryEmailNotification:', error);
  }
}