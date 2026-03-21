import { useState, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types'
import { MessageItem } from './MessageItem'
import { Virtuoso } from 'react-virtuoso'
import { pruneOldMessages } from '../utils/domPruning'

export const ChatSpeedUI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mainRect, setMainRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [inputHeight, setInputHeight] = useState(150);

  const updateMessagesFromNodes = useCallback((nodes: HTMLElement[]) => {
    if (nodes.length === 0) return;

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

        const isUser = turnEl.querySelector('[data-message-author-role="user"]') ||
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

      if (newMessages.length > 0) changed = true;

      if (changed) {
        // Appending new messages since ChatGPT streams/adds in order.
        setTimeout(() => pruneOldMessages(2), 1000); // Debounce-ish pruning after new message batch
        return [...nextMessages, ...newMessages].slice(-2);
      }
      return prevMessages;
    });
  }, []);

  useEffect(() => {
    const knownMessageIds = new Set<string>();
    let isInitialLoadComplete = false;

    // Chunked initial load of existing messages to avoid O(n) main thread blocking
    setTimeout(() => {
      const allTurns = Array.from(document.querySelectorAll('[data-testid^="conversation-turn-"]')).slice(-2) as HTMLElement[];
      console.log(`[ChatSpeed] Executing chunked load for ${allTurns.length} host nodes`);
      
      let index = 0;
      const CHUNK_SIZE = 100;
      
      const processChunk = () => {
        const chunk = allTurns.slice(index, index + CHUNK_SIZE);
        chunk.forEach(t => {
          const id = t.getAttribute('data-testid');
          if (id) knownMessageIds.add(id);
        });
        
        updateMessagesFromNodes(chunk);
        index += CHUNK_SIZE;
        
        if (index < allTurns.length) {
          requestAnimationFrame(processChunk);
        } else {
          isInitialLoadComplete = true;
          // Clear up historical React DOM overhead
          pruneOldMessages(2);
        }
      };
      
      processChunk();
    }, 100);

    // MutationObserver to catch new messages and text updates
    const observer = new MutationObserver((mutations) => {
      if (!isInitialLoadComplete) return;

      const nodesToUpdate = new Set<HTMLElement>();

      mutations.forEach((mutation) => {
        // Handle newly added nodes
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              const turns: HTMLElement[] = [];
              if (node.matches('[data-testid^="conversation-turn-"]')) {
                turns.push(node);
              } else {
                node.querySelectorAll('[data-testid^="conversation-turn-"]').forEach(t => turns.push(t as HTMLElement));
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
        }
        
        // Handle text changes (streaming)
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          let target = mutation.target as HTMLElement;
          if (target.nodeType === Node.TEXT_NODE) target = target.parentElement as HTMLElement;
          if (target) {
            const turnEl = target.closest('[data-testid^="conversation-turn-"]') as HTMLElement;
            if (turnEl) {
               const id = turnEl.getAttribute('data-testid');
               // Only update if we already know about this turn, otherwise it'll be caught by the new node logic
               if (id && knownMessageIds.has(id)) {
                   nodesToUpdate.add(turnEl);
               }
            }
          }
        }
      });

      if (nodesToUpdate.size > 0) {
        updateMessagesFromNodes(Array.from(nodesToUpdate));
      }
    });

    const observerTarget = document.querySelector('main') || document.body;
    observer.observe(observerTarget, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };
  }, [updateMessagesFromNodes]);

  // Track Dimensions of ChatGPT layout to position our UI perfectly
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const updateRect = () => {
      const rect = main.getBoundingClientRect();
      setMainRect(current => {
        if (rect.width !== current.width || rect.left !== current.left || rect.top !== current.top || rect.height !== current.height) {
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        }
        return current;
      });
    };
    
    // Initial check
    updateRect();
    
    // Efficiently observe size changes (like sidebar opening)
    const mainObserver = new ResizeObserver(updateRect);
    mainObserver.observe(main);

    // Track input box height to avoid covering it
    const inputObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Add 20px padding to the exact height to prevent collisions with focus rings etc
        setInputHeight(entry.contentRect.height + 20); 
      }
    });
    
    // Find the input box form container element
    const findAndObserveForm = () => {
      const formEl = document.querySelector('form');
      if (formEl) {
        inputObserver.observe(formEl);
      } else {
        setTimeout(findAndObserveForm, 1000);
      }
    };
    findAndObserveForm();

    return () => {
      mainObserver.disconnect();
      inputObserver.disconnect();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: mainRect.top,
      left: mainRect.left,
      width: mainRect.width,
      height: mainRect.height,
      pointerEvents: 'none',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        height: "calc(" + mainRect.height + "px - " + inputHeight + "px)",
        width: '100%',
        maxWidth: '800px', // Matches typical ChatGPT container width
        padding: '0 20px',
        pointerEvents: 'auto',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <Virtuoso
          style={{ height: '100%', width: '100%' }}
          data={messages}
          followOutput="smooth"
          initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
          itemContent={(_, msg) => (
            <MessageItem message={msg} />
          )}
        />
      </div>
    </div>
  );
};
