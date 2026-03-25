'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Generate organic-feeling signal bars with varied timing
function useSignalBars(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + (i / count) * 84}%`,
      duration: 1.8 + Math.random() * 2,
      delay: Math.random() * 2,
      height: 30 + Math.random() * 50,
    }));
  }, [count]);
}

export default function ScanningLineAnimation() {
  const signalBars = useSignalBars(10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-8 relative h-32 overflow-hidden rounded-xl glass-card-elevated p-6"
    >
      {/* Title */}
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-xs font-semibold text-[#00F5FF] uppercase tracking-wider opacity-80">
          Data Stream Monitor
        </h3>
      </div>

      {/* Animated Background Grid */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '0% 100%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            linear-gradient(0deg,
              rgba(0, 245, 255, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(90deg,
              rgba(0, 245, 255, 0.04) 1px,
              transparent 1px
            )
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0px 0px',
        }}
      />

      {/* ── Horizontal Scanning Line ── */}
      <div
        className="absolute top-0 bottom-0 w-[2px] animate-scan-horizontal z-20"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0, 245, 255, 0.9), transparent)',
          boxShadow: '0 0 12px rgba(0, 245, 255, 0.6), 0 0 24px rgba(0, 245, 255, 0.3)',
        }}
      />

      {/* ── Scanning Line Glow Trail ── */}
      <div
        className="absolute top-0 bottom-0 w-16 animate-scan-horizontal z-10"
        style={{
          background: 'linear-gradient(90deg, rgba(0, 245, 255, 0.08), transparent)',
          filter: 'blur(8px)',
        }}
      />

      {/* ── Signal Activity Bars (organic) ── */}
      {signalBars.map((bar) => (
        <div
          key={bar.id}
          className="absolute bottom-0 w-[2px] animate-signal-bar"
          style={{
            left: bar.left,
            height: `${bar.height}%`,
            animationDuration: `${bar.duration}s`,
            animationDelay: `${bar.delay}s`,
            background: `linear-gradient(0deg, rgba(0, 245, 255, 0.6), rgba(0, 245, 255, 0.1))`,
          }}
        />
      ))}

      {/* ── Data Wave Pulses ── */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`wave-${index}`}
          animate={{
            left: ['0%', '100%'],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: index * 1.1,
            ease: 'easeOut',
          }}
          className="absolute top-1/4 h-1/2 w-20 bg-gradient-to-r from-[rgba(0,245,255,0.1)] via-[rgba(0,245,255,0.2)] to-transparent blur-xl"
        />
      ))}

      {/* ── HUD Elements — Terminal Output ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center animate-terminal-flicker">
          <div className="text-xs text-[#00F5FF] font-mono tracking-wider opacity-80">
            {'< '}
            <span className="inline-block">INTERCEPTING</span>
            {' />'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
