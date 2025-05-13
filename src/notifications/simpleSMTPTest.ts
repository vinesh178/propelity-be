import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

/**
 * Simple test to verify Zoho SMTP connection
 * This bypasses all other code and directly tests the SMTP connection
 */
async function testZohoSMTPConnection() {
  console.log('Starting simple Zoho SMTP connection test...');
  console.log('Using the following configuration:');
  console.log(`Host: ${process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au'}`);
  console.log(`Port: ${process.env.ZOHO_MAIL_PORT || '465'}`);
  console.log(`Secure: ${process.env.ZOHO_MAIL_SECURE !== 'false'}`);
  console.log(`User: ${process.env.ZOHO_MAIL_USER}`);
  console.log(`Password: ${'*'.repeat(process.env.ZOHO_MAIL_PASSWORD?.length || 0)}`);
  console.log(`Test Recipient: ${process.env.SEND_TEST_MAIL_TO || 'not set - using default'}`);
  
  try {
    // Create a transporter with debug options
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au',
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      secure: process.env.ZOHO_MAIL_SECURE !== 'false',
      auth: {
        user: process.env.ZOHO_MAIL_USER,
        pass: process.env.ZOHO_MAIL_PASSWORD,
      },
      connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000'), // 10 seconds 
      greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '10000'), // 10 seconds
      socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '30000'), // 30 seconds
      debug: true, // Enable debug output
      logger: true, // Log information to console
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    
    // Verify the connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully!');
    
    // Determine the test recipient
    const testRecipient = process.env.SEND_TEST_MAIL_TO || 'admin@propelity.com.au';
    console.log(`Sending test email to: ${testRecipient}`);
    
    // Send a simple test email
    console.log('Sending a test email...');
    const info = await transporter.sendMail({
      from: process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER,
      to: testRecipient,
      subject: 'SMTP Test',
      text: 'This is a test email to verify SMTP connection with Zoho Mail.',
      html: '<p>This is a test email to verify SMTP connection with Zoho Mail.</p>',
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error: any) { // Type assertion to 'any' to access properties
    console.error('SMTP Test Error:', error);
    
    // Provide specific troubleshooting advice based on the error
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\nConnection issue detected. Please check:');
      console.error('1. Your network allows outgoing connections on port ' + (process.env.ZOHO_MAIL_PORT || '465'));
      console.error('2. The Zoho Mail server address is correct');
      console.error('3. Try using port 465 with secure=true instead of port 587');
    } else if (error.code === 'EAUTH') {
      console.error('\nAuthentication failed. Please check:');
      console.error('1. Your Zoho email address and password are correct');
      console.error('2. If you have 2FA enabled, you need to use an app-specific password');
      console.error('3. Your Zoho account allows SMTP access (check Zoho Mail settings)');
    }
    
    return false;
  }
}

// Execute the test function if this file is run directly
if (require.main === module) {
  testZohoSMTPConnection()
    .then(success => {
      if (success) {
        console.log('\nSMTP test completed successfully!');
      } else {
        console.error('\nSMTP test failed. See errors above.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error in SMTP test:', err);
      process.exit(1);
    });
}

export { testZohoSMTPConnection };