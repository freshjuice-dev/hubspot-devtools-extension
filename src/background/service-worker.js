/**
 * Service Worker for Chrome (Manifest V3)
 * Handles background tasks, badge updates, and messaging
 */

// Default state (duplicated here since service workers can't import modules easily)
const DEFAULT_STATE = {
  modes: {
    hsDebug: false,
    cacheBuster: false,
    developerMode: false
  },
  settings: {
    autoApplyToLinks: true,
    showBadge: true,
    persistAcrossSessions: true
  },
  domains: {
    allowedDomains: []
  }
};

/**
 * Initialize default state on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({ state: DEFAULT_STATE });
  }
});

/**
 * Update badge when storage changes
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.state) {
    updateBadgeForActiveTab();
  }
});

/**
 * Update badge when active tab changes
 */
chrome.tabs.onActivated.addListener(() => {
  updateBadgeForActiveTab();
});

/**
 * Update badge when tab URL changes
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateBadgeForActiveTab();
  }
});

/**
 * Handle navigation completion - apply persisted params if needed
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) return;

  const tabId = details.tabId;
  const url = details.url;

  // Skip non-http URLs
  if (!url || !url.startsWith('http')) return;

  // Check if this tab was being redirected - if so, clear the flag and skip
  if (redirectingTabs.has(tabId)) {
    redirectingTabs.delete(tabId);
    return;
  }

  try {
    const result = await chrome.storage.sync.get('state');
    const state = result.state || DEFAULT_STATE;
    const allowedDomains = state.domains.allowedDomains || [];

    const urlObj = new URL(url);
    const domainAllowed = isDomainAllowed(urlObj.hostname, allowedDomains);

    if (domainAllowed) {
      // Auto-apply saved modes if persistAcrossSessions is enabled
      if (state.settings.persistAcrossSessions) {
        await maybeApplySavedModes(tabId, url, state);
      }

      // Inject content script
      await injectContentScript(tabId);
    }
  } catch (e) {
    // Ignore errors
  }
});

/**
 * Check if saved modes should be applied and redirect if needed
 * @param {number} tabId - Tab ID
 * @param {string} urlString - Current URL
 * @param {Object} state - Current state
 */
async function maybeApplySavedModes(tabId, urlString, state) {
  const modes = state.modes || {};

  // Check if any modes are active
  const activeModes = Object.entries(modes).filter(([_, isActive]) => isActive);
  if (activeModes.length === 0) {
    return;
  }

  try {
    const url = new URL(urlString);

    // Check which params need to be added or updated
    const paramsToSet = {};
    let needsUpdate = false;

    activeModes.forEach(([mode]) => {
      const paramKey = URL_PARAM_KEYS[mode];
      if (!paramKey) return;

      if (mode === 'cacheBuster') {
        // Always update cacheBuster with fresh timestamp on each navigation
        const newTimestamp = Date.now().toString();
        const currentValue = url.searchParams.get(paramKey);
        if (currentValue !== newTimestamp) {
          paramsToSet[paramKey] = newTimestamp;
          needsUpdate = true;
        }
      } else {
        // For other params, only add if missing
        if (!url.searchParams.has(paramKey)) {
          paramsToSet[paramKey] = 'true';
          needsUpdate = true;
        }
      }
    });

    // If no updates needed, skip redirect
    if (!needsUpdate) {
      return;
    }

    // Update params in URL
    Object.entries(paramsToSet).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    // Mark this tab as redirecting to prevent loops
    redirectingTabs.add(tabId);

    // Redirect to the new URL
    await chrome.tabs.update(tabId, { url: url.toString() });
  } catch (e) {
    console.error('Failed to apply saved modes:', e);
  }
}

/**
 * Check if domain is in allowed list
 * @param {string} hostname - Domain to check
 * @param {string[]} allowedDomains - List of allowed domains
 * @returns {boolean}
 */
function isDomainAllowed(hostname, allowedDomains) {
  if (!hostname || !allowedDomains || allowedDomains.length === 0) {
    return false;
  }

  const domain = hostname.toLowerCase();
  return allowedDomains.some(allowed =>
    domain === allowed || domain.endsWith('.' + allowed)
  );
}

// URL param keys to check
const URL_PARAM_KEYS = {
  hsDebug: 'hsDebug',
  cacheBuster: 'hsCacheBuster',
  developerMode: 'developerMode'
};

// Track tabs being redirected to prevent loops
const redirectingTabs = new Set();

/**
 * Count active params in URL
 * @param {string} urlString - URL to check
 * @returns {number} - Count of active params
 */
function countActiveParamsInUrl(urlString) {
  try {
    const url = new URL(urlString);
    let count = 0;

    Object.values(URL_PARAM_KEYS).forEach(key => {
      if (url.searchParams.has(key)) {
        count++;
      }
    });

    return count;
  } catch (e) {
    return 0;
  }
}

/**
 * Update badge for the currently active tab
 */
async function updateBadgeForActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.storage.sync.get('state');
    const state = result.state || DEFAULT_STATE;

    // Check if badge should be shown at all
    if (!state.settings.showBadge) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    // Check if current tab is on an allowed domain
    let isAllowed = false;
    let activeCount = 0;

    if (tab && tab.url && tab.url.startsWith('http')) {
      try {
        const url = new URL(tab.url);
        const allowedDomains = state.domains.allowedDomains || [];
        isAllowed = isDomainAllowed(url.hostname, allowedDomains);

        // Count active params from URL, not stored state
        if (isAllowed) {
          activeCount = countActiveParamsInUrl(tab.url);
        }
      } catch (e) {
        // Invalid URL
      }
    }

    // Only show badge if domain is allowed and has active params
    if (!isAllowed || activeCount === 0) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    await chrome.action.setBadgeText({ text: activeCount.toString() });
    await chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

/**
 * Process incoming messages
 * @param {Object} message - Message object
 * @param {Object} sender - Sender information
 * @returns {Promise<Object>} - Response object
 */
async function handleMessage(message, sender) {
  switch (message.action) {
    case 'stateChanged':
      await updateBadgeForActiveTab();
      // Inject content script into active tab when state changes
      await injectContentScriptIntoActiveTab();
      return { success: true };

    case 'settingsChanged':
      await updateBadgeForActiveTab();
      return { success: true };

    case 'getState':
      const result = await chrome.storage.sync.get('state');
      return { state: result.state || DEFAULT_STATE };

    case 'applyToCurrentTab':
      await applyParamsToTab(message.tabId, message.params);
      return { success: true };

    case 'injectContentScript':
      await injectContentScript(message.tabId);
      return { success: true };

    default:
      return { error: 'Unknown action' };
  }
}

/**
 * Apply parameters to a specific tab
 * @param {number} tabId - Tab ID
 * @param {Object} params - Parameters to add
 */
async function applyParamsToTab(tabId, params) {
  const tab = await chrome.tabs.get(tabId);

  if (!tab.url || !tab.url.startsWith('http')) {
    return;
  }

  const url = new URL(tab.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, typeof value === 'function' ? value() : value);
  });

  await chrome.tabs.update(tabId, { url: url.toString() });
}

/**
 * Inject content script into a tab (Chrome MV3)
 * @param {number} tabId - Tab ID to inject into
 */
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['lib/browser-api.js', 'lib/url-params.js', 'content/content-script.js']
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

/**
 * Inject content script into the active tab
 */
async function injectContentScriptIntoActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url && tab.url.startsWith('http')) {
      await injectContentScript(tab.id);
    }
  } catch (error) {
    console.error('Failed to inject content script into active tab:', error);
  }
}

// Initialize badge on startup
updateBadgeForActiveTab();
