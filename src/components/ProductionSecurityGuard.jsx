'use client';

import { useEffect } from 'react';

/**
 * ProductionSecurityGuard
 * Prevents unauthorized code inspection, DevTools opening, source viewing,
 * and traps execution if a browser code editor or debugger is attached in production.
 */
export default function ProductionSecurityGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // 1. Block right-click context menu (prevents "Inspect", "Inspect Element", "View Source")
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. Intercept keyboard shortcuts used for debugging and code inspection
    const handleKeyDown = (e) => {
      // F12 (Standard DevTools toggle)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      if (isModifier) {
        // DevTools inspection combinations:
        // Ctrl+Shift+I / Cmd+Opt+I (Developer Tools)
        // Ctrl+Shift+J / Cmd+Opt+J (Console panel)
        // Ctrl+Shift+C / Cmd+Opt+C (Inspect DOM element)
        // Ctrl+Shift+K / Cmd+Opt+K (Firefox console)
        if (e.shiftKey && ['i', 'j', 'c', 'k'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Source and asset inspection combinations:
        // Ctrl+U (View Page Source)
        // Ctrl+S (Save Page Source)
        if (['u', 's'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // 3. Neutralize console logging in production to prevent object and state leaks
    if (typeof window !== 'undefined' && window.console) {
      const noop = () => {};
      const methodsToMute = ['log', 'debug', 'info', 'dir', 'table', 'trace'];
      methodsToMute.forEach((method) => {
        try {
          window.console[method] = noop;
        } catch (_) {}
      });
    }

    // 4. Active Anti-Debugging Trap
    // When browser DevTools Sources or code editor is opened, this constructor-based
    // debugger call continually traps execution, halting unauthorized inspection.
    let debuggerInterval = null;
    const triggerAntiDebugger = () => {
      try {
        const trap = function () {
          (function () {
            return false;
          })['constructor']('debugger')();
        };
        trap();
      } catch (_) {}
    };

    debuggerInterval = setInterval(triggerAntiDebugger, 250);

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      if (debuggerInterval) clearInterval(debuggerInterval);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return null;
}
