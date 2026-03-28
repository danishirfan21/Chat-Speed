/**
 * ChatSpeed — Background Service Worker
 * Maintains per-tab state and relays messages between popup and content script.
 */

const tabState: Record<number, { enabled: boolean; nodesPruned: number }> = {};

function getState(tabId: number) {
  return tabState[tabId] || { enabled: false, nodesPruned: 0 };
}

function ensureTab(tabId: number) {
  if (!tabState[tabId]) {
    tabState[tabId] = { enabled: false, nodesPruned: 0 };
  }
  return tabState[tabId];
}

// ── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Resolve tabId: from message (popup) or sender (content script)
  const tabId: number | undefined = msg.tabId ?? sender.tab?.id;

  if (!tabId) {
    sendResponse({ error: 'no tabId' });
    return;
  }

  if (msg.type === 'getState') {
    sendResponse(getState(tabId));
    return;
  }

  if (msg.type === 'toggle') {
    const state = ensureTab(tabId);
    state.enabled = !state.enabled;

    // Reset metrics on disable
    if (!state.enabled) {
      state.nodesPruned = 0;
    }

    // Relay to content script (safe — handles lastError)
    const action = state.enabled ? 'enable' : 'disable';
    chrome.tabs.sendMessage(tabId, { type: action }, () => {
      if (chrome.runtime.lastError) {
        // Content script not ready — ignore silently
      }
    });

    sendResponse({ enabled: state.enabled, nodesPruned: state.nodesPruned });
    return;
  }

  if (msg.type === 'metricsUpdate') {
    const state = ensureTab(tabId);
    state.nodesPruned = msg.nodesPruned ?? 0;
    sendResponse({ ok: true });
    return;
  }
});

// ── Cleanup on tab close ─────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabState[tabId];
});
