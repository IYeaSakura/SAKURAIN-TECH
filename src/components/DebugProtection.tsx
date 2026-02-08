"use client"

import { useEffect } from 'react';
import { securityConfig } from '@/config/security-config';

export function DebugProtection() {
  const config = securityConfig.debugProtection;

  useEffect(() => {
    if (!config.enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const meta = e.metaKey;

      let shouldPrevent = false;

      if (config.disableF12 && key === 'f12') {
        shouldPrevent = true;
      }

      if (config.disableDevToolsShortcuts) {
        if (
          (ctrl && shift && key === 'i') ||
          (ctrl && shift && key === 'j') ||
          (ctrl && shift && key === 'c') ||
          (meta && alt && key === 'i') ||
          (meta && alt && key === 'j') ||
          (meta && alt && key === 'c')
        ) {
          shouldPrevent = true;
        }
      }

      if (config.disableViewSource) {
        if (
          (ctrl && key === 'u') ||
          (ctrl && key === 's') ||
          (ctrl && shift && key === 's')
        ) {
          shouldPrevent = true;
        }
      }

      if (config.disableDevToolsShortcuts) {
        if (
          (ctrl && key === 'p') ||
          (ctrl && shift && key === 'p') ||
          (ctrl && key === 'f') ||
          (ctrl && shift && key === 'f') ||
          (ctrl && alt && key === 'f') ||
          (ctrl && key === 'e') ||
          (ctrl && shift && key === 'e') ||
          (ctrl && alt && key === 'e') ||
          (ctrl && key === 'g') ||
          (ctrl && shift && key === 'g') ||
          (ctrl && alt && key === 'g') ||
          (ctrl && key === 'd') ||
          (ctrl && shift && key === 'd') ||
          (ctrl && alt && key === 'd')
        ) {
          shouldPrevent = true;
        }
      }

      if (shouldPrevent) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (config.disableContextMenu) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragStart = (e: Event) => {
      if (config.disableDrag) {
        e.preventDefault();
      }
    };

    const handleSelectStart = (e: Event) => {
      if (config.disableSelect) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
          e.preventDefault();
        }
      }
    };

    if (config.disableF12 || config.disableDevToolsShortcuts || config.disableViewSource) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    if (config.disableContextMenu) {
      document.addEventListener('contextmenu', handleContextMenu, true);
    }

    if (config.disableDrag) {
      document.addEventListener('dragstart', handleDragStart, true);
    }

    if (config.disableSelect) {
      document.addEventListener('selectstart', handleSelectStart, true);
    }

    const originalOpen = window.open;
    window.open = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('chrome-devtools')) {
        return null;
      }
      return originalOpen.apply(this, args);
    };

    let debuggerIntervalId: number | null = null;

    if (config.detectDevTools) {
      const disablePage = () => {
        document.body.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            background: #1a1a1a;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 18px;
            z-index: 999999;
          ">
            <div style="text-align: center;">
              <h2 style="margin-bottom: 16px;">⚠️ 调试工具检测</h2>
              <p>检测到开发者工具已打开</p>
              <p style="margin-top: 8px; color: #ff6b6b;">请关闭调试工具后刷新页面</p>
            </div>
          </div>
        `;
        
        const blockExecution = () => {
          try {
            (function() {}).constructor('debugger')();
          } catch (e) {
            setTimeout(blockExecution, 100);
          }
        };
        
        blockExecution();
      };

      const triggerDebugger = () => {
        const start = Date.now();
        try {
          (function() {}).constructor('debugger')();
        } catch (e) {}
        
        const executionTime = Date.now() - start;
        
        if (executionTime > 200) {
          disablePage();
        }
      };

      debuggerIntervalId = window.setInterval(triggerDebugger, 2000);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      window.open = originalOpen;
      if (debuggerIntervalId !== null) {
        window.clearInterval(debuggerIntervalId);
      }
    };
  }, [config]);

  return null;
}
