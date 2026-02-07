#!/bin/bash

# Build Safari extension using Xcode's web extension converter
# Requires: Xcode (full, not just Command Line Tools)
#
# This script:
# 1. Builds the web extension into dist/safari/
# 2. Converts it to an Xcode project using safari-web-extension-converter
#
# The resulting Xcode project can then be:
# - Built and run locally (self-signed for development)
# - Archived and submitted to the App Store (requires Apple Developer account)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$ROOT_DIR/dist"
SAFARI_DIST="$DIST_DIR/safari"
XCODE_PROJECT="$DIST_DIR/safari-xcode"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for Xcode
if ! xcrun --find safari-web-extension-converter &>/dev/null; then
  echo -e "${RED}Error: safari-web-extension-converter not found.${NC}"
  echo "This tool requires the full Xcode app (not just Command Line Tools)."
  echo ""
  echo "Install Xcode from the Mac App Store, then run:"
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  exit 1
fi

# Build the web extension first
echo -e "${YELLOW}Building Safari web extension...${NC}"
node "$SCRIPT_DIR/build.js" --target=safari

# Check that dist/safari exists
if [ ! -d "$SAFARI_DIST" ]; then
  echo -e "${RED}Error: dist/safari/ not found. Build failed.${NC}"
  exit 1
fi

# Clean previous Xcode project
if [ -d "$XCODE_PROJECT" ]; then
  echo "Removing previous Xcode project..."
  rm -rf "$XCODE_PROJECT"
fi

# Convert to Xcode project
echo -e "${YELLOW}Converting to Xcode project...${NC}"
xcrun safari-web-extension-converter "$SAFARI_DIST" \
  --project-location "$XCODE_PROJECT" \
  --app-name "HubSpot DevTools" \
  --bundle-identifier "dev.freshjuice.hubspot-devtools" \
  --no-open \
  --macos-only \
  --force

echo ""
echo -e "${GREEN}Safari Xcode project created at: dist/safari-xcode/${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Open the Xcode project:"
echo "     open $XCODE_PROJECT/*.xcodeproj"
echo ""
echo "  2. To run locally (self-signed, no Apple Developer account needed):"
echo "     - Select your development team (or Personal Team) in Xcode"
echo "     - Product > Run (Cmd+R)"
echo "     - Enable the extension in Safari > Settings > Extensions"
echo "     - Allow unsigned extensions: Safari > Settings > Advanced >"
echo "       'Show features for web developers', then Developer > Allow Unsigned Extensions"
echo ""
echo "  3. To submit to the App Store:"
echo "     - Set your Apple Developer team in Xcode"
echo "     - Product > Archive"
echo "     - Distribute App > App Store Connect"
echo ""
