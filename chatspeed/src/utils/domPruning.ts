export function pruneOldMessages(safeCount: number = 50) {
  const messages = document.querySelectorAll('[data-testid^="conversation-turn-"]');
  if (messages.length <= safeCount) return;

  const cutoffIndex = messages.length - safeCount;

  // Prune older messages by index, avoiding expensive DOM scans or visibility checks
  for (let i = 0; i < cutoffIndex; i++) {
    const el = messages[i] as HTMLElement;

    // Skip if already collapsed or currently streaming
    if (el.dataset.collapsed === "true") continue;

    // Detect streaming status using known indicators
    const isStreaming = !!el.querySelector('.result-streaming') ||
                        !!el.querySelector('path[d*="M1 1v14h14V1H1z"]'); // ChatGPT cursor icon

    if (isStreaming) continue;

    // PERFORMANCE: Removed getBoundingClientRect() and dynamic height assignment.
    // We prioritize zero-reflow performance over exact height preservation.
    el.style.minHeight = "44px"; // Fixed small height for layout stability
    el.style.overflow = "hidden";
    el.dataset.collapsed = "true";

    const placeholder = document.createElement("div");
    placeholder.textContent = "⚡ Message collapsed for performance";
    placeholder.style.cssText = "opacity: 0.6; font-size: 12px; padding: 12px; text-align: center; color: #888;";

    // Using replaceChildren for better performance than innerHTML = ""
    el.replaceChildren(placeholder);

    console.log(`⚡ ChatSpeed: Pruned message at index ${i} (zero-reflow).`);
  }
}
