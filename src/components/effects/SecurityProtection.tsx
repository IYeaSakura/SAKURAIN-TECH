import { useEffect } from 'react';

interface SecurityConfig {
  disableCopy: boolean;
  disableF12: boolean;
  disableDevTools: boolean;
  disableDebug: boolean;
}

interface SecurityProtectionProps {
  config?: SecurityConfig;
}

export function SecurityProtection({ config }: SecurityProtectionProps) {
  useEffect(() => {
    const loadSecurityConfig = async (): Promise<SecurityConfig> => {
      if (config) {
        return config;
      }
      try {
        const response = await fetch('/config/security-config.json');
        const data = await response.json();
        return data.security;
      } catch (error) {
        return {
          disableCopy: true,
          disableF12: true,
          disableDevTools: true,
          disableDebug: true,
        };
      }
    };

    const initSecurity = async () => {
      const securityConfig = await loadSecurityConfig();

      if (securityConfig.disableCopy) {
        disableCopy();
      }

      if (securityConfig.disableF12) {
        disableF12();
      }

      if (securityConfig.disableDevTools) {
        disableDevTools();
      }

      if (securityConfig.disableDebug) {
        disableDebug();
      }
    };

    initSecurity();
  }, [config]);

  return null;
}

function disableCopy() {
  const handleCopy = (e: ClipboardEvent) => {
    e.preventDefault();
  };

  const handleCut = (e: ClipboardEvent) => {
    e.preventDefault();
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
  };

  const handleSelectStart = (e: Event) => {
    e.preventDefault();
  };

  const handleContextMenu = (e: Event) => {
    e.preventDefault();
  };

  document.addEventListener('copy', handleCopy);
  document.addEventListener('cut', handleCut);
  document.addEventListener('paste', handlePaste);
  document.addEventListener('selectstart', handleSelectStart);
  document.addEventListener('contextmenu', handleContextMenu);

  document.body.style.userSelect = 'none';
  (document.body.style as any).webkitUserSelect = 'none';

  return () => {
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('cut', handleCut);
    document.removeEventListener('paste', handlePaste);
    document.removeEventListener('selectstart', handleSelectStart);
    document.removeEventListener('contextmenu', handleContextMenu);
  };
}

function disableF12() {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.key === 'U') {
      e.preventDefault();
      return false;
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

function disableDevTools() {
  let devToolsOpen = false;
  const threshold = 160;

  const detectDevToolsBySize = () => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const widthThreshold = widthDiff > threshold;
    const heightThreshold = heightDiff > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        showBlockedMessage('Developer tools are disabled');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } else {
      devToolsOpen = false;
    }
  };

  const detectDevToolsByDebugger = () => {
    const start = performance.now();
    debugger;
    const end = performance.now();
    
    if (end - start > 100) {
      showBlockedMessage('Debugging is disabled');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const detectDevToolsByToString = () => {
    const devtools = /./;
    devtools.toString = function() {
      showBlockedMessage('Developer tools are disabled');
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return 'replaced';
    };
    console.log('%c', devtools);
  };

  const detectDevToolsByElement = () => {
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        showBlockedMessage('Developer tools are disabled');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    });
    console.log(element);
  };

  const sizeInterval = setInterval(detectDevToolsBySize, 500);
  const debuggerInterval = setInterval(detectDevToolsByDebugger, 1000);

  detectDevToolsByToString();
  detectDevToolsByElement();

  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    table: console.table,
    trace: console.trace,
    dir: console.dir,
    dirxml: console.dirxml,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    clear: console.clear,
    assert: console.assert,
    count: console.count,
    time: console.time,
    timeEnd: console.timeEnd,
    timeLog: console.timeLog,
  };

  const emptyConsole = () => {};

  console.log = emptyConsole;
  console.error = emptyConsole;
  console.warn = emptyConsole;
  console.info = emptyConsole;
  console.debug = emptyConsole;
  console.table = emptyConsole;
  console.trace = emptyConsole;
  console.dir = emptyConsole;
  console.dirxml = emptyConsole;
  console.group = emptyConsole;
  console.groupCollapsed = emptyConsole;
  console.groupEnd = emptyConsole;
  console.clear = emptyConsole;
  console.assert = emptyConsole;
  console.count = emptyConsole;
  console.time = emptyConsole;
  console.timeEnd = emptyConsole;
  console.timeLog = emptyConsole;

  return () => {
    clearInterval(sizeInterval);
    clearInterval(debuggerInterval);
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.table = originalConsole.table;
    console.trace = originalConsole.trace;
    console.dir = originalConsole.dir;
    console.dirxml = originalConsole.dirxml;
    console.group = originalConsole.group;
    console.groupCollapsed = originalConsole.groupCollapsed;
    console.groupEnd = originalConsole.groupEnd;
    console.clear = originalConsole.clear;
    console.assert = originalConsole.assert;
    console.count = originalConsole.count;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
    console.timeLog = originalConsole.timeLog;
  };
}

function disableDebug() {
  let debuggerDetected = false;

  const checkDebugger = () => {
    if (debuggerDetected) {
      return;
    }
    
    const start = performance.now();
    debugger;
    const end = performance.now();
    
    if (end - start > 100) {
      debuggerDetected = true;
      showBlockedMessage('Debugging is disabled');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const checkDebuggerWithInterval = () => {
    const start = Date.now();
    debugger;
    const end = Date.now();
    
    if (end - start > 100) {
      debuggerDetected = true;
      showBlockedMessage('Debugging is disabled');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const checkDebuggerWithFunction = () => {
    const devtools = {
      get: function() {
        debuggerDetected = true;
        showBlockedMessage('Debugging is disabled');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };
    
    Object.defineProperty(devtools, 'test', devtools);
    console.log(devtools);
  };

  const interval1 = setInterval(checkDebugger, 500);
  const interval2 = setInterval(checkDebuggerWithInterval, 750);
  const interval3 = setInterval(checkDebuggerWithFunction, 1000);

  const disableRightClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const disableInspect = (e: KeyboardEvent) => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const disableMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const disableDragStart = (e: Event) => {
    e.preventDefault();
  };

  const disableSelect = (e: Event) => {
    e.preventDefault();
  };

  document.addEventListener('contextmenu', disableRightClick, true);
  document.addEventListener('keydown', disableInspect, true);
  document.addEventListener('mouseup', disableMouseUp, true);
  document.addEventListener('dragstart', disableDragStart, true);
  document.addEventListener('selectstart', disableSelect, true);
  document.addEventListener('selectionchange', disableSelect, true);

  const disableInspectElement = () => {
    document.addEventListener('click', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  };

  disableInspectElement();

  const disableBeforeUnload = (e: BeforeUnloadEvent) => {
    if (performance.now() - (window as any).lastPageLoad < 1000) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', disableBeforeUnload);

  (window as any).lastPageLoad = performance.now();

  const disableWindowOpen = () => {
    window.open = function() {
      showBlockedMessage('Opening new windows is disabled');
      return null;
    };
  };

  disableWindowOpen();

  const disableEval = () => {
    (window as any).eval = function() {
      showBlockedMessage('eval is disabled');
      return undefined;
    };
  };

  disableEval();

  return () => {
    clearInterval(interval1);
    clearInterval(interval2);
    clearInterval(interval3);
    document.removeEventListener('contextmenu', disableRightClick, true);
    document.removeEventListener('keydown', disableInspect, true);
    document.removeEventListener('mouseup', disableMouseUp, true);
    document.removeEventListener('dragstart', disableDragStart, true);
    document.removeEventListener('selectstart', disableSelect, true);
    document.removeEventListener('selectionchange', disableSelect, true);
    window.removeEventListener('beforeunload', disableBeforeUnload);
  };
}

function showBlockedMessage(message: string) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 24px;
    color: white;
  `;
  overlay.textContent = message;
  document.body.appendChild(overlay);
}
