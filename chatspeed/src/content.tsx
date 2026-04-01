// 🔥 Step 1: Inject fetch interceptor into the PAGE CONTEXT (main world) immediately.

import { MESSAGE_TYPES } from "./lib/messages";

// This MUST run before ChatGPT's JS makes its first conversation API call.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.type = 'text/javascript';
(document.documentElement || document.head || document.body).appendChild(script);
script.onload = () => script.remove();

let enabled = false;
let currentTabId: number | null = null;
const LS_KEY = '__chatspeed_enabled__';

function setEnabledState(value: boolean) {
  enabled = value;
  // sessionStorage is synchronous, per-tab, and shared with injected.js (page world).
  // Per-tab: enabling on Tab A won't affect Tab B.
  // Persists across reloads within the same tab (unlike localStorage which is global).
  try {
    if (value) {
      sessionStorage.setItem(LS_KEY, '1');
    } else {
      sessionStorage.removeItem(LS_KEY);
    }
  } catch (_) { /* storage blocked */ }
}

// ─── Startup State Sync ───────────────────────────────────────────────────────
// When the page reloads the content script starts fresh (enabled = false).
// Ask the background for the persisted tab state and re-enable if necessary.
chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATE }, (response) => {
  if (chrome.runtime.lastError) return;
  
  if (response?.tabId) {
    currentTabId = response.tabId;
    console.log("[ChatSpeed content] initial tabId set:", currentTabId);
  }

  if (response?.enabled) {
    setEnabledState(true);
    dispatchToggleEvent(true);
    waitForMain();
  }
});

// Fallback to absolute tabId identification
if (currentTabId === null) {
  chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (res) => {
    if (res?.tabId) {
      currentTabId = res.tabId;
      console.log("[ChatSpeed content] fallback tabId set:", currentTabId);
    }
  });
}
let observer: MutationObserver | null = null;

function dispatchToggleEvent(enabled: boolean) {
  window.postMessage(
    {
      source: "chatspeed",
      type: "toggle",
      enabled,
    },
    "*"
  );
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.tabId) {
    currentTabId = msg.tabId;
  }

  if (msg.type === MESSAGE_TYPES.ENABLE) {
    setEnabledState(true);
    console.log("[ChatSpeed content] received ENABLE:", { enabled });
    dispatchToggleEvent(true);

    if (!observer) {
      waitForMain();
    }

    sendResponse({ ok: true });
    return;
  }

  if (msg.type === MESSAGE_TYPES.DISABLE) {
    setEnabledState(false);

    console.log("[ChatSpeed content] received DISABLE:", { enabled });

    dispatchToggleEvent(false);

    if (currentTabId !== null) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.METRICS_RESET,
        tabId: currentTabId,
      });
    }

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    sendResponse({ ok: true });
    return;
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "chatspeed") return;
  if (event.data?.type !== "pruned") return;

  const count = event.data.count ?? 0;
  const bytesSaved = event.data.bytesSaved ?? 0;

  console.log("[ChatSpeed content] pruned event received:", count, { enabled });

  // Allow first prune event even if enable hasn't synced yet
  if (!enabled) {
    console.log("[ChatSpeed content] accepting early prune before enable sync");
  }

  if (currentTabId !== null) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.METRICS_UPDATE,
      tabId: currentTabId,
      nodesPruned: count,
      bytesSaved
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ⚡ Step 2: Auto-Trimmer
// Watches the live DOM for message count. When it exceeds THRESHOLD, it
// triggers a Next.js soft navigation so the fetch interceptor re-fires and
// re-trims the conversation to MAX_MESSAGES.
// ─────────────────────────────────────────────────────────────────────────────
const THRESHOLD = 25; // DOM nodes before we trigger a prune

function isTemporaryChat() {
  const params = new URLSearchParams(window.location.search);
  return params.get('temporary-chat') === 'true';
}

function showOptimizationToast() {
  let toast = document.getElementById('chatspeed-toast');
  if (toast) return;

  // 1. Inject High-End Animation Styles
  if (!document.getElementById('chatspeed-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'chatspeed-toast-styles';
    style.textContent = `
      @keyframes chatspeed-slide-in {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes chatspeed-progress-bar {
        from { 
          width: 100%;
          box-shadow: 0 0 16px rgba(0, 245, 255, 0.8);
        }
        to { 
          width: 0%;
          box-shadow: 0 0 6px rgba(0, 245, 255, 0.2);
        }
      }
      @keyframes chatspeed-glow-pulse {
        0%, 100% {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 245, 255, 0.2);
        }
        50% {
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 245, 255, 0.35);
        }
      }
      @font-face {
        font-family: 'Geist';
        src: local('Geist'), local('-apple-system'), local('system-ui'), local('sans-serif');
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Create the Glassmorphism Container
  toast = document.createElement('div');
  toast.id = 'chatspeed-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    // Deep Space Blue background with cyan glow
    background: 'rgba(5, 8, 10, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#E8F0FF',
    padding: '14px 20px',
    borderRadius: '10px',
    // Cyan accent border with glow
    border: '1px solid rgba(0, 245, 255, 0.2)',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'Geist, system-ui, -apple-system, sans-serif',
    zIndex: '2147483647',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 245, 255, 0.2), inset 0 1px 2px rgba(0, 245, 255, 0.1)',
    animation: 'chatspeed-slide-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards, chatspeed-glow-pulse 2s ease-in-out infinite 0.5s',
    overflow: 'hidden',
    minWidth: '260px',
    pointerEvents: 'none',
    letterSpacing: '0.3px',
  });

  // Content wrapper
  const textWrapper = document.createElement('div');
  Object.assign(textWrapper.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  });

  // Status text with cyan color
  const text = document.createElement('span');
  text.innerHTML = '<span style="color: #00F5FF; margin-right: 4px; font-size: 14px;">⚡</span><span style="color: #E8F0FF;">INTERCEPTING STREAM</span>';
  Object.assign(text.style, {
    fontSize: '13px',
    color: '#E8F0FF',
    fontWeight: '500',
    letterSpacing: '0.2px',
  });

  textWrapper.appendChild(text);
  toast.appendChild(textWrapper);

  // 3. The Countdown Progress Bar with Cyan Glow
  const progressTrack = document.createElement('div');
  Object.assign(progressTrack.style, {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '100%',
    height: '2px',
    background: 'rgba(0, 245, 255, 0.08)',
    overflow: 'hidden',
  });

  const progressBar = document.createElement('div');
  Object.assign(progressBar.style, {
    height: '100%',
    background: 'linear-gradient(90deg, transparent, #00F5FF, transparent)',
    backgroundSize: '200% 100%',
    animation: 'chatspeed-progress-bar 3s linear forwards',
    boxShadow: '0 0 16px rgba(0, 245, 255, 0.8)',
  });

  progressTrack.appendChild(progressBar);
  toast.appendChild(progressTrack);
  document.body.appendChild(toast);

  // 4. Smooth Fade Out with glow fade
  setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease, box-shadow 0.4s ease';
      toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 8px rgba(0, 245, 255, 0.05)';
      setTimeout(() => toast?.remove(), 400);
    }
  }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🧬 CORE STABLE LOGIC (Do not change)
// ─────────────────────────────────────────────────────────────────────────────

function triggerSoftReset() {
  window.history.replaceState(null, '', window.location.href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getMessageCount() {
  return document.querySelectorAll('[data-testid^="conversation-turn-"]').length;
}

function isStreaming() {
  return !!document.querySelector('.result-streaming');
}

let pruneDebounceTimer: any = null;
let isPruning = false;

function schedulePrune() {
  if (isPruning || isTemporaryChat()) return;
  if (pruneDebounceTimer) clearTimeout(pruneDebounceTimer);

  pruneDebounceTimer = setTimeout(() => {
    pruneDebounceTimer = null;
    if (isStreaming()) return;
    if (getMessageCount() <= THRESHOLD) return;

    console.log(`[ChatSpeed] Pruning at ${getMessageCount()} messages.`);
    isPruning = true;

    showOptimizationToast();
    triggerSoftReset();

    setTimeout(() => {
      if (getMessageCount() > THRESHOLD) {
        window.location.reload();
      }
      isPruning = false;
    }, 1200);
  }, 1000);
}

function attachTrimmer(main: Element) {
  observer = new MutationObserver(() => {
    if (!enabled) return; 
    if (getMessageCount() > THRESHOLD) schedulePrune();
  });
  observer.observe(main, { childList: true, subtree: true });
}

function waitForMain() {
  if (observer) return;

  const main = document.querySelector('main');

  if (main) {
    attachTrimmer(main);
    return;
  }

  const waitObs = new MutationObserver(() => {
    const m = document.querySelector('main');
    if (m) {
      waitObs.disconnect();
      attachTrimmer(m);
    }
  });

  waitObs.observe(document.documentElement, { childList: true, subtree: true });
}
