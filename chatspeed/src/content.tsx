import ReactDOM from 'react-dom/client'
import { ChatSpeedUI } from './components/ChatSpeedUI'
import { pruneOldMessages } from './utils/domPruning'
import { debounce } from './utils/debounce'

let isInitialLoadDone = false;

function init() {
  const root = document.createElement('div');
  root.id = 'chatspeed-root';
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<ChatSpeedUI />);

  const debouncedPruning = debounce(() => {
    pruneOldMessages(50);
  }, 2000);

  const observer = new MutationObserver((mutations) => {
    if (!isInitialLoadDone) return;

    const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (hasAddedNodes) {
      debouncedPruning();
    }
  });

  const targetNode = document.querySelector('main') || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });

  // ✅ BETTER: wait until DOM stabilizes instead of fixed timeout
  let stableTimer: ReturnType<typeof setTimeout>;

  const stabilityObserver = new MutationObserver(() => {
    clearTimeout(stableTimer);

    stableTimer = setTimeout(() => {
      isInitialLoadDone = true;
      stabilityObserver.disconnect();
      console.log("✅ [ChatSpeed] Pruning enabled (DOM stabilized)");
    }, 300); // no mutations for 300ms → stable
  });

  stabilityObserver.observe(targetNode, { childList: true, subtree: true });
}

function waitForMessages() {
  const hasMessages = document.querySelector('[data-testid^="conversation-turn-"]');

  if (hasMessages) {
    init();
    return;
  }

  const obs = new MutationObserver(() => {
    const hasMessages = document.querySelector('[data-testid^="conversation-turn-"]');
    if (hasMessages) {
      obs.disconnect();
      init();
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });
}

waitForMessages();

