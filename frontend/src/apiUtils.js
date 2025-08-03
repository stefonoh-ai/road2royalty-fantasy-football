// API Utility with automatic retry logic for Render backend wake-up
// Handles the ~30 second wake-up time for sleeping services

const API_BASE_URL = 'https://road2royalty-backend.onrender.com';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // Start with 2 seconds
  backoffMultiplier: 2, // Double delay each retry
  wakeUpDelay: 30000 // 30 seconds for initial wake-up
};

/**
 * Enhanced fetch with automatic retry logic for sleeping backend
 * @param {string} endpoint - API endpoint (e.g., '/league')
 * @param {object} options - Fetch options
 * @param {boolean} isFirstAttempt - Internal flag for retry logic
 * @returns {Promise} - Fetch response
 */
export const fetchWithRetry = async (endpoint, options = {}, isFirstAttempt = true) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`🔄 Fetching: ${endpoint}${isFirstAttempt ? '' : ' (retry)'}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log(`✅ Success: ${endpoint}`);
    return response;
    
  } catch (error) {
    console.log(`❌ Error fetching ${endpoint}:`, error.message);
    
    // Check if this looks like a sleeping backend
    const isNetworkError = error.name === 'TypeError' || error.name === 'AbortError';
    const isServerError = error.message.includes('500') || error.message.includes('503');
    
    if ((isNetworkError || isServerError) && isFirstAttempt) {
      console.log(`😴 Backend appears to be sleeping. Waiting ${RETRY_CONFIG.wakeUpDelay/1000}s for wake-up...`);
      
      // Wait for backend to wake up
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.wakeUpDelay));
      
      // Retry after wake-up period
      return fetchWithRetry(endpoint, options, false);
    }
    
    throw error;
  }
};

/**
 * Fetch JSON data with retry logic
 * @param {string} endpoint - API endpoint
 * @returns {Promise<object>} - JSON response
 */
export const fetchJSON = async (endpoint) => {
  const response = await fetchWithRetry(endpoint);
  return response.json();
};

/**
 * Wake up the backend service proactively
 * @returns {Promise<boolean>} - Success status
 */
export const wakeUpBackend = async () => {
  try {
    console.log('🚀 Waking up backend service...');
    await fetchJSON('/');
    console.log('✅ Backend is awake and ready!');
    return true;
  } catch (error) {
    console.error('❌ Failed to wake up backend:', error);
    return false;
  }
};

/**
 * Check if backend is currently awake
 * @returns {Promise<boolean>} - Wake status
 */
export const isBackendAwake = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Quick 5s check
    
    const response = await fetch(`${API_BASE_URL}/`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  fetchWithRetry,
  fetchJSON,
  wakeUpBackend,
  isBackendAwake
};
