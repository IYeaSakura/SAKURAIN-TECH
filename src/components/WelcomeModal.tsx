import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Globe, X, Sparkles, FileText, Users, User } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PlantUML } from '@/pages/Docs/components/PlantUML';
import { deploymentConfig } from '@/config/deployment-config';
import { useMobile } from '@/hooks';

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then(mod => ({ default: mod.Prism }))
);
const vscDarkPlusPromise = import('react-syntax-highlighter/dist/esm/styles/prism').then(mod => mod.vscDarkPlus);

function CodeBlock({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
  const [style, setStyle] = useState<any>(null);

  useEffect(() => {
    vscDarkPlusPromise.then(setStyle);
  }, []);

  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !className;
  const language = match ? match[1] : 'text';
  const code = String(children).replace(/\n$/, '');

  if (language === 'plantuml' || code.includes('@startuml')) {
    return <PlantUML code={code} />;
  }

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

interface WelcomeModalConfig {
  enabled: boolean;
  title: string;
  content: string;
  updates?: string;
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

type TabType = 'welcome' | 'blog' | 'earth' | 'docs' | 'friends';

interface Tab {
  id: TabType;
  icon: React.ReactNode;
  label: string;
}

const tabs: Tab[] = [
  { id: 'welcome', icon: <Sparkles className="w-5 h-5" />, label: '欢迎' },
  { id: 'blog', icon: <BookOpen className="w-5 h-5" />, label: '博客' },
  { id: 'earth', icon: <Globe className="w-5 h-5" />, label: '地球' },
  { id: 'docs', icon: <FileText className="w-5 h-5" />, label: '文档' },
  { id: 'friends', icon: <Users className="w-5 h-5" />, label: '友链' },
];

export function WelcomeModal({ forceOpen = false }: { forceOpen?: boolean }) {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [config, setConfig] = useState<WelcomeModalConfig>(defaultConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('welcome');
  const [bellPosition, setBellPosition] = useState({ x: 14, y: window.innerHeight * 0.2 + 32 });
  const [markdownContent, setMarkdownContent] = useState('');
  const [isMarkdownLoading, setIsMarkdownLoading] = useState(false);

  const updateBellPosition = () => {
    const bell = document.getElementById('welcome-welcome-bell');
    if (bell) {
      const rect = bell.getBoundingClientRect();
      setBellPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  useEffect(() => {
    const handleOpenWelcome = () => {
      updateBellPosition();
      setIsOpen(true);
      setActiveTab('welcome');
    };
    window.addEventListener('open-welcome-modal', handleOpenWelcome);
    return () => window.removeEventListener('open-welcome-modal', handleOpenWelcome);
  }, []);

  useEffect(() => {
    const handleResize = () => updateBellPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch(`/config/welcome-modal.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: WelcomeModalConfig) => {
        setConfig(data);

        if (!data.enabled) {
          setIsLoading(false);
          return;
        }

        setTimeout(updateBellPosition, 100);
        setIsOpen(true);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[WelcomeModal] 配置加载失败:', error);
        setConfig(defaultConfig);
        setTimeout(updateBellPosition, 100);
        setIsOpen(true);
        setIsLoading(false);
      });
  }, [forceOpen]);

  const handleCloseOnly = () => {
    setIsOpen(false);
  };

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const handleBlogClick = () => {
    setIsOpen(false);
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/blog';
    } else {
      navigate('/blog');
    }
  };

  const handleAboutClick = () => {
    setIsOpen(false);
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/about';
    } else {
      navigate('/about');
    }
  };

  const handleEarthClick = () => {
    if (isMobile) {
      toast.error('地球Online暂不支持移动端，请在电脑端访问');
      return;
    }
    const event = new CustomEvent('open-earth-online');
    window.dispatchEvent(event);
    setIsOpen(false);
  };

  const handleFriendsClick = () => {
    setIsOpen(false);
    if (deploymentConfig.useWindowLocation) {
      window.location.href = '/friends';
    } else {
      navigate('/friends');
    }
  };

  const loadMarkdown = async () => {
    setIsMarkdownLoading(true);
    try {
      const response = await fetch(`/docs/courses/site-tech/chapter01.md?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load markdown: ${response.status}`);
      }
      const text = await response.text();
      setMarkdownContent(text);
    } catch (error) {
      console.error('[WelcomeModal] 加载 Markdown 失败:', error);
      setMarkdownContent('加载失败，请稍后重试。');
    } finally {
      setIsMarkdownLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'docs' && !markdownContent) {
      loadMarkdown();
    }
  }, [activeTab]);

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
                  className="fixed z-50 w-[calc(100vw-2rem)] h-[calc(100vh-12rem)] max-h-[500px] sm:w-[700px] sm:h-[500px] rounded-2xl border shadow-2xl outline-none overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'rgba(var(--accent-primary-rgb), 0.3)',
                    pointerEvents: 'auto',
                    transformOrigin: 'center center',
                  }}
                >
                  <div onClick={(e) => e.stopPropagation()} className="flex flex-col h-full">
                    <div className="flex flex-col sm:flex-row h-full min-h-[300px] sm:min-h-[400px]">
                      <div className="flex flex-row sm:flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 sm:w-20 sm:border-r border-b sm:border-b-0 border-[var(--accent-primary)]/20 overflow-x-auto sm:overflow-visible">
                        {tabs.map((tab) => (
                          <motion.button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className="flex flex-row sm:flex-col items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0"
                            style={{
                              backgroundColor: activeTab === tab.id ? 'var(--accent-primary)/20' : 'transparent',
                              border: activeTab === tab.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {tab.icon}
                            <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
                          </motion.button>
                        ))}
                      </div>

                      <div className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">
                        <div className="flex items-start justify-between mb-4 sm:mb-6">
                          <h2
                            className="text-xl sm:text-2xl font-bold font-pixel"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {tabs.find(t => t.id === activeTab)?.label}
                          </h2>
                          <button
                            onClick={handleCloseOnly}
                            className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <div className="space-y-6">
                          {activeTab === 'welcome' && (
                            <>
                                <div
                                  className="text-sm sm:text-base leading-relaxed"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  {config.content.split('\n').map((line, index) => (
                                    <React.Fragment key={index}>
                                      {line}
                                      {index < config.content.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                  ))}
                                </div>

                                <motion.button
                                  onClick={handleAboutClick}
                                  className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300"
                                  style={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--accent-primary)',
                                    color: 'var(--accent-primary)',
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>关于我</span>
                                </motion.button>

                                {config.updates && (
                                <div className="pt-3 sm:pt-4 border-t border-[var(--accent-primary)]/20">
                                  <h3
                                    className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                                    style={{ color: 'var(--accent-primary)' }}
                                  >
                                    最新更新
                                  </h3>
                                  <ul className="space-y-1.5 sm:space-y-2">
                                    {config.updates.split('\n').map((line, index) => (
                                      <li key={index} className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {line.trim().startsWith('- ') ? line.trim().substring(2) : line.trim()}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[var(--accent-primary)]/20">
                                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                                  <a
                                    href="https://beian.miit.gov.cn/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-70 transition-opacity"
                                  >
                                    皖ICP备2025073165号-1
                                  </a>
                                  <span>|</span>
                                  <a
                                    href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=34130202000598"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-70 transition-opacity flex items-center gap-1"
                                  >
                                    <img
                                      src="/image/ghs.png"
                                      alt="公安备案图标"
                                      className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                                    />
                                    皖公网安备34130202000598号
                                  </a>
                                </div>
                              </div>
                            </>
                          )}

                          {activeTab === 'blog' && (
                            <div className="space-y-3 sm:space-y-4">
                              <p
                                className="text-sm sm:text-base leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                博客功能刚刚启动，我们会慢慢添加更多技术文章。这里记录了我们在技术探索过程中的心得体会、学习笔记和项目经验。
                              </p>

                              <div className="p-3 sm:p-4 rounded-xl" style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--accent-primary)/30',
                              }}>
                                <h3
                                  className="text-xs sm:text-sm font-semibold mb-2"
                                  style={{ color: 'var(--accent-primary)' }}
                                >
                                  你可以在这里找到：
                                </h3>
                                <ul className="space-y-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  <li>• 技术教程和学习笔记</li>
                                  <li>• 项目开发经验分享</li>
                                  <li>• 工具使用心得</li>
                                  <li>• 行业趋势分析</li>
                                </ul>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2">
                                <motion.button
                                  onClick={handleBlogClick}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300"
                                  style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'white',
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>访问博客</span>
                                </motion.button>
                                <motion.button
                                  onClick={() => { setIsOpen(false); window.location.href = '/docs'; }}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300"
                                  style={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--accent-primary)',
                                    color: 'var(--accent-primary)',
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>文档页</span>
                                </motion.button>
                              </div>
                            </div>
                          )}

                          {activeTab === 'earth' && (
                            <div className="space-y-3 sm:space-y-4">
                              <p
                                className="text-sm sm:text-base leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                地球Online是本人开发的一个可交互的3D地球可视化项目，中国区域部分支持放大查看卫星图，支持发送弹幕进入卫星轨道并附带Markdown文本哦~
                              </p>

                              <div className="p-3 sm:p-4 rounded-xl" style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--accent-primary)/30',
                              }}>
                                <h3
                                  className="text-xs sm:text-sm font-semibold mb-2"
                                  style={{ color: 'var(--accent-primary)' }}
                                >
                                  功能特点：
                                </h3>
                                <ul className="space-y-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  <li>• 3D地球可视化</li>
                                  <li>• 实时弹幕卫星系统</li>
                                  <li>• 交互式探索体验</li>
                                  <li>• 沉浸式视觉效果</li>
                                </ul>
                              </div>

                              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg" style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}>
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ background: '#ef4444' }} />
                                <span className="text-xs sm:text-sm" style={{ color: '#fca5a5' }}>暂不支持移动端，配置较低的电脑可能运行不流畅</span>
                              </div>

                              <motion.button
                                onClick={handleEarthClick}
                                className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'white',
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>打开地球Online</span>
                              </motion.button>
                            </div>
                          )}

                          {activeTab === 'docs' && (
                            <div className="space-y-3 sm:space-y-4">
                              {isMarkdownLoading ? (
                                <div className="flex items-center justify-center py-6 sm:py-8">
                                  <div
                                    className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="overflow-y-auto p-4 rounded-xl"
                                  style={{
                                    color: 'var(--text-secondary)',
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--accent-primary)/30',
                                  }}
                                >
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0 w-full" style={{ color: 'var(--text-primary)' }}>
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-lg font-semibold mb-3 mt-5 w-full" style={{ color: 'var(--text-primary)' }}>
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-base font-medium mb-2 mt-4 w-full" style={{ color: 'var(--text-primary)' }}>
                                          {children}
                                        </h3>
                                      ),
                                      h4: ({ children }) => (
                                        <h4 className="text-sm font-normal mb-2 mt-3 w-full" style={{ color: 'var(--text-primary)' }}>
                                          {children}
                                        </h4>
                                      ),
                                      p: ({ children }) => (
                                        <p className="mb-3 leading-relaxed w-full" style={{ color: 'var(--text-secondary)' }}>
                                          {children}
                                        </p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc list-inside mb-3 space-y-1 w-full" style={{ color: 'var(--text-secondary)' }}>
                                          {children}
                                        </ul>
                                      ),
                                      li: ({ children }) => (
                                        <li className="ml-2 w-full">{children}</li>
                                      ),
                                      code: CodeBlock,
                                      pre: ({ children }: { children?: React.ReactNode }) => (
                                        <div className="rounded-lg overflow-hidden mb-3 w-full">
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
                                        <hr className="my-4 w-full" style={{ borderColor: 'var(--border-subtle)' }} />
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
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'friends' && (
                            <div className="space-y-3 sm:space-y-4">
                              <p
                                className="text-sm sm:text-base leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                欢迎申请友链！我们很高兴与志同道合的朋友建立联系。
                              </p>

                              <div className="p-3 sm:p-4 rounded-xl" style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--accent-primary)/30',
                              }}>
                                <h3
                                  className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3"
                                  style={{ color: 'var(--accent-primary)' }}
                                >
                                  本站信息：
                                </h3>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  <div>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>网站名称：</span>
                                    <span className="ml-2">SAKURAIN TEAM</span>
                                  </div>
                                  <div>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>网站链接：</span>
                                    <span className="ml-2">https://sakurain.net</span>
                                  </div>
                                  <div>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>头像链接：</span>
                                    <span className="ml-2">https://sakurain.net/favicon</span>
                                  </div>
                                  <div>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>网站描述：</span>
                                    <span className="ml-2">用代码构建未来</span>
                                  </div>
                                </div>
                              </div>

                              <motion.button
                                onClick={handleFriendsClick}
                                className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'white',
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>进入友链页</span>
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
