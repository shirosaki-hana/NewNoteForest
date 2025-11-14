import { type FastifyPluginAsync } from 'fastify';
import {
  CreateNoteRequestSchema,
  CreateNoteResponseSchema,
  UpdateNoteRequestSchema,
  UpdateNoteResponseSchema,
  DeleteNoteResponseSchema,
  GetNoteResponseSchema,
  ListNotesResponseSchema,
  ListTagsResponseSchema,
} from '@noteforest/types';
import { createNote, getNoteById, updateNote, deleteNote, listNotes, listTags } from '../services/index.js';
import { requireAuth } from '../middleware/index.js';
//------------------------------------------------------------------------------//

// 쿼리 파라미터 타입 정의
interface ListNotesQuerystring {
  search?: string;
  tagIds?: string; // JSON 문자열로 전달됨
  limit?: string;
  offset?: string;
}

interface NoteIdParams {
  id: string;
}

export const noteRoutes: FastifyPluginAsync = async fastify => {
  // 인증 미들웨어 적용
  fastify.addHook('onRequest', requireAuth);

  // 노트 목록 조회 (검색, 태그 필터링, 페이지네이션)
  fastify.get<{ Querystring: ListNotesQuerystring }>('/', async (request, reply) => {
    const { search, tagIds, limit, offset } = request.query;

    const query = {
      search,
      tagIds: tagIds ? JSON.parse(tagIds) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };

    const result = await listNotes(query);
    return reply.send(ListNotesResponseSchema.parse(result));
  });

  // 노트 생성
  fastify.post('/', async (request, reply) => {
    const body = CreateNoteRequestSchema.parse(request.body);
    const note = await createNote(body);
    return reply.status(201).send(CreateNoteResponseSchema.parse({ note }));
  });

  // 노트 단일 조회
  fastify.get<{ Params: NoteIdParams }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const note = await getNoteById(Number(id));
    return reply.send(GetNoteResponseSchema.parse({ note }));
  });

  // 노트 수정
  fastify.patch<{ Params: NoteIdParams }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const body = UpdateNoteRequestSchema.parse(request.body);
    const note = await updateNote(Number(id), body);
    return reply.send(UpdateNoteResponseSchema.parse({ note }));
  });

  // 노트 삭제
  fastify.delete<{ Params: NoteIdParams }>('/:id', async (request, reply) => {
    const { id } = request.params;
    await deleteNote(Number(id));
    return reply.send(DeleteNoteResponseSchema.parse({ success: true }));
  });

  // 태그 목록 조회
  fastify.get('/tags/all', async (request, reply) => {
    const tags = await listTags();
    return reply.send(ListTagsResponseSchema.parse({ tags }));
  });
};
