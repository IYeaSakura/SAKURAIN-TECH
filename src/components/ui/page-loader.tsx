import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LOADING_COMMANDS = [
  { text: 'Initializing application...', delay: 0 },
  { text: 'Loading page components...', delay: 1200 },
  { text: 'Fetching resources...', delay: 2400 },
  { text: 'Rendering interface...', delay: 3600 },
];

export function PageLoader() {
  const [currentCommand, setCurrentCommand] = useState(0);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    let timeouts: number[] = [];

    LOADING_COMMANDS.forEach((cmd, index) => {
      const timeout = setTimeout(() => {
        setCurrentCommand(index);
        setVisibleLines(prev => [...prev, cmd.text]);
      }, cmd.delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* 背景网格 */}
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

      {/* 环境光效 */}
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
        className="absolute bottom-1/4 right -z-5 pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.1,
        }}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl overflow-hidden relative z-10"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid',
          borderColor: 'var(--accent-primary)',
          boxShadow: '0 0 40px var(--accent-glow), 0 0 80px var(--accent-primary)20, inset 0 0 20px rgba(59, 130, 246, 0.1)',
          width: '600px',
        }}
      >
        {/* 顶部装饰线 */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
            animation: 'shimmer 2s infinite',
          }}
        />

        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid var(--accent-primary)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex gap-2">
            <motion.div
              className="w-3 h-3 rounded-full cursor-pointer"
              style={{ background: 'var(--error-color)' }}
              whileHover={{ scale: 1.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full cursor-pointer"
              style={{ background: 'var(--warning-color)' }}
              whileHover={{ scale: 1.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full cursor-pointer"
              style={{ background: 'var(--success-color)' }}
              whileHover={{ scale: 1.2 }}
            />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--accent-primary)' }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span
              className="text-xs font-mono tracking-wider"
              style={{
                color: 'var(--accent-primary)',
                textShadow: '0 0 10px var(--accent-glow)',
              }}
            >
              sakurain-tech@loading: ~
            </span>
          </div>
        </div>

        <div
          className="p-4 font-mono text-sm relative"
          style={{
            height: '220px',
            color: '#d4d4d4',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* 扫描线效果 */}
          <div
            className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--accent-primary)10, transparent)',
              animation: 'scanline 2s linear infinite',
            }}
          />

          {visibleLines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-1"
            >
              <span style={{ color: '#32cd32', textShadow: '0 0 5px #32cd3240' }}>➜</span>
              <span style={{ color: '#3b82f6', textShadow: '0 0 5px #3b82f640' }}> sakurain-tech</span>
              <span style={{ color: '#eab308', textShadow: '0 0 5px #eab30840' }}> $</span>
              <span className="ml-2" style={{ color: '#d4d4d4' }}>{line}</span>
            </motion.div>
          ))}

          {currentCommand < LOADING_COMMANDS.length && (
            <div className="mb-1">
              <span style={{ color: '#32cd32', textShadow: '0 0 5px #32cd3240' }}>➜</span>
              <span style={{ color: '#3b82f6', textShadow: '0 0 5px #3b82f640' }}> sakurain-tech</span>
              <span style={{ color: '#eab308', textShadow: '0 0 5px #eab30840' }}> $</span>
              <span className="ml-2" style={{ color: '#d4d4d4' }}>
                {LOADING_COMMANDS[currentCommand].text}
                <motion.span
                  className="inline-block w-2 h-4 ml-1"
                  style={{ background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-glow)' }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </span>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between px-4 py-1.5 text-xs relative"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
          }}
        >
          {/* 底部光效 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer 2s infinite',
            }}
          />

          <div className="flex items-center gap-4 relative z-10">
            <span className="flex items-center gap-1">
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: 'white' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              WASI
            </span>
            <span className="flex items-center gap-1">
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: 'white' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
              WASIX
            </span>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <span>Ln {visibleLines.length + 1}, Col 1</span>
            <span className="font-bold">WebAssembly</span>
          </div>
        </div>

        {/* 角落装饰 */}
        <div className="absolute top-0 left-0 w-4 h-4">
          <div
            className="w-2 h-2"
            style={{ background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-glow)' }}
          />
        </div>
        <div className="absolute top-0 right-0 w-4 h-4">
          <div
            className="w-2 h-2 ml-auto"
            style={{ background: 'var(--accent-secondary)', boxShadow: '0 0 10px var(--accent-glow)' }}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-4 h-4">
          <div
            className="w-2 h-2"
            style={{ background: 'var(--accent-tertiary)', boxShadow: '0 0 10px var(--accent-glow)' }}
          />
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4">
          <div
            className="w-2 h-2 ml-auto"
            style={{ background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-glow)' }}
          />
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
