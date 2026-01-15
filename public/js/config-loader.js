/**
 * Config Loader - Loads public configuration from API
 * This allows customizing contact details via environment variables
 */

(function() {
  // Default config (used if API fails)
  const defaultConfig = {
    appName: 'GameBlast Mobile',
    supportEmail: 'support@example.com',
    supportWhatsApp: '+919876543210',
    supportHours: '9 AM - 9 PM IST',
    appUrl: ''
  };

  // Store config globally
  window.appConfig = defaultConfig;

  // Load config from API
  async function loadConfig() {
    try {
      const response = await fetch('/api/config/public');
      if (response.ok) {
        const config = await response.json();
        window.appConfig = config;
        updatePageWithConfig(config);
      }
    } catch (error) {
      console.warn('Could not load config from API, using defaults:', error);
    }
  }

  // Update page elements with config values
  function updatePageWithConfig(config) {
    // Update all elements with data-config attributes
    document.querySelectorAll('[data-config]').forEach(element => {
      const configKey = element.getAttribute('data-config');
      if (config[configKey]) {
        if (element.tagName === 'A') {
          // Handle links
          if (configKey === 'supportEmail') {
            element.href = `mailto:${config[configKey]}`;
            element.textContent = config[configKey];
          } else if (configKey === 'supportWhatsApp') {
            const cleanNumber = config[configKey].replace(/[^0-9+]/g, '');
            element.href = `https://wa.me/${cleanNumber}`;
            element.textContent = config[configKey];
          } else if (configKey === 'appUrl') {
            element.href = config[configKey];
          }
        } else {
          element.textContent = config[configKey];
        }
      }
    });

    // Update page title if app name is configured
    if (config.appName) {
      const titleElement = document.querySelector('title');
      if (titleElement && titleElement.textContent.includes('GameBlast')) {
        titleElement.textContent = titleElement.textContent.replace('GameBlast Mobile', config.appName);
      }
      
      // Update logo text
      document.querySelectorAll('.logo').forEach(logo => {
        if (logo.textContent.includes('GameBlast')) {
          logo.textContent = config.appName;
        }
      });
    }
  }

  // Load config when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
  } else {
    loadConfig();
  }

  // Expose function to reload config
  window.reloadAppConfig = loadConfig;
})();
