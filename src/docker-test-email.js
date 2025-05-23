const nodemailer = require('nodemailer');
require('dotenv').config();
const dns = require('dns');

async function testEmailFromDocker() {
  console.log('==== DOCKER EMAIL TEST ====');
  
  // Print environment variable status (without revealing passwords)
  console.log('Environment check:');
  console.log(`ZOHO_MAIL_HOST: ${process.env.ZOHO_MAIL_HOST || 'not set'}`);
  console.log(`ZOHO_MAIL_PORT: ${process.env.ZOHO_MAIL_PORT || 'not set'}`);
  console.log(`ZOHO_MAIL_USER: ${process.env.ZOHO_MAIL_USER || 'not set'}`);
  console.log(`ZOHO_MAIL_PASSWORD: ${process.env.ZOHO_MAIL_PASSWORD ? 'set' : 'not set'}`);
  console.log(`ZOHO_MAIL_FROM: ${process.env.ZOHO_MAIL_FROM || 'not set'}`);
  console.log(`SEND_TEST_MAIL_TO: ${process.env.SEND_TEST_MAIL_TO || 'not set'}`);
  console.log(`Running in Docker: ${process.env.RUNNING_IN_DOCKER || 'unknown'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  
  // Check DNS resolution to verify network connectivity
  console.log('\nChecking DNS resolution...');
  
  try {
    console.log(`Resolving ${process.env.ZOHO_MAIL_HOST}...`);
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve(process.env.ZOHO_MAIL_HOST, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log(`DNS resolution successful: ${JSON.stringify(addresses)}`);
  } catch (dnsError) {
    console.error(`DNS resolution failed: ${dnsError.message}`);
    console.log('Trying to resolve google.com as a test...');
    try {
      const googleAddresses = await new Promise((resolve, reject) => {
        dns.resolve('google.com', (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      console.log(`Google.com resolution successful: ${JSON.stringify(googleAddresses)}`);
    } catch (googleDnsError) {
      console.error(`Google.com resolution failed: ${googleDnsError.message}`);
      console.error('This indicates a serious DNS or network connectivity issue in the container');
    }
  }
  
  try {
    console.log('\nCreating mail transporter with extended timeouts...');
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au',
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      secure: process.env.ZOHO_MAIL_SECURE !== 'false',
      auth: {
        user: process.env.ZOHO_MAIL_USER,
        pass: process.env.ZOHO_MAIL_PASSWORD
      },
      connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '60000'),  // 60 seconds
      greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '60000'),      // 60 seconds
      socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '120000'),        // 120 seconds
      debug: true,                 // Enable debugging
      logger: true,                 // Enable logging
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    
    // Add DNS resolution test for the specific host
    console.log(`\nTesting direct connection to ${process.env.ZOHO_MAIL_HOST}:${process.env.ZOHO_MAIL_PORT}...`);
    const net = require('net');
    const socket = net.createConnection({
      host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au',
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      timeout: 10000
    });
    
    socket.on('connect', () => {
      console.log('Socket connection successful!');
      socket.end();
    });
    
    socket.on('timeout', () => {
      console.error('Socket connection timed out!');
      socket.destroy();
    });
    
    socket.on('error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Wait for socket test to complete
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('Verifying connection with extended timeouts...');
    await transporter.verify();
    console.log('SMTP connection verified!');
    
    console.log('\nSending test email...');
    
    // Use the configurable test email recipient from env variables
    const testRecipient = process.env.SEND_TEST_MAIL_TO || process.env.ZOHO_MAIL_USER;
    console.log(`Test email will be sent to: ${testRecipient}`);
    
    const info = await transporter.sendMail({
      from: `"Docker Test" <${process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER}>`,
      to: testRecipient,
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