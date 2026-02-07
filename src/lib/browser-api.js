/**
 * Cross-browser API wrapper
 * Provides unified API for Chrome and Firefox (both MV3)
 */
(function() {
  'use strict';

  var api;

  if (typeof browser !== 'undefined' && browser.runtime) {
    api = browser;
  } else if (typeof chrome !== 'undefined' && chrome.runtime) {
    api = chrome;
  } else {
    console.warn('HubSpot DevTools: Browser API not available');
    api = null;
  }

  // Export to window
  window.browserAPI = api;
})();
