import path from 'path';
import ms from 'ms';
import { env, isDevelopment, isProduction } from './env.config.js';
import { projectRoot } from '../utils/index.js';
//------------------------------------------------------------------------------//
export const fastifyConfig = { bodyLimit: parseInt(env.REQUEST_BODY_LIMIT.replace('mb', '')) * 1024 * 1024 };

export const corsConfig = {
  origin: isDevelopment ? true : env.FRONTEND_URL,
  credentials: true,
};

export const helmetConfig = {
  // 개발 환경에서는 CSP를 비활성화해서 디버깅과 도구 사용을 편하게 하고,
  // 프로덕션에서만 엄격한 CSP를 적용합니다.
  contentSecurityPolicy: isDevelopment
    ? false
    : {
        directives: {
          // 기본적으로 동일 오리진만 허용
          defaultSrc: ["'self'"],
          // 스크립트는 동일 오리진만 허용 (인라인 스크립트는 금지)
          scriptSrc: ["'self'"],
          // MUI 등에서 인라인 <style> 태그를 사용하므로 'unsafe-inline' 허용
          styleSrc: ["'self'", "'unsafe-inline'"],
          // 앱에서 사용하는 이미지 (파비콘, PWA 아이콘, 데이터 URL, 외부 HTTPS 이미지)
          imgSrc: ["'self'", 'data:', 'https:'],
          // 폰트는 동일 오리진 + data URL
          fontSrc: ["'self'", 'data:'],
          // 프론트엔드가 호출하는 API는 동일 오리진만 허용
          connectSrc: ["'self'"],
          // object/embed 등은 완전히 차단
          objectSrc: ["'none'"],
          // base 태그 제한
          baseUri: ["'self'"],
          // form action 제한
          formAction: ["'self'"],
          // frame ancestors 제한 (clickjacking 방지)
          frameAncestors: ["'self'"],
          // 업그레이드 안전하지 않은 요청 (프로덕션에서만)
          ...(isProduction && { upgradeInsecureRequests: [] }),
        },
      },
  crossOriginEmbedderPolicy: false,
  // Cross-Origin-Resource-Policy: 노트 앱은 동일 오리진 리소스만 사용하므로 same-origin으로 제한
  crossOriginResourcePolicy: { policy: 'same-origin' as const },
};

export const rateLimitConfig = {
  max: env.RATELIMIT_MAX,
  timeWindow: ms(env.RATELIMIT_WINDOWMS),
};

export const staticFilesConfig = {
  root: path.join(projectRoot, 'frontend/dist'),
  prefix: '/',
  cacheControl: isProduction,
  etag: true,
  lastModified: true,
  maxAge: isProduction ? ms('1d') : 0,
};
