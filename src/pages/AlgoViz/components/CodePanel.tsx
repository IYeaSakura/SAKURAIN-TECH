/**
 * 算法可视化平台 - 代码面板组件
 * 展示算法代码，支持当前行高亮
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CodePanelProps {
  code: string;
  currentLine: number;
  language?: string;
  showLineNumbers?: boolean;
  title?: string;
}

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  currentLine,
  language = 'javascript',
  showLineNumbers = true,
  title = '算法实现'
}) => {
  const lines = code.split('\n');
  const contentRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 自动滚动到当前行
  useEffect(() => {
    if (currentLine > 0 && lineRefs.current[currentLine - 1]) {
      const lineElement = lineRefs.current[currentLine - 1];
      const container = contentRef.current;
      if (lineElement && container) {
        const lineRect = lineElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // 检查当前行是否在可视区域内
        if (lineRect.top < containerRect.top || lineRect.bottom > containerRect.bottom) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentLine]);

  // 计算缩进级别
  const getIndentLevel = (line: string): number => {
    const match = line.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 2) : 0;
  };

  return (
    <div className="code-panel">
      <div className="code-header">
        <span className="code-title">{title}</span>
        <span className="code-language">{language}</span>
      </div>
      
      <div className="code-content" ref={contentRef}>
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isActive = lineNumber === currentLine;
          const indentLevel = getIndentLevel(line);
          
          return (
            <motion.div
              key={index}
              ref={el => { lineRefs.current[index] = el; }}
              className={`code-line ${isActive ? 'active' : ''}`}
              animate={{
                backgroundColor: isActive ? 'var(--code-active-bg)' : 'transparent'
              }}
              transition={{ duration: 0.2 }}
            >
              {showLineNumbers && (
                <span className={`line-number ${isActive ? 'active' : ''}`}>
                  {lineNumber}
                </span>
              )}
              
              <span 
                className="line-content"
                style={{ paddingLeft: `${indentLevel * 20}px` }}
              >
                {line.trim() === '' ? (
                  <span>&nbsp;</span>
                ) : (
                  <SyntaxHighlightedLine line={line} />
                )}
              </span>
              
              {isActive && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeLine"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// 简单的语法高亮
const SyntaxHighlightedLine: React.FC<{ line: string }> = ({ line }) => {
  // 分割行以进行高亮
  const tokens: { type: string; content: string }[] = [];
  let remaining = line;
  
  // 简单的高亮处理
  const processLine = () => {
    // 注释
    if (remaining.includes('//')) {
      const idx = remaining.indexOf('//');
      if (idx > 0) {
        tokens.push({ type: 'code', content: remaining.slice(0, idx) });
      }
      tokens.push({ type: 'comment', content: remaining.slice(idx) });
      return;
    }
    
    // 字符串
    const stringMatch = remaining.match(/(['"`])(.*?)\1/);
    if (stringMatch) {
      const idx = remaining.indexOf(stringMatch[0]);
      if (idx > 0) {
        tokens.push({ type: 'code', content: remaining.slice(0, idx) });
      }
      tokens.push({ type: 'string', content: stringMatch[0] });
      remaining = remaining.slice(idx + stringMatch[0].length);
      processLine();
      return;
    }
    
    tokens.push({ type: 'code', content: remaining });
  };
  
  processLine();
  
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={`syntax-${token.type}`}>
          {token.content}
        </span>
      ))}
    </>
  );
};

export default CodePanel;
