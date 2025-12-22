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
  AuthStatusResponseSchema,
  SetupPasswordResponseSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
} from '@noteforest/types';
import { z } from 'zod';
import type { ApiAdapter } from '../adapter';
import type { ListNotesParams } from '../notes';
import { apiClient } from '../client';

//------------------------------------------------------------------------------//
// Zod 검증 헬퍼
//------------------------------------------------------------------------------//
function validateResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

//------------------------------------------------------------------------------//
// 웹 API 어댑터 (기존 axios 기반)
//------------------------------------------------------------------------------//
export class WebApiAdapter implements ApiAdapter {
  //----------------------------------------------------------------------------//
  // Auth
  //----------------------------------------------------------------------------//
  async checkAuthStatus(): Promise<AuthStatusResponse> {
    const { AuthStatusResponseSchema } = await import('@noteforest/types');
    const response = await apiClient.get('/auth/status');
    return validateResponse(AuthStatusResponseSchema, response.data);
  }

  async setupPassword(data: SetupPasswordRequest): Promise<SetupPasswordResponse> {
    const { SetupPasswordResponseSchema } = await import('@noteforest/types');
    const response = await apiClient.post('/auth/setup', data);
    return validateResponse(SetupPasswordResponseSchema, response.data);
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const { LoginResponseSchema } = await import('@noteforest/types');
    const response = await apiClient.post('/auth/login', data);
    return validateResponse(LoginResponseSchema, response.data);
  }

  async logout(): Promise<LogoutResponse> {
    const { LogoutResponseSchema } = await import('@noteforest/types');
    const response = await apiClient.post('/auth/logout');
    return validateResponse(LogoutResponseSchema, response.data);
  }

  //----------------------------------------------------------------------------//
  // Notes
  //----------------------------------------------------------------------------//
  async listNotes(params?: ListNotesParams): Promise<ListNotesResponse> {
    const queryParams = new URLSearchParams();

    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.tagIds && params.tagIds.length > 0) {
      queryParams.append('tagIds', JSON.stringify(params.tagIds));
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }

    const query = queryParams.toString();
    const url = query ? `/notes?${query}` : '/notes';
    const response = await apiClient.get<ListNotesResponse>(url);
    return response.data;
  }

  async getNoteById(id: number): Promise<GetNoteResponse> {
    const response = await apiClient.get<GetNoteResponse>(`/notes/${id}`);
    return response.data;
  }

  async createNote(data: CreateNoteRequest): Promise<CreateNoteResponse> {
    const response = await apiClient.post<CreateNoteResponse>('/notes', data);
    return response.data;
  }

  async updateNote(id: number, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
    const response = await apiClient.patch<UpdateNoteResponse>(`/notes/${id}`, data);
    return response.data;
  }

  async deleteNote(id: number): Promise<DeleteNoteResponse> {
    const response = await apiClient.delete<DeleteNoteResponse>(`/notes/${id}`);
    return response.data;
  }

  async listTags(): Promise<ListTagsResponse> {
    const response = await apiClient.get<ListTagsResponse>('/notes/tags/all');
    return response.data;
  }
}

