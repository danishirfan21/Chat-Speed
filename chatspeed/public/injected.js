/**
 * ChatSpeed — Main-world fetch interceptor
 *
 * Runs in the PAGE CONTEXT (not extension isolated world).
 * Overrides window.fetch to intercept ChatGPT's conversation API
 * and trim the mapping to only the last N messages.
 *
 * Starts DISABLED. Controlled via `chatspeed-toggle` CustomEvent.
 */
(function () {
  "use strict";

  // Double-injection guard
  if (window.__CHAT_SPEED_INJECTED__) return;
  window.__CHAT_SPEED_INJECTED__ = true;

  const MAX_MESSAGES = 4;
  const originalFetch = window.fetch;
  const LS_KEY = '__chatspeed_enabled__';

  // BOOTSTRAP ONLY (runs once)
  let chatspeedEnabled = sessionStorage.getItem(LS_KEY) === '1';

  console.log("[ChatSpeed] Initial state from sessionStorage:", chatspeedEnabled);

  // RUNTIME SOURCE OF TRUTH
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (event.data?.source !== "chatspeed") return;
    if (event.data?.type !== "toggle") return;

    const nextEnabled = !!event.data.enabled;

    if (chatspeedEnabled === nextEnabled) return;

    chatspeedEnabled = nextEnabled;

    console.log(
      "[ChatSpeed] Interceptor " + (chatspeedEnabled ? "ENABLED" : "DISABLED")
    );
  });

  window.fetch = async function (...args) {
    const url = (args[0]?.url || args[0])?.toString?.() || "";

    // TRUST ONLY MEMORY FLAG
    if (!chatspeedEnabled) {
      return originalFetch.apply(this, args);
    }

    // Only intercept GET requests to the conversation load endpoint
    const isConversationLoad =
      url.includes('/backend-api/conversation/') &&
      !url.includes('/backend-api/conversation/gen_title') &&
      !url.includes('/backend-api/conversation/message') &&
      (!args[1] || !args[1].method || args[1].method === 'GET');

    if (!isConversationLoad) {
      return originalFetch.apply(this, args);
    }

    const response = await originalFetch.apply(this, args);

    try {
      const cloned = response.clone();
      const json = await cloned.json();

      if (!json?.mapping || !json?.current_node) return response;

      const mapping = json.mapping;
      const currentNodeId = json.current_node;
      const newMapping = {};

      // 1. Identify the Root Node (the node with no parent)
      const rootNodeId = Object.keys(mapping).find(id => !mapping[id].parent);
      if (!rootNodeId) return response;

      newMapping[rootNodeId] = { ...mapping[rootNodeId], children: [] };

      // 2. Trace back the last N messages from the current leaf
      const tailNodeIds = [];
      let curr = currentNodeId;
      while (curr && mapping[curr] && tailNodeIds.length < MAX_MESSAGES) {
        if (curr !== rootNodeId) {
          tailNodeIds.unshift(curr); // Keep chronological order
        }
        curr = mapping[curr].parent;
      }

      // 3. Stitch the oldest kept message to the Root Node
      if (tailNodeIds.length > 0) {
        const oldestKeptId = tailNodeIds[0];

        // Graft: Root points to our first kept message
        newMapping[rootNodeId].children = [oldestKeptId];

        // Build the chain with correct parent and children arrays
        tailNodeIds.forEach((id, index) => {
          const originalNode = mapping[id];
          const nextId = tailNodeIds[index + 1] ?? null; // undefined → null
          newMapping[id] = {
            ...originalNode,
            // First kept node's parent is the root; rest keep their original parent
            parent: id === oldestKeptId ? rootNodeId : originalNode.parent,
            // Point children only to the next node in chain; last node has no children
            children: nextId ? [nextId] : []
          };
        });
      }

      json.mapping = newMapping;
      console.log(`[ChatSpeed] Scaled graph: ${Object.keys(mapping).length} → ${Object.keys(newMapping).length} nodes.`);

      const prunedCount = Object.keys(mapping).length - Object.keys(newMapping).length;

      // Estimate memory saved
      let bytesSaved = 0;

      Object.keys(mapping).forEach((id) => {
        // skip nodes that are kept
        if (newMapping[id]) return;

        const msg = mapping[id]?.message;
        const text = msg?.content?.parts?.join('') || '';

        const textBytes = text.length * 2; // UTF-16
        const overhead = 1024; // per node overhead
        const isCode = text.includes('```') ? 1.5 : 1;

        bytesSaved += (textBytes + overhead) * isCode;
      });

      if (prunedCount > 0) {
        window.postMessage(
          {
            source: "chatspeed",
            type: "pruned",
            count: prunedCount,
            bytesSaved,
          },
          "*"
        );
      }

      return new Response(JSON.stringify(json), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('[ChatSpeed] Surgery failed:', err);
      return response;
    }
  };

  console.log('[ChatSpeed] Fetch interceptor ready.');
})();