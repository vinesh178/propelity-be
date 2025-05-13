const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
require('ts-node').register();

// Load environment variables
dotenv.config();

async function testSendEmail() {
  try {
    console.log('TEST EMAIL: Starting test email sender');
    console.log('Environment variables check:');
    console.log(`ZOHO_MAIL_HOST: ${process.env.ZOHO_MAIL_HOST ? 'Present' : 'Missing'}`);
    console.log(`ZOHO_MAIL_PORT: ${process.env.ZOHO_MAIL_PORT ? 'Present' : 'Missing'}`);
    console.log(`ZOHO_MAIL_USER: ${process.env.ZOHO_MAIL_USER ? 'Present' : 'Missing'}`);
    console.log(`ZOHO_MAIL_PASSWORD: ${process.env.ZOHO_MAIL_PASSWORD ? 'Present' : 'Missing'}`);
    
    // Create a transporter
    console.log('Creating mail transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      secure: process.env.ZOHO_MAIL_SECURE !== 'false', // Default to true
      auth: {
        user: process.env.ZOHO_MAIL_USER, // Your Zoho email address
        pass: process.env.ZOHO_MAIL_PASSWORD, // Your Zoho email password
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 30000, // 30 seconds
      debug: true, // Enable debug output
      logger: true // Log information to console
    });
    
    console.log('Mail transporter created');
    
    // Test HTML template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Email</title>
    </head>
    <body>
      <h1>Test Email</h1>
      <p>This is a test email to verify the email sending functionality.</p>
      <p>If you're seeing this, the email system is working!</p>
    </body>
    </html>
    `;
    
    console.log('Sending test email...');
    // Send the email
    const info = await transporter.sendMail({
      from: `"Propelity Test" <${process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER}>`,
      to: process.env.ZOHO_MAIL_USER, // Send to yourself for testing
      subject: 'Test Email - Propelity Email System',
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': 'test-email-123'
      },
      priority: 'high'
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('Error sending test email:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
}

// Run the test
testSendEmail().catch(console.error); 