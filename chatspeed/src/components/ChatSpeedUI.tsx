import { useState, useEffect, useMemo } from 'react'
import type { ChatMessage } from '../types'
import { MessageItem } from './MessageItem'
import { Virtuoso } from 'react-virtuoso'

const COLLAPSE_THRESHOLD = 100;

export const ChatSpeedUI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [width, setWidth] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showOlderMessages, setShowOlderMessages] = useState(false);

  useEffect(() => {
    console.log("🚀 ChatSpeed: Content script initialized.");

    const scrapeMessages = () => {
      const turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
      if (turns.length === 0) return;

      setMessages((prevMessages) => {
        const messageMap = new Map(prevMessages.map(m => [m.id, m]));
        let changed = false;

        turns.forEach((turn) => {
          const turnEl = turn as HTMLElement;
          const id = turnEl.getAttribute('data-testid') || '';
          if (!id) return;

          // If the element is collapsed, its DOM doesn't reflect actual content.
          // Since we already have the state in memory, don't overwrite it with "collapsed" text.
          if (turnEl.dataset.collapsed === "true") return;

          const isUser = turnEl.querySelector('[aria-label="You said"]') ||
                         turnEl.innerText.toLowerCase().startsWith('you');

          const contentEl = turnEl.querySelector('.prose') as HTMLElement;
          const text = contentEl ? contentEl.innerText.trim() : turnEl.innerText.trim();

          // Detect streaming status (typical cursor or specialized class)
          const isStreaming = !!turnEl.querySelector('.result-streaming') ||
                              !!turnEl.querySelector('path[d*="M1 1v14h14V1H1z"]'); // ChatGPT cursor icon

          const existing = messageMap.get(id);
          if (!existing || existing.content !== text || existing.isStreaming !== isStreaming) {
            messageMap.set(id, {
              id,
              role: isUser ? 'user' : 'assistant',
              content: text,
              createdAt: existing?.createdAt || Date.now(),
              isStreaming
            });
            changed = true;
          }
        });

        if (changed) {
          return Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
        }
        return prevMessages;
      });
    };

    scrapeMessages();
    const targetNode = document.querySelector('main') || document.body;
    const observer = new MutationObserver(() => scrapeMessages());
    observer.observe(targetNode, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

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
