const NEW_TAB_URLS = new Set([
  'chrome://newtab/',
  'chrome://new-tab-page/',
  'chrome://new-tab-page-third-party/',
]);

export type Decision = { move: boolean; reason: string };

// Decide whether a freshly-created tab should be moved to the start of the
// window (right after pinned tabs).
//
// Cases — in order of evaluation:
//   1. Pinned tab            → don't touch.
//   2. URL = chrome://newtab → Ctrl+T / "+" button. Move.
//   3. Empty URL             → can't tell, skip.
//   4. active === false      → background open (Ctrl+Click). Skip.
//   5. No openerTabId        → external open with no source tab. Move.
//   6. Has openerTabId:
//        - opener in different window         → external. Move.
//        - tab.index === opener.index + 1     → in-Chrome click (target=
//          "_blank", window.open). Skip.
//        - otherwise (tab placed at window's
//          end while opener is elsewhere)     → external app link (Slack,
//          Mail, Spotlight…). Chrome attaches the previously-active tab as
//          opener but appends the new tab at the end, so position breaks
//          the tie. Move.
export async function decide(tab: chrome.tabs.Tab): Promise<Decision> {
  if (tab.pinned) return { move: false, reason: 'pinned' };

  const url = tab.pendingUrl || tab.url || '';

  if (NEW_TAB_URLS.has(url)) return { move: true, reason: 'new tab page URL' };
  if (!url) return { move: false, reason: 'empty URL' };
  if (!tab.active) return { move: false, reason: 'background tab' };
  if (tab.openerTabId === undefined) return { move: true, reason: 'no opener + real URL' };

  let opener: chrome.tabs.Tab;
  try {
    opener = await chrome.tabs.get(tab.openerTabId);
  } catch {
    return { move: true, reason: `opener ${tab.openerTabId} no longer exists` };
  }

  if (opener.windowId !== tab.windowId) {
    return { move: true, reason: 'opener in different window' };
  }

  if (tab.index === opener.index + 1) {
    return {
      move: false,
      reason: `adjacent to opener (tab.index=${tab.index}, opener.index=${opener.index})`,
    };
  }

  return {
    move: true,
    reason: `not adjacent to opener (tab.index=${tab.index}, opener.index=${opener.index})`,
  };
}
