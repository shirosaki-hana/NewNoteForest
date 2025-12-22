import type {
  AuthStatusResponse,
  SetupPasswordRequest,
  SetupPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from '@noteforest/types';
import { getApiAdapter } from './adapter';

// 인증 상태 조회
export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  return getApiAdapter().checkAuthStatus();
}

// 비밀번호 최초 설정
export async function setupPassword(data: SetupPasswordRequest): Promise<SetupPasswordResponse> {
  return getApiAdapter().setupPassword(data);
}

// 로그인
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return getApiAdapter().login(data);
}

// 로그아웃
export async function logout(): Promise<LogoutResponse> {
  return getApiAdapter().logout();
}
