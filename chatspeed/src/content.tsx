import ReactDOM from 'react-dom/client'
import { ChatSpeedUI } from './components/ChatSpeedUI'
import { pruneOldMessages } from './utils/domPruning'
import { debounce } from './utils/debounce'

let isInitialLoadDone = false;

function init() {
  // Mount
  const root = document.createElement('div');
  root.id = 'chatspeed-root';
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<ChatSpeedUI />);

  // Performance Optimization: Prune host DOM periodically to keep ChatGPT fast.
  const debouncedPruning = debounce(() => {
    pruneOldMessages(50);
  }, 2000);

  // Attach observer to detect when to prune (only on new nodes)
  const observer = new MutationObserver((mutations) => {
    if (!isInitialLoadDone) return;

    const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (hasAddedNodes) {
      debouncedPruning();
    }
  });

  const targetNode = document.querySelector('main') || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });

  setTimeout(() => {
    isInitialLoadDone = true;
    console.log("✅ [ChatSpeed] Pruning enabled");
  }, 1000);
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

