import axios from 'axios';

const API_URL = 'https://hackpadtracker.vercel.app/api';

interface PRProgress {
  prUrl: string;
  progress: number;
  currentStage: string;
  lastUpdated: number;
}

export const savePRProgress = async (prUrl: string, progress: number, currentStage: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/progress`, {
      prUrl,
      progress,
      currentStage,
    });
  } catch (error) {
    console.error('Failed to save progress:', error);
    throw new Error('Failed to save progress');
  }
};

export const getPRProgress = async (prUrl: string): Promise<PRProgress | null> => {
  try {
    const response = await axios.get(`${API_URL}/progress/${encodeURIComponent(prUrl)}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get progress:', error);
    return null;
  }
};