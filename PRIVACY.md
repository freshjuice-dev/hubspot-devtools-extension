# Privacy Policy

## FreshJuice HubSpot DevTools

**Last updated:** November 2025

### Overview

FreshJuice HubSpot DevTools is a browser extension designed to help HubSpot CMS developers debug and develop websites more efficiently. We are committed to protecting your privacy.

### Data Collection

**This extension does not collect, store, or transmit any personal data.**

Specifically, we do NOT collect:
- Personal information
- Browsing history
- Website content
- Analytics or usage data
- Cookies or tracking information

### Data Storage

The extension stores only your preferences locally in your browser using the browser's built-in storage API (`chrome.storage.sync` or `browser.storage.sync`). This includes:

- Toggle states (Debug Mode, Cache Buster, Developer Mode)
- Settings preferences (auto-apply to links, show badge)
- List of allowed domains you've configured

This data:
- Never leaves your browser
- Is not transmitted to any external servers
- Is synced only through your browser's built-in sync feature (if enabled)
- Can be cleared at any time through the extension settings

### Permissions

The extension requires certain permissions to function:

- **storage**: To save your preferences locally
- **tabs**: To read the current tab URL and update badge
- **activeTab**: To apply debug parameters to the current page
- **host_permissions** (`<all_urls>`): To modify links on pages you visit (only on domains you've allowed)

### Third-Party Services

This extension does not use any third-party analytics, tracking, or data collection services.

### Open Source

This extension is open source. You can review the complete source code at:
https://github.com/freshjuice-dev/hubspot-devtools-extension

### Contact

If you have any questions about this privacy policy, please open an issue on our GitHub repository:
https://github.com/freshjuice-dev/hubspot-devtools-extension/issues

### Changes

Any changes to this privacy policy will be reflected in this document and in the GitHub repository.
