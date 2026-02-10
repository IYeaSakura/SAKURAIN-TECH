"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Search,
  RefreshCw,
  Share,
  Home,
  Scissors,
  FileText,
  Info,
  ExternalLink,
  Link as LinkIcon,
  Camera,
  Printer
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  selectedText?: string;
  isEditable?: boolean;
  linkUrl?: string;
  linkText?: string;
}

export function CustomContextMenu({ x, y, onClose, selectedText, isEditable, linkUrl, linkText }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [isMounted, setIsMounted] = useState(false);
  const [positionCalculated, setPositionCalculated] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const openTimeoutRef = useRef<number | null>(null);
  const lastMouseDownTime = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    setIsOpening(true);

    openTimeoutRef.current = window.setTimeout(() => {
      setIsOpening(false);
    }, 500);

    return () => {
      setIsMounted(false);
      if (openTimeoutRef.current) {
        window.clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleClickOutside = (event: MouseEvent) => {
      try {
        const now = Date.now();
        if (now - lastMouseDownTime.current < 100) return;

        if (isOpening) return;

        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      } catch (error) {
        console.error('Error in handleClickOutside:', error);
      }
    };

    const handleMouseDown = () => {
      lastMouseDownTime.current = Date.now();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        if (event.key === 'Escape') {
          onClose();
        }
      } catch (error) {
        console.error('Error in handleKeyDown:', error);
      }
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose, isMounted, isOpening]);

  useEffect(() => {
    if (!isMounted || !menuRef.current || positionCalculated) return;

    const adjustPosition = () => {
      try {
        const menuRect = menuRef.current?.getBoundingClientRect();
        if (!menuRect) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = x;
        let adjustedY = y;

        if (x + menuRect.width > viewportWidth - 10) {
          adjustedX = x - menuRect.width - 10;
        }

        if (y + menuRect.height > viewportHeight - 10) {
          adjustedY = y - menuRect.height - 10;
        }

        adjustedX = Math.max(10, adjustedX);
        adjustedY = Math.max(10, adjustedY);

        setPosition({ x: adjustedX, y: adjustedY });
        setPositionCalculated(true);
      } catch (error) {
        console.error('Error in position calculation:', error);
        setPosition({ x, y });
        setPositionCalculated(true);
      }
    };

    requestAnimationFrame(adjustPosition);
  }, [x, y, isMounted, positionCalculated]);

  const handleCopy = useCallback(async () => {
    if (!selectedText) return;

    try {
      await navigator.clipboard.writeText(selectedText);
      onClose();
    } catch (error) {
      console.error('Failed to copy:', error);
      const fallbackCopy = () => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = selectedText;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          onClose();
        } catch (fallbackError) {
          console.error('Fallback copy also failed:', fallbackError);
        }
      };
      fallbackCopy();
    }
  }, [selectedText, onClose]);

  const handleCut = useCallback(async () => {
    if (!selectedText || !isEditable) return;

    try {
      await navigator.clipboard.writeText(selectedText);
      document.execCommand('delete');
      onClose();
    } catch (error) {
      console.error('Failed to cut:', error);
    }
  }, [selectedText, isEditable, onClose]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertText', false, text);
      onClose();
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  }, [onClose]);

  const handleSearch = useCallback(() => {
    if (!selectedText) return;

    try {
      const searchUrl = `https://cn.bing.com/search?q=${encodeURIComponent(selectedText)}`;
      window.open(searchUrl, '_blank');
      onClose();
    } catch (error) {
      console.error('Failed to search:', error);
    }
  }, [selectedText, onClose]);

  const handleRefresh = useCallback(() => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  }, []);

  const handleGoHome = useCallback(() => {
    try {
      window.location.href = 'https://sakurain.net';
    } catch (error) {
      console.error('Failed to go home:', error);
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('链接已复制到剪贴板！');
      }
      onClose();
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }, [onClose]);

  const handleAbout = useCallback(() => {
    try {
      window.location.href = '/about';
      onClose();
    } catch (error) {
      console.error('Failed to navigate to about:', error);
    }
  }, [onClose]);

  const handleOpenLinkInNewTab = useCallback(() => {
    if (!linkUrl) return;

    try {
      window.open(linkUrl, '_blank');
      onClose();
    } catch (error) {
      console.error('Failed to open link in new tab:', error);
    }
  }, [linkUrl, onClose]);

  const handleOpenLinkInNewWindow = useCallback(() => {
    if (!linkUrl) return;

    try {
      window.open(linkUrl, '_blank', 'width=800,height=600');
      onClose();
    } catch (error) {
      console.error('Failed to open link in new window:', error);
    }
  }, [linkUrl, onClose]);

  const handleCopyLinkUrl = useCallback(async () => {
    if (!linkUrl) return;

    try {
      await navigator.clipboard.writeText(linkUrl);
      onClose();
    } catch (error) {
      console.error('Failed to copy link URL:', error);
    }
  }, [linkUrl, onClose]);

  const handleCopyLinkText = useCallback(async () => {
    if (!linkText) return;

    try {
      await navigator.clipboard.writeText(linkText);
      onClose();
    } catch (error) {
      console.error('Failed to copy link text:', error);
    }
  }, [linkText, onClose]);

  const handleScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0);

      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      stream.getTracks().forEach(track => track.stop());
      onClose();
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('您取消了截图选择');
      } else {
        alert('截图失败，请确保在 HTTPS 或 localhost 环境中使用');
      }
    }
  }, [onClose]);

  const handlePrint = useCallback(() => {
    try {
      window.print();
      onClose();
    } catch (error) {
      console.error('Failed to print:', error);
    }
  }, [onClose]);

  const menuItems = [
    {
      icon: ExternalLink,
      label: '在新标签页中打开',
      onClick: handleOpenLinkInNewTab,
      disabled: !linkUrl,
      shortcut: '',
      color: '#60a5fa',
      show: !!linkUrl,
    },
    {
      icon: LinkIcon,
      label: '在新窗口中打开',
      onClick: handleOpenLinkInNewWindow,
      disabled: !linkUrl,
      shortcut: '',
      color: '#34d399',
      show: !!linkUrl,
    },
    {
      icon: Copy,
      label: '复制链接',
      onClick: handleCopyLinkUrl,
      disabled: !linkUrl,
      shortcut: '',
      color: '#f472b6',
      show: !!linkUrl,
    },
    {
      icon: Copy,
      label: '复制链接文字',
      onClick: handleCopyLinkText,
      disabled: !linkText,
      shortcut: '',
      color: '#a78bfa',
      show: !!linkText,
    },
    {
      icon: Camera,
      label: '截图',
      onClick: handleScreenshot,
      shortcut: '',
      color: '#fb923c',
      show: !linkUrl,
    },
    {
      icon: Printer,
      label: '打印',
      onClick: handlePrint,
      shortcut: 'Ctrl+P',
      color: '#f97316',
      show: !linkUrl,
    },
    {
      icon: Copy,
      label: '复制',
      onClick: handleCopy,
      disabled: !selectedText,
      shortcut: 'Ctrl+C',
      color: '#60a5fa',
      show: !!selectedText && !linkUrl,
    },
    {
      icon: Scissors,
      label: '剪切',
      onClick: handleCut,
      disabled: !selectedText || !isEditable,
      shortcut: 'Ctrl+X',
      color: '#f472b6',
      show: !!selectedText && isEditable && !linkUrl,
    },
    {
      icon: FileText,
      label: '粘贴',
      onClick: handlePaste,
      shortcut: 'Ctrl+V',
      color: '#a78bfa',
      show: isEditable && !linkUrl,
    },
    {
      icon: Search,
      label: '必应搜索',
      onClick: handleSearch,
      disabled: !selectedText,
      shortcut: 'Ctrl+K',
      color: '#34d399',
      show: !!selectedText && !linkUrl,
    },
    {
      icon: RefreshCw,
      label: '刷新页面',
      onClick: handleRefresh,
      shortcut: 'F5',
      color: '#2dd4bf',
      show: !linkUrl,
    },
    {
      icon: Home,
      label: '返回首页',
      onClick: handleGoHome,
      shortcut: 'Alt+Home',
      color: '#818cf8',
      show: !linkUrl,
    },
    {
      icon: Share,
      label: '共享页面',
      onClick: handleShare,
      shortcut: '',
      color: '#a3e635',
      show: !linkUrl,
    },
    {
      icon: Info,
      label: '关于',
      onClick: handleAbout,
      shortcut: '',
      color: '#fb923c',
      show: !linkUrl,
    },
  ].filter(item => item.show);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-[99999] min-w-[200px] rounded-2xl overflow-hidden backdrop-blur-xl pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="relative overflow-hidden pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-secondary)]/5 pointer-events-none" />

          <div className="relative p-2 space-y-0.5">
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!item.disabled) {
                    item.onClick();
                  }
                }}
                disabled={item.disabled}
                className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent pointer-events-auto"
                style={{
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  try {
                    if (!item.disabled) {
                      e.currentTarget.style.background = `${item.color}15`;
                      e.currentTarget.style.color = item.color;
                    }
                  } catch (error) {
                    console.error('Error in onMouseEnter:', error);
                  }
                }}
                onMouseLeave={(e) => {
                  try {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  } catch (error) {
                    console.error('Error in onMouseLeave:', error);
                  }
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{
                    background: `${item.color}20`,
                    color: item.color,
                  }}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.shortcut && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-mono"
                    style={{
                      background: `${item.color}10`,
                      color: `${item.color}80`,
                    }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function getLinkFromElement(element: HTMLElement): { url: string; text: string } | null {
  const linkElement = element.closest('a') as HTMLAnchorElement;
  if (linkElement && linkElement.href) {
    return {
      url: linkElement.href,
      text: linkElement.textContent || linkElement.innerText || linkElement.href,
    };
  }
  return null;
}

function isUrl(text: string): boolean {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlPattern.test(text.trim());
}

export function GlobalContextMenu() {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const isHandlingContextMenu = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleContextMenu = (event: MouseEvent) => {
      try {
        if (isHandlingContextMenu.current) return;
        isHandlingContextMenu.current = true;

        event.preventDefault();
        event.stopPropagation();

        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';

        const target = event.target as HTMLElement;
        const editable = target.isContentEditable ||
                       target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.closest('input') !== null ||
                       target.closest('textarea') !== null;

        const linkFromElement = getLinkFromElement(target);

        let detectedLinkUrl = '';
        let detectedLinkText = '';

        if (linkFromElement) {
          detectedLinkUrl = linkFromElement.url;
          detectedLinkText = linkFromElement.text;
        } else if (text && isUrl(text)) {
          detectedLinkUrl = text;
          detectedLinkText = text;
        }

        setMenuPosition({ x: event.clientX, y: event.clientY });
        setSelectedText(text);
        setIsEditable(editable);
        setLinkUrl(detectedLinkUrl);
        setLinkText(detectedLinkText);

        setTimeout(() => {
          isHandlingContextMenu.current = false;
        }, 200);
      } catch (error) {
        console.error('Error in handleContextMenu:', error);
        isHandlingContextMenu.current = false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [isMounted]);

  const handleClose = useCallback(() => {
    try {
      setMenuPosition(null);
      setSelectedText('');
      setIsEditable(false);
      setLinkUrl('');
      setLinkText('');
    } catch (error) {
      console.error('Error in handleClose:', error);
    }
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {menuPosition && (
        <CustomContextMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={handleClose}
          selectedText={selectedText}
          isEditable={isEditable}
          linkUrl={linkUrl}
          linkText={linkText}
        />
      )}
    </>
  );
}
