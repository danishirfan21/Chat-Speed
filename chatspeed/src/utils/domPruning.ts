export function pruneOldMessages(safeCount: number = 200) {
  const messages = document.querySelectorAll('[data-testid^="conversation-turn-"]');
  if (messages.length <= safeCount) return;

  const cutoffIndex = messages.length - safeCount;
  let prunedCount = 0;

  for (let i = 0; i < cutoffIndex; i++) {
    const el = messages[i] as HTMLElement;
    
    // Skip if already pruned or if it's currently streaming
    if (el.dataset.pruned === "true") continue;
    const isStreaming = !!el.querySelector('.result-streaming') ||
                        !!el.querySelector('path[d*="M1 1v14h14V1H1z"]');
    if (isStreaming) continue;

    // Remove inner contents to slash React reconciliation and memory overhead
    // We leave the node itself intact so ChatGPT structure remains.
    el.style.display = "none";
    el.dataset.pruned = "true";
    el.replaceChildren(); 
    prunedCount++;
  }

  if (prunedCount > 0) {
    console.log(`[ChatSpeed] Pruned ${prunedCount} host DOM nodes to save memory. Total host nodes kept: ${messages.length - prunedCount}`);
  }
}
