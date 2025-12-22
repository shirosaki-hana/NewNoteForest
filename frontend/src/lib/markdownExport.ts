import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

//------------------------------------------------------------------------------//
// 타입 정의
//------------------------------------------------------------------------------//
export interface NoteExportData {
  title: string;
  tags: string[];
  content: string;
}

export interface ParsedMarkdown {
  isValid: boolean;
  title?: string;
  tags?: string[];
  content: string;
}

//------------------------------------------------------------------------------//
// Front-matter 유틸리티
//------------------------------------------------------------------------------//
const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function extractFrontMatter(markdown: string): { data: Record<string, unknown>; content: string } | null {
  const match = markdown.match(FRONT_MATTER_REGEX);
  if (!match) {
    return null;
  }

  try {
    const yamlContent = match[1];
    const data = parseYaml(yamlContent) as Record<string, unknown>;
    const content = markdown.slice(match[0].length);
    return { data, content };
  } catch {
    return null;
  }
}

function createFrontMatter(data: Record<string, unknown>): string {
  const yaml = stringifyYaml(data, { lineWidth: 0 });
  return `---\n${yaml}---\n`;
}

//------------------------------------------------------------------------------//
// Export: 노트 데이터를 YAML front-matter가 포함된 Markdown 문자열로 변환
//------------------------------------------------------------------------------//
export function noteToMarkdown(note: NoteExportData): string {
  const frontMatter = {
    title: note.title,
    tags: note.tags,
    exportedAt: new Date().toISOString(),
  };

  return createFrontMatter(frontMatter) + note.content;
}

//------------------------------------------------------------------------------//
// Import: Markdown 문자열을 파싱하여 노트 데이터 추출
//------------------------------------------------------------------------------//
export function parseMarkdownWithFrontMatter(markdown: string): ParsedMarkdown {
  try {
    const parsed = extractFrontMatter(markdown);

    // front-matter가 있고 title이 유효한 경우
    if (parsed?.data && typeof parsed.data.title === 'string' && parsed.data.title.trim()) {
      const tags: string[] = [];

      // tags 파싱 (배열 또는 문자열 처리)
      if (Array.isArray(parsed.data.tags)) {
        tags.push(...parsed.data.tags.filter((tag: unknown) => typeof tag === 'string'));
      } else if (typeof parsed.data.tags === 'string') {
        // 쉼표로 구분된 문자열도 지원
        tags.push(...parsed.data.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
      }

      return {
        isValid: true,
        title: parsed.data.title.trim(),
        tags,
        content: parsed.content,
      };
    }

    // front-matter가 없거나 유효하지 않은 경우
    return {
      isValid: false,
      content: parsed?.content || markdown,
    };
  } catch {
    // 파싱 실패 시 전체 내용을 content로 반환
    return {
      isValid: false,
      content: markdown,
    };
  }
}

//------------------------------------------------------------------------------//
// 파일 다운로드 헬퍼
//------------------------------------------------------------------------------//
export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

//------------------------------------------------------------------------------//
// 파일 읽기 헬퍼
//------------------------------------------------------------------------------//
export function readMarkdownFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}
