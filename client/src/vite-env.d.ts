/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL_LOCAL: string;
  readonly VITE_API_URL_PRODUCTION: string;
  readonly VITE_USE_PRODUCTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
