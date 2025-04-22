import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables at the very beginning
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import after environment variables are loaded
import { getAllEnquiries } from './enquiries';
import { fetchUsers, fetchUserById } from './users';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

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
    
    // Send the fetched data
    console.log(`Sending ${data?.length || 0} enquiries to client`);
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
  const userId = parseInt(req.params.id);
  console.log(`Received request to /api/users/${userId}`);
  
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  
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

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL configured: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
});