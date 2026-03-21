import ReactDOM from 'react-dom/client'
import { ChatSpeedUI } from './components/ChatSpeedUI'

// 🔥 Inject fetch interceptor into the PAGE CONTEXT (main world) immediately.
// This MUST run before ChatGPT's JS makes its first conversation API call.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.type = 'text/javascript';
(document.documentElement || document.head || document.body).appendChild(script);
script.onload = () => script.remove(); // Clean up after injection

function init() {
  const root = document.createElement('div');
  root.id = 'chatspeed-root';
  // Append to body. The React component will manage its own position.
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<ChatSpeedUI />);

  // Inject CSS to hide original messages while keeping them in DOM
  // We use visibility: hidden as well as absolute positioning so they 
  // don't take up layout space but React can still measure and update them if it needs to.
  // Alternatively, just targeting the conversational turns to not display.
  const style = document.createElement('style');
  style.textContent = `
    /* Hide the individual turns to completely bypass ChatGPT UI rendering */
    [data-testid^="conversation-turn-"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function waitForStart() {
  // Wait until the main element is available
  if (document.querySelector('main')) {
    init();
    return;
  }
  
  const obs = new MutationObserver(() => {
    if (document.querySelector('main')) {
      obs.disconnect();
      init();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

waitForStart();
