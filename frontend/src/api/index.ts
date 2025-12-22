// API 어댑터 시스템
export { getApiAdapter, setApiAdapter, isTauri, type ApiAdapter } from './adapter';
export { WebApiAdapter } from './adapters/web.adapter';
export { TauriApiAdapter } from './adapters/tauri.adapter';

// 기존 타입 re-export
export type { ListNotesParams } from './notes';

