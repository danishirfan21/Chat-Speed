import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem = React.memo(({ message }: MessageItemProps) => {
  const isUser = message.role === 'user';

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

      <div className="prose prose-invert max-w-none" style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
