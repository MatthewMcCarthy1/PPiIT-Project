// Smart API URL configuration for development in different environments
const isCodespaces = window.location.hostname.includes('.github.dev') || 
                     window.location.hostname.includes('-');

// Determine the right backend URL based on environment
const getApiUrl = () => {
  if (isCodespaces) {
    // For Codespaces: convert frontend URL to backend URL
    return `https://${window.location.hostname.replace('-3000', '-8000')}/server.php`;
  } else {
    // For local development on Windows
    return 'http://localhost:8000/server.php';
  }
};

export const API_BASE_URL = getApiUrl();