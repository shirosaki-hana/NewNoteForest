import { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useSettingsStore } from './stores/settingsStore';
import App from './App';
import { createAppTheme } from './theme/createAppTheme';

export function ThemedApp() {
  const { effectiveTheme } = useSettingsStore();
  const theme = createAppTheme(effectiveTheme);

  // 테마 변경 시 body 배경색도 업데이트
  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
  }, [theme.palette.background.default]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}
