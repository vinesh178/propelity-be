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
    // Get the template path
    const templatePath = path.resolve(
      __dirname,
      `${templateName}.html`
    );
    
    // Read the template file
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(placeholder, value || '');
    });
    
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
}