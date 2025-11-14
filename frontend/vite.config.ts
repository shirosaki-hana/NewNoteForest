import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// pnpm(.pnpm) 구조까지 고려해 node_modules 경로에서 실제 패키지 이름을 추출
function getPackageName(id: string): string | null {
  if (!id.includes('node_modules')) return null;

  // 예:
  // - node_modules/react/index.js
  // - node_modules/.pnpm/react@19.2.0/node_modules/react/index.js
  // - node_modules/.pnpm/@mui+material@7.3.5/node_modules/@mui/material/index.js
  const match = id.match(
    /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/
  );

  return match ? match[1] : null;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'es2023',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
            // 자동 청크 분리: pnpm 구조까지 고려해 패키지 단위/도메인 단위로 분리
            manualChunks(id) {
              const packageName = getPackageName(id);
              if (!packageName) return;

              // React 계열
              if (
                packageName === 'react' ||
                packageName === 'react-dom' ||
                packageName === 'scheduler'
              ) {
                return 'vendor-react';
              }

              // MUI + emotion
              if (
                packageName.startsWith('@mui/') ||
                packageName.startsWith('@emotion/')
              ) {
                return 'vendor-mui';
              }

              // CodeMirror 에디터 계열
              if (
                packageName.startsWith('@codemirror/') ||
                packageName === '@uiw/react-codemirror'
              ) {
                return 'vendor-editor';
              }

              // Markdown 렌더링 계열
              if (
                packageName === 'react-markdown' ||
                packageName.startsWith('rehype-') ||
                packageName.startsWith('remark-') ||
                packageName.startsWith('unist-')
              ) {
                return 'vendor-markdown';
              }

              // 라우팅 / HTTP / i18n / 상태관리 등 주요 도메인
              if (packageName === 'react-router-dom') {
                return 'vendor-router';
              }
              if (packageName === 'axios') {
                return 'vendor-http';
              }
              if (
                packageName === 'i18next' ||
                packageName === 'react-i18next'
              ) {
                return 'vendor-i18n';
              }
              if (packageName === 'zustand') {
                return 'vendor-state';
              }
              if (packageName === 'highlight.js') {
                return 'vendor-highlight';
              }
              return;
            },
          },
        },
      },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
