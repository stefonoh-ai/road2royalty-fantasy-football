// Local Development Configuration
// Use this to switch between local and production backends

const LOCAL_DEV_CONFIG = {
  // Set to true for local development, false for production
  USE_LOCAL_BACKEND: true,
  
  // Backend URLs
  LOCAL_BACKEND: 'http://127.0.0.1:8000',
  PRODUCTION_BACKEND: 'https://road2royalty-backend.onrender.com',
  
  // Get the current backend URL
  getBackendUrl: function() {
    return this.USE_LOCAL_BACKEND ? this.LOCAL_BACKEND : this.PRODUCTION_BACKEND;
  }
};

// Export for use in components
export default LOCAL_DEV_CONFIG;
