import { supabase } from './supabase/supabaseClient';

interface User {
  id: string; // UUID
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  issubscribed: boolean;
  isAdmin: boolean;
}

/**
 * Fetches all users from the propelity_users table.
 *
 * @returns {Promise<{ data: User[] | null, error: any }>} An object containing the data or an error.
 */
export async function fetchUsers(): Promise<{ data: User[] | null; error: any }> {
  console.log('Attempting to fetch users from propelity_users table...');
  try {
    const { data, error } = await supabase
      .from('propelity_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return { data: null, error };
    }

    if (data && data.length > 0) {
      console.log(`Successfully fetched ${data.length} users from Supabase`);
      console.log('First user sample:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No users found in the database');
    }
    
    return { data: data as User[] | null, error: null };
  } catch (err) {
    console.error('Exception when fetching users:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetches a single user by ID from the propelity_users table.
 *
 * @param {string} userId - The UUID of the user to fetch.
 * @returns {Promise<{ data: User | null, error: any }>} An object containing the data or an error.
 */
export async function fetchUserById(userId: string): Promise<{ data: User | null; error: any }> {
  console.log(`Attempting to fetch user with ID ${userId} from propelity_users table...`);
  try {
    const { data, error } = await supabase
      .from('propelity_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`Error fetching user with ID ${userId} from Supabase:`, error);
      return { data: null, error };
    }

    console.log(`Successfully fetched user with ID ${userId} from Supabase`);
    return { data: data as User | null, error: null };
  } catch (err) {
    console.error(`Exception when fetching user with ID ${userId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Creates a new user in the propelity_users table.
 *
 * @param {Omit<User, 'id' | 'created_at'>} user - The user data to insert.
 * @returns {Promise<{ data: User | null, error: any }>} An object containing the data or an error.
 */
export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<{ data: User | null; error: any }> {
  console.log('Attempting to create a new user in Supabase...');
  try {
    const { data, error } = await supabase
      .from('propelity_users')
      .insert([user])
      .select()
      .single();

    if (error) {
      console.error('Error creating user in Supabase:', error);
      return { data: null, error };
    }

    console.log('Successfully created user in Supabase');
    return { data: data as User, error: null };
  }
  catch (err) {
    console.error('Exception when creating user:', err);
    return { data: null, error: err };
  }
}

/**
 * Updates an existing user in the propelity_users table.
 *
 * @param {string} userId - The ID of the user to update.
 * @param {Partial<Omit<User, 'id' | 'created_at'>>} updates - The user data to update.
 * @returns {Promise<{ data: User | null, error: any }>} An object containing the data or an error.
 */
export async function updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<{ data: User | null; error: any }> {
  console.log(`Attempting to update user with ID ${userId} in Supabase...`);
  try {
    const { data, error } = await supabase
      .from('propelity_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating user with ID ${userId} in Supabase:`, error);
      return { data: null, error };
    }

    console.log(`Successfully updated user with ID ${userId} in Supabase`);
    return { data: data as User, error: null };
  }
  catch (err) {
    console.error(`Exception when updating user with ID ${userId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Deletes a user from the propelity_users table.
 *
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<{ success: boolean, error: any }>} An object indicating success or containing an error.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error: any }> {
  console.log(`Attempting to delete user with ID ${userId} from Supabase...`);
  try {
    const { error } = await supabase
      .from('propelity_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error(`Error deleting user with ID ${userId} from Supabase:`, error);
      return { success: false, error };
    }

    console.log(`Successfully deleted user with ID ${userId} from Supabase`);
    return { success: true, error: null };
  }
  catch (err) {
    console.error(`Exception when deleting user with ID ${userId}:`, err);
    return { success: false, error: err };
  }
}

/**
 * Debug function to test connection to the propelity_users table
 */
export async function debugUsersConnection() {
  console.log('Debugging Supabase connection to propelity_users table...');
  
  // Check if Supabase client is initialized
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return { success: false, message: 'Supabase client is not initialized' };
  }
  
  try {
    // Test connection by fetching a simple count
    const { count, error: countError } = await supabase
      .from('propelity_users')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error connecting to propelity_users table:', countError);
      return { success: false, message: `Connection error: ${countError.message}` };
    }
    
    console.log(`Connection successful. Found ${count} records in propelity_users table.`);
    
    // Fetch a sample record to verify data structure
    const { data, error } = await supabase
      .from('propelity_users')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching sample user data:', error);
      return { success: false, message: `Data fetch error: ${error.message}` };
    }
    
    if (data && data.length > 0) {
      console.log('Sample user data structure:', JSON.stringify(data[0], null, 2));
      return { success: true, message: 'Connection and data retrieval successful', sampleData: data[0] };
    } else {
      console.log('No data found in propelity_users table');
      return { success: true, message: 'Connection successful but no data found' };
    }
  } catch (err) {
    console.error('Exception during connection test:', err);
    return { success: false, message: `Exception: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// Call the debug function to test the connection
debugUsersConnection();
