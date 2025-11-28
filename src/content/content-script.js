/**
 * Content script for HubSpot DevTools
 * Modifies link hrefs on hover to add debug parameters
 */

(function() {
  'use strict';

  // Guard against multiple injections
  if (window.__hsDevToolsContentScript) {
    window.__hsDevToolsContentScript.init();
    return;
  }

  // Current state
  let state = null;
  let isEnabled = false;

  /**
   * Normalize hostname by removing www prefix
   * @param {string} hostname - Hostname to normalize
   * @returns {string}
   */
  function normalizeHostname(hostname) {
    return hostname.toLowerCase().replace(/^www\./, '');
  }

  /**
   * Check if two hostnames belong to the same domain
   * @param {string} hostname1 - First hostname
   * @param {string} hostname2 - Second hostname
   * @returns {boolean}
   */
  function isSameDomain(hostname1, hostname2) {
    return normalizeHostname(hostname1) === normalizeHostname(hostname2);
  }

  /**
   * Check if current domain is in the allowed domains list
   * @param {Object} domains - Domain filter settings
   * @returns {boolean}
   */
  function isDomainAllowed(domains) {
    if (!domains) return false;

    const currentDomain = window.location.hostname.toLowerCase();
    const allowedDomains = domains.allowedDomains || domains.whitelist || [];

    if (allowedDomains.length === 0) {
      return false;
    }

    return allowedDomains.some(domain =>
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
  }

  /**
   * Check if current page URL has any debug params
   * @returns {boolean}
   */
  function pageHasDebugParams() {
    try {
      const url = new URL(window.location.href);
      const paramKeys = ['hsDebug', 'hsCacheBuster', 'developerMode'];
      return paramKeys.some(key => url.searchParams.has(key));
    } catch (e) {
      return false;
    }
  }

  /**
   * Get active parameters from current page URL
   * @returns {Object} - Key-value pairs of active params
   */
  function getActiveParamsFromUrl() {
    const params = {};

    try {
      const url = new URL(window.location.href);

      if (typeof URL_PARAMS !== 'undefined') {
        Object.entries(URL_PARAMS).forEach(([mode, { key, value }]) => {
          if (url.searchParams.has(key)) {
            // Use the value from URL or generate new one for dynamic values
            params[key] = typeof value === 'function' ? value() : url.searchParams.get(key);
          }
        });
      }
    } catch (e) {
      // Invalid URL
    }

    return params;
  }

  /**
   * Check if a link should be modified
   * @param {string} href - Link href
   * @returns {boolean}
   */
  function shouldModifyLink(href) {
    if (!href) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('javascript:')) return false;
    if (href.startsWith('mailto:')) return false;
    if (href.startsWith('tel:')) return false;

    try {
      const url = new URL(href, window.location.origin);

      // Only modify http(s) links
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

      // Only modify same-domain links
      if (!isSameDomain(url.hostname, window.location.hostname)) return false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add parameters to URL
   * @param {string} href - Original URL
   * @param {Object} params - Parameters to add
   * @returns {string} - Modified URL
   */
  function addParamsToUrl(href, params) {
    try {
      const url = new URL(href, window.location.origin);

      Object.entries(params).forEach(([key, value]) => {
        // Always set/update the param
        url.searchParams.set(key, value);
      });

      return url.toString();
    } catch {
      return href;
    }
  }

  /**
   * Handle mouse enter on links
   * @param {Event} event - Mouse event
   */
  function handleMouseEnter(event) {
    if (!isEnabled) return;

    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!shouldModifyLink(href)) return;

    // Get active params from current page URL
    const params = getActiveParamsFromUrl();
    if (Object.keys(params).length === 0) return;

    // Store original href if not already stored
    if (!link.dataset.hsOriginalHref) {
      link.dataset.hsOriginalHref = link.href;
    }

    // Modify the URL
    const newUrl = addParamsToUrl(link.href, params);
    if (newUrl !== link.href) {
      link.href = newUrl;
    }
  }

  /**
   * Update enabled state based on current conditions
   */
  function updateEnabledState() {
    if (!state) {
      isEnabled = false;
      return;
    }

    // Check all conditions:
    // 1. Auto-apply to links is enabled in settings
    // 2. Current domain is in allowed list
    // 3. Current page has debug params in URL
    const autoApplyEnabled = state.settings && state.settings.autoApplyToLinks;
    const domainAllowed = isDomainAllowed(state.domains);
    const hasDebugParams = pageHasDebugParams();

    isEnabled = autoApplyEnabled && domainAllowed && hasDebugParams;
  }

  /**
   * Initialize content script
   */
  async function init() {
    const api = typeof browser !== 'undefined' ? browser : chrome;

    try {
      const result = await api.storage.sync.get('state');
      state = result.state;
      updateEnabledState();
    } catch (e) {
      console.error('HubSpot DevTools: Failed to initialize', e);
    }
  }

  /**
   * Listen for messages from popup/background
   */
  const api = typeof browser !== 'undefined' ? browser : chrome;

  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'settingsChanged':
        init();
        break;

      case 'activate':
        state = message.state;
        updateEnabledState();
        break;

      case 'deactivate':
        isEnabled = false;
        break;
    }

    sendResponse({ success: true });
    return true;
  });

  /**
   * Listen for storage changes
   */
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.state) {
      state = changes.state.newValue;
      updateEnabledState();
    }
  });

  // Add hover listener to document (capture phase)
  document.addEventListener('mouseover', handleMouseEnter, true);

  // Initialize
  init();

  // Register for re-injection handling
  window.__hsDevToolsContentScript = {
    init: init
  };

})();
