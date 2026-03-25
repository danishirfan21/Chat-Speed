import { useState } from 'react';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';
import NeoSkeuomorphicToggle from './components/reactor/neo-toggle';
import ScanningLineAnimation from './components/reactor/scanning-line';

const App = () => {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = (newState: boolean) => {
    setIsActive(newState);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden vignette">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,245,255,0.03)] via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[rgba(0,245,255,0.04)] rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[rgba(0,245,255,0.03)] rounded-full blur-3xl opacity-15" />
      </div>

      {/* Circuit Board Texture */}
      <div className="fixed inset-0 circuit-texture pointer-events-none opacity-30" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Master Control Section */}
        <div className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-2 mb-8"
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
                className="mt-1.5 text-[11px] font-semibold tracking-[0.25em] uppercase opacity-90 transition-all duration-500"
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

            {/* Reactor with Radial Background Glow */}
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
                  opacity: isActive ? 0.35 : 0,
                  height: isActive ? '32px' : '0px'
                }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[2px] pointer-events-none z-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0, 245, 255, 0.4), transparent)'
                }}
              />
            </div>
          </motion.div>

          {/* Panels with AnimatePresence */}
          <AnimatePresence mode="wait">
            {isActive ? (
              <ScanningLineAnimation key="scanner" isActive={isActive} />
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex justify-center"
              >
                <div className="glass-card px-8 py-6 max-w-md text-center">
                  <p className="text-muted-foreground text-sm">
                    Enable ChatSpeed to start intercepting and pruning ChatGPT's JSON data streams in real-time.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default App;