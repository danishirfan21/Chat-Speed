// ─────────────────────────────────────────────────────────────────────────────
// 🔥 Step 1: Inject fetch interceptor into the PAGE CONTEXT (main world)
// immediately at document_start. Starts DISABLED — controlled via toggle event.
// ─────────────────────────────────────────────────────────────────────────────
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.type = 'text/javascript';
(document.documentElement || document.head || document.body).appendChild(script);
script.onload = () => script.remove();

// ─────────────────────────────────────────────────────────────────────────────
// 🧠 State
// ─────────────────────────────────────────────────────────────────────────────
let enabled = false;
let nodesPruned = 0;
let trimmerObserver: MutationObserver | null = null;
let metricsTimer: any = null;

// ─────────────────────────────────────────────────────────────────────────────
// 🔌 Toggle bridge: content script ↔ injected.js (page world)
// ─────────────────────────────────────────────────────────────────────────────
function dispatchToggleEvent(on: boolean) {
  window.dispatchEvent(new CustomEvent('chatspeed-toggle', {
    detail: { enabled: on }
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 📊 Listen for prune metrics from injected.js (debounced at 500ms)
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('chatspeed-pruned', ((e: CustomEvent) => {
  nodesPruned += e.detail.prunedCount;
  if (metricsTimer) clearTimeout(metricsTimer);
  metricsTimer = setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'metricsUpdate', nodesPruned });
  }, 500);
}) as EventListener);

// ─────────────────────────────────────────────────────────────────────────────
// 📨 Message listener: enable/disable from background
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'enable') {
    enabled = true;
    dispatchToggleEvent(true);
    waitForMain();
    sendResponse({ ok: true });
  }
  if (msg.type === 'disable') {
    enabled = false;
    nodesPruned = 0;
    dispatchToggleEvent(false);
    trimmerObserver?.disconnect();
    trimmerObserver = null;
    sendResponse({ ok: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔄 Auto re-enable on page reload (check background state)
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'getState' }, (res) => {
  if (chrome.runtime.lastError) return;
  if (res?.enabled) {
    enabled = true;
    dispatchToggleEvent(true);
    waitForMain();
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
        from { width: 100%; }
        to { width: 0%; }
      }
      @font-face {
        font-family: 'Inter';
        src: local('Inter'), local('sans-serif');
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
    background: 'rgba(23, 23, 23, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#fff',
    padding: '16px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    zIndex: '2147483647', // Max possible z-index
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    animation: 'chatspeed-slide-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
    overflow: 'hidden',
    minWidth: '240px',
    pointerEvents: 'none'
  });

  const text = document.createElement('div');
  text.innerHTML = '<span style="color: #FFD700; margin-right: 8px;">⚡</span> Speed Mode: Optimizing...';
  toast.appendChild(text);

  // 3. The Countdown Progress Bar
  const progressTrack = document.createElement('div');
  Object.assign(progressTrack.style, {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '100%',
    height: '3px',
    background: 'rgba(255, 255, 255, 0.05)',
  });

  const progressBar = document.createElement('div');
  Object.assign(progressBar.style, {
    height: '100%',
    background: 'rgba(255, 255, 255, 0.5)',
    animation: 'chatspeed-progress-bar 3s linear forwards',
  });

  progressTrack.appendChild(progressBar);
  toast.appendChild(progressTrack);
  document.body.appendChild(toast);

  // 4. Smooth Fade Out
  setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast?.remove(), 400);
    }
  }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🧬 CORE STABLE LOGIC
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
  if (!enabled) return; // ← only prune when enabled
  if (isPruning || isTemporaryChat()) return;
  if (pruneDebounceTimer) clearTimeout(pruneDebounceTimer);

  pruneDebounceTimer = setTimeout(() => {
    pruneDebounceTimer = null;
    if (!enabled) return;
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
  // Disconnect previous observer if any
  trimmerObserver?.disconnect();

  trimmerObserver = new MutationObserver(() => {
    if (enabled && getMessageCount() > THRESHOLD) schedulePrune();
  });
  trimmerObserver.observe(main, { childList: true, subtree: true });
}

function waitForMain() {
  const main = document.querySelector('main');
  if (main) { attachTrimmer(main); return; }
  const waitObs = new MutationObserver(() => {
    const m = document.querySelector('main');
    if (m) { waitObs.disconnect(); attachTrimmer(m); }
  });
  waitObs.observe(document.documentElement, { childList: true, subtree: true });
}

// NOTE: waitForMain() is NOT called here unconditionally anymore.
// It's triggered by "enable" message or auto re-enable on reload.