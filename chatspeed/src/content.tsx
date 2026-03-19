import ReactDOM from 'react-dom/client'
import { ChatSpeedUI } from './components/ChatSpeedUI'
import { pruneChatGPTDOM } from './utils/domPruning'
import { debounce } from './utils/debounce'

// Mount
const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<ChatSpeedUI />);

// Performance Optimization: Prune host DOM periodically to keep ChatGPT fast.
const debouncedPruning = debounce(() => {
  pruneChatGPTDOM(50);
}, 2000);

// Attach observer to detect when to prune
const observer = new MutationObserver(() => {
  debouncedPruning();
});

const targetNode = document.querySelector('main') || document.body;
observer.observe(targetNode, { childList: true, subtree: true });

// Also prune on scroll to catch items that leave viewport
window.addEventListener('scroll', debouncedPruning, { passive: true });
