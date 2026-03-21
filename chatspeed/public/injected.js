/**
 * ChatSpeed — Main-world fetch interceptor
 * 
 * Runs in the PAGE CONTEXT (not extension isolated world).
 * Overrides window.fetch to intercept ChatGPT's conversation API
 * and trim the mapping to only the last N messages.
 */
(function () {
  'use strict';

  const MAX_MESSAGES = 50;
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url = (args[0]?.url || args[0])?.toString?.() || '';

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

      if (!json?.mapping) {
        console.log('[ChatSpeed] No mapping found in response, passing through.');
        return response;
      }

      const mapping = json.mapping;
      const currentNodeId = json.current_node;

      if (!currentNodeId || !mapping[currentNodeId]) {
        console.log('[ChatSpeed] No current_node found, passing through.');
        return response;
      }

      // Walk backwards from current_node via parent pointers
      const selected = new Map();
      let nodeId = currentNodeId;
      let count = 0;

      while (nodeId && mapping[nodeId] && count < MAX_MESSAGES) {
        const node = mapping[nodeId];
        selected.set(nodeId, node);
        nodeId = node.parent;
        count++;
      }

      // If the walk ended before hitting the root, include the root ancestor
      // so ChatGPT has a valid tree root
      if (nodeId && mapping[nodeId] && !selected.has(nodeId)) {
        const rootNode = { ...mapping[nodeId] };
        // Point children only to the node we came from (trim siblings)
        const childInChain = Array.from(selected.keys()).find(
          (key) => selected.get(key).parent === nodeId
        );
        if (childInChain) {
          rootNode.children = [childInChain];
        }
        selected.set(nodeId, rootNode);
      }

      // Fix the oldest selected node's parent pointer:
      // The oldest node in our chain should point to the root (or have null parent)
      // to keep the chain valid without dangling references.
      const oldestInChain = Array.from(selected.keys()).find((key) => {
        const parentId = selected.get(key).parent;
        return parentId && !selected.has(parentId);
      });
      if (oldestInChain) {
        selected.set(oldestInChain, {
          ...selected.get(oldestInChain),
          parent: null,
        });
      }

      // Rebuild mapping
      const newMapping = {};
      selected.forEach((value, key) => {
        newMapping[key] = value;
      });

      const originalCount = Object.keys(mapping).length;
      const newCount = Object.keys(newMapping).length;

      json.mapping = newMapping;

      console.log('[ChatSpeed] Intercepted conversation:', url);
      console.log(
        '[ChatSpeed] Mapping trimmed:',
        originalCount,
        '→',
        newCount,
        'nodes'
      );

      return new Response(JSON.stringify(json), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('[ChatSpeed] Intercept failed, returning original:', err);
      return response;
    }
  };

  console.log('[ChatSpeed] Fetch interceptor installed.');
})();
