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
  console.log('MAIL CONFIG: Creating mail transporter with:');
  console.log(`Host: ${process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com'}`);
  console.log(`Port: ${process.env.ZOHO_MAIL_PORT || '465'}`);
  console.log(`Secure: ${process.env.ZOHO_MAIL_SECURE !== 'false'}`);
  console.log(`User: ${process.env.ZOHO_MAIL_USER}`);  console.log(`Password set: ${process.env.ZOHO_MAIL_PASSWORD ? 'Yes' : 'No'}`);  
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
    console.log('DEBUG: Starting sendUserConfirmationEmail');
    console.log('DEBUG: Full enquiry data:', JSON.stringify(enquiryData, null, 2));
    
    // Validate required fields for the email
    if (!enquiryData.id) {
      console.error('DEBUG: Cannot send email - missing enquiry ID');
      return false;
    }
    
    if (!enquiryData.service_type) {
      console.error('DEBUG: Cannot send email - missing service_type');
      return false;
    }
    
    if (!enquiryData.budget_range) {
      console.error('DEBUG: Cannot send email - missing budget_range');
      return false;
    }
    
    // Get email from either the root object or nested user object
    const email = enquiryData.email || enquiryData.user?.email;
    const firstName = enquiryData.first_name || enquiryData.user?.first_name || 'Valued Customer';
    
    console.log('DEBUG: Extracted email:', email);
    console.log('DEBUG: Extracted firstName:', firstName);
    
    if (!email) {
      console.warn('Cannot send confirmation email: No email address available');
      return false;
    }
    
    console.log('DEBUG: Creating mail transporter...');
    const transporter = createZohoMailTransporter();
    console.log('DEBUG: Mail transporter created successfully');

    // Prepare template data with formatted service type
    let formattedServiceType = enquiryData.service_type;
    
    // Convert service_type to human-readable format
    switch(enquiryData.service_type) {
      case 'both':
        formattedServiceType = 'Buyer Agent and Mortgage Broker Services';
        break;
      case 'buyer_agent':
        formattedServiceType = 'Buyer Agent Services';
        break;
      case 'mortgage_broker':
        formattedServiceType = 'Mortgage Broker Services';
        break;
      default:
        // For safety, set a default readable format if the service_type is unknown
        formattedServiceType = 'Property Services';
    }
    
    console.log('DEBUG: Formatted service type:', formattedServiceType);
    
    // Ensure all template data fields are present with fallbacks
    const templateData: EnquiryReceivedTemplateData = {
      firstName: firstName,
      serviceType: formattedServiceType,
      budgetRange: enquiryData.budget_range || 'Not specified',
      additionalInfo: enquiryData.additional_info || 'None provided'
    };

    console.log('DEBUG: Template data prepared:', JSON.stringify(templateData, null, 2));
    console.log('DEBUG: Loading email template...');

    // Load and process the template
    let emailContent;
    try {
      emailContent = loadTemplate('enquiryReceived', templateData);
      console.log('DEBUG: Email template loaded successfully');
    } catch (templateError) {
      console.error('DEBUG: Failed to load email template:', templateError);
      // Provide a fallback plain text email in case template loading fails
      emailContent = `
        <html>
        <body>
          <h1>Thank You for Your Enquiry</h1>
          <p>Dear ${firstName},</p>
          <p>Thank you for contacting us. We have received your enquiry regarding ${formattedServiceType}.</p>
          <p>Our team is reviewing your request and will get back to you as soon as possible.</p>
          <p>Best regards,<br>The Propelity Team</p>
        </body>
        </html>
      `;
      console.log('DEBUG: Using fallback email template');
    }

    console.log('DEBUG: Preparing to send email...');
    
    // Ensure we have a valid from address
    const fromAddress = process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER;
    if (!fromAddress) {
      console.error('DEBUG: No from address available for sending email');
      return false;
    }
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"Propelity" <${fromAddress}>`,
      to: email,
      subject: 'Your Enquiry Has Been Received',
      html: emailContent,
      headers: {
        'X-Entity-Ref-ID': enquiryData.id,
        'List-Unsubscribe': '<mailto:unsubscribe@propelity.com.au>',
      },
      priority: 'high',
      replyTo: 'admin@propelity.com.au',
    });

    console.log('DEBUG: Email sent successfully. Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('DEBUG: Error in sendUserConfirmationEmail:', error);
    console.error('DEBUG: Error stack:', error.stack);
    return false;
  }
}

/**
 * Sends a confirmation email to the user who submitted the enquiry
 * @param {EnquiryData} enquiryData - The enquiry data
 * @returns {Promise<boolean>} True if the notification was sent successfully, false otherwise
 */
export async function notifyUserAboutEnquiry(enquiryData: EnquiryData): Promise<boolean> {
  console.log('MAIL STEP 1: notifyUserAboutEnquiry called with data:', JSON.stringify({
    id: enquiryData.id,
    email: enquiryData.email,
    user_email: enquiryData.user?.email,
    service_type: enquiryData.service_type
  }));
  
  try {
    console.log('MAIL STEP 2: Sending confirmation email to user...');
    
    // Ensure we have an email address available
    if (!enquiryData.email && !enquiryData.user?.email) {
      console.error('MAIL ERROR: No email address available, cannot send email notification');
      return false;
    }
    
    // Send confirmation email directly using the provided enquiry data
    const notificationSent = await sendUserConfirmationEmail(enquiryData);
    
    console.log('MAIL STEP 3: sendUserConfirmationEmail returned:', notificationSent);
    
    if (notificationSent) {
      console.log('User confirmation email sent successfully');
      return true;
    } else {
      console.warn('Failed to send user confirmation email');
      
      // Log more details about what might have gone wrong
      console.error('MAIL ERROR: Failed to send email. Details:', JSON.stringify({
        id: enquiryData.id,
        has_email: !!enquiryData.email,
        has_user_email: !!enquiryData.user?.email,
        service_type: enquiryData.service_type,
        budget_range: enquiryData.budget_range,
        first_name: enquiryData.first_name || enquiryData.user?.first_name,
      }));
      
      return false;
    }
  } catch (err: any) {
    console.error('MAIL ERROR: Exception when sending user confirmation email:', err);
    console.error('MAIL ERROR: Stack trace:', err.stack);
    console.error('MAIL ERROR: Failed for enquiry:', enquiryData.id);
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