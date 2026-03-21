import { useState, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types'
import { MessageItem } from './MessageItem'
import { Virtuoso } from 'react-virtuoso'

export const ChatSpeedUI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateMessagesFromNodes = useCallback((nodes: HTMLElement[], options?: { prepend?: boolean }) => {
    if (nodes.length === 0) return;

    if (nodes.length > 60) {
      console.warn("🚨 [ChatSpeed] Prevented large update:", nodes.length);
      return;
    }

    setMessages((prevMessages) => {
      let changed = false;
      const nextMessages = [...prevMessages];
      const newMessages: ChatMessage[] = [];

      nodes.forEach((turnEl) => {
        const id = turnEl.getAttribute('data-testid') || '';
        if (!id) return;

        const contentEl = turnEl.querySelector('.prose') as HTMLElement;
        const text = contentEl 
          ? contentEl.textContent?.trim() || '' 
          : turnEl.textContent?.trim() || '';

        const isUser = turnEl.querySelector('[aria-label="You said"]') ||
                       (turnEl.textContent && turnEl.textContent.toLowerCase().startsWith('you'));

        const isStreaming = !!turnEl.querySelector('.result-streaming') ||
                            !!turnEl.querySelector('path[d*="M1 1v14h14V1H1z"]');

        const existingIndex = nextMessages.findIndex(m => m.id === id);

        if (existingIndex !== -1) {
          const existing = nextMessages[existingIndex];
          if (existing.content !== text || existing.isStreaming !== isStreaming) {
            nextMessages[existingIndex] = {
              ...existing,
              content: text,
              isStreaming
            };
            changed = true;
          }
        } else {
          newMessages.push({
            id,
            role: isUser ? 'user' : 'assistant',
            content: text,
            createdAt: Date.now(),
            isStreaming
          });
        }
      });

      if (newMessages.length > 0) {
        changed = true;
      }

      if (changed) {
        if (newMessages.length > 0) {
          return options?.prepend ? [...newMessages, ...nextMessages] : [...nextMessages, ...newMessages];
        }
        return nextMessages;
      }

      return prevMessages;
    });
  }, []);

  const processNodesInChunks = useCallback((nodes: HTMLElement[], options?: { prepend?: boolean; chunkSize?: number }) => {
    const { prepend = false, chunkSize = 50 } = options || {};
    const nodesToProcess = [...nodes];

    const processNextChunk = () => {
      if (nodesToProcess.length === 0) return;
      const chunk = prepend ? nodesToProcess.splice(-chunkSize) : nodesToProcess.splice(0, chunkSize);
      updateMessagesFromNodes(chunk, { prepend });
      if (nodesToProcess.length > 0) {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(processNextChunk);
        } else {
          setTimeout(processNextChunk, 10);
        }
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(processNextChunk);
    } else {
      setTimeout(processNextChunk, 10);
    }
  }, [updateMessagesFromNodes]);

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('[data-chatspeed-hidden="true"]');
      if (container) {
        setRect(container.getBoundingClientRect());
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const interval = setInterval(updateDimensions, 1000); // Polling as fallback

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const knownMessageIds = new Set<string>();
    let isInitialLoadComplete = false;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const allTurns = Array.from(document.querySelectorAll('[data-testid^="conversation-turn-"]')) as HTMLElement[];
        const initialBatchSize = 50;

        allTurns.forEach(t => {
          const id = t.getAttribute('data-testid');
          if (id) knownMessageIds.add(id);
        });

        const recentTurns = allTurns.slice(-initialBatchSize);
        const olderTurns = allTurns.slice(0, -initialBatchSize);

        updateMessagesFromNodes(recentTurns);

        if (olderTurns.length > 0) {
          processNodesInChunks(olderTurns, { prepend: true });
        }

        isInitialLoadComplete = true;
      }, 100);
    });

    const observer = new MutationObserver((mutations) => {
      if (!isInitialLoadComplete) return;
      const nodesToUpdate = new Set<HTMLElement>();

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length === 0) return;
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const turns: HTMLElement[] = [];
            if (node.matches('[data-testid^="conversation-turn-"]')) {
              turns.push(node);
            } else {
              const nested = node.querySelectorAll('[data-testid^="conversation-turn-"]');
              nested.forEach(t => turns.push(t as HTMLElement));
            }

            turns.forEach(turnEl => {
              const id = turnEl.getAttribute('data-testid');
              if (id && !knownMessageIds.has(id)) {
                knownMessageIds.add(id);
                nodesToUpdate.add(turnEl);
              }
            });
          }
        });
      });

      if (nodesToUpdate.size > 0) {
        updateMessagesFromNodes(Array.from(nodesToUpdate));
      }
    });

    const targetNode = document.querySelector('main') || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    const resyncInterval = setInterval(() => {
      const allTurns = Array.from(document.querySelectorAll('[data-testid^="conversation-turn-"]')) as HTMLElement[];
      processNodesInChunks(allTurns);
    }, 60000);

    return () => {
      observer.disconnect();
      clearInterval(resyncInterval);
    };
  }, [updateMessagesFromNodes, processNodesInChunks]);

  if (!rect) return null;

  return (
    <div style={{
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      background: '#1a1a1a',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '10px 20px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span style={{ color: '#10a37f', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>⚡ CHATSPEED PARALLEL UI</span>
      </div>

      <div style={{ flexGrow: 1, position: 'relative', minHeight: 0 }}>
        <Virtuoso
          style={{ height: '100%' }}
          data={messages}
          followOutput="smooth"
          initialTopMostItemIndex={messages.length - 1}
          itemContent={(_, msg) => (
            <MessageItem message={msg} />
          )}
        />
      </div>
    </div>
  );
};
