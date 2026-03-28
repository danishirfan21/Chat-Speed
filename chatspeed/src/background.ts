import { MESSAGE_TYPES } from "./lib/messages";

type TabState = {
  enabled: boolean;
  nodesPruned: number;
};

const tabState: Record<number, TabState> = {};

function getDefaultState(): TabState {
  return {
    enabled: false,
    nodesPruned: 0,
  };
}

function getState(tabId: number): TabState {
  return tabState[tabId] ?? getDefaultState();
}

function ensureState(tabId: number): TabState {
  if (!tabState[tabId]) {
    tabState[tabId] = getDefaultState();
  }
  return tabState[tabId];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId: number | undefined = msg.tabId ?? sender.tab?.id;

  if (!tabId) {
    sendResponse({ error: 'no tabId' });
    return;
  }

  if (msg.type === MESSAGE_TYPES.GET_STATE) {
    sendResponse(getState(tabId));
    return;
  }

  if (msg.type === MESSAGE_TYPES.TOGGLE) {
    const state = ensureState(tabId);
    state.enabled = !state.enabled;

    if (!state.enabled) {
      state.nodesPruned = 0;
    }

    const action = state.enabled
      ? MESSAGE_TYPES.ENABLE
      : MESSAGE_TYPES.DISABLE;

    chrome.tabs.sendMessage(tabId, { type: action }, () => {
      if (chrome.runtime.lastError) {
        return;
      }
    });

    sendResponse(state);
    return;
  }
});