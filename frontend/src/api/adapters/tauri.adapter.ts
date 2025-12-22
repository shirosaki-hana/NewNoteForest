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
import type { ApiAdapter } from '../adapter';
import type { ListNotesParams } from '../notes';

//------------------------------------------------------------------------------//
// Tauri IPC 호출 헬퍼
//------------------------------------------------------------------------------//
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  // @ts-expect-error Tauri의 invoke는 런타임에 window.__TAURI__에서 제공됨
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  return tauriInvoke(cmd, args);
}

//------------------------------------------------------------------------------//
// Tauri API 어댑터 (IPC 기반)
//------------------------------------------------------------------------------//
export class TauriApiAdapter implements ApiAdapter {
  //----------------------------------------------------------------------------//
  // Auth - 데스크탑에서는 항상 인증됨!
  //----------------------------------------------------------------------------//
  async checkAuthStatus(): Promise<AuthStatusResponse> {
    // 데스크탑 앱에서는 항상 인증된 상태
    return { isSetup: true, isAuthenticated: true };
  }

  async setupPassword(_data: SetupPasswordRequest): Promise<SetupPasswordResponse> {
    // 데스크탑에서는 비밀번호 설정 불필요
    return { success: true };
  }

  async login(_data: LoginRequest): Promise<LoginResponse> {
    // 데스크탑에서는 로그인 불필요
    return { success: true };
  }

  async logout(): Promise<LogoutResponse> {
    // 데스크탑에서는 로그아웃 불필요
    return { success: true };
  }

  //----------------------------------------------------------------------------//
  // Notes - Rust 백엔드와 IPC 통신
  //----------------------------------------------------------------------------//
  async listNotes(params?: ListNotesParams): Promise<ListNotesResponse> {
    return invoke('list_notes', { params: params ?? {} });
  }

  async getNoteById(id: number): Promise<GetNoteResponse> {
    return invoke('get_note_by_id', { id });
  }

  async createNote(data: CreateNoteRequest): Promise<CreateNoteResponse> {
    return invoke('create_note', { data });
  }

  async updateNote(id: number, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
    return invoke('update_note', { id, data });
  }

  async deleteNote(id: number): Promise<DeleteNoteResponse> {
    return invoke('delete_note', { id });
  }

  async listTags(): Promise<ListTagsResponse> {
    return invoke('list_tags');
  }
}

