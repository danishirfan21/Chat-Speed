import ReactDOM from 'react-dom/client'
import { ChatSpeedUI } from './components/ChatSpeedUI'

function getHostMessageContainer(): HTMLElement | null {
  const firstTurn = document.querySelector('[data-testid^="conversation-turn-"]');
  if (!firstTurn) return null;

  let current = firstTurn.parentElement;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return current;
    }
    current = current.parentElement;
  }
  return firstTurn.parentElement;
}

function init() {
  // Hide host messages
  const style = document.createElement('style');
  style.textContent = `
    [data-testid^="conversation-turn-"] {
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  const container = getHostMessageContainer();
  if (container) {
    container.style.visibility = 'hidden';
    container.setAttribute('data-chatspeed-hidden', 'true');
  }

  const root = document.createElement('div');
  root.id = 'chatspeed-root';
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<ChatSpeedUI />);

  const targetNode = document.querySelector('main') || document.body;

  // ✅ BETTER: wait until DOM stabilizes instead of fixed timeout
  let stableTimer: ReturnType<typeof setTimeout>;

  const stabilityObserver = new MutationObserver(() => {
    clearTimeout(stableTimer);

    stableTimer = setTimeout(() => {
      stabilityObserver.disconnect();
      console.log("✅ [ChatSpeed] DOM stabilized");

      // Re-check container if not found initially
      const container = getHostMessageContainer();
      if (container) {
        container.style.visibility = 'hidden';
        container.setAttribute('data-chatspeed-hidden', 'true');
      }
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
