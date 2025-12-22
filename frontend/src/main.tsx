import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n'; // i18n 초기화
import { ThemedApp } from './ThemedApp';
import { setApiAdapter, isTauri } from './api';
import { WebApiAdapter } from './api/adapters/web.adapter';
import { TauriApiAdapter } from './api/adapters/tauri.adapter';

// 환경에 따라 적절한 API 어댑터 설정
if (isTauri()) {
  setApiAdapter(new TauriApiAdapter());
} else {
  setApiAdapter(new WebApiAdapter());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>
);
