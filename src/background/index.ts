const NEW_TAB_URLS = new Set([
  'chrome://newtab/',
  'chrome://new-tab-page/',
  'chrome://new-tab-page-third-party/',
]);

// "Manual" = Ctrl+T or the "+" button. Detected solely by the initial URL
// pointing to the New Tab page. We cannot rely on openerTabId being absent:
// modern Chrome attaches the previously-active tab as opener for Ctrl+T too.
// URL alone is reliable because Ctrl+click on a link always yields the link's
// URL in pendingUrl, never chrome://newtab/.
//
// At onCreated time, tab.url is often "" while tab.pendingUrl holds the value,
// so we check both fields.
function isManualNewTab(tab: chrome.tabs.Tab): boolean {
  return [tab.url, tab.pendingUrl].some((u) => !!u && NEW_TAB_URLS.has(u));
}

async function moveAfterPinned(tabId: number, windowId: number): Promise<void> {
  const tabs = await chrome.tabs.query({ windowId });
  const pinnedCount = tabs.filter((t) => t.pinned).length;
  await chrome.tabs.move(tabId, { index: pinnedCount });
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id === undefined || tab.pinned) return;
  if (!isManualNewTab(tab)) return;

  void moveAfterPinned(tab.id, tab.windowId).catch((err: unknown) => {
    console.warn('[btrtabs] move failed', err);
  });
});
