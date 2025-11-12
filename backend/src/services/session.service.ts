import ms from 'ms';
import { randomBytes } from 'crypto';
import { env } from '../config/index.js';
import { logger } from '../utils/index.js';
//------------------------------------------------------------------------------//
const SESSION_TTL_MS = ms(env.SESSION_TTL);

// 메모리 기반 세션 스토어: token -> expiresAt(ms)
const sessionStore = new Map<string, number>();

// 주기적 세션 정리 인터벌 (5분)
const PRUNE_INTERVAL_MS = ms('5m');
let pruneIntervalId: NodeJS.Timeout | null = null;

/**
 * 세션 토큰 생성 (96자 hex 문자열)
 */
function generateToken(): string {
  return randomBytes(48).toString('hex');
}

/**
 * 메모리에서 만료된 세션 정리
 */
function pruneExpiredSessionsFromMemory(): number {
  const now = Date.now();
  let count = 0;

  for (const [token, expiresAt] of sessionStore.entries()) {
    if (expiresAt <= now) {
      sessionStore.delete(token);
      count++;
    }
  }

  return count;
}

/**
 * 주기적 세션 정리 시작
 */
export function startSessionPruning(): void {
  if (pruneIntervalId) {
    return;
  }

  pruneIntervalId = setInterval(() => {
    const pruned = pruneExpiredSessionsFromMemory();
    if (pruned > 0) {
      logger.info(`[Session] Pruned ${pruned} expired session(s)`);
    }
  }, PRUNE_INTERVAL_MS);
}

/**
 * 주기적 세션 정리 중지
 */
export function stopSessionPruning(): void {
  if (pruneIntervalId) {
    clearInterval(pruneIntervalId);
    pruneIntervalId = null;
  }
}

/**
 * 새로운 세션 생성
 * @returns 생성된 세션 토큰
 */
export function createSession(): string {
  const token = generateToken();
  const expiresAt = Date.now() + Math.max(60_000, Math.floor(SESSION_TTL_MS));
  sessionStore.set(token, expiresAt);
  return token;
}

/**
 * 세션 삭제
 * @param token 삭제할 세션 토큰
 */
export function deleteSession(token: string): void {
  sessionStore.delete(token);
}

/**
 * 세션 유효성 검증
 * @param token 검증할 세션 토큰
 * @returns 유효한 세션 여부
 */
export function validateSession(token?: string | null): boolean {
  if (!token) {
    return false;
  }

  const expiresAt = sessionStore.get(token);
  if (!expiresAt) {
    return false;
  }

  const now = Date.now();
  if (expiresAt <= now) {
    // 만료된 세션 제거
    sessionStore.delete(token);
    return false;
  }

  return true;
}

/**
 * 만료된 세션 정리
 * @returns 정리된 세션 개수
 */
export function pruneExpiredSessions(): number {
  return pruneExpiredSessionsFromMemory();
}

/**
 * 현재 활성 세션 개수 조회
 */
export function getActiveSessionCount(): number {
  return sessionStore.size;
}
