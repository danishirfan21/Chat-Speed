import { MESSAGE_TYPES } from "./lib/messages";

type TabState = {
  enabled: boolean;
  nodesPruned: number;
  bytesSaved: number;
};

function getDefaultState(): TabState {
  return {
    enabled: false,
    nodesPruned: 0,
    bytesSaved: 0,
  };
}

function getStorageKey(tabId: number) {
  return `tab:${tabId}`;
}

async function getState(tabId: number): Promise<TabState> {
  const key = getStorageKey(tabId);
  const result = await chrome.storage.session.get(key) as Record<string, TabState | undefined>;
  return result[key] ?? getDefaultState();
}

async function setState(tabId: number, state: TabState): Promise<void> {
  const key = getStorageKey(tabId);
  await chrome.storage.session.set({ [key]: state });
}

async function clearState(tabId: number): Promise<void> {
  await chrome.storage.session.remove(getStorageKey(tabId));
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId: number | undefined = msg.tabId ?? sender.tab?.id;

  if (!tabId) {
    console.warn("[ChatSpeed bg] No tabId found for message:", msg.type, "sender:", sender);
    sendResponse({ error: 'no tabId' });
    return;
  }

  if (msg.type === 'GET_TAB_ID') {
    sendResponse({ tabId });
    return;
  }

  if (msg.type === MESSAGE_TYPES.GET_STATE) {
    getState(tabId).then(state => sendResponse({ ...state, tabId }));
    return true;
  }

  if (msg.type === MESSAGE_TYPES.METRICS_UPDATE) {
    (async () => {
      const current = await getState(tabId);

      const next: TabState = {
        ...current,
        nodesPruned: current.nodesPruned + (msg.nodesPruned ?? 0),
        bytesSaved: current.bytesSaved + (msg.bytesSaved ?? 0),
      };

      await setState(tabId, next);
    })();

    return;
  }

  if (msg.type === MESSAGE_TYPES.METRICS_RESET) {
    (async () => {
      const current = await getState(tabId);

      const next: TabState = {
        ...current,
        nodesPruned: 0,
        bytesSaved: 0,
      };

      await setState(tabId, next);
    })();

    return;
  }

  if (msg.type === MESSAGE_TYPES.TOGGLE) {
    (async () => {
      const current = await getState(tabId);

      const next: TabState = {
        ...current,
        enabled: !current.enabled,
        nodesPruned: current.nodesPruned,
      };

      await setState(tabId, next);

      const action = next.enabled
        ? MESSAGE_TYPES.ENABLE
        : MESSAGE_TYPES.DISABLE;

      chrome.tabs.sendMessage(tabId, { type: action, tabId }, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });

      sendResponse({ ...next, tabId });
    })();

    return true;
  }
});

// ─── Re-push state after tab reload ──────────────────────────────────────────
// When a tab finishes loading, check if it was enabled. If so, re-send ENABLE
// to the newly injected content script (which always starts fresh at disabled).
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;

  setTimeout(async () => {
    const state = await getState(tabId);
    if (!state.enabled) return;

    chrome.tabs.sendMessage(tabId, { type: MESSAGE_TYPES.ENABLE, tabId }, () => {
      if (chrome.runtime.lastError) {
        // Ignore unsupported pages / listener not ready yet
      }
    });
  }, 300);
});

// ─── Cleanup on tab close ────────────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  clearState(tabId);
});