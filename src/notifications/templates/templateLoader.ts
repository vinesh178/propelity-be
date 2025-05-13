import fs from 'fs';
import path from 'path';

/**
 * Template data interface for enquiry received email
 */
export interface EnquiryReceivedTemplateData {
  firstName: string;
  serviceType: string;
  budgetRange: string;
  additionalInfo: string;
}

/**
 * Loads an email template and replaces placeholders with actual data
 * @param templateName - The name of the template file without extension
 * @param data - An object containing the data to replace placeholders
 * @returns The processed HTML template as a string
 */
export function loadTemplate<T extends Record<string, any>>(
  templateName: string,
  data: T
): string {
  try {
    console.log('DEBUG: TemplateLoader - Starting to load template:', templateName);
    
    // Get the template path
    const templatePath = path.resolve(
      __dirname,
      `${templateName}.html`
    );
    
    console.log('DEBUG: TemplateLoader - Template path:', templatePath);
    
    // Read the template file
    console.log('DEBUG: TemplateLoader - Reading template file...');
    let template = fs.readFileSync(templatePath, 'utf8');
    console.log('DEBUG: TemplateLoader - Template file read successfully');
    
    // Replace all placeholders with actual data
    console.log('DEBUG: TemplateLoader - Replacing placeholders with data:', JSON.stringify(data, null, 2));
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      const oldTemplate = template;
      template = template.replace(placeholder, value || '');
      if (oldTemplate !== template) {
        console.log(`DEBUG: TemplateLoader - Replaced {{${key}}} with:`, value);
      }
    });
    
    console.log('DEBUG: TemplateLoader - Template processing completed');
    return template;
  } catch (error: any) {
    console.error('DEBUG: TemplateLoader - Error loading template:', error);
    console.error('DEBUG: TemplateLoader - Error stack:', error.stack);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
}