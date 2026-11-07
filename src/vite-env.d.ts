/// <reference types="vite/client" />
declare module 'virtual:available-assets' {
  const files: string[];
  export default files;
}

/** Commit e hora do build (vite.config.ts). */
declare const __BUILD_ID__: string;
