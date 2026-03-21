import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem = React.memo(({ message }: MessageItemProps) => {
  const isUser = message.role === 'user';
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !message.node) return;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(message.node);
  }, [message.node]);

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#ccc',
        minHeight: '60px' // helps React Virtuoso calculate layout
      }}
    >
      <div style={{
        color: isUser ? '#54a3ff' : '#10a37f',
        fontWeight: '600',
        marginBottom: '4px',
        textTransform: 'uppercase',
        fontSize: '11px'
      }}>
        {message.role}
        {message.isStreaming && <span style={{ marginLeft: '8px', opacity: 0.5 }}>●</span>}
      </div>

      <div ref={containerRef} style={{ opacity: 0.9 }} className="chat-speed-cloned-message" />
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
