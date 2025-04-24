import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables at the very beginning
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import after environment variables are loaded
import { getAllEnquiries } from './enquiries';
import { fetchUsers, fetchUserById, updateUser } from './users';
import { handleNewEnquiryNotification } from './notifications/enquiryNotifications';
import { sendEnquiryNotificationToSlack } from './notifications/slackWebhook';
import { authenticateUser, verifyToken, signOutUser } from './auth';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json()); // Add middleware to parse JSON bodies

// API endpoint to fetch enquiries
app.get('/api/enquiries', async (req: Request, res: Response) => {
  console.log('Received request to /api/enquiries');
  try {
    const { data, error } = await getAllEnquiries();

    if (error) {
      // Log the detailed error on the server
      console.error('Error fetching enquiries for API:', error);
      // Send a generic error message to the client
      return res.status(500).json({ message: 'Failed to fetch enquiries', error: error.message });
    }
    
    if (!data || data.length === 0) {
      console.log('No enquiries found');
      return res.json([]);
    }
    
    // Send the fetched data
    console.log(`Sending ${data.length} enquiries to client`);
    return res.json(data);
  } catch (err) {
    console.error('Unexpected error in /api/enquiries endpoint:', err);
    return res.status(500).json({ message: 'Internal server error', error: err instanceof Error ? err.message : String(err) });
  }
});

// API endpoint to fetch all users
app.get('/api/users', async (req: Request, res: Response) => {
  console.log('Received request to /api/users');
  try {
    const { data, error } = await fetchUsers();

    if (error) {
      console.error('Error fetching users for API:', error);
      return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
    
    console.log(`Sending ${data?.length || 0} users to client`);
    return res.json(data);
  } catch (err) {
    console.error('Unexpected error in /api/users endpoint:', err);
    return res.status(500).json({ message: 'Internal server error', error: err instanceof Error ? err.message : String(err) });
  }
});

// API endpoint to fetch a specific user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;
  console.log(`Received request to /api/users/${userId}`);
  
  try {
    const { data, error } = await fetchUserById(userId);

    if (error) {
      console.error(`Error fetching user ${userId} for API:`, error);
      return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Sending user ${userId} to client`);
    return res.json(data);
  } catch (err) {
    console.error(`Unexpected error in /api/users/${userId} endpoint:`, err);
    return res.status(500).json({ message: 'Internal server error', error: err instanceof Error ? err.message : String(err) });
  }
});

// API endpoint to update a user
app.put('/api/users/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;
  const updates = req.body;
  console.log(`Received request to update user ${userId}:`, updates);
  
  try {
    const { data, error } = await updateUser(userId, updates);
    
    if (error) {
      console.error(`Error updating user ${userId}:`, error);
      return res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ message: 'User not found or no update performed' });
    }
    
    console.log(`Successfully updated user ${userId}`);
    return res.json(data);
  } catch (err) {
    console.error(`Unexpected error in PUT /api/users/${userId} endpoint:`, err);
    return res.status(500).json({ message: 'Internal server error', error: err instanceof Error ? err.message : String(err) });
  }
});
// Test endpoint for webhook verification
app.get('/api/webhooks/supabase/test', (req: Request, res: Response) => {
  console.log('Webhook test endpoint accessed');
  return res.status(200).json({ 
    message: 'Webhook test endpoint is working', 
    timestamp: new Date().toISOString(),
    url: 'https://admin.propelity.com.au/api/webhooks/supabase'
  });
});

// Webhook endpoint for Supabase database changes
app.post('/api/webhooks/supabase', express.json(), async (req: Request, res: Response) => {
  console.log('Received webhook from Supabase:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Process the webhook payload
    const payload = req.body;

    if (!payload) {
      console.warn('Empty webhook payload');
      return res.status(400).json({ message: 'Empty payload' });
    }

    let type, table, record;

    if (payload.type && payload.table && payload.record) {
      type = payload.type;
      table = payload.table;
      record = payload.record;
    } else if (payload.event && payload.schema && payload.table && payload.record) {
      type = payload.event;
      table = payload.table;
      record = payload.record;
    } else {
      console.warn('Unknown webhook payload format:', payload);
      // Try direct Slack notification for unknown formats if record exists
      if (payload.record) {
        console.log('Attempting direct Slack notification for unknown format. Record:', payload.record);
        try {
          await sendEnquiryNotificationToSlack(payload.record);
          console.log('Direct Slack notification sent for unknown format.');
        } catch (notifyErr) {
          console.error('Error sending direct Slack notification for unknown format:', notifyErr);
        }
      }
      return res.status(200).json({ message: 'Webhook received (unknown format)' });
    }

    console.log(`Processed webhook: type=${type}, table=${table}, record ID=${record?.id || 'unknown'}`);

    // Add logging before notification
    if ((type === 'INSERT' || type === 'insert') && table === 'enquiries' && record && record.id) {
      console.log('New enquiry detected:', record.id);
      try {
        await handleNewEnquiryNotification(record.id);
        console.log('Notification triggered for new enquiry:', record.id);
      } catch (notifyErr) {
        console.error('Error in handleNewEnquiryNotification:', notifyErr);
        // Try direct Slack notification as fallback
        try {
          await sendEnquiryNotificationToSlack(record);
          console.log('Fallback: Direct Slack notification sent.');
        } catch (slackErr) {
          console.error('Fallback: Error sending direct Slack notification:', slackErr);
        }
      }
    } else if (record) {
      // If not a standard insert event, still attempt direct Slack notification
      console.log('Non-standard event, attempting direct Slack notification. Record:', record);
      try {
        await sendEnquiryNotificationToSlack(record);
        console.log('Direct Slack notification sent for non-standard event.');
      } catch (slackErr) {
        console.error('Error sending direct Slack notification for non-standard event:', slackErr);
      }
    } else {
      console.log(`Ignoring webhook event: type=${type}, table=${table}`);
    }

    return res.status(200).json({ message: 'Webhook received and processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(200).json({ message: 'Webhook received with errors' });
  }
});

// Authentication routes
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    const { data, error } = await authenticateUser(email, password);
    
    if (error) {
      return res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
    
    // Return the session token
    return res.status(200).json({
      message: 'Authentication successful',
      token: data.session?.access_token,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });
  } catch (err) {
    console.error('Unexpected error during login:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/verify', verifyToken, (req: Request, res: Response) => {
  // If middleware passes, the token is valid
  return res.status(200).json({ message: 'Token is valid', user: (req as any).user });
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const { success, error } = await signOutUser();
    
    if (!success) {
      return res.status(500).json({ message: 'Logout failed', error: error?.message });
    }
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Unexpected error during logout:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Protected route example
app.get('/api/admin/dashboard-data', verifyToken, async (req: Request, res: Response) => {
  // This route is protected and only accessible with a valid token
  // The verifyToken middleware ensures only admins can access this
  
  try {
    // Example of fetching admin dashboard data
    const [enquiriesResult, usersResult] = await Promise.all([
      getAllEnquiries(),
      fetchUsers()
    ]);
    
    return res.status(200).json({
      enquiries: enquiriesResult.data || [],
      users: usersResult.data || [],
      stats: {
        totalEnquiries: enquiriesResult.data?.length || 0,
        totalUsers: usersResult.data?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error fetching admin dashboard data:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL configured: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
  console.log(`Local webhook endpoint: http://localhost:${port}/api/webhooks/supabase`);
  console.log(`Public webhook URL: https://admin.propelity.com.au/api/webhooks/supabase`);
});