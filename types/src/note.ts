import { z } from 'zod';

//------------------------------------------------------------------------------//
// 기본 스키마
//------------------------------------------------------------------------------//
export const NoteIdSchema = z.number().int().positive();
export const TagIdSchema = z.number().int().positive();

export const NoteSchema = z.object({
  id: NoteIdSchema,
  title: z.string(),
  content: z.string(),
  tags: z.array(z.object({
    id: TagIdSchema,
    name: z.string(),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Note = z.infer<typeof NoteSchema>;

export const TagSchema = z.object({
  id: TagIdSchema,
  name: z.string(),
  createdAt: z.string().datetime(),
});
export type Tag = z.infer<typeof TagSchema>;

//------------------------------------------------------------------------------//
// 노트 생성
//------------------------------------------------------------------------------//
export const CreateNoteRequestSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(255),
  content: z.string(),
  tagNames: z.array(z.string().min(1).max(50)).optional().default([]),
});
export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;

export const CreateNoteResponseSchema = z.object({
  note: NoteSchema,
});
export type CreateNoteResponse = z.infer<typeof CreateNoteResponseSchema>;

//------------------------------------------------------------------------------//
// 노트 수정
//------------------------------------------------------------------------------//
export const UpdateNoteRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  tagNames: z.array(z.string().min(1).max(50)).optional(),
});
export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequestSchema>;

export const UpdateNoteResponseSchema = z.object({
  note: NoteSchema,
});
export type UpdateNoteResponse = z.infer<typeof UpdateNoteResponseSchema>;

//------------------------------------------------------------------------------//
// 노트 삭제
//------------------------------------------------------------------------------//
export const DeleteNoteResponseSchema = z.object({
  success: z.literal(true),
});
export type DeleteNoteResponse = z.infer<typeof DeleteNoteResponseSchema>;

//------------------------------------------------------------------------------//
// 노트 조회
//------------------------------------------------------------------------------//
export const GetNoteResponseSchema = z.object({
  note: NoteSchema,
});
export type GetNoteResponse = z.infer<typeof GetNoteResponseSchema>;

//------------------------------------------------------------------------------//
// 노트 목록 조회
//------------------------------------------------------------------------------//
export const ListNotesQuerySchema = z.object({
  search: z.string().optional(),
  tagIds: z.array(TagIdSchema).optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});
export type ListNotesQuery = z.infer<typeof ListNotesQuerySchema>;

export const ListNotesResponseSchema = z.object({
  notes: z.array(NoteSchema),
  total: z.number().int().nonnegative(),
});
export type ListNotesResponse = z.infer<typeof ListNotesResponseSchema>;

//------------------------------------------------------------------------------//
// 태그 목록 조회
//------------------------------------------------------------------------------//
export const ListTagsResponseSchema = z.object({
  tags: z.array(TagSchema),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>;

