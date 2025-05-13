const fs = require('fs');
const path = require('path');
require('ts-node').register();

// Import the template loader
const { loadTemplate } = require('./notifications/templates/templateLoader');

// Test function to verify template loading
async function testTemplateLoader() {
  try {
    console.log('TEST: Starting template loader test');
    
    // Test data for template
    const templateData = {
      firstName: 'Test User',
      serviceType: 'Test Service',
      budgetRange: '$100,000 - $200,000',
      additionalInfo: 'This is a test of the template loading functionality.'
    };
    
    console.log('TEST: Template data:', JSON.stringify(templateData, null, 2));
    
    // Check if the template file exists
    const templatePath = path.resolve(__dirname, 'notifications/templates/enquiryReceived.html');
    console.log('TEST: Template path:', templatePath);
    
    if (fs.existsSync(templatePath)) {
      console.log('TEST: Template file exists');
      
      // Try to read the file content directly
      const rawTemplate = fs.readFileSync(templatePath, 'utf8');
      console.log('TEST: Raw template file content (first 100 chars):', rawTemplate.substring(0, 100) + '...');
      
      // Now try to load and process the template using the loader
      console.log('TEST: Loading template through loadTemplate function...');
      const processedTemplate = loadTemplate('enquiryReceived', templateData);
      
      // Check if the placeholders were replaced
      const containsPlaceholders = processedTemplate.includes('{{') && processedTemplate.includes('}}');
      console.log('TEST: Template still contains placeholders:', containsPlaceholders);
      
      if (containsPlaceholders) {
        console.log('TEST: WARNING - Template processing did not replace all placeholders');
      } else {
        console.log('TEST: Template processing successful - all placeholders replaced');
      }
      
      // Check if the values were inserted
      for (const [key, value] of Object.entries(templateData)) {
        console.log(`TEST: Checking if template contains value for ${key}:`, processedTemplate.includes(value));
      }
      
      console.log('TEST: Template processing test completed successfully');
    } else {
      console.error('TEST: Template file does not exist at path:', templatePath);
    }
  } catch (error) {
    console.error('TEST ERROR: Failed to test template loader:', error);
    console.error('TEST ERROR: Stack trace:', error.stack);
  }
}

// Run the test
testTemplateLoader().catch(console.error); 