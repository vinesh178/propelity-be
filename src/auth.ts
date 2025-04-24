import { supabase } from './supabase/supabaseClient';
import { Request, Response, NextFunction } from 'express';

/**
 * Handles user authentication against Supabase
 * @param email User's email
 * @param password User's password
 * @returns Object containing session data or error
 */
export async function authenticateUser(email: string, password: string) {
  console.log(`Attempting to authenticate user: ${email}`);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Authentication error:', error.message);
      return { data: null, error };
    }
    if (!email) {
      console.error('No email provided for admin check');
      return { data: null, error: { message: 'No email provided' } };
    }
    // Check if user is an admin via user_metadata
    if (data.user) {
      const isAdmin = data.user.user_metadata && data.user.user_metadata.isAdmin === true;
      if (!isAdmin) {
        console.error('User is not an admin (user_metadata):', email);
        return { data: null, error: { message: 'Access denied: Admin privileges required' } };
      }
      console.log(`User authenticated successfully: ${email} (Admin: true)`);
      return { data, error: null };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Exception during authentication:', err);
    return { data: null, error: { message: 'Authentication failed' } };
  }
}

/**
 * Middleware to verify JWT token from request
 */
export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Verify the JWT token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error('Token verification failed:', error?.message || 'Invalid token');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    const userEmail = data.user.email;
    if (!userEmail) {
      console.error('No email found in Supabase user object');
      return res.status(403).json({ message: 'No email found in user profile' });
    }
    // Check if the user is an admin via user_metadata
    const isAdmin = data.user.user_metadata && data.user.user_metadata.isAdmin === true;
    if (!isAdmin) {
      console.error('Non-admin user attempted to access protected route (user_metadata):', userEmail);
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    // Add the user to the request object for later use
    (req as any).user = data.user;
    next();
  } catch (err) {
    console.error('Exception during token verification:', err);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

/**
 * Signs out a user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception during sign out:', err);
    return { success: false, error: { message: 'Sign out failed' } };
  }
}
