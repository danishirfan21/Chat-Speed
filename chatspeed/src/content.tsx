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

// Wait for ChatGPT to finish hydrating before injecting
function waitForMain() {
  if (document.querySelector('main')) {
    init();
  } else {
    const obs = new MutationObserver(() => {
      if (document.querySelector('main')) {
        obs.disconnect();
        init();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
}

waitForMain();

