# FreshJuice HubSpot DevTools

[![Version](https://img.shields.io/github/v/release/freshjuice-dev/hubspot-devtools-extension)](https://github.com/freshjuice-dev/hubspot-devtools-extension/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/jmlcckldioeofjchfaomgaimhpnlfgok?logo=googlechrome&logoColor=white&label=Chrome%20installs&color=4285F4)](https://chromewebstore.google.com/detail/jmlcckldioeofjchfaomgaimhpnlfgok)
[![Firefox Add-ons](https://img.shields.io/amo/users/freshjuice-hubspot-devtools?logo=firefox&logoColor=white&label=Firefox%20installs&color=FF7139)](https://addons.mozilla.org/en-US/firefox/addon/freshjuice-hubspot-devtools/)
[![GitHub stars](https://img.shields.io/github/stars/freshjuice-dev/hubspot-devtools-extension)](https://github.com/freshjuice-dev/hubspot-devtools-extension/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/freshjuice-dev/hubspot-devtools-extension)](https://github.com/freshjuice-dev/hubspot-devtools-extension/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/freshjuice-dev/hubspot-devtools-extension)](https://github.com/freshjuice-dev/hubspot-devtools-extension/watchers)

A browser extension for HubSpot CMS developers with quick access to debug parameters and HubL documentation.

**[Learn more at freshjuice.dev/hubspot-devtools](https://freshjuice.dev/hubspot-devtools/)**

## Features

- **Debug Mode Toggle** - Quickly add `hsDebug=true` to your current page
- **Cache Buster** - Add `hsCacheBuster={timestamp}` to bypass caching
- **BackOffice Dev Mode** - Enable `developerMode=true` for HubSpot backend
- **Auto-apply to Links** - Automatically propagate debug parameters to internal links
- **HubL Quick Links** - Fast access to HubL documentation (Functions, Variables, Filters, Loops, If Statements, HubDB)
- **Design Manager** - One-click access to HubSpot Design Manager

## Screenshots

### Chrome

<p align="center">
  <img src="store-assets/screenshot-1.png" width="400" alt="Chrome - Popup (Light Mode)">
  <img src="store-assets/screenshot-2.png" width="400" alt="Chrome - Settings (Light Mode)">
</p>
<p align="center">
  <img src="store-assets/screenshot-3.png" width="400" alt="Chrome - Popup (Dark Mode)">
  <img src="store-assets/screenshot-4.png" width="400" alt="Chrome - Settings (Dark Mode)">
</p>

### Firefox

<p align="center">
  <img src="store-assets/ff-screenshot-1.png" width="400" alt="Firefox - Popup (Light Mode)">
  <img src="store-assets/ff-screenshot-2.png" width="400" alt="Firefox - Settings (Light Mode)">
</p>
<p align="center">
  <img src="store-assets/ff-screenshot-3.png" width="400" alt="Firefox - Popup (Dark Mode)">
  <img src="store-assets/ff-screenshot-4.png" width="400" alt="Firefox - Settings (Dark Mode)">
</p>

## Installation

### Install from Store (Recommended)

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/jmlcckldioeofjchfaomgaimhpnlfgok)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox_Add--ons-Install-FF7139?style=for-the-badge&logo=firefox&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/freshjuice-hubspot-devtools/)

<details>
<summary><strong>Manual Installation</strong></summary>

#### Chrome

1. Download the latest release from [Releases](https://github.com/freshjuice-dev/hubspot-devtools-extension/releases)
2. Unzip `hubspot-devtools-chrome-*.zip`
3. Open `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the unzipped folder

#### Firefox

1. Download the latest release from [Releases](https://github.com/freshjuice-dev/hubspot-devtools-extension/releases)
2. Open `about:addons`
3. Click the gear icon and select "Install Add-on From File..."
4. Select `hubspot-devtools-firefox-*.zip`

</details>

## Development

### Prerequisites

- Node.js 22+

### Setup

```bash
# Install dependencies
npm install

# Build for all browsers
npm run build:all

# Build for specific browser
npm run build:chrome
npm run build:firefox

# Watch mode for development
npm run dev:chrome
npm run dev:firefox

# Create release zips
npm run release
```

### Testing & Validation

```bash
# Run unit tests
npm run test

# Run ESLint
npm run lint

# Validate Chrome extension
npm run validate:chrome

# Validate Firefox extension
npm run validate:firefox

# Run all validations (lint + test + chrome + firefox)
npm run validate
```

### Project Structure

```
src/
├── manifest/        # Browser-specific manifest files
├── popup/           # Extension popup UI
├── options/         # Settings page
├── background/      # Service worker / background script
├── content/         # Content script for link modification
├── lib/             # Shared utilities
└── assets/          # Icons and images
```

## Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs

Found a bug? Please [open an issue](https://github.com/freshjuice-dev/hubspot-devtools-extension/issues/new?template=bug_report.md) with:
- Browser and version
- Extension version
- Operating system
- Steps to reproduce
- Expected vs actual behavior

### Suggesting Features

Have an idea? [Submit a feature request](https://github.com/freshjuice-dev/hubspot-devtools-extension/issues/new?template=feature_request.md) describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Pull Requests

Want to contribute code? Great!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test on both Chrome and Firefox
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Privacy

This extension does not collect any personal data. See our [Privacy Policy](PRIVACY.md) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## License

[MIT](LICENSE) - Created by [Alex Zappa](https://alex.zappa.dev) at [FreshJuice](https://freshjuice.dev)
