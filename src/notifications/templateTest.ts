import { loadTemplate, EnquiryReceivedTemplateData } from './templates/templateLoader';
import fs from 'fs';
import path from 'path';

async function testTemplateLoading() {
  console.log('Testing template loading...');
  
  try {
    // Check if template file exists
    const templatePath = path.resolve(__dirname, 'templates', 'enquiryReceived.html');
    console.log(`Template path: ${templatePath}`);
    
    if (fs.existsSync(templatePath)) {
      console.log('Template file exists!');
    } else {
      console.error('Template file does not exist!');
      return false;
    }
    
    // Test data
    const templateData: EnquiryReceivedTemplateData = {
      firstName: 'Test User',
      serviceType: 'Web Development',
      budgetRange: '$5,000 - $10,000',
      additionalInfo: 'This is a test'
    };
    
    // Try to load and process the template
    const processedTemplate = loadTemplate('enquiryReceived', templateData);
    
    // Check if placeholders were replaced
    const containsPlaceholders = processedTemplate.includes('{{');
    
    if (containsPlaceholders) {
      console.error('Template still contains placeholders after processing!');
      console.log(processedTemplate.substring(0, 500) + '...');
      return false;
    } else {
      console.log('Template processed successfully!');
      console.log('First 200 characters of processed template:');
      console.log(processedTemplate.substring(0, 200) + '...');
      return true;
    }
  } catch (error) {
    console.error('Template test error:', error);
    return false;
  }
}

// Run the test
testTemplateLoading()
  .then(success => {
    console.log(success ? 'Template test passed!' : 'Template test failed!');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error in template test:', err);
    process.exit(1);
  });