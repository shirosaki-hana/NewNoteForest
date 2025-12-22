import type {
  AuthStatusResponse,
  SetupPasswordRequest,
  SetupPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteResponse,
  GetNoteResponse,
  ListNotesResponse,
  ListTagsResponse,
} from '@noteforest/types';
import type { ListNotesParams } from './notes';

//------------------------------------------------------------------------------//
// API 어댑터 인터페이스 정의
//------------------------------------------------------------------------------//
export interface ApiAdapter {
  // Auth
  checkAuthStatus(): Promise<AuthStatusResponse>;
  setupPassword(data: SetupPasswordRequest): Promise<SetupPasswordResponse>;
  login(data: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<LogoutResponse>;

  // Notes
  listNotes(params?: ListNotesParams): Promise<ListNotesResponse>;
  getNoteById(id: number): Promise<GetNoteResponse>;
  createNote(data: CreateNoteRequest): Promise<CreateNoteResponse>;
  updateNote(id: number, data: UpdateNoteRequest): Promise<UpdateNoteResponse>;
  deleteNote(id: number): Promise<DeleteNoteResponse>;
  listTags(): Promise<ListTagsResponse>;
}

//------------------------------------------------------------------------------//
// 현재 사용 중인 어댑터
//------------------------------------------------------------------------------//
let currentAdapter: ApiAdapter | null = null;

export function setApiAdapter(adapter: ApiAdapter): void {
  currentAdapter = adapter;
}

export function getApiAdapter(): ApiAdapter {
  if (!currentAdapter) {
    throw new Error('API adapter not initialized. Call setApiAdapter() first.');
  }
  return currentAdapter;
}

//------------------------------------------------------------------------------//
// 환경 감지 유틸리티
//------------------------------------------------------------------------------//
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

