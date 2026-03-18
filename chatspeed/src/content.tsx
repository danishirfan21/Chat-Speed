import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Virtuoso } from 'react-virtuoso'

const ChatSpeedUI = () => {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);

  useEffect(() => {
    console.log("🚀 ChatSpeed: Content script initialized.");

    const scrapeMessages = () => {
      // Modern ChatGPT uses data-testid for message turns
      const turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
      
      if (turns.length === 0) {
        console.warn("⚠️ ChatSpeed: No conversation turns found yet.");
        return;
      }

      const newMessages = Array.from(turns).map((turn) => {
        const turnEl = turn as HTMLElement;
        const isUser = turnEl.querySelector('[aria-label="You said"]') || 
                       turnEl.innerText.toLowerCase().startsWith('you');
        
        const contentEl = turnEl.querySelector('.prose') as HTMLElement;
        const text = contentEl ? contentEl.innerText.trim() : turnEl.innerText.trim();
        
        return {
          role: isUser ? 'User' : 'AI',
          text: text
        };
      });

      console.log(`✅ ChatSpeed: Scraped ${newMessages.length} messages.`);
      setMessages(newMessages);
    };

    // 1. Initial Scrape
    scrapeMessages();

    // 2. Set up Observer to watch the 'main' section for new messages
    const targetNode = document.querySelector('main') || document.body;
    const observer = new MutationObserver(() => {
      console.log("👀 ChatSpeed: DOM change detected, rescraping...");
      scrapeMessages();
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: '0', right: '0', width: '400px', height: '100vh',
      background: '#0d0d0d', zIndex: 999999, borderLeft: '2px solid #333',
      display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.5)'
    }}>
      <div style={{ padding: '15px', background: '#1a1a1a', color: '#10a37f', fontWeight: 'bold' }}>
        ⚡ ChatSpeed (Total: {messages.length})
      </div>
      
      <Virtuoso
        style={{ flexGrow: 1 }}
        data={messages}
        itemContent={(_, msg) => (
          <div style={{ 
            padding: '12px', borderBottom: '1px solid #222', fontSize: '13px', color: '#eee' 
          }}>
            <strong style={{ color: msg.role === 'User' ? '#007bff' : '#10a37f' }}>{msg.role}:</strong>
            <div style={{ marginTop: '5px', opacity: 0.9 }}>{msg.text.substring(0, 500)}...</div>
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
