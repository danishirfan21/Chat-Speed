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

    // Capture current height once per message to preserve layout
    const rect = el.getBoundingClientRect();
    const height = rect.height;

    // Collapse and replace content
    el.style.height = `${height}px`;
    el.style.overflow = "hidden";
    el.dataset.collapsed = "true";

    const placeholder = document.createElement("div");
    placeholder.textContent = "⚡ Message collapsed for performance";
    placeholder.style.cssText = "opacity: 0.6; font-size: 12px; padding: 10px; text-align: center; color: #888;";

    el.innerHTML = "";
    el.appendChild(placeholder);

    console.log(`⚡ ChatSpeed: Pruned message at index ${i}. Saved ~${height}px of DOM content.`);
  }
}
