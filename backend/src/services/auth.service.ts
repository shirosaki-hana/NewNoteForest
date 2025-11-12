import ms from 'ms';
import { database } from '../database/index.js';
import { env, isProduction } from '../config/index.js';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { LoginRequestSchema, SetupPasswordRequestSchema } from '@noteforest/types';
import { createSession, deleteSession, validateSession } from './session.service.js';

import type { LoginRequest, SetupPasswordRequest } from '@noteforest/types';
import type { CookieSerializeOptions } from '@fastify/cookie';
//------------------------------------------------------------------------------//
const SESSION_TTL_MS = ms(env.SESSION_TTL);

/**
 * 세션 쿠키 옵션
 */
export function getCookieOptions(): CookieSerializeOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/**
 * 비밀번호가 설정되어 있는지 확인
 */
export async function isPasswordSetup(): Promise<boolean> {
  const auth = await database.auth.findFirst();
  return Boolean(auth?.passwordHash);
}

/**
 * 최초 비밀번호 설정
 * @throws 이미 설정된 경우 statusCode 400 에러
 */
export async function setupPassword(body: unknown): Promise<void> {
  const { password } = SetupPasswordRequestSchema.parse(body) satisfies SetupPasswordRequest;

  const exists = await database.auth.findFirst();
  if (exists?.passwordHash) {
    throw Object.assign(new Error('Already configured'), { statusCode: 400 });
  }

  const passwordHash = await argon2Hash(password);

  if (exists) {
    await database.auth.update({ where: { id: exists.id }, data: { passwordHash } });
  } else {
    await database.auth.create({ data: { id: 1, passwordHash } });
  }
}

/**
 * 로그인 처리 및 세션 토큰 발급
 * @returns 세션 토큰
 * @throws 비밀번호 미설정 시 statusCode 400, 인증 실패 시 statusCode 401 에러
 */
export async function login(body: unknown): Promise<string> {
  const { password } = LoginRequestSchema.parse(body) satisfies LoginRequest;

  const record = await database.auth.findFirst();
  if (!record?.passwordHash) {
    throw Object.assign(new Error('Setup required'), { statusCode: 400 });
  }

  const isValid = await argon2Verify(record.passwordHash, password);
  if (!isValid) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  return createSession();
}

/**
 * 세션 토큰으로 로그아웃 처리
 */
export function logoutByToken(token: string): void {
  deleteSession(token);
}

/**
 * 세션 토큰으로 인증 확인
 * @param token 세션 토큰 (선택적)
 * @returns 유효한 세션 여부
 */
export function authenticateByToken(token?: string | null): boolean {
  return validateSession(token);
}

