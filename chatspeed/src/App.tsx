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
            className="flex flex-col items-center gap-8 mb-12"
          >
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#00F5FF] to-[#D4AF37]">
                Surgical Network Graft
              </h1>
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                O(1) JSON Data Stream Pruning
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
            </div>

            {/* Status Indicator */}
            <motion.div
              animate={{ opacity: isActive ? 1 : 0.6 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{
                  backgroundColor: isActive
                    ? 'rgba(0, 245, 255, 0.9)'
                    : 'rgba(0, 245, 255, 0.3)',
                }}
                transition={{ duration: 0.4 }}
                className={`w-2.5 h-2.5 rounded-full ${isActive ? 'animate-status-dot' : ''}`}
                style={{
                  boxShadow: isActive
                    ? '0 0 8px rgba(0, 245, 255, 0.6)'
                    : '0 0 4px rgba(0, 245, 255, 0.15)',
                }}
              />
              <span className="text-sm text-muted-foreground font-mono tracking-wider">
                {isActive ? 'ACTIVE' : 'STANDBY'}
              </span>
            </motion.div>
          </motion.div>

          {/* Panels with AnimatePresence */}
          <AnimatePresence mode="wait">
            {isActive ? (
              <ScanningLineAnimation key="scanner" />
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