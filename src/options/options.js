/**
 * Options page script for HubSpot DevTools
 */

// Fun taglines for footer
const TAGLINES = [
  'Squeezed by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Freshly pressed by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Blended with care by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Juiced up by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Cold-pressed by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Hand-squeezed by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Zested with love by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
  'Pulp-free, crafted by <a href="https://alex.zappa.dev" target="_blank">Alex Zappa</a> at <a href="https://freshjuice.dev" target="_blank">FreshJuice</a>',
];

// DOM Elements
const autoApplyCheckbox = document.getElementById('autoApplyToLinks');
const showBadgeCheckbox = document.getElementById('showBadge');
const persistCheckbox = document.getElementById('persistAcrossSessions');
const allowedDomainsTextarea = document.getElementById('allowedDomains');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const statusMessage = document.getElementById('statusMessage');
const footerTagline = document.getElementById('footerTagline');

/**
 * Initialize options page with current state
 */
async function initOptions() {
  // Set random tagline
  const randomTagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  footerTagline.innerHTML = randomTagline;

  // Load current state
  const state = await getState();

  // Set checkbox states
  autoApplyCheckbox.checked = state.settings.autoApplyToLinks;
  showBadgeCheckbox.checked = state.settings.showBadge;
  persistCheckbox.checked = state.settings.persistAcrossSessions;

  // Set allowed domains (migrate from old whitelist if needed)
  const allowedDomains = state.domains.allowedDomains || state.domains.whitelist || [];
  allowedDomainsTextarea.value = allowedDomains.join('\n');

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  saveButton.addEventListener('click', saveSettings);
  resetButton.addEventListener('click', resetSettings);
}

/**
 * Parse textarea content to array of domains
 * @param {string} text - Textarea content
 * @returns {string[]} - Array of domains
 */
function parseDomainList(text) {
  return text
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0);
}

/**
 * Save current settings
 */
async function saveSettings() {
  try {
    const state = await getState();

    // Update settings
    state.settings.autoApplyToLinks = autoApplyCheckbox.checked;
    state.settings.showBadge = showBadgeCheckbox.checked;
    state.settings.persistAcrossSessions = persistCheckbox.checked;

    // Update domains
    state.domains.allowedDomains = parseDomainList(allowedDomainsTextarea.value);
    // Remove old fields
    delete state.domains.whitelist;
    delete state.domains.blacklist;

    // Save state
    await saveState(state);

    // Notify background script
    browserAPI.runtime.sendMessage({ action: 'settingsChanged' });

    // Show success message
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving settings. Please try again.', 'error');
    console.error('Error saving settings:', error);
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    const state = await resetState();

    // Update UI
    autoApplyCheckbox.checked = state.settings.autoApplyToLinks;
    showBadgeCheckbox.checked = state.settings.showBadge;
    persistCheckbox.checked = state.settings.persistAcrossSessions;
    allowedDomainsTextarea.value = '';

    // Notify background script
    browserAPI.runtime.sendMessage({ action: 'settingsChanged' });

    // Show success message
    showStatus('Settings reset to defaults.', 'success');
  } catch (error) {
    showStatus('Error resetting settings. Please try again.', 'error');
    console.error('Error resetting settings:', error);
  }
}

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  // Hide after 3 seconds
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initOptions);
