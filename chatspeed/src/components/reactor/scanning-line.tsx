'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';


interface ScanningLineAnimationProps {
  isActive?: boolean;
}

export default function ScanningLineAnimation({ isActive = true }: ScanningLineAnimationProps) {
  const signalBars = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const isActivity = Math.random() > 0.4;
      return {
        id: i,
        // Non-uniform spacing
        left: `${3 + (i / 16) * 94 + (Math.random() - 0.5) * 2}%`,
        duration: 1.5 + Math.random() * 4,
        delay: Math.random() * -10,
        repeatDelay: Math.random() * 2,
        baseHeight: isActivity ? (10 + Math.random() * 65) : (5 + Math.random() * 10),
        glowOpacity: isActivity ? (0.2 + Math.random() * 0.5) : 0.1,
        isSpike: Math.random() > 0.92,
        width: 1 + Math.random() * 1.5,
      };
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-8 relative h-32 overflow-hidden rounded-xl glass-card-elevated p-6"
    >
      {/* ── Suble Noise Layer ── */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,245,255,0.03) 1px, transparent 1px)',
          backgroundSize: '2px 2px',
        }}
      />
      {/* Baseline glow (bottom edge) */}
      {/* Baseline glow (bottom edge) — reacts to reactor power with slight delay */}
      <motion.div
        initial={false}
        animate={{
          opacity: isActive ? [0.85, 1, 0.92, 1] : 0.3,
          height: isActive ? '2px' : '1px',
        }}
        transition={{ 
          opacity: { duration: 0.2, repeat: Infinity, repeatType: 'reverse' },
          height: { delay: 0.15, duration: 0.8, ease: 'easeOut' } 
        }}
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(0, 245, 255, 0.4) 30%, rgba(0, 245, 255, 0.6) 50%, rgba(0, 245, 255, 0.4) 70%, transparent 95%)',
          boxShadow: isActive ? '0 0 12px rgba(0, 245, 255, 0.15)' : 'none',
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
      <motion.div
        animate={{ 
          left: ['-10%', '110%'],
          opacity: [0, 1, 0.8, 1, 0]
        }}
        transition={{ 
          left: { duration: 4.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }, // Non-linear scan
          opacity: { duration: 0.2, repeat: Infinity }
        }}
        className="absolute top-0 bottom-0 w-[1.5px] z-20"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0, 245, 255, 0.6), transparent)',
          boxShadow: '0 0 8px rgba(0, 245, 255, 0.4)',
          filter: 'blur(0.5px)',
        }}
      />

      {/* ── Scanning Line Glow Trail (sync with scan) ── */}
      <motion.div
        animate={{ left: ['-20%', '100%'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-0 bottom-0 w-24 z-10"
        style={{
          background: 'linear-gradient(90deg, rgba(0, 245, 255, 0.06), transparent)',
          filter: 'blur(12px)',
        }}
      />

      {/* ── Signal Activity Bars (organic & reactive with delay) ── */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ maskImage: 'linear-gradient(to top, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent 100%)' }}
      >
        {signalBars.map((bar) => (
          <motion.div
            key={bar.id}
            animate={{
              height: isActive 
                ? [`${bar.baseHeight}%`, `${(bar.baseHeight + (bar.isSpike ? 25 : 5))}%`, `${bar.baseHeight}%`] 
                : `${bar.baseHeight * 0.3}%`,
              opacity: isActive 
                ? [bar.glowOpacity, bar.glowOpacity + (bar.isSpike ? 0.3 : 0.1), bar.glowOpacity] 
                : 0.1,
            }}
            transition={{
              duration: bar.duration,
              repeat: Infinity,
              repeatDelay: bar.repeatDelay,
              delay: isActive ? (bar.delay + 0.15) : bar.delay,
              ease: 'easeInOut',
            }}
            className="absolute bottom-0"
            style={{
              width: `${bar.width}px`,
              left: bar.left,
              background: isActive 
                ? `linear-gradient(0deg, rgba(0, 245, 255, 0.8), rgba(0, 245, 255, 0.1))`
                : `rgba(0, 245, 255, 0.15)`,
              filter: `blur(${bar.isSpike ? 0.6 : 0.3}px)`,
              willChange: 'height, opacity',
            }}
          />
        ))}
      </div>

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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <motion.div 
          animate={{ 
            opacity: [0.7, 1, 0.85, 1],
            letterSpacing: ['0.1em', '0.12em', '0.1em']
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-center"
        >
          <div className="text-xs text-[#00F5FF] font-mono tracking-wider opacity-80">
            {'< '}
            <span className="inline-block">INTERCEPTING</span>
            {' />'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
