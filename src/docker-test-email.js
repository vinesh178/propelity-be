const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailFromDocker() {
  console.log('==== DOCKER EMAIL TEST ====');
  
  // Print environment variable status (without revealing passwords)
  console.log('Environment check:');
  console.log(`ZOHO_MAIL_HOST: ${process.env.ZOHO_MAIL_HOST || 'not set'}`);
  console.log(`ZOHO_MAIL_PORT: ${process.env.ZOHO_MAIL_PORT || 'not set'}`);
  console.log(`ZOHO_MAIL_USER: ${process.env.ZOHO_MAIL_USER || 'not set'}`);
  console.log(`ZOHO_MAIL_PASSWORD: ${process.env.ZOHO_MAIL_PASSWORD ? 'set' : 'not set'}`);
  console.log(`ZOHO_MAIL_FROM: ${process.env.ZOHO_MAIL_FROM || 'not set'}`);
  
  try {
    console.log('\nCreating mail transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      secure: process.env.ZOHO_MAIL_SECURE !== 'false',
      auth: {
        user: process.env.ZOHO_MAIL_USER,
        pass: process.env.ZOHO_MAIL_PASSWORD
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000
    });
    
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('SMTP connection verified!');
    
    console.log('\nSending test email...');
    
    const userEmail = process.env.ZOHO_MAIL_USER;
    const info = await transporter.sendMail({
      from: `"Docker Test" <${process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER}>`,
      to: userEmail,
      subject: "Docker Container Email Test",
      html: `
        <h1>Email Test from Docker Container</h1>
        <p>This is a test email sent from the Docker container at: ${new Date().toISOString()}</p>
        <p>If you're seeing this, email sending is working!</p>
      `
    });
    
    console.log('Email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log('\n==== TEST COMPLETED SUCCESSFULLY ====');
    
  } catch (error) {
    console.error('\nERROR sending email:');
    console.error(error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n==== TEST FAILED ====');
  }
}

testEmailFromDocker().catch(error => {
  console.error('Unhandled error in test:', error);
}); 