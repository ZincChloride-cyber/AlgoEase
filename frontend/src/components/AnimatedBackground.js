import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => (
  <div className="animated-background pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="background-gradient" />

    <motion.div
      className="aurora-layer aurora-layer--primary"
      initial={{ opacity: 0.35, scale: 0.8, x: '-8%', y: '-12%' }}
      animate={{
        opacity: [0.28, 0.42, 0.28],
        scale: [0.85, 1.03, 0.9],
        x: ['-9%', '5%', '-4%'],
        y: ['-14%', '-6%', '-12%'],
      }}
      transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
    />

    <motion.div
      className="aurora-layer aurora-layer--accent"
      initial={{ opacity: 0.25, scale: 0.9, x: '26%', y: '24%' }}
      animate={{
        opacity: [0.18, 0.34, 0.18],
        scale: [0.95, 1.08, 0.92],
        x: ['28%', '12%', '30%'],
        y: ['22%', '18%', '26%'],
      }}
      transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut' }}
    />

    <motion.div
      className="aurora-layer aurora-layer--soft"
      initial={{ opacity: 0.18, scale: 1, x: '-30%', y: '38%' }}
      animate={{
        opacity: [0.12, 0.22, 0.12],
        scale: [1, 1.06, 0.96],
        x: ['-34%', '-22%', '-28%'],
        y: ['34%', '40%', '36%'],
      }}
      transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
    />

    <div className="mesh-grid" />
    <div className="noise-overlay" />
  </div>
);

export default AnimatedBackground;
