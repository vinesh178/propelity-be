import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables at the very beginning
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import after environment variables are loaded
import { getAllEnquiries } from './enquiries';
import { fetchUsers, fetchUserById, updateUser } from './users';

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

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL configured: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
});