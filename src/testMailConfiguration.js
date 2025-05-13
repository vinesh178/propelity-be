const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Tests the email configuration and sends a diagnostic email
 */
async function testMailConfiguration() {
  console.log('============ MAIL CONFIGURATION TEST ==============');
  console.log('Testing mail configuration in this environment');
  
  // 1. Check environment variables
  console.log('\n1. Checking environment variables:');
  const requiredVars = [
    'ZOHO_MAIL_HOST',
    'ZOHO_MAIL_PORT',
    'ZOHO_MAIL_USER',
    'ZOHO_MAIL_PASSWORD'
  ];
  
  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    const isPresent = !!process.env[varName];
    console.log(`  ${varName}: ${isPresent ? 'Present' : 'MISSING'}`);
    if (!isPresent) allVarsPresent = false;
  });
  
  if (!allVarsPresent) {
    console.error('\nERROR: Some required environment variables are missing');
    console.error('Please check your .env file and ensure all required variables are set');
    return;
  }
  
  // 2. Check template existence
  console.log('\n2. Checking email template:');
  const templatePath = path.resolve(__dirname, 'notifications/templates/enquiryReceived.html');
  
  try {
    const templateExists = fs.existsSync(templatePath);
    console.log(`  Template path: ${templatePath}`);
    console.log(`  Template exists: ${templateExists ? 'Yes' : 'No'}`);
    
    if (templateExists) {
      const templateStats = fs.statSync(templatePath);
      console.log(`  Template size: ${templateStats.size} bytes`);
      console.log(`  Last modified: ${templateStats.mtime}`);
      
      // Read first 100 chars
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      console.log(`  Template preview: ${templateContent.substring(0, 100)}...`);
    } else {
      console.error('\nERROR: Email template does not exist at the expected location');
      return;
    }
  } catch (err) {
    console.error('\nERROR: Failed to check template:', err);
    return;
  }
  
  // 3. Test SMTP connection
  console.log('\n3. Testing SMTP connection:');
  
  try {
    console.log('  Creating transporter with these settings:');
    console.log(`    Host: ${process.env.ZOHO_MAIL_HOST}`);
    console.log(`    Port: ${process.env.ZOHO_MAIL_PORT}`);
    console.log(`    User: ${process.env.ZOHO_MAIL_USER}`);
    console.log(`    Secure: ${process.env.ZOHO_MAIL_SECURE !== 'false'}`);
    
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_MAIL_HOST,
      port: parseInt(process.env.ZOHO_MAIL_PORT || '465'),
      secure: process.env.ZOHO_MAIL_SECURE !== 'false',
      auth: {
        user: process.env.ZOHO_MAIL_USER,
        pass: process.env.ZOHO_MAIL_PASSWORD
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 30000 // 30 seconds
    });
    
    console.log('  Verifying connection...');
    
    // Verify connection
    const verifyResult = await transporter.verify();
    console.log(`  Connection verified: ${verifyResult ? 'Success' : 'Failed'}`);
    
    // 4. Send test email
    console.log('\n4. Sending test email:');
    const adminEmail = process.env.ZOHO_MAIL_USER;
    
    console.log(`  Sending to: ${adminEmail}`);
    const info = await transporter.sendMail({
      from: `"Mail Test" <${process.env.ZOHO_MAIL_FROM || process.env.ZOHO_MAIL_USER}>`,
      to: adminEmail,
      subject: 'Mail Configuration Test',
      text: `This is a test email sent at ${new Date().toISOString()}
      
Server environment: ${process.env.NODE_ENV || 'development'}
Configuration test successful!
      `,
      html: `
        <h1>Mail Configuration Test</h1>
        <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
        <p>Server environment: <strong>${process.env.NODE_ENV || 'development'}</strong></p>
        <p>Configuration test successful!</p>
      `,
      headers: {
        'X-Test-ID': 'mail-configuration-test'
      }
    });
    
    console.log('  Test email sent successfully!');
    console.log(`  Message ID: ${info.messageId}`);
    
    console.log('\n==== Configuration test completed successfully! ====');
    
  } catch (err) {
    console.error('\nERROR: Mail configuration test failed:');
    console.error(err);
    console.error('Stack trace:');
    console.error(err.stack);
  }
}

// Run the test
testMailConfiguration().catch(err => {
  console.error('Unhandled error in mail configuration test:', err);
}); 