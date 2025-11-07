# Chrome Extension for EventFlow

## Setup Instructions

1. Update `manifest.json`:
   - Replace `https://your-domain.com` with your actual domain
   - Update icon paths if needed

2. Create icons:
   - Create `icons/` folder
   - Add `icon16.png`, `icon48.png`, `icon128.png` (16x16, 48x48, 128x128 pixels)

3. Update API endpoints:
   - Replace `https://your-domain.com` in `background.js` and `popup.js`

4. Load extension:
   - Open Chrome → Extensions → Developer mode
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

5. Test:
   - Select text on any webpage
   - Right-click → "Extract Event with EventFlow"
   - Or use Ctrl+Shift+E (Cmd+Shift+E on Mac)

## Features

- Context menu extraction
- Keyboard shortcut (Ctrl+Shift+E)
- Notification with approve/view buttons
- Popup showing latest extracted event
- Direct link to EventFlow inbox

## Building for Production

1. Update all `your-domain.com` references
2. Create proper icons
3. Test all features
4. Package as `.zip` for Chrome Web Store submission

