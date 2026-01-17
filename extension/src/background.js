const BADGE_COLORS = {
  available: '#38ef7d',
  unavailable: '#666666',
  error: '#f45c43'
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CANVAS_STATUS') {
    updateBadge(sender.tab?.id, message.available);
  }
  return true;
});

function updateBadge(tabId, available) {
  if (!tabId) return;

  if (available) {
    chrome.action.setBadgeText({ tabId, text: '' });
    chrome.action.setTitle({ 
      tabId, 
      title: 'Gemini Canvas Publisher - Ready' 
    });
  } else {
    chrome.action.setBadgeText({ tabId, text: '!' });
    chrome.action.setBadgeBackgroundColor({ 
      tabId, 
      color: BADGE_COLORS.unavailable 
    });
    chrome.action.setTitle({ 
      tabId, 
      title: 'Gemini Canvas Publisher - Canvas not detected' 
    });
  }
}

chrome.alarms.create('refreshConfig', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshConfig') {
    refreshConfig();
  }
});

async function refreshConfig() {
  try {
    const response = await fetch('http://localhost:3000/api/extension-config');
    if (response.ok) {
      const config = await response.json();
      await chrome.storage.local.set({
        gcp_config: {
          config,
          timestamp: Date.now()
        }
      });
      console.log('[GCP] Config refreshed');
    }
  } catch (error) {
    console.log('[GCP] Config refresh failed:', error.message);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[GCP] Extension installed');
    refreshConfig();
  } else if (details.reason === 'update') {
    console.log('[GCP] Extension updated to', chrome.runtime.getManifest().version);
    refreshConfig();
  }
});
