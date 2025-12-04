/**
 * Options page script for HubSpot DevTools
 */

// Fun taglines for footer (prefix only, links added via DOM)
const TAGLINES = [
  'Squeezed by',
  'Freshly pressed by',
  'Blended with care by',
  'Juiced up by',
  'Cold-pressed by',
  'Hand-squeezed by',
  'Zested with love by',
  'Pulp-free, crafted by',
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
  // Set random tagline using DOM methods (avoids innerHTML security warning)
  const randomPrefix = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  footerTagline.textContent = '';
  footerTagline.appendChild(document.createTextNode(randomPrefix + ' '));

  const alexLink = document.createElement('a');
  alexLink.href = 'https://alex.zappa.dev?utm_source=freshjuice-hubspot-devtools';
  alexLink.target = '_blank';
  alexLink.textContent = 'Alex Zappa';
  footerTagline.appendChild(alexLink);

  footerTagline.appendChild(document.createTextNode(' at '));

  const fjLink = document.createElement('a');
  fjLink.href = 'https://freshjuice.dev?utm_source=freshjuice-hubspot-devtools';
  fjLink.target = '_blank';
  fjLink.textContent = 'FreshJuice';
  footerTagline.appendChild(fjLink);

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

  // Tab switching
  const subtitles = {
    settings: 'Configure your development tools preferences',
    resources: 'Useful links for HubSpot CMS developers'
  };

  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      // Update button states
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update content visibility
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');

      // Update subtitle
      document.getElementById('pageSubtitle').textContent = subtitles[tabId] || '';
    });
  });
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

// Fun blog CTAs
const BLOG_CTAS = [
  'Squeeze more juice from our blog →',
  'Thirsty for more? Visit the blog →',
  'Get your daily dose of fresh →',
  'More pulp at the blog →',
  'Sip more fresh content →',
  'Keep it fresh — visit the blog →',
];

/**
 * Fetch and render blog posts
 */
async function loadBlogPosts() {
  const container = document.getElementById('blogPosts');
  if (!container) return;

  const randomCta = BLOG_CTAS[Math.floor(Math.random() * BLOG_CTAS.length)];
  const utmParams = 'utm_source=freshjuice-hubspot-devtools';

  try {
    const response = await fetch('https://freshjuice.dev/feed.json');
    if (!response.ok) throw new Error('Failed to fetch');

    const feed = await response.json();
    const posts = feed.items || [];

    // Clear loading state
    container.textContent = '';

    if (posts.length === 0) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'blog-error';
      errorDiv.textContent = 'No posts available';
      container.appendChild(errorDiv);
      return;
    }

    // Create post elements safely using DOM methods
    posts.slice(0, 5).forEach(post => {
      const date = new Date(post.date_published).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const author = post.author?.name || 'FreshJuice';
      const postUrl = post.url + (post.url.includes('?') ? '&' : '?') + utmParams;

      const link = document.createElement('a');
      link.href = postUrl;
      link.target = '_blank';
      link.className = 'blog-post';

      const title = document.createElement('span');
      title.className = 'blog-post-title';
      title.textContent = post.title || '';

      const summary = document.createElement('span');
      summary.className = 'blog-post-summary';
      summary.textContent = post.summary || '';

      const meta = document.createElement('span');
      meta.className = 'blog-post-meta';
      meta.textContent = `${date} · ${author}`;

      link.appendChild(title);
      link.appendChild(summary);
      link.appendChild(meta);
      container.appendChild(link);
    });

    // Add "view all" link
    const viewAllLink = document.createElement('a');
    viewAllLink.href = `https://freshjuice.dev/blog/?${utmParams}`;
    viewAllLink.target = '_blank';
    viewAllLink.className = 'blog-view-all';
    viewAllLink.textContent = randomCta;
    container.appendChild(viewAllLink);

  } catch (error) {
    console.error('Failed to load blog posts:', error);
    container.textContent = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'blog-error';
    errorDiv.textContent = 'Failed to load posts';
    container.appendChild(errorDiv);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initOptions();
  loadBlogPosts();
});
