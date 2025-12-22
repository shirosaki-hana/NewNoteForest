import { createTheme } from '@mui/material';

// Prism.js 코드 하이라이팅 스타일 (MUI 테마 연동)
const getPrismStyles = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

  // 라이트 테마 색상 (GitHub 스타일)
  const lightColors = {
    comment: '#6a737d',
    prolog: '#6a737d',
    doctype: '#6a737d',
    cdata: '#6a737d',
    punctuation: '#24292e',
    property: '#005cc5',
    tag: '#22863a',
    boolean: '#005cc5',
    number: '#005cc5',
    constant: '#005cc5',
    symbol: '#e36209',
    deleted: '#d73a49',
    selector: '#22863a',
    attrName: '#6f42c1',
    string: '#032f62',
    char: '#032f62',
    builtin: '#6f42c1',
    inserted: '#22863a',
    operator: '#d73a49',
    entity: '#005cc5',
    url: '#005cc5',
    variable: '#e36209',
    atrule: '#d73a49',
    attrValue: '#032f62',
    function: '#6f42c1',
    className: '#6f42c1',
    keyword: '#d73a49',
    regex: '#032f62',
    important: '#d73a49',
  };

  // 다크 테마 색상 (GitHub Dark 스타일)
  const darkColors = {
    comment: '#8b949e',
    prolog: '#8b949e',
    doctype: '#8b949e',
    cdata: '#8b949e',
    punctuation: '#c9d1d9',
    property: '#79c0ff',
    tag: '#7ee787',
    boolean: '#79c0ff',
    number: '#79c0ff',
    constant: '#79c0ff',
    symbol: '#ffa657',
    deleted: '#ff7b72',
    selector: '#7ee787',
    attrName: '#d2a8ff',
    string: '#a5d6ff',
    char: '#a5d6ff',
    builtin: '#d2a8ff',
    inserted: '#7ee787',
    operator: '#ff7b72',
    entity: '#79c0ff',
    url: '#79c0ff',
    variable: '#ffa657',
    atrule: '#ff7b72',
    attrValue: '#a5d6ff',
    function: '#d2a8ff',
    className: '#d2a8ff',
    keyword: '#ff7b72',
    regex: '#a5d6ff',
    important: '#ff7b72',
  };

  const colors = isDark ? darkColors : lightColors;

  return {
    '.token.comment, .token.prolog, .token.doctype, .token.cdata': {
      color: colors.comment,
      fontStyle: 'italic',
    },
    '.token.punctuation': {
      color: colors.punctuation,
    },
    '.token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol': {
      color: colors.property,
    },
    '.token.tag': {
      color: colors.tag,
    },
    '.token.boolean, .token.number, .token.constant': {
      color: colors.boolean,
    },
    '.token.symbol, .token.deleted': {
      color: colors.deleted,
    },
    '.token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted': {
      color: colors.string,
    },
    '.token.attr-name': {
      color: colors.attrName,
    },
    '.token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string': {
      color: colors.operator,
    },
    '.token.atrule, .token.attr-value, .token.keyword': {
      color: colors.keyword,
    },
    '.token.function, .token.class-name': {
      color: colors.function,
    },
    '.token.regex, .token.important, .token.variable': {
      color: colors.variable,
    },
    '.token.important, .token.bold': {
      fontWeight: 'bold',
    },
    '.token.italic': {
      fontStyle: 'italic',
    },
    '.token.entity': {
      cursor: 'help',
    },
  };
};

export function createAppTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#2563eb' : '#3b82f6',
        light: mode === 'light' ? '#3b82f6' : '#60a5fa',
        dark: mode === 'light' ? '#1e40af' : '#1d4ed8',
      },
      secondary: {
        main: mode === 'light' ? '#7c3aed' : '#8b5cf6',
        light: mode === 'light' ? '#8b5cf6' : '#a78bfa',
        dark: mode === 'light' ? '#6d28d9' : '#7c3aed',
      },
      success: {
        main: mode === 'light' ? '#10b981' : '#34d399',
        light: mode === 'light' ? '#34d399' : '#6ee7b7',
        dark: mode === 'light' ? '#059669' : '#10b981',
      },
      error: {
        main: mode === 'light' ? '#ef4444' : '#f87171',
        light: mode === 'light' ? '#f87171' : '#fca5a5',
        dark: mode === 'light' ? '#dc2626' : '#ef4444',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0b1220',
        paper: mode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(2,6,23,0.55)',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#e2e8f0',
        secondary: mode === 'light' ? '#64748b' : '#94a3b8',
      },
      divider: mode === 'light' ? 'rgba(2,6,23,0.08)' : 'rgba(148,163,184,0.16)',
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage:
              mode === 'light'
                ? 'radial-gradient(40rem 40rem at -10% -20%, rgba(37, 99, 235, 0.08), transparent), radial-gradient(50rem 40rem at 120% -10%, rgba(147, 51, 234, 0.08), transparent)'
                : 'radial-gradient(40rem 40rem at -10% -20%, rgba(37, 99, 235, 0.15), transparent), radial-gradient(50rem 40rem at 120% -10%, rgba(147, 51, 234, 0.12), transparent)',
            backgroundAttachment: 'fixed',
          },
          '::selection': {
            backgroundColor: mode === 'light' ? 'rgba(37,99,235,0.2)' : 'rgba(59,130,246,0.25)',
          },
          // 커스텀 스크롤바 스타일 (WebKit 기반 브라우저: Chrome, Edge, Safari)
          '*::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '*::-webkit-scrollbar-track': {
            background: mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
          },
          '*::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
            borderRadius: '10px',
            border: mode === 'light' ? '3px solid #f8fafc' : '3px solid #0b1220',
            transition: 'background 0.2s',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: mode === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)',
          },
          '*::-webkit-scrollbar-thumb:active': {
            background: mode === 'light' ? 'rgba(37,99,235,0.4)' : 'rgba(59,130,246,0.4)',
          },
          // Firefox용 스크롤바 스타일
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'light' ? 'rgba(0,0,0,0.15) rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.15) rgba(255,255,255,0.03)',
          },
          // Prism.js 코드 하이라이팅 스타일
          ...getPrismStyles(mode),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
          },
          sizeLarge: { paddingTop: 10, paddingBottom: 10 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          input: {
            paddingTop: 14,
            paddingBottom: 14,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            backdropFilter: 'saturate(160%) blur(12px)',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'saturate(150%) blur(10px)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, backgroundImage: 'none', backdropFilter: 'blur(12px)' },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          grouped: { borderRadius: 10 },
        },
      },
    },
  });
}
