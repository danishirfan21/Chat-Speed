// 🔥 Step 1: Inject fetch interceptor into the PAGE CONTEXT (main world) immediately.
// This MUST run before ChatGPT's JS makes its first conversation API call.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.type = 'text/javascript';
(document.documentElement || document.head || document.body).appendChild(script);
script.onload = () => script.remove();

// ─────────────────────────────────────────────────────────────────────────────
// ⚡ Step 2: Auto-Trimmer
// Watches the live DOM for message count. When it exceeds THRESHOLD, it
// triggers a Next.js soft navigation so the fetch interceptor re-fires and
// re-trims the conversation to MAX_MESSAGES.
// ─────────────────────────────────────────────────────────────────────────────
const THRESHOLD = 25; // DOM nodes before we trigger a prune

function showToast() {
  let toast = document.getElementById('chatspeed-toast');
  if (toast) return; // already showing

  toast = document.createElement('div');
  toast.id = 'chatspeed-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0,0,0,0.82)',
    color: '#fff',
    padding: '14px 24px',
    borderRadius: '10px',
    fontSize: '15px',
    fontFamily: 'system-ui, sans-serif',
    zIndex: '999999',
    pointerEvents: 'none',
    letterSpacing: '0.01em',
  });
  toast.textContent = '⚡ Speed Mode: Optimizing chat...';
  document.body.appendChild(toast);

  // Auto-remove after 3 s in case navigation doesn't fire
  setTimeout(() => toast?.remove(), 3000);
}

function triggerSoftReset() {
  // Next.js listens to popstate to handle client-side routing.
  // Dispatching it causes a route re-evaluation and a re-fetch of the
  // conversation, which re-triggers our injected.js interceptor.
  window.history.replaceState(null, '', window.location.href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getMessageCount() {
  return document.querySelectorAll('[data-testid^="conversation-turn-"]').length;
}

function isStreaming() {
  return !!document.querySelector('.result-streaming');
}

let pruneDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isPruning = false;

function schedulePrune() {
  if (isPruning) return;
  if (pruneDebounceTimer) clearTimeout(pruneDebounceTimer);

  pruneDebounceTimer = setTimeout(() => {
    pruneDebounceTimer = null;

    // Safety checks: don't prune while still streaming, and reconfirm threshold
    if (isStreaming()) return;
    if (getMessageCount() <= THRESHOLD) return;

    console.log(`[ChatSpeed] Auto-Trimmer: ${getMessageCount()} messages — triggering soft reset.`);
    isPruning = true;

    showToast();
    triggerSoftReset();

    // Watchdog: if message count hasn't dropped after 1 s, do a hard reload
    setTimeout(() => {
      if (getMessageCount() > THRESHOLD) {
        console.warn('[ChatSpeed] Soft reset failed — falling back to hard reload.');
        window.location.reload();
      } else {
        console.log('[ChatSpeed] Soft reset successful.');
      }
      isPruning = false;
    }, 1000);
  }, 1000); // 1 s debounce
}

function attachTrimmer(main: Element) {
  const observer = new MutationObserver(() => {
    if (getMessageCount() > THRESHOLD) {
      schedulePrune();
    }
  });

  observer.observe(main, { childList: true, subtree: true });
  console.log('[ChatSpeed] Auto-Trimmer observer attached.');
}

function waitForMain() {
  const main = document.querySelector('main');
  if (main) {
    attachTrimmer(main);
    return;
  }

  // Poll until <main> exists — content script runs at document_start
  const waitObs = new MutationObserver(() => {
    const m = document.querySelector('main');
    if (m) {
      waitObs.disconnect();
      attachTrimmer(m);
    }
  });
  waitObs.observe(document.documentElement, { childList: true, subtree: true });
}

waitForMain();
