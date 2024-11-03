import express from 'express';
import cors from 'cors';
import { put, get } from '@vercel/blob';
import { generateToken, verifyCredentials } from './auth.js';

const app = express();
const PORT = 3001;
const BLOB_KEY = 'pr-progress-db';
const activeTokens = new Set();

app.use(cors());
app.use(express.json());

// Get database
async function getDB() {
  try {
    const blob = await get(BLOB_KEY);
    if (!blob) {
      return {};
    }
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error reading from blob storage:', error);
    return {};
  }
}

// Write to database
async function writeDB(data) {
  try {
    await put(BLOB_KEY, JSON.stringify(data, null, 2), {
      access: 'public',
      token: import.meta.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error('Error writing to blob storage:', error);
    throw new Error('Failed to save data');
  }
}

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (verifyCredentials(username, password)) {
    const token = generateToken(username);
    activeTokens.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Logout endpoint
app.post('/api/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  activeTokens.delete(token);
  res.json({ success: true });
});

// Get PR progress (public endpoint)
app.get('/api/progress/:prUrl', async (req, res) => {
  try {
    const db = await getDB();
    const progress = db[req.params.prUrl];
    res.json(progress || null);
  } catch (error) {
    console.error('Failed to read progress:', error);
    res.status(500).json({ error: 'Failed to read progress' });
  }
});

// Save PR progress (protected endpoint)
app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { prUrl, progress, currentStage } = req.body;
    const db = await getDB();
    
    db[prUrl] = {
      prUrl,
      progress,
      currentStage,
      lastUpdated: Date.now()
    };
    
    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});