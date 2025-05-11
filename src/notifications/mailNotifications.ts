import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { loadTemplate, EnquiryReceivedTemplateData } from './templates/templateLoader';

// Load environment variables
dotenv.config();

// Define a simple interface for enquiry data
interface EnquiryData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  service_type: string;
  budget_range: string;
  additional_info?: string | null;
  state?: string;
  // For backward compatibility with existing code
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

/**
 * Creates and returns a configured nodemailer transporter for Zoho Mail
 * @returns {nodemailer.Transporter} Configured nodemailer transporter
 */
function createZohoMailTransporter() {
  // Zoho Mail SMTP configuration
  console.log('Creating mail transporter with:');
  console.log(`Host: ${process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com'}`);
  console.log(`Port: ${process.env.ZOHO_MAIL_PORT || '465'}`);
  console.log(`Secure: ${process.env.ZOHO_MAIL_SECURE !== 'false'}`);
  console.log(`User: ${process.env.ZOHO_MAIL_USER}`);
  
  return nodemailer.createTransport({
    host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
    secure: process.env.ZOHO_MAIL_SECURE !== 'false', // Default to true for secure connection
    auth: {
      user: process.env.ZOHO_MAIL_USER, // Your Zoho email address
      pass: process.env.ZOHO_MAIL_PASSWORD, // Your Zoho email password or app-specific password
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 30000, // 30 seconds
    debug: true, // Enable debug output
    logger: true, // Log information to console
  });
}

/**
 * Sends a confirmation email to the user who submitted the enquiry
 * @param {EnquiryData} enquiryData - The enquiry data
 * @returns {Promise<boolean>} True if the email was sent successfully, false otherwise
 */
async function sendUserConfirmationEmail(enquiryData: EnquiryData): Promise<boolean> {
  try {
    // Get email from either the root object or nested user object
    const email = enquiryData.email || enquiryData.user?.email;
    const firstName = enquiryData.first_name || enquiryData.user?.first_name || 'Valued Customer';
    
    if (!email) {
      console.warn('Cannot send confirmation email: No email address available');
      return false;
    }

    // Create a transporter using Zoho Mail configuration
    const transporter = createZohoMailTransporter();

    // Prepare template data
    const templateData: EnquiryReceivedTemplateData = {
      firstName: firstName,
      serviceType: enquiryData.service_type,
      budgetRange: enquiryData.budget_range,
      additionalInfo: enquiryData.additional_info || 'None provided'
    };

    // Load and process the template
    const emailContent = loadTemplate('enquiryReceived', templateData);

    // Send the email
    const info = await transporter.sendMail({
      from: `"Propelity" <${process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER}>`,
      to: email,
      subject: 'Your Enquiry Has Been Received',
      html: emailContent,
      headers: {
        'X-Entity-Ref-ID': enquiryData.id, // Helps with email threading and tracking
        'List-Unsubscribe': '<mailto:unsubscribe@propelity.com.au>', // Good practice for deliverability
      },
      priority: 'high', // Mark as important
      replyTo: 'support@propelity.com.au', // Provide a proper reply-to address
    });

    console.log(`User confirmation email sent successfully: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('Error sending user confirmation email:', error);
    return false;
  }
}

/**
 * Sends a confirmation email to the user who submitted the enquiry
 * @param {EnquiryData} enquiryData - The enquiry data
 * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise
 */
export async function notifyUserAboutEnquiry(enquiryData: EnquiryData): Promise<boolean> {
  console.log('Sending confirmation email to user...');
  
  try {
    // Send confirmation email directly using the provided enquiry data
    const notificationSent = await sendUserConfirmationEmail(enquiryData);
    
    if (notificationSent) {
      console.log('User confirmation email sent successfully');
      return true;
    } else {
      console.warn('Failed to send user confirmation email');
      return false;
    }
  } catch (err: any) {
    console.error('Exception when sending user confirmation email:', err);
    return false;
  }
}

/**
 * Handles sending a confirmation email for a new enquiry
 * This function can be called directly with enquiry data
 * @param {EnquiryData} enquiryData - The enquiry data
 */
export async function handleNewEnquiryEmailNotification(enquiryData: EnquiryData): Promise<void> {
  try {
    const success = await notifyUserAboutEnquiry(enquiryData);
    if (success) {
      console.log(`Successfully sent user confirmation email for enquiry ${enquiryData.id}`);
    } else {
      console.error(`Failed to send user confirmation email for enquiry ${enquiryData.id}`);
    }
  } catch (error: any) {
    console.error('Error in handleNewEnquiryEmailNotification:', error);
  }
}