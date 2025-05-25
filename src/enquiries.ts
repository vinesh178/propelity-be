import { supabase } from './supabase/supabaseClient';
import { handleNewEnquiryNotification } from './notifications/enquiryNotifications';

export interface Enquiry {
  // Define the structure of your enquiry object based on your table columns
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  budget_range: string;
  additional_info?: string;
  service_type: string;
  created_at: string;
  recaptcha_token?: string;
  // Add other columns as needed
}

/**
 * Fetches all enquiries from the Supabase 'enquiries' table.
 * @returns {Promise<{ data: Enquiry[] | null, error: any }>} An object containing the data or an error.
 */
export async function getAllEnquiries(): Promise<{ data: Enquiry[] | null; error: any }> {
  console.log('Attempting to fetch enquiries from Supabase...');
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enquiries from Supabase:', error);
      return { data: null, error };
    }

    if (data && data.length > 0) {
      console.log(`Successfully fetched ${data.length} enquiries from Supabase`);
      console.log('First enquiry sample:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No enquiries found in the database');
    }
    
    return { data: data as Enquiry[] | null, error: null };
  } catch (err) {
    console.error('Exception when fetching enquiries:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetches a single enquiry by ID from the Supabase 'enquiries' table.
 * @param {string} id - The ID of the enquiry to fetch.
 * @returns {Promise<{ data: Enquiry | null, error: any }>} An object containing the data or an error.
 */
export async function getEnquiryById(id: string): Promise<{ data: Enquiry | null; error: any }> {
  console.log(`Attempting to fetch enquiry with ID ${id} from Supabase...`);
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching enquiry with ID ${id} from Supabase:`, error);
      return { data: null, error };
    }

    console.log(`Successfully fetched enquiry with ID ${id} from Supabase`);
    return { data: data as Enquiry | null, error: null };
  } catch (err) {
    console.error(`Exception when fetching enquiry with ID ${id}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Creates a new enquiry in the Supabase 'enquiries' table.
 * @param {Omit<Enquiry, 'id' | 'created_at'>} enquiry - The enquiry data to insert.
 * @returns {Promise<{ data: Enquiry | null, error: any }>} An object containing the data or an error.
 */
export async function createEnquiry(enquiry: Omit<Enquiry, 'id' | 'created_at'>): Promise<{ data: Enquiry | null; error: any }> {
  console.log('Attempting to create a new enquiry in Supabase...');
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .insert([enquiry])
      .select()
      .single();

    if (error) {
      console.error('Error creating enquiry in Supabase:', error);
      return { data: null, error };
    }

    console.log('Successfully created enquiry in Supabase');
    
    // Trigger notifications synchronously
    if (data && data.id) {
      try {
        console.log('Triggering notifications for enquiry:', data.id);
        await handleNewEnquiryNotification(data.id);
        console.log('Notifications sent successfully for enquiry:', data.id);
      } catch (notifyErr) {
        console.error('Error sending notifications:', notifyErr);
        // Don't fail the enquiry creation if notifications fail
      }
    }
    
    return { data: data as Enquiry, error: null };
  }
  catch (err) {
    console.error('Exception when creating enquiry:', err);
    return { data: null, error: err };
  }
}
