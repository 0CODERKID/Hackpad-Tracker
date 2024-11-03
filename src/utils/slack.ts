import Cookies from 'js-cookie';

export const authorizedUsers = ['Scooter Y', 'CODER KID', 'xX_ALEXREN_Xx'];
export const clientSecret = import.meta.env.VITE_CODE;

export interface SlackProfile {
  display_name: string;
  real_name: string;
}

export interface SlackAPIResponse {
  ok: boolean;
  error?: string;
  profile?: SlackProfile;
}

export const verifySlackUser = async (token: string, userId: string): Promise<{ isAuthorized: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `https://hackpadtracker.vercel.app/api/slack/api/users.profile.get?user=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data: SlackAPIResponse = await response.json();

    if (!data.ok) {
      console.error('Error from Slack API:', data.error);
      return { isAuthorized: false, error: data.error };
    }

    const profile = data.profile;
    if (!profile) {
      return { isAuthorized: false, error: 'No profile data received' };
    }

    const userName = profile.display_name || profile.real_name;
    const isAuthorized = authorizedUsers.includes(userName);

    return { isAuthorized };
  } catch (error) {
    console.error('Error during verification:', error);
    return { isAuthorized: false, error: 'Failed to verify user' };
  }
};

export const handleSlackCallback = async (code: string, clientSecret: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '2210535565.7957522136834',
        client_secret: clientSecret,
        code,
        redirect_uri: 'https://hackpadtracker.vercel.app/callback',
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      Cookies.set('slack_token', data.access_token);
      Cookies.set('slack_user_id', data.authed_user.id);
      return { success: true };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('Error during OAuth:', error);
    return { success: false, error: 'Failed to complete authentication' };
  }
};