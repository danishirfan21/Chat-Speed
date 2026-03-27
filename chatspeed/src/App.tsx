import { useEffect, useState } from 'react';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';
import NeoSkeuomorphicToggle from './components/reactor/neo-toggle';
import ScanningLineAnimation from './components/reactor/scanning-line';

const App = () => {
  const [isActive, setIsActive] = useState(false);
  const [ramSaved, setRamSaved] = useState(0);
  const [nodesPruned, setNodesPruned] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const ramInterval = setInterval(() => {
      setRamSaved((prev) => Math.min(prev + Math.random() * 3 + 1, 512));
    }, 800);

    const nodesInterval = setInterval(() => {
      setNodesPruned((prev) => prev + Math.floor(Math.random() * 12 + 5));
    }, 600);


    return () => {
      clearInterval(ramInterval);
      clearInterval(nodesInterval);
    };
  }, [isActive]);

  const handleToggle = (newState: boolean) => {
    setIsActive(newState);
    if (isActive) {
      setRamSaved(0);
      setNodesPruned(0);
    }
  };

  return (
    <div className="w-[420px] h-[560px] overflow-hidden flex flex-col bg-background text-foreground vignette relative">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,245,255,0.03)] via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[rgba(0,245,255,0.04)] rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[rgba(0,245,255,0.03)] rounded-full blur-3xl opacity-15" />
      </div>

      {/* Circuit Board Texture */}
      <div className="absolute inset-0 circuit-texture pointer-events-none opacity-30 z-0" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* 3. HEADER (TOP BAR) */}
        <div className="flex-none h-[48px] px-5 pt-4 flex items-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {/* ── Two-Layer Header ── */}
            <div className="w-full">
              {/* Top Row: Brand + Status */}
              <div className="flex items-center justify-between">
                {/* Left: Logo + Product Name */}
                <div className="flex items-center gap-2.5">
                  <img
                    src="/icon32.png"
                    alt="ChatSpeed"
                    className="w-5 h-5"
                    style={{
                      transform: 'translateY(0.5px)',
                      filter: 'drop-shadow(0 0 3px rgba(0, 245, 255, 0.2))',
                    }}
                  />
                  <span
                    className="text-[15px] font-semibold text-white tracking-tight"
                    style={{ textShadow: '0 0 10px rgba(0, 245, 255, 0.25)' }}
                  >
                    ChatSpeed
                  </span>
                </div>

                {/* Right: Status Indicator */}
                <motion.div
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-[3px]"
                >
                  <motion.div
                    style={{
                      backgroundColor: isActive ? 'rgba(0, 245, 255, 1)' : 'rgba(0, 245, 255, 0.15)',
                      boxShadow: isActive
                        ? '0 0 10px rgba(0, 245, 255, 0.8), 0 0 4px rgba(0, 245, 255, 0.4)'
                        : '0 0 2px rgba(0, 245, 255, 0.05)',
                    }}
                    transition={{ duration: 0.4 }}
                    className={`w-[7px] h-[7px] rounded-full ${isActive ? 'animate-status-dot' : ''}`}
                  />
                  <span 
                    className={`text-[11px] font-mono tracking-widest uppercase transition-all duration-300 ${isActive ? 'text-white' : 'text-muted-foreground opacity-60'}`}
                    style={{
                      textShadow: isActive ? '0 0 4px rgba(0, 245, 255, 0.25)' : 'none',
                    }}
                  >
                    {isActive ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </motion.div>
              </div>

              {/* Sub-header: Technical Identity */}
              <p
                className="mt-0.5 text-[11px] font-semibold tracking-[0.25em] uppercase opacity-90 transition-all duration-500"
                style={{
                  color: isActive ? 'rgba(0, 245, 255, 0.95)' : 'rgba(0, 245, 255, 0.6)',
                  textShadow: isActive 
                    ? '0 0 12px rgba(0, 245, 255, 0.3), 0 0 4px rgba(0, 245, 255, 0.15)' 
                    : '0 0 6px rgba(0, 245, 255, 0.12)',
                }}
              >
                Surgical Network Graft
              </p>
            </div>
          </motion.div>
        </div>

        {/* 4. REACTOR SECTION */}
        <div className="flex-none h-[150px] mt-[12px] relative flex flex-col items-center justify-center">
          <motion.div
            animate={{ 
              opacity: isActive ? [0.65, 0.9, 0.75, 1] : [0.4, 0.6, 0.5, 0.6],
              textShadow: isActive ? '0 0 12px rgba(0, 245, 255, 0.4)' : '0 0 6px rgba(0, 245, 255, 0.2)'
            }}
            transition={{ duration: isActive ? 2 : 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-3 text-[10px] font-mono tracking-[0.18em] text-[#00F5FF]/80 uppercase pointer-events-none"
          >
            {isActive ? 'Live Interception Active' : 'System ready to intercept'}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="relative">
              {/* Radial glow behind reactor */}
              <motion.div
                animate={{
                  opacity: isActive ? 0.5 : 0.15,
                  scale: isActive ? 1.2 : 0.9,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-0 -m-16 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 245, 255, 0.25), transparent 70%)',
                }}
              />
              <NeoSkeuomorphicToggle isActive={isActive} onChange={handleToggle} />

              {/* ── Energy Continuity Beam ── */}
              <motion.div
                animate={{ 
                  opacity: isActive ? 0.6 : 0.2,
                  height: '30px'
                }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[1px] pointer-events-none z-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,245,255,0.4), rgba(0,245,255,0.05), transparent)',
                  filter: 'blur(0.5px)',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* 5. DATA STREAM MONITOR */}
        <div className="flex-none h-[125px] mt-[20px] px-5">
          <ScanningLineAnimation isActive={isActive} />
        </div>

        {/* Panels with AnimatePresence */}
        <AnimatePresence mode="wait">
          {isActive ? (
            <>
            {/* 6. METRICS SECTION - 2 Column Grid */}
            <motion.div
              key="metrics-zone"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 mt-[16px] relative min-h-0 flex flex-col"
            >
              {/* Top divider glow & inner depth fade */}
              <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[rgba(0,245,255,0.25)] to-transparent z-20 pointer-events-none" />
              <div className="absolute top-0 left-5 right-5 h-[40px] bg-gradient-to-b from-[rgba(0,245,255,0.04)] to-transparent z-10 pointer-events-none rounded-t-lg" />
              
              <div 
                className="flex-1 grid grid-cols-2 gap-4 px-5 pb-5 pt-[14px] rounded-lg bg-gradient-to-b from-white/[0.03] to-transparent/0 relative section-depth card-edge-highlight overflow-hidden items-start"
                style={{
                  boxShadow: 'inset 0 1px 4px rgba(0, 245, 255, 0.12), inset 0 6px 15px -10px rgba(0, 245, 255, 0.15)'
                }}
              >
                {/* RAM Saved Card - Enhanced with lit panel effect */}
              <motion.div
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
                className="metric-card metric-card-cyan p-3 rounded-lg group cursor-default"
              >
                <div className="flex items-start justify-between mb-1.5 relative z-10">
                  <div className="flex-1">
                    <p className="metric-label">RAM Saved</p>
                        <motion.p
                          key={ramSaved}
                          animate={{ opacity: [0.7, 1], scale: [1.03, 1] }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="metric-value text-accent mt-1.5"
                          style={{ color: '#00F5FF' }}
                        >
                          {ramSaved.toFixed(0)}
                        </motion.p>
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="text-2xl text-accent/40 group-hover:text-accent/60 transition-colors"
                      >
                        ⚡
                      </motion.span>
                    </div>
                    <div className={`metric-underline metric-underline-cyan mt-1 ${isActive ? 'active' : 'standby'}`} />
                  </motion.div>

                  {/* Nodes Pruned Card - Enhanced with lit panel effect */}
                  <motion.div
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.2 }}
                    className="metric-card metric-card-gold p-3 rounded-lg group cursor-default"
                  >
                    <div className="flex items-start justify-between mb-1.5 relative z-10">
                      <div className="flex-1">
                        <p className="metric-label">Nodes Pruned</p>
                        <motion.p
                          key={nodesPruned}
                          animate={{ opacity: [0.7, 1], scale: [1.03, 1] }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="metric-value text-primary mt-1.5"
                          style={{ color: '#D4AF37' }}
                        >
                          {nodesPruned}
                        </motion.p>
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                        className="text-2xl text-primary/40 group-hover:text-primary/60 transition-colors"
                      >
                        ✂️
                      </motion.span>
                    </div>
                    <div className={`metric-underline metric-underline-gold mt-1 ${isActive ? 'active' : 'standby'}`} />
                  </motion.div>
              </div> {/* Close scrolling div wrapper */}
            </motion.div>
            </>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex-1 mt-[20px] px-8 flex flex-col items-center justify-center min-h-0 relative z-20"
            >
              <div className="px-5 py-4 text-center w-full bg-white/[0.025] border border-white/[0.05] rounded-xl shadow-none">
                <p className="text-[#00F5FF]/50 text-[11px] leading-snug tracking-wide font-medium">
                  Enable ChatSpeed to start intercepting and pruning ChatGPT&apos;s JSON data streams in real-time.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 7. SYSTEM HUD FOOTER */}
        <div className="flex-none flex justify-center mt-auto mb-6">
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            href="https://github.com/danishirfan21/Chat-Speed"
            target="_blank"
            rel="noopener noreferrer"
            className={`hud-link ${isActive ? 'hud-link-active' : 'hud-link-standby'}`}
          >
            {isActive ? '< LIVE TRACE AVAILABLE />' : '< SOURCE AVAILABLE />'}
          </motion.a>
        </div>
      </div>
    </div>
  );
};

export default App;