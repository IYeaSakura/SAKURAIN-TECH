/**
 * Minimal type declarations for the AMap JS API loaded at runtime.
 *
 * Full typing is omitted because the official loader injects the global
 * AMap object dynamically. These declarations silence TypeScript while
 * keeping the component lightweight.
 */

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AMap: any;
}

export {};
