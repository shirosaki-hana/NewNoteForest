import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeQuoteHighlight from '../lib/rehypeQuoteHighlight';
import { Box, alpha, useTheme } from '@mui/material';

//------------------------------------------------------------------------------//
// 마크다운 렌더러 컴포넌트
//
// 기능:
// - GitHub Flavored Markdown 지원
// - 코드 하이라이팅 (highlight.js)
// - 수학 수식 렌더링 (KaTeX)
// - 따옴표 하이라이팅
// - Material-UI 테마 연동
//------------------------------------------------------------------------------//

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
        fontSize: '15px',
        lineHeight: 1.6,
        color: 'text.primary',
        overflow: 'auto',
        height: '100%',

        // 따옴표 하이라이팅
        '& .quote-highlight': {
          color: 'info.main',
          fontWeight: 500,
          borderRadius: '3px',
          padding: '0 2px',
          backgroundColor: theme => alpha(theme.palette.info.main, 0.08),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme => alpha(theme.palette.info.main, 0.12),
          },
        },

        // 인라인 코드
        '& code': {
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontFamily: '"JetBrains Mono", "Menlo", "Monaco", "Courier New", monospace',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2',
        },

        // 코드 블록
        '& pre': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '8px',
          marginBottom: '16px',
          overflow: 'auto',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          '& code': {
            padding: 0,
            fontSize: '0.875rem',
            backgroundColor: 'transparent',
            color: 'inherit',
          },
        },

        // 인용구
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          paddingLeft: '16px',
          margin: '16px 0',
          color: 'text.secondary',
          fontStyle: 'italic',
          '& p': {
            marginTop: '8px',
            marginBottom: '8px',
          },
        },

        // 리스트
        '& ul, & ol': {
          paddingLeft: '24px',
          marginTop: '8px',
          marginBottom: '16px',
          '& li': {
            marginBottom: '4px',
          },
        },

        // 테이블
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '8px',
          marginBottom: '16px',
          border: '1px solid',
          borderColor: 'divider',
          '& th, & td': {
            padding: '8px 12px',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'left',
          },
          '& th': {
            fontWeight: 600,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          },
        },

        // 구분선
        '& hr': {
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          margin: '24px 0',
        },

        // 이미지
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          marginTop: '8px',
          marginBottom: '16px',
        },

        // 링크
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          fontWeight: 500,
          '&:hover': {
            textDecoration: 'underline',
            color: 'primary.light',
          },
        },

        // 제목
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          marginTop: '24px',
          marginBottom: '12px',
          fontWeight: 600,
          lineHeight: 1.3,
        },
        '& h1': {
          fontSize: '2rem',
          borderBottom: '1px solid',
          borderColor: 'divider',
          paddingBottom: '8px',
        },
        '& h2': {
          fontSize: '1.5rem',
        },
        '& h3': {
          fontSize: '1.25rem',
        },

        // 문단
        '& p': {
          marginTop: '8px',
          marginBottom: '8px',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, [rehypeKatex, { output: 'mathml' }], rehypeRaw, rehypeQuoteHighlight]}
      >
        {content || ''}
      </ReactMarkdown>
    </Box>
  );
}
