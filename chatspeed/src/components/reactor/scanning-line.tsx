'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';


interface ScanningLineAnimationProps {
  isActive?: boolean;
}

export default function ScanningLineAnimation({ isActive = true }: ScanningLineAnimationProps) {
  const signalBars = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${4 + (i / 12) * 92}%`,
      duration: 1.2 + Math.random() * 4.5,
      delay: Math.random() * -12, // Even wider delay offset
      baseHeight: 12 + Math.random() * 65,
      glowOpacity: 0.15 + Math.random() * 0.6,
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-8 relative h-32 overflow-hidden rounded-xl glass-card-elevated p-6"
    >
      {/* Baseline glow (bottom edge) */}
      {/* Baseline glow (bottom edge) — reacts to reactor power with slight delay */}
      <motion.div
        initial={false}
        animate={{
          opacity: isActive ? 1 : 0.3,
          height: isActive ? '2px' : '1px',
        }}
        transition={{ delay: 0.15, duration: 0.8, ease: 'easeOut' }}
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(0, 245, 255, 0.4) 30%, rgba(0, 245, 255, 0.6) 50%, rgba(0, 245, 255, 0.4) 70%, transparent 95%)',
          boxShadow: isActive ? '0 0 10px rgba(0, 245, 255, 0.2)' : 'none',
        }}
      />

      {/* Subtle Gradient Sweep (Option B — slow 3s loop) */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 bottom-0 w-1/2 pointer-events-none z-0 opacity-[0.04]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.15), transparent)',
        }}
      />
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
          background: 'linear-gradient(180deg, transparent, rgba(0, 245, 255, 0.5), transparent)',
          boxShadow: '0 0 6px rgba(0, 245, 255, 0.3)',
          filter: 'blur(1px)',
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

      {/* ── Signal Activity Bars (organic & reactive with delay) ── */}
      {signalBars.map((bar) => (
        <motion.div
          key={bar.id}
          animate={{
            height: isActive ? [`${bar.baseHeight}%`, `${bar.baseHeight * 1.3}%`, `${bar.baseHeight}%`] : `${bar.baseHeight * 0.3}%`,
            opacity: isActive ? [bar.glowOpacity, bar.glowOpacity + 0.2, bar.glowOpacity] : 0.15,
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            delay: isActive ? (bar.delay + 0.15) : bar.delay, // 150ms Influence of reactor pulse delay
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 w-[1.5px]"
          style={{
            left: bar.left,
            background: isActive 
              ? `linear-gradient(0deg, rgba(0, 245, 255, 0.7), rgba(0, 245, 255, 0.1))`
              : `rgba(0, 245, 255, 0.2)`,
            filter: 'blur(0.3px)',
          }}
        />
      ))}

      {/* ── Data Wave Pulses ── */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`wave-${index}`}
          animate={{
            left: ['0%', '100%'],
            opacity: [0.25, 0.1, 0],
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
