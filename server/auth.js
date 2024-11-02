import crypto from 'crypto';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Generate a secure token for the session
export function generateToken(username) {
  return crypto
    .createHash('sha256')
    .update(username + Date.now().toString())
    .digest('hex');
}

// Verify admin credentials
export function verifyCredentials(username, password) {
  return username === ADMIN_CREDENTIALS.username && 
         password === ADMIN_CREDENTIALS.password;
}

// Store active tokens (in a real app, use Redis or a database)
const activeTokens = new Set();