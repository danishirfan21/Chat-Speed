'use client';

import { motion } from 'framer-motion';

interface NeoSkeuomorphicToggleProps {
  isActive: boolean;
  onChange: (state: boolean) => void;
}

export default function NeoSkeuomorphicToggle({
  isActive,
  onChange,
}: NeoSkeuomorphicToggleProps) {
  return (
    <motion.button
      onClick={() => onChange(!isActive)}
      className="relative w-32 h-32 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Outer Glass Shell with 3D Effect */}
      <motion.div
        animate={{
          boxShadow: isActive
            ? `
            0 0 40px rgba(0, 245, 255, 0.8),
            0 20px 60px rgba(0, 0, 0, 0.8),
            inset -2px -2px 8px rgba(0, 0, 0, 0.5),
            inset 2px 2px 8px rgba(0, 245, 255, 0.3)
            `
            : `
            0 0 20px rgba(212, 175, 55, 0.3),
            0 20px 50px rgba(0, 0, 0, 0.9),
            inset -2px -2px 8px rgba(0, 0, 0, 0.8),
            inset 2px 2px 8px rgba(212, 175, 55, 0.1)
            `,
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-white/5 to-black/20 backdrop-blur-xl border-2"
        style={{
          borderColor: isActive ? 'rgba(0, 245, 255, 0.5)' : 'rgba(212, 175, 55, 0.3)',
        }}
      />

      {/* Metal Ring - Inner Layer */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/5 to-black/40 border border-white/5" />

      {/* Central Crystal Core */}
      <motion.div
        animate={{
          scale: isActive ? 1.1 : 1,
          backgroundColor: isActive
            ? 'rgba(0, 245, 255, 0.3)'
            : 'rgba(212, 175, 55, 0.15)',
          boxShadow: isActive
            ? '0 0 30px rgba(0, 245, 255, 0.9), inset 0 0 20px rgba(0, 245, 255, 0.4)'
            : '0 0 15px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(212, 175, 55, 0.2)',
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-6 rounded-full backdrop-blur-sm border-2"
        style={{
          borderColor: isActive ? 'rgba(0, 245, 255, 0.8)' : 'rgba(212, 175, 55, 0.5)',
        }}
      />

      {/* Inner Glow Pulse */}
      {isActive && (
        <>
          <motion.div
            animate={{
              opacity: [0.8, 0.3, 0.8],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-8 rounded-full bg-gradient-to-r from-accent to-transparent opacity-60"
          />
          <motion.div
            animate={{
              opacity: [0.6, 0.2, 0.6],
              scale: [0.7, 1.2, 0.7],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-10 rounded-full bg-accent/30"
          />
        </>
      )}

      {/* Power Icon - Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          width={64}
          height={64}
          viewBox="0 0 64 64"
          animate={{
            fill: isActive ? '#00F5FF' : '#D4AF37',
          }}
          transition={{ duration: 0.4 }}
          className="drop-shadow-lg"
        >
          <path
            d="M32 4C17.6 4 6 15.6 6 30c0 14.4 11.6 26 26 26s26-11.6 26-26c0-14.4-11.6-26-26-26zm0 48c-12.2 0-22-9.8-22-22s9.8-22 22-22 22 9.8 22 22-9.8 22-22 22zm0-38c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2s2-.9 2-2V16c0-1.1-.9-2-2-2z"
            fillRule="evenodd"
          />
        </motion.svg>
      </div>

      {/* Outer Glow Ring (only when active) */}
      {isActive && (
        <motion.div
          animate={{
            opacity: [0.6, 0.2, 0.6],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-2 rounded-full border-2 border-accent/50 pointer-events-none"
        />
      )}
    </motion.button>
  );
}
