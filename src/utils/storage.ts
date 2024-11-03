import axios from 'axios';
import Cookies from 'js-cookie';

interface PRProgress {
  prUrl: string;
  progress: number;
  currentStage: string;
  lastUpdated: number;
}

export const savePRProgress = async (prUrl: string, progress: number, currentStage: string): Promise<void> => {
  try {
    await axios.post('/api/progress', {
      prUrl,
      progress,
      currentStage,
    }, {
      withCredentials: true // This is important for sending cookies
    });
  } catch (error) {
    console.error('Failed to save progress:', error);
    throw new Error('Failed to save progress');
  }
};

export const getPRProgress = async (prUrl: string): Promise<PRProgress | null> => {
  try {
    const response = await axios.get(`/api/progress/${encodeURIComponent(prUrl)}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get progress:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!Cookies.get('slack_token');
};