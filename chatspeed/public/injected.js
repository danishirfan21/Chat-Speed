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
  const DEBUG = false;

  let errorCount = 0;
  const MAX_ERRORS = 3;

  const log = (...args) => DEBUG && console.log("[ChatSpeed]", ...args);
  const warn = (...args) => console.warn("[ChatSpeed]", ...args);
  const error = (...args) => console.error("[ChatSpeed]", ...args);

  // BOOTSTRAP ONLY (runs once)
  let chatspeedEnabled = sessionStorage.getItem(LS_KEY) === '1';

  log("Initial state from sessionStorage:", chatspeedEnabled);

  // RUNTIME SOURCE OF TRUTH
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (event.data?.source !== "chatspeed") return;
    if (event.data?.type !== "toggle") return;

    const nextEnabled = !!event.data.enabled;

    if (chatspeedEnabled === nextEnabled) return;

    chatspeedEnabled = nextEnabled;
    errorCount = 0; // Reset error count on manual toggle

    log("Interceptor " + (chatspeedEnabled ? "ENABLED" : "DISABLED"));
  });

  if (window.location.search.includes("temporary-chat=true")) {
    log("Skipping fetch override in temporary chat mode");
    return;
  }

  window.fetch = new Proxy(originalFetch, {
    apply(target, thisArg, args) {
      const url = (args[0]?.url || args[0])?.toString?.() || "";

      // TRUST ONLY MEMORY FLAG
      if (!chatspeedEnabled) {
        return Reflect.apply(target, thisArg, args);
      }

      // Only intercept GET requests to the conversation load endpoint
      let pathname = "";
      try {
        pathname = new URL(url, window.location.origin).pathname;
      } catch (err) {
        return Reflect.apply(target, thisArg, args);
      }

      const method = args[1]?.method || "GET";

      const isConversationLoad =
        /^\/backend-api\/conversation\/[^\/]+$/.test(pathname) &&
        method === 'GET';

      if (!isConversationLoad) {
        return Reflect.apply(target, thisArg, args);
      }

      return (async () => {
        const response = await Reflect.apply(target, thisArg, args);

        try {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            return response;
          }

          const cloned = response.clone();
          const json = await cloned.json();

          if (
            !json ||
            typeof json !== "object" ||
            !json.mapping ||
            typeof json.mapping !== "object" ||
            !json.current_node
          ) {
            return response;
          }

          const mapping = json.mapping;
          const mappingKeys = Object.keys(mapping);
          const mappingSize = mappingKeys.length;

          // Guard against small chats
          if (mappingSize < 20) {
            return response;
          }

          const currentNodeId = json.current_node;
          const newMapping = {};

          // 1. Identify the Root Node (the node with no parent)
          const rootNodeId = mappingKeys.find(id => mapping[id] && !mapping[id].parent);
          if (!rootNodeId) return response;

          newMapping[rootNodeId] = { ...mapping[rootNodeId], children: [] };

          // 2. Build full chain first
          const fullChain = [];
          let curr = currentNodeId;

          while (curr && mapping[curr]) {
            if (curr !== rootNodeId) {
              fullChain.unshift(curr);
            }
            curr = mapping[curr].parent;
          }

          // 3. Pick last N visible (user/assistant) messages
          const visibleNodes = [];
          let lastRole = null;

          for (let i = fullChain.length - 1; i >= 0; i--) {
            const id = fullChain[i];
            const node = mapping[id];
            const role = node?.message?.author?.role;
            const hidden = node?.message?.metadata?.is_visually_hidden_from_conversation;

            // skip hidden/system
            if (hidden || (role !== "user" && role !== "assistant")) continue;

            // enforce alternation
            if (role === lastRole) continue;

            visibleNodes.unshift(id);
            lastRole = role;

            if (visibleNodes.length >= MAX_MESSAGES) break;
          }

          // 4. Keep Full Structure from first visible node onward
          let tailNodeIds = [];
          if (visibleNodes.length > 0) {
            const startIdx = fullChain.indexOf(visibleNodes[0]);
            tailNodeIds = fullChain.slice(startIdx);
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

          const newMappingSize = Object.keys(newMapping).length;
          const prunedCount = mappingSize - newMappingSize;

          if (prunedCount <= 0) {
            return response;
          }

          const newJson = { ...json, mapping: newMapping };
          log(`Scaled graph: ${mappingSize} → ${newMappingSize} nodes.`);

          // Estimate memory saved
          let bytesSaved = 0;

          for (const id in mapping) {
            // skip nodes that are kept
            if (newMapping[id]) continue;

            const msg = mapping[id]?.message;
            const text = msg?.content?.parts?.join('') || '';

            const textBytes = text.length * 2; // UTF-16
            const overhead = 1024; // per node overhead
            const isCode = text.includes('```') ? 1.5 : 1;

            bytesSaved += (textBytes + overhead) * isCode;
          }

          window.postMessage(
            {
              source: "chatspeed",
              type: "pruned",
              count: prunedCount,
              bytesSaved,
            },
            "*"
          );

          return new Response(JSON.stringify(newJson), {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers)
          });
        } catch (err) {
          errorCount++;
          error('Surgery failed:', err);

          if (errorCount >= MAX_ERRORS) {
            warn("Auto disabling due to errors");
            chatspeedEnabled = false;
          }

          return response;
        }
      })();
    }
  });

  log('Fetch interceptor ready.');
})();