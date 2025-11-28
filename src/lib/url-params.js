/**
 * URL Parameters configuration and utilities
 */
(function() {
  'use strict';

  const URL_PARAMS = {
    hsDebug: { key: 'hsDebug', value: 'true' },
    cacheBuster: { key: 'hsCacheBuster', value: () => Date.now().toString() },
    developerMode: { key: 'developerMode', value: 'true' }
  };

  /**
   * Get active parameters based on current mode states
   * @param {Object} modes - Object with mode states (hsDebug, cacheBuster, developerMode)
   * @returns {Object} - Object with parameter key-value pairs
   */
  function getActiveParams(modes) {
    const params = {};

    Object.entries(modes).forEach(([mode, isActive]) => {
      if (isActive && URL_PARAMS[mode]) {
        const { key, value } = URL_PARAMS[mode];
        params[key] = typeof value === 'function' ? value() : value;
      }
    });

    return params;
  }

  /**
   * Add parameters to a URL
   * @param {string} url - The URL to modify
   * @param {Object} params - Parameters to add
   * @returns {string} - Modified URL
   */
  function addParamsToUrl(url, params) {
    try {
      const urlObj = new URL(url);

      for (const [key, value] of Object.entries(params)) {
        // Don't duplicate params
        if (!urlObj.searchParams.has(key)) {
          urlObj.searchParams.set(key, value);
        }
      }

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Remove our parameters from a URL
   * @param {string} url - The URL to clean
   * @returns {string} - Cleaned URL
   */
  function removeParamsFromUrl(url) {
    try {
      const urlObj = new URL(url);

      Object.values(URL_PARAMS).forEach(({ key }) => {
        urlObj.searchParams.delete(key);
      });

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Export to window
  window.URL_PARAMS = URL_PARAMS;
  window.getActiveParams = getActiveParams;
  window.addParamsToUrl = addParamsToUrl;
  window.removeParamsFromUrl = removeParamsFromUrl;
})();
