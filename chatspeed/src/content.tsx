import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Virtuoso } from 'react-virtuoso'

const ChatSpeedUI = () => {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [width, setWidth] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    console.log("🚀 ChatSpeed: Content script initialized.");

    const scrapeMessages = () => {
      const turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
      if (turns.length === 0) return;

      const newMessages = Array.from(turns).map((turn) => {
        const turnEl = turn as HTMLElement;
        const isUser = turnEl.querySelector('[aria-label="You said"]') || 
                       turnEl.innerText.toLowerCase().startsWith('you');
        
        const contentEl = turnEl.querySelector('.prose') as HTMLElement;
        const text = contentEl ? contentEl.innerText.trim() : turnEl.innerText.trim();
        
        return { role: isUser ? 'User' : 'AI', text: text };
      });

      setMessages(newMessages);
    };

    scrapeMessages();
    const targetNode = document.querySelector('main') || document.body;
    const observer = new MutationObserver(() => scrapeMessages());
    observer.observe(targetNode, { childList: true, subtree: true });

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
      
      <Virtuoso
        style={{ flexGrow: 1 }}
        data={messages}
        itemContent={(_, msg) => (
          <div style={{ 
            padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', 
            lineHeight: '1.6', color: '#ccc' 
          }}>
            <div style={{ 
              color: msg.role === 'User' ? '#54a3ff' : '#10a37f', 
              fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px'
            }}>
              {msg.role}
            </div>
            <div style={{ opacity: 0.9 }}>{msg.text.substring(0, 800)}...</div>
          </div>
        )}
      />
    </div>
  );
};

// Mount
const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<ChatSpeedUI />);
