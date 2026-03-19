export function pruneChatGPTDOM(safeCount: number = 50) {
  const messages = document.querySelectorAll('[data-testid^="conversation-turn-"]');
  if (messages.length <= safeCount) return;

  // Identify candidates for pruning: older than safeCount from the end
  const candidates = Array.from(messages).slice(0, messages.length - safeCount);

  candidates.forEach((node) => {
    const el = node as HTMLElement;

    // Check if already collapsed
    if (el.dataset.collapsed === "true") return;

    // Detect streaming status
    const isStreaming = !!el.querySelector('.result-streaming') ||
                        !!el.querySelector('path[d*="M1 1v14h14V1H1z"]'); // ChatGPT cursor icon

    if (isStreaming) return;

    // Check if in viewport - don't collapse if visible
    const rect = el.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (isInViewport) return;

    // Record height and collapse
    const height = rect.height;
    el.style.height = `${height}px`;
    el.style.overflow = "hidden";
    el.dataset.collapsed = "true";

    // Replace with lightweight placeholder
    const placeholder = document.createElement("div");
    placeholder.textContent = "⚡ Message collapsed for performance";
    placeholder.style.cssText = "opacity: 0.6; font-size: 12px; padding: 10px; text-align: center; color: #888;";

    el.innerHTML = "";
    el.appendChild(placeholder);

    console.log(`⚡ ChatSpeed: Pruned message turn to improve performance. Saved ~${height}px of DOM content.`);
  });
}
