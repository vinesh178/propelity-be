import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

async function testDirectSMTP() {
  console.log('Starting direct SMTP test...');
  console.log('Using configuration:');
  console.log(`Host: ${process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com'}`);
  console.log(`Port: ${process.env.ZOHO_MAIL_PORT || '465'}`);
  console.log(`Secure: ${process.env.ZOHO_MAIL_SECURE !== 'false'}`);
  console.log(`User: ${process.env.ZOHO_MAIL_USER}`);
  
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      secure: process.env.ZOHO_MAIL_SECURE !== 'false',
      auth: {
        user: process.env.ZOHO_MAIL_USER,
        pass: process.env.ZOHO_MAIL_PASSWORD,
      },
      debug: true,
      logger: true
    });
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified!');
    
    // Test recipient email
    const testEmail = process.env.TEST_EMAIL || 'vineshk83@gmail.com';
    console.log(`Sending test email to: ${testEmail}`);
    
    // Send a simple email
    const info = await transporter.sendMail({
      from: process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER,
      to: testEmail,
      subject: 'Direct SMTP Test',
      text: 'This is a direct SMTP test email.',
      html: '<p>This is a <strong>direct SMTP test</strong> email.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return true;
  } catch (error) {
    console.error('SMTP Test Error:', error);
    return false;
  }
}

// Run the test
testDirectSMTP()
  .then(success => {
    console.log(success ? 'Test completed successfully!' : 'Test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });