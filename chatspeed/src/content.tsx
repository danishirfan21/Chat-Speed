// 🔥 Inject fetch interceptor into the PAGE CONTEXT (main world) immediately.
// This MUST run before ChatGPT's JS makes its first conversation API call.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.type = 'text/javascript';
(document.documentElement || document.head || document.body).appendChild(script);
script.onload = () => script.remove(); // Clean up after injection
