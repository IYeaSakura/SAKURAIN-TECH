import { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalProps {
  className?: string;
}

export const Terminal = memo(function Terminal({ className = '' }: TerminalProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  const lines = [
    { type: 'input', content: 'git clone sakurain.tech/project.git' },
    { type: 'output', content: 'Cloning into project...' },
    { type: 'output', content: '✓ 142 objects, done.' },
    { type: 'input', content: 'cd project && npm i' },
    { type: 'output', content: '✓ 142 pkgs in 2.3s' },
    { type: 'input', content: 'npm run build' },
    { type: 'output', content: '> tsc && vite build' },
    { type: 'output', content: '✓ 2141 modules' },
    { type: 'output', content: '✓ built in 4.2s' },
    { type: 'input', content: './deploy.sh --prod' },
    { type: 'output', content: '[✓] Deployed!' },
    { type: 'output', content: '[✓] https://sakurain.net' },
  ];

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for lines
  useEffect(() => {
    if (currentLine < lines.length) {
      const delay = lines[currentLine].type === 'input' ? 1500 : 800;
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentLine, lines.length]);

  // Reset animation
  useEffect(() => {
    if (currentLine >= lines.length) {
      const timer = setTimeout(() => {
        setCurrentLine(0);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentLine, lines.length]);

  // Auto-scroll to bottom when new lines appear
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [currentLine]);

  return (
    <motion.div
      className={`rounded-lg overflow-hidden font-mono text-xs ${className}`}
      style={{
        background: '#1e1e1e',
        border: '1px solid #333',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Terminal Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: '#2d2d2d',
          borderBottom: '1px solid #333',
        }}
      >
        {/* Window Controls */}
        <div className="flex gap-2">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ background: '#ff5f56' }}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ background: '#ffbd2e' }}
            whileHover={{ scale: 1.2 }}
          />
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ background: '#27ca40' }}
            whileHover={{ scale: 1.2 }}
          />
        </div>
        
        {/* Title */}
        <div className="flex-1 text-center text-xs" style={{ color: '#888' }}>
          sakurain@terminal: ~/project
        </div>
        
        {/* Empty space for balance */}
        <div className="w-16" />
      </div>

      {/* Terminal Body */}
      <div ref={terminalBodyRef} className="p-4 h-[200px] overflow-y-auto" style={{ background: '#1e1e1e' }}>
        <AnimatePresence mode="popLayout">
          {lines.slice(0, currentLine).map((line, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-2 mb-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {line.type === 'input' ? (
                <>
                  <span style={{ color: '#0E639C' }}>➜</span>
                  <span style={{ color: '#4EC9B0' }}>~/project</span>
                  <span style={{ color: '#CE9178' }}>git:(main)</span>
                  <span style={{ color: '#fff' }}>✗</span>
                  <span style={{ color: '#d4d4d4' }}>{line.content}</span>
                </>
              ) : (
                <span 
                  className="pl-0"
                  style={{ 
                    color: line.content.includes('SUCCESS') ? '#4EC9B0' : 
                           line.content.includes('ERROR') ? '#F44747' : 
                           line.content.includes('INFO') ? '#569CD6' : '#858585',
                  }}
                >
                  {line.content}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Current Input Line with Cursor */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span style={{ color: '#0E639C' }}>➜</span>
          <span style={{ color: '#4EC9B0' }}>~/project</span>
          <span style={{ color: '#CE9178' }}>git:(main)</span>
          <span style={{ color: '#fff' }}>✗</span>
          <motion.span
            animate={{ opacity: showCursor ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            style={{ color: '#d4d4d4' }}
          >
            ▊
          </motion.span>
        </motion.div>
      </div>

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-4 py-1 text-xs"
        style={{
          background: '#007acc',
          color: '#fff',
        }}
      >
        <div className="flex items-center gap-4">
          <span>● master</span>
          <span>✓ 0 errors</span>
          <span>⚠ 0 warnings</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {currentLine + 1}, Col 1</span>
          <span>UTF-8</span>
          <span>TypeScript</span>
        </div>
      </div>
    </motion.div>
  );
});
