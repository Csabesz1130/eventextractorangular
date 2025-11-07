// Listen for selection request
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ text: selection });
  }
});

// Visual feedback when extracting
function showExtractionOverlay(text) {
  const overlay = document.createElement('div');
  overlay.className = 'eventflow-overlay';
  overlay.innerHTML = `
    <div class="eventflow-card">
      <div class="spinner"></div>
      <p>Extracting event...</p>
    </div>
  `;
  document.body.appendChild(overlay);
  
  setTimeout(() => overlay.remove(), 2000);
}

