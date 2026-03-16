// CSS 모듈 import를 위한 타입 선언
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// highlight.js 스타일 파일들을 위한 타입 선언
declare module 'highlight.js/styles/*.css';
