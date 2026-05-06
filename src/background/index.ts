import { log, warn } from '../lib/log';
import { decide } from './decide';

log('service worker booted');

// onStartup fires only on browser boot, not on service-worker wake-up. We
// suspend reordering for a few seconds afterwards so session-restored tabs
// stay where Chrome put them.
const STARTUP_GRACE_MS = 5000;
let suppressMoves = false;

chrome.runtime.onStartup.addListener(() => {
  log('onStartup — suppressing moves for', STARTUP_GRACE_MS, 'ms');
  suppressMoves = true;
  setTimeout(() => {
    suppressMoves = false;
    log('startup grace ended');
  }, STARTUP_GRACE_MS);
});

async function moveAfterPinned(tabId: number, windowId: number): Promise<void> {
  const tabs = await chrome.tabs.query({ windowId });
  const pinnedCount = tabs.filter((t) => t.pinned).length;
  log('moving tab', tabId, '→ index', pinnedCount);
  await chrome.tabs.move(tabId, { index: pinnedCount });
}

chrome.tabs.onCreated.addListener((tab) => {
  log('onCreated', {
    id: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    url: tab.url || tab.pendingUrl,
    openerTabId: tab.openerTabId,
    pinned: tab.pinned,
    active: tab.active,
  });

  const tabId = tab.id;
  if (tabId === undefined) return;
  if (suppressMoves) {
    log('skip: startup grace');
    return;
  }

  void decide(tab)
    .then((d) => {
      log('decision for', tabId, '→', d.move ? 'MOVE' : 'SKIP', `(${d.reason})`);
      if (d.move) return moveAfterPinned(tabId, tab.windowId);
    })
    .catch((err: unknown) => warn('handler failed', err));
});
