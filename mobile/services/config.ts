// API configuration
export const getApiBaseUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is required. ' +
      'Please create a .env file in the mobile directory with: ' +
      'EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8000'
    );
  }

  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();