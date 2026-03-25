'use client';

import { motion } from 'framer-motion';

export default function ScanningLineAnimation() {
  return (
    <div className="mb-8 relative h-32 overflow-hidden rounded-xl glass-card-elevated p-6">
      {/* Title */}
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Data Stream Monitor
        </h3>
      </div>

      {/* Animated Background Grid */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '0% 100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(0deg, 
              rgba(0, 245, 255, 0.1) 1px, 
              transparent 1px
            ),
            linear-gradient(90deg, 
              rgba(0, 245, 255, 0.05) 1px, 
              transparent 1px
            )
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0px 0px',
        }}
      />

      {/* Scanning Line */}
      <motion.div
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent z-20"
        style={{
          boxShadow: '0 0 20px rgba(0, 245, 255, 0.8)',
        }}
      />

      {/* Vertical Scanning Bars */}
      {[0, 25, 50, 75].map((position) => (
        <motion.div
          key={position}
          animate={{
            opacity: [0, 0.5, 0],
            scaleY: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: position / 100,
            ease: 'easeInOut',
          }}
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-accent via-accent to-transparent"
          style={{
            left: `${position}%`,
          }}
        />
      ))}

      {/* Data Wave Pulses */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`wave-${index}`}
          animate={{
            left: ['0%', '100%'],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.8,
            ease: 'easeOut',
          }}
          className="absolute top-1/4 h-1/2 w-16 bg-gradient-to-r from-accent/20 via-accent/40 to-transparent blur-xl"
        />
      ))}

      {/* Hud Elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="text-center"
        >
          <div className="text-xs text-accent font-mono tracking-wider">
            {'< '}
            <motion.span
              animate={{
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
              }}
            >
              INTERCEPTING
            </motion.span>
            {' />'}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
