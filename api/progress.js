import { getDB, writeDB } from '../server/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Cookie');
  
  // Handle OPTIONS request (for CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request - public endpoint
  if (req.method === 'GET') {
    try {
      const prUrl = req.query.prUrl;
      const db = await getDB();
      const progress = db[prUrl];
      return res.json(progress || null);
    } catch (error) {
      console.error('Failed to read progress:', error);
      return res.status(500).json({ error: 'Failed to read progress' });
    }
  }
  
  // POST request - protected endpoint
  if (req.method === 'POST') {
    // Check for slack_token cookie
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    if (!cookies?.slack_token) {
      return res.status(401).json({ error: 'Unauthorized - No Slack token found' });
    }

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
      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to save progress:', error);
      return res.status(500).json({ error: 'Failed to save progress' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 