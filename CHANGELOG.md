# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-05

### Added
- Keyboard shortcuts info section with browser-specific instructions
- Click-to-copy functionality for shortcut URLs with visual feedback
- Testing infrastructure with Vitest and ESLint
- Chrome extension validator script

### Changed
- Updated README with GitHub badges (stars, forks, watchers, install counts)
- Improved Firefox manifest with `data_collection_permissions`

### Fixed
- Content script errors on special pages by adding API safety checks
- innerHTML security warning by using safe DOM methods

## [1.1.0] - 2025-12-04

### Added
- Context menus with dynamic Add/Remove labels
- Enable/Disable website buttons in popup
- Tabbed settings page (Settings/Resources)
- HubSpot Documentation section with [Phosphor icons](https://phosphoricons.com?utm_source=freshjuice-hubspot-devtools)
- Juicy Blog integration with latest posts
- UTM tracking on external links
- Updated Privacy Policy with External Links section

### Changed
- Improved settings descriptions

### Fixed
- Persist debug modes across sessions on allowed domains

## [1.0.0] - 2025-11-28

### Added
- Initial release
- Debug Mode toggle (`hsDebug=true`)
- Cache Buster toggle (`hsCacheBuster={timestamp}`)
- BackOffice Developer Mode toggle (`developerMode=true`)
- Auto-apply debug parameters to internal links on hover
- Allowed domains management
- Quick links to HubL documentation (Functions, Variables, Filters, If Statements, Loops, HubDB)
- One-click access to HubSpot Design Manager
- Badge indicator showing active debug parameters
- Settings page with customizable options
- Support for Chrome (Manifest V3) and Firefox (Manifest V2)
- Dark mode support
- Keyboard shortcuts for toggling debug modes
