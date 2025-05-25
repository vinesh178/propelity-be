import { loadTemplate } from './templates/templateLoader';

interface EnquiryData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  service_type: string;
  budget_range: string;
  additional_info: string | null;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

/**
 * Formats the service type into a user-friendly string
 * @param {string} serviceType - The raw service type from the database
 * @returns {string} The formatted service type
 */
function formatServiceType(serviceType: string): string {
  switch (serviceType) {
    case 'both':
      return 'Both Buyer Agent and Mortgage Broker Services';
    case 'buyer_agent':
      return 'Buyer Agent Services';
    case 'mortgage_broker':
      return 'Mortgage Broker Services';
    default:
      return serviceType;
  }
}

/**
 * Sends a confirmation email to the user who submitted the enquiry using Mailtrap API
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

    // Prepare template data
    const templateData = {
      firstName: firstName,
      formattedServiceType: formatServiceType(enquiryData.service_type),
      budgetRange: enquiryData.budget_range,
      additionalInfo: enquiryData.additional_info || 'None provided'
    };

    // Load and process the template
    const emailContent = loadTemplate('enquiryReceived', templateData);

    // Send the email using Mailtrap API
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': process.env.MAILTRAP_API_TOKEN || ''
      },
      body: JSON.stringify({
        to: [{ email: email }],
        from: {
          email: process.env.MAIL_FROM || 'admin@propelity.com.au',
          name: 'Propelity'
        },
        subject: 'Your Enquiry Has Been Received',
        html: emailContent
      })
    });

    if (!response.ok) {
      throw new Error(`Mailtrap API error: ${response.statusText}`);
    }

    console.log(`User confirmation email sent successfully to ${email}`);
    return true;
  } catch (error) {
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
    const notificationSent = await sendUserConfirmationEmail(enquiryData);
    
    if (notificationSent) {
      console.log('User confirmation email sent successfully');
      return true;
    } else {
      console.warn('Failed to send user confirmation email');
      return false;
    }
  } catch (err) {
    console.error('Exception when sending user confirmation email:', err);
    return false;
  }
}

/**
 * Handles sending a confirmation email for a new enquiry
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
  } catch (error) {
    console.error('Error in handleNewEnquiryEmailNotification:', error);
  }
} 