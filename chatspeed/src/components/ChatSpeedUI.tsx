import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ChatMessage } from '../types'
import { MessageItem } from './MessageItem'
import { Virtuoso } from 'react-virtuoso'
import { pruneOldMessages } from '../utils/domPruning'

const COLLAPSE_THRESHOLD = 100;
const MAX_MESSAGES = 500;

export const ChatSpeedUI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [width, setWidth] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showOlderMessages, setShowOlderMessages] = useState(false);

  const updateMessagesFromNodes = useCallback((nodes: HTMLElement[]) => {
    if (nodes.length === 0) return;

    // 🥉 Log every trigger
    console.log('[ChatSpeed] updateMessagesFromNodes triggered, nodes:', nodes.length);

    setMessages((prevMessages) => {
      const start = performance.now();
      let changed = false;
      const nextMessages = [...prevMessages]; // Shallow copy array

      nodes.forEach((turnEl) => {
        const id = turnEl.getAttribute('data-testid') || '';
        if (!id) return;

        // Skip collapsed nodes to avoid overwriting state with placeholder text
        if (turnEl.dataset.collapsed === "true") return;

        // Performance: Use textContent instead of innerText to avoid layout reflows
        const contentEl = turnEl.querySelector('.prose') as HTMLElement;
        const text = contentEl 
          ? contentEl.textContent?.trim() || '' 
          : turnEl.textContent?.trim() || '';

        const isUser = turnEl.querySelector('[aria-label="You said"]') ||
                       (turnEl.textContent && turnEl.textContent.toLowerCase().startsWith('you'));

        // Detect streaming status via DOM indicators
        const isStreaming = !!turnEl.querySelector('.result-streaming') ||
                            !!turnEl.querySelector('path[d*="M1 1v14h14V1H1z"]');

        const existingIndex = nextMessages.findIndex(m => m.id === id);

        if (existingIndex !== -1) {
          const existing = nextMessages[existingIndex];
          if (existing.content !== text || existing.isStreaming !== isStreaming) {
            // Update ONLY the changed message
            nextMessages[existingIndex] = {
              ...existing,
              content: text,
              isStreaming
            };
            changed = true;
          }
        } else {
          // Append new message incrementally
          nextMessages.push({
            id,
            role: isUser ? 'user' : 'assistant',
            content: text,
            createdAt: Date.now(),
            isStreaming
          });
          changed = true;
        }
      });

      if (changed) {
        let finalMessages = nextMessages;

        // Cap message history simply (memory bounded)
        if (finalMessages.length > MAX_MESSAGES) {
           finalMessages = finalMessages.slice(-MAX_MESSAGES);
        }

        // Optimization: pruning trigger (incremental)
        pruneOldMessages(MAX_MESSAGES);

        const duration = performance.now() - start;
        console.log(`[ChatSpeed] updateMessages took ${duration.toFixed(2)}ms`);
        return finalMessages;
      }

      return prevMessages;
    });
  }, []);

  useEffect(() => {
    console.log("🚀 ChatSpeed: Incremental scraping initialized.");

    // Initial full scan
    const initialTurns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
    updateMessagesFromNodes(Array.from(initialTurns) as HTMLElement[]);

    const observer = new MutationObserver((mutations) => {
      // 🥉 Streaming frequency — watch for 20+/sec = bottleneck
      console.count('[ChatSpeed] Mutation events');
      const nodesToUpdate = new Set<HTMLElement>();

      mutations.forEach((mutation) => {
        // Handle added nodes
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches('[data-testid^="conversation-turn-"]')) {
              nodesToUpdate.add(node);
            } else {
              const nestedTurns = node.querySelectorAll('[data-testid^="conversation-turn-"]');
              nestedTurns.forEach(t => nodesToUpdate.add(t as HTMLElement));
            }
          }
        });

        // Handle content updates (streaming)
        const target = mutation.target as HTMLElement;
        const closestTurn = target.closest?.('[data-testid^="conversation-turn-"]') as HTMLElement;
        if (closestTurn) {
          nodesToUpdate.add(closestTurn);
        }
      });

      if (nodesToUpdate.size > 0) {
        updateMessagesFromNodes(Array.from(nodesToUpdate));
      }
    });

    const targetNode = document.querySelector('main') || document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Periodic full resync fallback (every 60s)
    const resyncInterval = setInterval(() => {
      console.log("🔄 ChatSpeed: Periodic full resync...");
      const allTurns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
      console.log('[ChatSpeed] Resync — total turns found:', allTurns.length);
      updateMessagesFromNodes(Array.from(allTurns) as HTMLElement[]);
    }, 60000);

    // 🧠 Scroll performance indicator
    const scrollHandler = () => {
      console.log('[ChatSpeed] scrolling');
    };
    window.addEventListener('scroll', scrollHandler);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scrollHandler);
      clearInterval(resyncInterval);
    };
  }, [updateMessagesFromNodes]);

  // Handle Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < 800) setWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const visibleMessages = useMemo(() => {
    if (messages.length > COLLAPSE_THRESHOLD && !showOlderMessages) {
      return messages.slice(messages.length - COLLAPSE_THRESHOLD);
    }
    return messages;
  }, [messages, showOlderMessages]);

  const hiddenCount = messages.length - visibleMessages.length;

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 999999,
          background: '#10a37f', color: 'white', border: 'none', borderRadius: '50%',
          width: '50px', height: '50px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
        }}
      >
        ⚡
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: '0', right: '0', width: `${width}px`, height: '100vh',
      background: 'rgba(26, 26, 26, 0.95)', backdropFilter: 'blur(10px)',
      zIndex: 999999, borderLeft: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      transition: isResizing ? 'none' : 'width 0.2s ease-out'
    }}>
      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{
          position: 'absolute', left: '-5px', top: '0', width: '10px', height: '100%',
          cursor: 'col-resize', zIndex: 1000, background: isResizing ? '#10a37f' : 'transparent'
        }}
      />

      <div style={{
        padding: '20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: '#10a37f', fontWeight: 'bold', letterSpacing: '0.5px' }}>⚡ CHATSPEED</span>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Virtuoso
          style={{ height: '100%' }}
          data={visibleMessages}
          followOutput="smooth"
          initialTopMostItemIndex={visibleMessages.length - 1}
          components={{
            Header: () => (
              hiddenCount > 0 ? (
                <div
                  onClick={() => setShowOlderMessages(true)}
                  style={{
                    padding: '12px', textAlign: 'center', cursor: 'pointer',
                    background: 'rgba(16, 163, 127, 0.1)', color: '#10a37f',
                    fontSize: '12px', borderBottom: '1px solid rgba(16, 163, 127, 0.2)'
                  }}
                >
                  ⚡ {hiddenCount} earlier messages
                </div>
              ) : null
            )
          }}
          itemContent={(_, msg) => (
            <MessageItem message={msg} />
          )}
        />
      </div>
    </div>
  );
};
