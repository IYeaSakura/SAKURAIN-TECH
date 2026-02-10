import { memo } from 'react';
import { motion } from 'framer-motion';

export const LoadingPlaceholder = memo(() => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(var(--accent-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow effects */}
      <div
        className="absolute top-1/4 left-1/4 -z-5 pointer-events-none"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 0.15,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 -z-5 pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.1,
        }}
      />

      {/* Main loading container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Animated spinner */}
        <div className="relative">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid var(--accent-primary)',
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />

          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{
              border: '2px solid var(--accent-secondary)',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner ring */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{
              border: '2px solid var(--accent-tertiary)',
              borderLeftColor: 'transparent',
              borderTopColor: 'transparent',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center dot */}
          <motion.div
            className="absolute inset-0 m-auto w-4 h-4 rounded-full"
            style={{
              background: 'var(--accent-primary)',
              boxShadow: '0 0 20px var(--accent-glow), 0 0 40px var(--accent-primary)40',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Size of the container */}
          <div className="w-16 h-16" />
        </div>

        {/* Loading text */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p
            className="text-lg font-medium tracking-wider"
            style={{
              color: 'var(--text-primary)',
              textShadow: '0 0 10px var(--accent-glow)',
            }}
          >
            加载中
          </p>

          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--accent-primary)' }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-48 h-1 rounded-full overflow-hidden"
          style={{
            background: 'var(--border-subtle)',
          }}
          initial={{ width: 0 }}
          animate={{ width: '12rem' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary))',
              backgroundSize: '200% 100%',
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-20 h-20 opacity-30">
        <div
          className="absolute top-3 left-3 w-8 h-px"
          style={{ background: 'var(--accent-primary)' }}
        />
        <div
          className="absolute top-3 left-3 w-px h-8"
          style={{ background: 'var(--accent-primary)' }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-30">
        <div
          className="absolute bottom-3 right-3 w-8 h-px"
          style={{ background: 'var(--accent-secondary)' }}
        />
        <div
          className="absolute bottom-3 right-3 w-px h-8"
          style={{ background: 'var(--accent-secondary)' }}
        />
      </div>
    </div>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';
