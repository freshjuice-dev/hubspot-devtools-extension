/**
 * Background script for Firefox (Manifest V2)
 * Handles background tasks, badge updates, and messaging
 */

// Default state
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
browserAPI.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await browserAPI.storage.sync.set({ state: DEFAULT_STATE });
  }
});

/**
 * Update badge when storage changes
 */
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.state) {
    updateBadgeForActiveTab();
  }
});

/**
 * Update badge when active tab changes
 */
browserAPI.tabs.onActivated.addListener(() => {
  updateBadgeForActiveTab();
});

/**
 * Update badge when tab URL changes and inject content script if needed
 */
browserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    updateBadgeForActiveTab();

    // Inject content script if domain is allowed
    try {
      const result = await browserAPI.storage.sync.get('state');
      const state = result.state || DEFAULT_STATE;
      const allowedDomains = state.domains.allowedDomains || [];

      const url = new URL(tab.url);
      if (isDomainAllowed(url.hostname, allowedDomains)) {
        await injectContentScript(tabId);
      }
    } catch (e) {
      // Ignore errors
    }
  } else if (changeInfo.url) {
    updateBadgeForActiveTab();
  }
});

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
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const result = await browserAPI.storage.sync.get('state');
    const state = result.state || DEFAULT_STATE;

    // Check if badge should be shown at all
    if (!state.settings.showBadge) {
      await browserAPI.browserAction.setBadgeText({ text: '' });
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
      await browserAPI.browserAction.setBadgeText({ text: '' });
      return;
    }

    await browserAPI.browserAction.setBadgeText({ text: activeCount.toString() });
    await browserAPI.browserAction.setBadgeBackgroundColor({ color: '#16a34a' });
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

/**
 * Handle messages from popup and content scripts
 */
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
      const result = await browserAPI.storage.sync.get('state');
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
  const tab = await browserAPI.tabs.get(tabId);

  if (!tab.url || !tab.url.startsWith('http')) {
    return;
  }

  const url = new URL(tab.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, typeof value === 'function' ? value() : value);
  });

  await browserAPI.tabs.update(tabId, { url: url.toString() });
}

/**
 * Inject content script into a tab (Firefox MV2)
 * @param {number} tabId - Tab ID to inject into
 */
async function injectContentScript(tabId) {
  try {
    // Firefox MV2 uses tabs.executeScript
    await browserAPI.tabs.executeScript(tabId, { file: 'lib/browser-api.js' });
    await browserAPI.tabs.executeScript(tabId, { file: 'lib/url-params.js' });
    await browserAPI.tabs.executeScript(tabId, { file: 'content/content-script.js' });
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

/**
 * Inject content script into the active tab
 */
async function injectContentScriptIntoActiveTab() {
  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url && tab.url.startsWith('http')) {
      await injectContentScript(tab.id);
    }
  } catch (error) {
    console.error('Failed to inject content script into active tab:', error);
  }
}

// Initialize badge on startup
updateBadgeForActiveTab();
