import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeQuoteHighlight from './rehypeQuoteHighlight';
import { Box, alpha } from '@mui/material';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: '16px 0',
        fontFamily: '"Inter", "Arial", "Helvetica", sans-serif',
        lineHeight: 1.6,
        overflow: 'auto',
        height: '100%',
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
        '& code': {
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontFamily: '"JetBrains Mono", "Menlo", "Monaco", "Courier New", monospace',
        },
        '& pre': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          overflow: 'auto',
          '& code': {
            padding: 0,
            fontSize: '0.875rem',
          },
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          paddingLeft: '16px',
          margin: '16px 0',
          fontStyle: 'italic',
          '& p': {
            marginBottom: '8px',
          },
        },
        '& ul, & ol': {
          paddingLeft: '24px',
          marginBottom: '16px',
          '& li': {
            marginBottom: '4px',
          },
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
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
          },
        },
        '& hr': {
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          margin: '24px 0',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          marginBottom: '16px',
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: 'primary.light',
          },
          '&:visited': {
            color: 'secondary.main',
          },
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeKatex, { output: 'mathml' }],
          rehypeRaw,
          rehypeQuoteHighlight,
        ]}
      >
        {content || '*내용이 없습니다.*'}
      </ReactMarkdown>
    </Box>
  );
}
