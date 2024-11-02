import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateToken, verifyCredentials } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const DB_PATH = join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Initialize database file if it doesn't exist
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({}));
  }
}

// Read database
async function readDB() {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Write to database
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
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
    const db = await readDB();
    const progress = db[req.params.prUrl];
    res.json(progress || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read progress' });
  }
});

// Save PR progress (protected endpoint)
app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { prUrl, progress, currentStage } = req.body;
    const db = await readDB();
    
    db[prUrl] = {
      prUrl,
      progress,
      currentStage,
      lastUpdated: Date.now()
    };
    
    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

await initDB();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});