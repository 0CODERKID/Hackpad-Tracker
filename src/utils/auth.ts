import axios from 'axios';

const API_URL = 'https://hackpadtracker.vercel.app/api';

interface AdminCredentials {
  username: string;
  password: string;
}

let authToken: string | null = null;

export const authenticateAdmin = async (credentials: AdminCredentials): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    authToken = response.data.token;
    return true;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
};

export const logoutAdmin = async (): Promise<void> => {
  if (!authToken) return;

  try {
    await axios.post(
      `${API_URL}/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
  } finally {
    authToken = null;
  }
};

export const getAuthHeader = () => {
  return authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
};