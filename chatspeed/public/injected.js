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

  if (window.location.search.includes("temporary-chat=true")) {
    return;
  }

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

  let interceptorInstalled = false;

  if (chatspeedEnabled) {
    enableInterceptor();
  }

  function enableInterceptor() {
    if (interceptorInstalled) return;

    window.fetch = new Proxy(originalFetch, {
      apply(target, thisArg, args) {
        const url = (args[0]?.url || args[0])?.toString?.() || "";

        let pathname = "";
        try {
          pathname = new URL(url, window.location.origin).pathname;
        } catch {
          return Reflect.apply(target, thisArg, args);
        }

        const method = args[1]?.method || "GET";

        const isConversationLoad =
          /^\/backend-api\/conversation\/[^\/]+$/.test(pathname) &&
          method === "GET";

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

            if (mappingSize < 20) return response;

            const currentNodeId = json.current_node;
            const newMapping = {};

            const rootNodeId = mappingKeys.find(id => mapping[id] && !mapping[id].parent);
            if (!rootNodeId) return response;

            newMapping[rootNodeId] = { ...mapping[rootNodeId], children: [] };

            const fullChain = [];
            let curr = currentNodeId;

            while (curr && mapping[curr]) {
              if (curr !== rootNodeId) fullChain.unshift(curr);
              curr = mapping[curr].parent;
            }

            const visibleNodes = [];
            let lastRole = null;

            for (let i = fullChain.length - 1; i >= 0; i--) {
              const id = fullChain[i];
              const node = mapping[id];
              const role = node?.message?.author?.role;
              const hidden = node?.message?.metadata?.is_visually_hidden_from_conversation;

              if (hidden || (role !== "user" && role !== "assistant")) continue;
              if (role === lastRole) continue;

              visibleNodes.unshift(id);
              lastRole = role;

              if (visibleNodes.length >= MAX_MESSAGES) break;
            }

            let tailNodeIds = [];
            if (visibleNodes.length > 0) {
              const startIdx = fullChain.indexOf(visibleNodes[0]);
              tailNodeIds = fullChain.slice(startIdx);
            }

            if (tailNodeIds.length > 0) {
              const oldestKeptId = tailNodeIds[0];
              newMapping[rootNodeId].children = [oldestKeptId];

              tailNodeIds.forEach((id, index) => {
                const originalNode = mapping[id];
                const nextId = tailNodeIds[index + 1] ?? null;

                newMapping[id] = {
                  ...originalNode,
                  parent: id === oldestKeptId ? rootNodeId : originalNode.parent,
                  children: nextId ? [nextId] : []
                };
              });
            }

            const newMappingSize = Object.keys(newMapping).length;
            const prunedCount = mappingSize - newMappingSize;

            if (prunedCount <= 0) return response;

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
            if (errorCount >= MAX_ERRORS) {
              chatspeedEnabled = false;
              disableInterceptor();
              warn("Auto disabling due to repeated errors");
            }
            return response;
          }
        })();
      }
    });

    interceptorInstalled = true;
    log("Interceptor INSTALLED");
  }

  function disableInterceptor() {
    if (!interceptorInstalled) return;

    if (window.fetch !== originalFetch) {
      window.fetch = originalFetch;
    }
    interceptorInstalled = false;

    log("Interceptor REMOVED");
  }

  // RUNTIME SOURCE OF TRUTH
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (event.data?.source !== "chatspeed") return;
    if (event.data?.type !== "toggle") return;

    const nextEnabled = !!event.data.enabled;

    if (chatspeedEnabled === nextEnabled) return;

    chatspeedEnabled = nextEnabled;
    errorCount = 0;

    if (chatspeedEnabled) {
      enableInterceptor();
    } else {
      disableInterceptor();
    }

    log("Interceptor " + (chatspeedEnabled ? "ENABLED" : "DISABLED"));
  });



  log('Fetch interceptor ready.');
})();