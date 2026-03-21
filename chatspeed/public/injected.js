/**
 * ChatSpeed — Main-world fetch interceptor
 * 
 * Runs in the PAGE CONTEXT (not extension isolated world).
 * Overrides window.fetch to intercept ChatGPT's conversation API
 * and trim the mapping to only the last N messages.
 */
(function () {
  'use strict';

  const MAX_MESSAGES = 4;
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

      if (!json?.mapping || !json?.current_node) return response;

      const mapping = json.mapping;
      const currentNodeId = json.current_node;
      const newMapping = {};

      // 1. Identify the Root Node (the node with no parent)
      const rootNodeId = Object.keys(mapping).find(id => !mapping[id].parent);
      if (!rootNodeId) return response; 
      
      newMapping[rootNodeId] = { ...mapping[rootNodeId], children: [] };

      // 2. Trace back the last 50 messages from the current leaf
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

  console.log('[ChatSpeed] Fetch interceptor installed.');
})();
