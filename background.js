// AIRadar Background Service Worker

const defaultStats = { totalFlagged: 0, totalScanned: 0, totalAiImages: 0 };

chrome.runtime.onInstalled.addListener(async () => {
  const { globalStats } = await chrome.storage.local.get(['globalStats']);
  if (!globalStats) await chrome.storage.local.set({ globalStats: defaultStats });

  const { settings } = await chrome.storage.sync.get(['settings']);
  if (!settings) {
    await chrome.storage.sync.set({
      settings: { enabled: true, mode: 'label', threshold: 40, scanImages: true, apiKey: '' }
    });
  }

  chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UPDATE_STATS') {
    const { stats } = msg;
    chrome.storage.local.get(['globalStats'], ({ globalStats = defaultStats }) => {
      globalStats.totalFlagged += stats.flagged || 0;
      globalStats.totalScanned += stats.scanned || 0;
      globalStats.totalAiImages += stats.aiImages || 0;
      chrome.storage.local.set({ globalStats });
      const total = globalStats.totalFlagged + globalStats.totalAiImages;
      chrome.action.setBadgeText({ text: total > 0 ? (total > 99 ? '99+' : String(total)) : '' });
    });
  }

  if (msg.type === 'GET_GLOBAL_STATS') {
    chrome.storage.local.get(['globalStats'], ({ globalStats }) => {
      sendResponse(globalStats || defaultStats);
    });
    return true;
  }

  if (msg.type === 'RESET_STATS') {
    chrome.storage.local.set({ globalStats: defaultStats });
    chrome.action.setBadgeText({ text: '' });
  }
});
