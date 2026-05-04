chrome.runtime.onInstalled.addListener((details) => {
  console.log('[btrtabs] installed', details.reason);
});
