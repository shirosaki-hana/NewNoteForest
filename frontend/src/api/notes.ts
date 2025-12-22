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
import { getApiAdapter } from './adapter';

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
  return getApiAdapter().listNotes(params);
}

//------------------------------------------------------------------------------//
// 노트 단일 조회
//------------------------------------------------------------------------------//
export async function getNoteById(id: number): Promise<GetNoteResponse> {
  return getApiAdapter().getNoteById(id);
}

//------------------------------------------------------------------------------//
// 노트 생성
//------------------------------------------------------------------------------//
export async function createNote(data: CreateNoteRequest): Promise<CreateNoteResponse> {
  return getApiAdapter().createNote(data);
}

//------------------------------------------------------------------------------//
// 노트 수정
//------------------------------------------------------------------------------//
export async function updateNote(id: number, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
  return getApiAdapter().updateNote(id, data);
}

//------------------------------------------------------------------------------//
// 노트 삭제
//------------------------------------------------------------------------------//
export async function deleteNote(id: number): Promise<DeleteNoteResponse> {
  return getApiAdapter().deleteNote(id);
}

//------------------------------------------------------------------------------//
// 태그 목록 조회
//------------------------------------------------------------------------------//
export async function listTags(): Promise<ListTagsResponse> {
  return getApiAdapter().listTags();
}
