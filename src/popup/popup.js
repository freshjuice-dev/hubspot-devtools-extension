/**
 * Popup script for HubSpot DevTools
 */

// Fun taglines for footer
const POPUP_TAGLINES = [
  'Freshly squeezed by FreshJuice 🍊',
  'Get more juice at FreshJuice 🧃',
  'Powered by FreshJuice 🍋',
  'A fresh blend from FreshJuice 🥤',
  'Sip more at FreshJuice 🍹',
  'Vitamin-packed by FreshJuice 🍇',
  'Stay fresh with FreshJuice 🍉',
  '100% organic FreshJuice 🥝',
];

// DOM Elements
const toggles = {
  hsDebug: document.getElementById('hsDebug'),
  cacheBuster: document.getElementById('cacheBuster'),
  developerMode: document.getElementById('developerMode')
};
const settingsLink = document.getElementById('settingsLink');
const footerTagline = document.getElementById('footerTagline');
const enableButton = document.getElementById('enableWebsite');
const forgetButton = document.getElementById('forgetWebsite');

/**
 * Check if URL has a specific param
 * @param {URL} url - URL object
 * @param {string} key - Param key to check
 * @returns {boolean}
 */
function urlHasParam(url, key) {
  return url.searchParams.has(key);
}

/**
 * Get toggle states from current URL params
 * @param {string} urlString - Current page URL
 * @returns {Object} - Mode states based on URL
 */
function getModesFromUrl(urlString) {
  const modes = {
    hsDebug: false,
    cacheBuster: false,
    developerMode: false
  };

  try {
    const url = new URL(urlString);

    // Check each param
    Object.entries(URL_PARAMS).forEach(([mode, { key }]) => {
      modes[mode] = urlHasParam(url, key);
    });
  } catch (e) {
    // Invalid URL, return all false
  }

  return modes;
}

/**
 * Initialize popup with current URL state
 */
async function initPopup() {
  // Set random tagline
  footerTagline.textContent = POPUP_TAGLINES[Math.floor(Math.random() * POPUP_TAGLINES.length)];

  // Get current tab
  const current = await getCurrentTab();

  if (current && current.tab.url) {
    // Set toggle states based on URL params
    const modes = getModesFromUrl(current.tab.url);
    Object.entries(toggles).forEach(([mode, element]) => {
      element.checked = modes[mode];
    });

    // Show enable/disable button based on domain status and URL params
    await updateWebsiteButtons(current.domain, current.tab.url);
  } else {
    // No valid URL, disable all toggles
    Object.values(toggles).forEach(element => {
      element.checked = false;
    });
  }

  // Add event listeners
  setupEventListeners();
}

/**
 * Check if URL has any debug params
 * @param {string} urlString - URL to check
 * @returns {boolean}
 */
function urlHasDebugParams(urlString) {
  try {
    const url = new URL(urlString);
    return url.searchParams.has('hsDebug') ||
           url.searchParams.has('hsCacheBuster') ||
           url.searchParams.has('developerMode');
  } catch {
    return false;
  }
}

/**
 * Update enable/disable button visibility and toggle styles
 * @param {string} domain - Current domain
 * @param {string} urlString - Current URL
 */
async function updateWebsiteButtons(domain, urlString) {
  const state = await getState();
  const allowedDomains = state.domains.allowedDomains || [];
  const isAllowed = allowedDomains.includes(domain);
  const hasDebugParams = urlHasDebugParams(urlString);

  // Update toggle card styles based on managed/unmanaged state
  const toggleCards = document.querySelectorAll('.toggle-card');
  toggleCards.forEach(card => {
    card.classList.toggle('unmanaged', !isAllowed);
  });

  if (isAllowed) {
    // Domain is whitelisted - show disable button
    enableButton.style.display = 'none';
    forgetButton.style.display = 'flex';
  } else if (hasDebugParams) {
    // Domain not whitelisted but URL has debug params - show enable button
    enableButton.style.display = 'flex';
    forgetButton.style.display = 'none';
  } else {
    // Domain not whitelisted and no debug params - hide both
    enableButton.style.display = 'none';
    forgetButton.style.display = 'none';
  }
}

/**
 * Get current tab info
 * @returns {Promise<{tab: Object, domain: string}|null>}
 */
async function getCurrentTab() {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab && tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      return { tab, domain: url.hostname.toLowerCase() };
    }
  } catch (e) {
    console.error('Failed to get current tab:', e);
  }
  return null;
}

/**
 * Add domain to allowed domains if not already present
 * @param {string} domain - Domain to add
 */
async function addToAllowedDomains(domain) {
  if (!domain) return;

  const state = await getState();
  const allowedDomains = state.domains.allowedDomains || [];

  if (!allowedDomains.includes(domain)) {
    allowedDomains.push(domain);
    await updateState('domains', { allowedDomains });
  }
}

/**
 * Apply current toggle states to the page
 * @param {Object} tab - Current tab
 */
async function applyToPage(tab) {
  if (!tab || !tab.url || !tab.url.startsWith('http')) return;

  // Build params from current toggle states
  const params = {};
  Object.entries(toggles).forEach(([mode, element]) => {
    if (element.checked && URL_PARAMS[mode]) {
      const { key, value } = URL_PARAMS[mode];
      params[key] = typeof value === 'function' ? value() : value;
    }
  });

  // Remove all our params first, then add only the active ones
  const cleanUrl = removeParamsFromUrl(tab.url);
  const newUrl = addParamsToUrl(cleanUrl, params);

  // Update tab URL (this reloads the page)
  await browserAPI.tabs.update(tab.id, { url: newUrl });

  // Close popup
  window.close();
}

/**
 * Handle toggle change - immediately applies to current page
 * @param {string} mode - Mode name
 * @param {boolean} checked - New checked state
 */
async function handleToggleChange(mode, checked) {
  // Get current tab
  const current = await getCurrentTab();
  if (!current) return;

  // Auto-add domain to allowed domains when enabling a toggle
  if (checked) {
    await addToAllowedDomains(current.domain);
  }

  // Save mode states to storage for persistence
  await saveModeStates();

  // Notify background script for badge update
  notifyBackgroundScript();

  // Apply changes to current page
  await applyToPage(current.tab);
}

/**
 * Save current toggle states to storage
 */
async function saveModeStates() {
  const modes = {};
  Object.entries(toggles).forEach(([mode, element]) => {
    modes[mode] = element.checked;
  });
  await updateState('modes', modes);
}

/**
 * Setup event listeners for all interactive elements
 */
function setupEventListeners() {
  // Toggle switches
  Object.entries(toggles).forEach(([mode, element]) => {
    element.addEventListener('change', async (e) => {
      await handleToggleChange(mode, e.target.checked);
    });
  });

  // Toggle cards (click anywhere on card to toggle)
  document.querySelectorAll('.toggle-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      // Don't trigger if clicking directly on the switch
      if (e.target.closest('.toggle-switch')) return;

      const mode = card.dataset.toggle;
      const checkbox = toggles[mode];
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        await handleToggleChange(mode, checkbox.checked);
      }
    });
  });

  // Settings link
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    browserAPI.runtime.openOptionsPage();
  });

  // Enable website button
  enableButton.addEventListener('click', async () => {
    const current = await getCurrentTab();
    if (!current) return;

    await enableWebsite(current.domain);
  });

  // Forget website button
  forgetButton.addEventListener('click', async () => {
    const current = await getCurrentTab();
    if (!current) return;

    const confirmed = confirm(`Disable HubSpot DevTools for "${current.domain}"?\n\nThis will remove the domain from the allowed list and clear all debug parameters.`);
    if (!confirmed) return;

    await forgetWebsite(current.domain, current.tab);
  });
}

/**
 * Enable a website - add to allowed list and save current modes
 * @param {string} domain - Domain to enable
 */
async function enableWebsite(domain) {
  // Add domain to allowed list
  await addToAllowedDomains(domain);

  // Save current toggle states
  await saveModeStates();

  // Notify background script
  notifyBackgroundScript();

  // Update buttons
  enableButton.style.display = 'none';
  forgetButton.style.display = 'flex';

  // Remove unmanaged class from toggle cards (they're now managed)
  document.querySelectorAll('.toggle-card').forEach(card => {
    card.classList.remove('unmanaged');
  });
}

/**
 * Forget a website - remove from allowed list and clear debug params
 * @param {string} domain - Domain to forget
 * @param {Object} tab - Current tab
 */
async function forgetWebsite(domain, tab) {
  // Remove domain from allowed list
  const state = await getState();
  const allowedDomains = state.domains.allowedDomains || [];
  const updatedDomains = allowedDomains.filter(d => d !== domain);
  await updateState('domains', { allowedDomains: updatedDomains });

  // Clear all debug params from URL and reload
  if (tab && tab.url) {
    const cleanUrl = removeParamsFromUrl(tab.url);
    await browserAPI.tabs.update(tab.id, { url: cleanUrl });
  }

  // Notify background script
  notifyBackgroundScript();

  // Close popup
  window.close();
}

/**
 * Notify background script of state changes
 */
function notifyBackgroundScript() {
  browserAPI.runtime.sendMessage({ action: 'stateChanged' });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPopup);
