document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['latestEvent'], (result) => {
    if (result.latestEvent) {
      showEvent(result.latestEvent);
    } else {
      document.getElementById('noEvent').style.display = 'block';
    }
  });
  
  document.getElementById('approveBtn')?.addEventListener('click', approveEvent);
  document.getElementById('editBtn')?.addEventListener('click', editEvent);
});

function showEvent(event) {
  document.getElementById('noEvent').style.display = 'none';
  document.getElementById('latestEvent').style.display = 'block';
  document.getElementById('eventTitle').textContent = event.title || 'Untitled';
  document.getElementById('eventTime').textContent = formatDate(event.start);
  document.getElementById('eventLocation').textContent = event.location || '';
}

async function approveEvent() {
  const result = await chrome.storage.local.get(['latestEvent']);
  if (!result.latestEvent) return;
  
  const response = await fetch('https://your-domain.com/api/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: result.latestEvent })
  });
  
  if (response.ok) {
    showSuccess('Event added to calendar!');
    chrome.storage.local.remove('latestEvent');
    setTimeout(() => window.close(), 1500);
  }
}

function editEvent() {
  chrome.tabs.create({ url: 'https://your-domain.com/inbox' });
}

function formatDate(isoString) {
  if (!isoString) return 'No date';
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showSuccess(message) {
  const card = document.getElementById('latestEvent');
  card.innerHTML = `<p style="text-align:center;color:#8cffd2;">${message}</p>`;
}

