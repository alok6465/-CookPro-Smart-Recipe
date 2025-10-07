// API Configuration - Auto-detects local vs hosted
const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'  // Local development
    : 'https://ind-recipes-api.onrender.com'  // Production/hosted
};

function getApiUrl(query) {
  return `${API_CONFIG.BASE_URL}/?q=${encodeURIComponent(query)}`;
}