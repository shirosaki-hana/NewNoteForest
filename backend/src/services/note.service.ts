import { database } from '../database/index.js';
import { CreateNoteRequestSchema, UpdateNoteRequestSchema, ListNotesQuerySchema } from '@noteforest/types';

import type { CreateNoteRequest, UpdateNoteRequest, ListNotesQuery, Note, Tag } from '@noteforest/types';
import type { Note as PrismaNote, Tag as PrismaTag, NoteTag as PrismaNoteTag, Prisma } from '../database/prismaclient/index.js';

//------------------------------------------------------------------------------//
// 헬퍼 함수
//------------------------------------------------------------------------------//

/**
 * Prisma Note 객체를 API Note 형식으로 변환
 */
function toNoteResponse(note: PrismaNote & { noteTags?: Array<PrismaNoteTag & { tag: PrismaTag }> }): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags:
      note.noteTags?.map(nt => ({
        id: nt.tag.id,
        name: nt.tag.name,
      })) || [],
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

/**
 * 태그 이름 배열로 태그 생성 또는 조회 및 노트와 연결
 */
async function syncNoteTags(noteId: number, tagNames: string[]): Promise<void> {
  // 기존 연결 제거
  await database.noteTag.deleteMany({ where: { noteId } });

  if (tagNames.length === 0) {
    return;
  }

  // 태그 생성 또는 조회
  const tags = await Promise.all(
    tagNames.map(async name => {
      const existing = await database.tag.findUnique({ where: { name } });
      if (existing) {
        return existing;
      }
      return database.tag.create({ data: { name } });
    })
  );

  // 노트-태그 연결
  await database.noteTag.createMany({
    data: tags.map(tag => ({ noteId, tagId: tag.id })),
  });
}

//------------------------------------------------------------------------------//
// 노트 CRUD
//------------------------------------------------------------------------------//

/**
 * 노트 생성
 * @throws 유효성 검증 실패 시 에러
 */
export async function createNote(body: unknown): Promise<Note> {
  const { title, content, tagNames } = CreateNoteRequestSchema.parse(body) satisfies CreateNoteRequest;

  const note = await database.note.create({
    data: { title, content },
  });

  if (tagNames && tagNames.length > 0) {
    await syncNoteTags(note.id, tagNames);
  }

  const noteWithTags = await database.note.findUnique({
    where: { id: note.id },
    include: {
      noteTags: {
        include: { tag: true },
      },
    },
  });

  if (!noteWithTags) {
    throw Object.assign(new Error('Note creation failed'), { statusCode: 500 });
  }

  return toNoteResponse(noteWithTags);
}

/**
 * 노트 ID로 조회
 * @throws 노트를 찾을 수 없는 경우 statusCode 404 에러
 */
export async function getNoteById(id: number): Promise<Note> {
  const note = await database.note.findUnique({
    where: { id },
    include: {
      noteTags: {
        include: { tag: true },
      },
    },
  });

  if (!note) {
    throw Object.assign(new Error('Note not found'), { statusCode: 404 });
  }

  return toNoteResponse(note);
}

/**
 * 노트 수정
 * @throws 노트를 찾을 수 없는 경우 statusCode 404 에러
 */
export async function updateNote(id: number, body: unknown): Promise<Note> {
  const updates = UpdateNoteRequestSchema.parse(body) satisfies UpdateNoteRequest;

  // 노트 존재 확인
  const exists = await database.note.findUnique({ where: { id } });
  if (!exists) {
    throw Object.assign(new Error('Note not found'), { statusCode: 404 });
  }

  // 제목, 내용 업데이트
  const updateData: { title?: string; content?: string } = {};
  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content;
  }

  if (Object.keys(updateData).length > 0) {
    await database.note.update({ where: { id }, data: updateData });
  }

  // 태그 업데이트
  if (updates.tagNames !== undefined) {
    await syncNoteTags(id, updates.tagNames);
  }

  return getNoteById(id);
}

/**
 * 노트 삭제
 * @throws 노트를 찾을 수 없는 경우 statusCode 404 에러
 */
export async function deleteNote(id: number): Promise<void> {
  const exists = await database.note.findUnique({ where: { id } });
  if (!exists) {
    throw Object.assign(new Error('Note not found'), { statusCode: 404 });
  }

  await database.note.delete({ where: { id } });
}

/**
 * 노트 목록 조회 (검색, 태그 필터링, 페이지네이션 지원)
 */
export async function listNotes(query: unknown): Promise<{ notes: Note[]; total: number }> {
  const { search, tagIds, limit, offset } = ListNotesQuerySchema.parse(query) satisfies ListNotesQuery;

  const where: Prisma.NoteWhereInput = {};

  // 검색어 필터링 (제목 또는 내용)
  if (search) {
    where.OR = [{ title: { contains: search } }, { content: { contains: search } }];
  }

  // 태그 필터링
  if (tagIds && tagIds.length > 0) {
    where.noteTags = {
      some: {
        tagId: { in: tagIds },
      },
    };
  }

  const [notes, total] = await Promise.all([
    database.note.findMany({
      where,
      include: {
        noteTags: {
          include: { tag: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    database.note.count({ where }),
  ]);

  return {
    notes: notes.map(toNoteResponse),
    total,
  };
}

/**
 * 모든 태그 목록 조회
 */
export async function listTags(): Promise<Tag[]> {
  const tags = await database.tag.findMany({
    orderBy: { name: 'asc' },
  });

  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    createdAt: tag.createdAt.toISOString(),
  }));
}
