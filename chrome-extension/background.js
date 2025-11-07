const API_BASE = 'https://your-domain.com/api';

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'extractEvent',
    title: 'Extract Event with EventFlow',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'extractEvent') {
    extractFromSelection(info.selectionText, tab);
  }
});

// Keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'extract-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' }, (response) => {
        if (response?.text) {
          extractFromSelection(response.text, tabs[0]);
        }
      });
    });
  }
});

async function extractFromSelection(text, tab) {
  try {
    const response = await fetch(`${API_BASE}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        source: 'chrome_extension',
        source_meta: {
          url: tab.url,
          title: tab.title
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
    
    const event = await response.json();
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Event Extracted',
      message: `${event.title || 'Untitled'}\n${event.start || 'No date'}`,
      buttons: [
        { title: 'Approve' },
        { title: 'View in EventFlow' }
      ]
    });
    
    // Store for popup
    chrome.storage.local.set({ latestEvent: event });
    
  } catch (err) {
    console.error('Extraction failed:', err);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Extraction Failed',
      message: 'Could not extract event from selection'
    });
  }
}

// Handle notification clicks
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (btnIdx === 0) { // Approve
    chrome.storage.local.get(['latestEvent'], async (result) => {
      if (result.latestEvent) {
        await fetch(`${API_BASE}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: result.latestEvent })
        });
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Success',
          message: 'Event added to calendar'
        });
      }
    });
  } else { // View
    chrome.tabs.create({ url: 'https://your-domain.com/inbox' });
  }
});

