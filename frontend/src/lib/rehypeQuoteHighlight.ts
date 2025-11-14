import { visit } from 'unist-util-visit';
import type { Root, Element, Text, ElementContent } from 'hast';

/**
 * Rehype 플러그인: 마크다운 내 따옴표로 감싸진 텍스트를 하이라이팅합니다.
 *
 * 지원하는 따옴표 형식:
 * - 영문 쌍따옴표: "text"
 * - 영문 홑따옴표: 'text'
 * - 한글 쌍따옴표: "text"
 * - 한글 홑따옴표: 'text'
 * - 유니코드 쌍따옴표: \u201C...\u201D
 * - 유니코드 홑따옴표: \u2018...\u2019
 */

// 따옴표 패턴 - 정규식 인스턴스를 모듈 레벨에서 미리 생성
const QUOTE_PATTERN = /"([^"]+)"|'([^']+)'|"([^"]+)"|'([^']+)'|\u201C([^\u201D]+)\u201D|\u2018([^\u2019]+)\u2019/g;

export default function rehypeQuoteHighlight() {
  return (tree: Root) => {
    // 코드 블록 내부 노드들을 추적하기 위한 WeakSet (메모리 효율성)
    const codeBlockDescendants = new WeakSet<Element>();

    // 모든 코드 블록과 그 후손들을 미리 수집 (한 번만 순회)
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'code' || node.tagName === 'pre') {
        // 현재 노드와 모든 후손 노드들을 WeakSet에 추가
        const addDescendants = (element: Element) => {
          codeBlockDescendants.add(element);
          for (const child of element.children) {
            if (child.type === 'element') {
              addDescendants(child);
            }
          }
        };
        addDescendants(node);
      }
    });

    // 텍스트 노드들을 배치로 처리
    const textNodesToProcess: Array<{
      node: Text;
      index: number;
      parent: Element;
    }> = [];

    // 텍스트 노드 수집 (코드 블록 내부가 아닌 것만)
    visit(tree, 'text', (node: Text, index, parent) => {
      if (parent && parent.type === 'element' && typeof index === 'number' && !codeBlockDescendants.has(parent)) {
        textNodesToProcess.push({ node, index, parent });
      }
    });

    // 배치 처리: 뒤에서부터 처리하여 인덱스 변경 문제 방지
    for (let i = textNodesToProcess.length - 1; i >= 0; i--) {
      const { node, index, parent } = textNodesToProcess[i];
      const processedParts = processTextNode(node.value);

      // 처리 결과가 기존 텍스트 노드와 다를 때만 교체
      // - 따옴표 전체가 하나의 텍스트 노드인 경우처럼,
      //   하이라이트된 span 하나만 생겨도 교체가 필요하므로
      if (processedParts.length !== 1 || processedParts[0].type !== 'text' || (processedParts[0] as Text).value !== node.value) {
        // 한 번에 교체 (splice 최적화)
        parent.children.splice(index, 1, ...processedParts);
      }
    }
  };
}

// 텍스트 노드 처리 함수 (순수 함수로 분리하여 테스트 가능)
function processTextNode(text: string): ElementContent[] {
  // 정규식을 한 번만 실행하여 모든 매치를 찾음
  const matches = Array.from(text.matchAll(QUOTE_PATTERN));

  if (matches.length === 0) {
    return [
      {
        type: 'text',
        value: text,
      } as Text,
    ];
  }

  const parts: ElementContent[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const matchIndex = match.index!;

    // 매칭 전 텍스트가 있으면 추가
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        value: text.slice(lastIndex, matchIndex),
      } as Text);
    }

    // 하이라이트된 부분 추가
    parts.push({
      type: 'element',
      tagName: 'span',
      properties: {
        className: ['quote-highlight'],
      },
      children: [
        {
          type: 'text',
          value: match[0],
        } as Text,
      ],
    } as Element);

    lastIndex = matchIndex + match[0].length;
  }

  // 남은 텍스트가 있으면 추가
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      value: text.slice(lastIndex),
    } as Text);
  }

  return parts;
}
