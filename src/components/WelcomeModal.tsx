import React, { useState, useEffect, Suspense, lazy } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// 懒加载 SyntaxHighlighter 减少主包体积
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(mod => ({ default: mod.Prism }))
);
const vscDarkPlusPromise = import('react-syntax-highlighter/dist/esm/styles/prism').then(mod => mod.vscDarkPlus);

// 代码块组件
function CodeBlock({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
  const [style, setStyle] = useState<any>(null);
  
  useEffect(() => {
    vscDarkPlusPromise.then(setStyle);
  }, []);
  
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !className;
  const language = match ? match[1] : 'text';
  const code = String(children).replace(/\n$/, '');
  
  if (isInline) {
    return (
      <code className="px-1.5 py-0.5 rounded text-xs" style={{ 
        backgroundColor: 'var(--bg-card)',
        color: 'var(--accent-primary)',
      }} {...props}>
        {children}
      </code>
    );
  }
  
  if (!style) {
    return (
      <pre className="p-3 rounded-lg overflow-x-auto mb-3 text-xs" style={{ 
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        <code>{code}</code>
      </pre>
    );
  }
  
  return (
    <Suspense fallback={
      <pre className="p-3 rounded-lg overflow-x-auto mb-3 text-xs" style={{ 
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
      }}>
        <code>{code}</code>
      </pre>
    }>
      <SyntaxHighlighter
        style={style}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '8px',
          fontSize: '12px',
          backgroundColor: '#1e1e1e',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Suspense>
  );
}

interface LinkConfig {
  text: string;
  href: string;
}

interface WelcomeModalConfig {
  enabled: boolean;
  title: string;
  content: string;
  updates?: string;
  link?: LinkConfig;
  confirmButtonText: string;
  closeButtonText?: string;
  showOnce: boolean;
  storageKey: string;
}

const defaultConfig: WelcomeModalConfig = {
  enabled: true,
  title: '欢迎访问',
  content: '欢迎访问本网站！',
  confirmButtonText: '不再显示',
  closeButtonText: '关闭',
  showOnce: true,
  storageKey: 'welcome-modal-shown',
};

// 渲染支持 \n 换行的文本
function renderMultilineText(text: string) {
  if (!text) return null;
  return text.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </span>
  ));
}

// 渲染更新日志，支持 - 开头的无序列表
function renderUpdates(updatesText: string) {
  if (!updatesText) return null;
  
  const lines = updatesText.split('\n');
  const items: string[] = [];
  
  lines.forEach(line => {
    if (line.trim().startsWith('- ')) {
      items.push(line.trim().substring(2));
    } else if (line.trim()) {
      items.push(line.trim());
    }
  });
  
  if (items.length === 0) return null;
  
  return (
    <ul className="list-disc list-inside space-y-1 mt-2">
      {items.map((item, index) => (
        <li key={index} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WelcomeModal({ forceOpen = false }: { forceOpen?: boolean }) {
  const [config, setConfig] = useState<WelcomeModalConfig>(defaultConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isMarkdownLoading, setIsMarkdownLoading] = useState(false);
  const [bellPosition, setBellPosition] = useState({ x: 14, y: window.innerHeight * 0.2 + 32 });

  // 获取铃铛位置
  const updateBellPosition = () => {
    const bell = document.getElementById('welcome-bell');
    if (bell) {
      const rect = bell.getBoundingClientRect();
      setBellPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  // 监听强制打开事件
  useEffect(() => {
    const handleOpenWelcome = () => {
      updateBellPosition();
      setIsOpen(true);
      setShowMarkdown(false);
    };
    window.addEventListener('open-welcome-modal', handleOpenWelcome);
    return () => window.removeEventListener('open-welcome-modal', handleOpenWelcome);
  }, []);

  // 窗口大小变化时更新位置
  useEffect(() => {
    const handleResize = () => updateBellPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 加载配置文件
    fetch('/config/welcome-modal.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: WelcomeModalConfig) => {
        setConfig(data);
        
        // 如果未启用，直接返回
        if (!data.enabled) {
          setIsLoading(false);
          return;
        }

        // 检查是否需要显示弹窗（非强制打开时）
        if (!forceOpen) {
          if (data.showOnce) {
            const hasShown = localStorage.getItem(data.storageKey);
            if (!hasShown) {
              setTimeout(updateBellPosition, 100);
              setIsOpen(true);
            }
          } else {
            setTimeout(updateBellPosition, 100);
            setIsOpen(true);
          }
        } else {
          setTimeout(updateBellPosition, 100);
          setIsOpen(true);
        }
        
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[WelcomeModal] 配置加载失败:', error);
        // 加载失败时使用默认配置
        setConfig(defaultConfig);
        if (!forceOpen) {
          const hasShown = localStorage.getItem(defaultConfig.storageKey);
          if (!hasShown) {
            setTimeout(updateBellPosition, 100);
            setIsOpen(true);
          }
        } else {
          setTimeout(updateBellPosition, 100);
          setIsOpen(true);
        }
        setIsLoading(false);
      });
  }, [forceOpen]);

  // 加载 Markdown 内容
  const loadMarkdown = async (path: string) => {
    setIsMarkdownLoading(true);
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load markdown: ${response.status}`);
      }
      const text = await response.text();
      setMarkdownContent(text);
      setShowMarkdown(true);
    } catch (error) {
      console.error('[WelcomeModal] 加载 Markdown 失败:', error);
      setMarkdownContent('加载失败，请稍后重试。');
      setShowMarkdown(true);
    } finally {
      setIsMarkdownLoading(false);
    }
  };

  // 不再显示 - 关闭并记录到 localStorage
  const handleNeverShow = () => {
    setIsOpen(false);
    localStorage.setItem(config.storageKey, 'true');
  };

  // 仅关闭 - 下次还会显示
  const handleCloseOnly = () => {
    setIsOpen(false);
  };

  // 返回主内容
  const handleBack = () => {
    setShowMarkdown(false);
    setMarkdownContent('');
  };

  // 加载中或未启用时不渲染
  if (isLoading || !config.enabled) {
    return null;
  }

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogPrimitive.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* 遮罩层 */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                  style={{ pointerEvents: 'auto' }}
                  onClick={handleCloseOnly}
                />
              </DialogPrimitive.Overlay>

              {/* 弹窗内容 */}
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ 
                    opacity: 0, 
                    scale: 0.3,
                    left: bellPosition.x,
                    top: bellPosition.y,
                    x: '-50%',
                    y: '-50%',
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    left: centerX,
                    top: centerY,
                    x: '-50%',
                    y: '-50%',
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.1,
                    left: bellPosition.x,
                    top: bellPosition.y,
                    x: '-50%',
                    y: '-50%',
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn(
                    "fixed z-50 w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)]",
                    "rounded-lg border p-6 shadow-2xl outline-none overflow-y-auto",
                    showMarkdown ? "sm:max-w-2xl" : "sm:max-w-md"
                  )}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'rgba(var(--accent-primary-rgb), 0.3)',
                    pointerEvents: 'auto',
                    transformOrigin: 'center center',
                  }}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    {showMarkdown ? (
                      // Markdown 内容视图
                      <div className="flex flex-col gap-4">
                        {/* 返回按钮 */}
                        <div className="flex items-center gap-3 border-b border-[var(--accent-primary)]/20 pb-3">
                          <button
                            onClick={handleBack}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                            style={{
                              backgroundColor: 'var(--accent-primary)/10',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>返回</span>
                          </button>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            {config.link?.text}
                          </span>
                        </div>

                        {/* Markdown 内容 */}
                        <div 
                          className="prose prose-sm max-w-none prose-invert overflow-y-auto max-h-[60vh]"
                          style={{ 
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {isMarkdownLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div 
                                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                              />
                            </div>
                          ) : (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0" style={{ color: 'var(--text-primary)' }}>
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-semibold mb-3 mt-5" style={{ color: 'var(--text-primary)' }}>
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-medium mb-2 mt-4" style={{ color: 'var(--text-primary)' }}>
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-3 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                                    {children}
                                  </ul>
                                ),
                                li: ({ children }) => (
                                  <li className="ml-2">{children}</li>
                                ),
                                code: CodeBlock,
                                pre: ({ children }: { children?: React.ReactNode }) => (
                                  <div className="rounded-lg overflow-hidden mb-3">
                                    {children}
                                  </div>
                                ),
                                table: ({ children }) => (
                                  <table className="w-full text-left text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    {children}
                                  </table>
                                ),
                                th: ({ children }) => (
                                  <th className="p-2 border-b font-medium" style={{ 
                                    borderColor: 'var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                  }}>
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                                    {children}
                                  </td>
                                ),
                                hr: () => (
                                  <hr className="my-4" style={{ borderColor: 'var(--border-subtle)' }} />
                                ),
                                strong: ({ children }) => (
                                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {children}
                                  </strong>
                                ),
                              }}
                            >
                              {markdownContent}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ) : (
                      // 主内容视图
                      <>
                        <div className="flex flex-col gap-3 text-center sm:text-left">
                          {/* 标题 */}
                          <DialogPrimitive.Title 
                            className="text-xl font-bold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {config.title}
                          </DialogPrimitive.Title>
                          
                          {/* 内容文本 */}
                          <DialogPrimitive.Description 
                            className="text-base leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {renderMultilineText(config.content)}
                          </DialogPrimitive.Description>
                          
                          {/* 技术详解链接按钮 */}
                          {config.link && (
                            <div className="mt-2">
                              <button
                                onClick={() => loadMarkdown('/docs/courses/site-tech/chapter01.md')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 group"
                                style={{
                                  backgroundColor: 'var(--accent-primary)/10',
                                  border: '1px solid var(--accent-primary)',
                                  color: 'var(--accent-primary)',
                                }}
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>{config.link.text}</span>
                              </button>
                            </div>
                          )}
                          
                          {/* 最新更新 */}
                          {config.updates && (
                            <div className="mt-2 pt-3 border-t border-[var(--accent-primary)]/20">
                              <h4 
                                className="text-sm font-semibold mb-2"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                最新更新
                              </h4>
                              {renderUpdates(config.updates)}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <Button
                            onClick={handleCloseOnly}
                            variant="outline"
                            className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                            style={{ 
                              borderColor: 'var(--accent-primary)',
                              color: 'var(--text-primary)',
                              backgroundColor: 'transparent',
                            }}
                          >
                            {config.closeButtonText || '关闭'}
                          </Button>
                          <Button
                            onClick={handleNeverShow}
                            className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                            style={{ 
                              backgroundColor: 'var(--accent-primary)',
                              color: 'white',
                            }}
                          >
                            {config.confirmButtonText}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default WelcomeModal;
