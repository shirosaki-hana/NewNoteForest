import type { 
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteResponse,
  GetNoteResponse,
  ListNotesResponse,
  ListTagsResponse,
} from '@noteforest/types';
import { apiClient } from './client';

//------------------------------------------------------------------------------//
// 노트 목록 조회
//------------------------------------------------------------------------------//
export interface ListNotesParams {
  search?: string;
  tagIds?: number[];
  limit?: number;
  offset?: number;
}

export async function listNotes(params?: ListNotesParams): Promise<ListNotesResponse> {
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

//------------------------------------------------------------------------------//
// 노트 단일 조회
//------------------------------------------------------------------------------//
export async function getNoteById(id: number): Promise<GetNoteResponse> {
  const response = await apiClient.get<GetNoteResponse>(`/notes/${id}`);
  return response.data;
}

//------------------------------------------------------------------------------//
// 노트 생성
//------------------------------------------------------------------------------//
export async function createNote(data: CreateNoteRequest): Promise<CreateNoteResponse> {
  const response = await apiClient.post<CreateNoteResponse>('/notes', data);
  return response.data;
}

//------------------------------------------------------------------------------//
// 노트 수정
//------------------------------------------------------------------------------//
export async function updateNote(id: number, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
  const response = await apiClient.patch<UpdateNoteResponse>(`/notes/${id}`, data);
  return response.data;
}

//------------------------------------------------------------------------------//
// 노트 삭제
//------------------------------------------------------------------------------//
export async function deleteNote(id: number): Promise<DeleteNoteResponse> {
  const response = await apiClient.delete<DeleteNoteResponse>(`/notes/${id}`);
  return response.data;
}

//------------------------------------------------------------------------------//
// 태그 목록 조회
//------------------------------------------------------------------------------//
export async function listTags(): Promise<ListTagsResponse> {
  const response = await apiClient.get<ListTagsResponse>('/notes/tags/all');
  return response.data;
}

