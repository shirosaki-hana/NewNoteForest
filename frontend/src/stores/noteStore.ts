import { create } from 'zustand';
import type { Note, Tag } from '@noteforest/types';
import * as noteApi from '../api/notes';

//------------------------------------------------------------------------------//
// 탭 인터페이스
//------------------------------------------------------------------------------//
export interface NoteTab {
  id: number;
  title: string;
  isDirty: boolean; // 수정되었지만 저장되지 않음
  isActive: boolean;
}

//------------------------------------------------------------------------------//
// 노트 스토어 State
//------------------------------------------------------------------------------//
interface NoteStoreState {
  // 노트 리스트
  notes: Note[];
  total: number;
  isLoadingNotes: boolean;

  // 태그 리스트
  tags: Tag[];
  isLoadingTags: boolean;

  // 필터 및 검색
  searchQuery: string;
  selectedTagIds: number[];
  limit: number;
  offset: number;

  // 열린 탭들
  tabs: NoteTab[];
  activeTabId: number | null;

  // 현재 편집 중인 노트
  currentNote: Note | null;
  currentNoteContent: string;
  isLoadingNote: boolean;
  isSaving: boolean;

  // 사이드바 (모바일)
  isSidebarOpen: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  loadTags: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedTagIds: (tagIds: number[]) => void;
  setOffset: (offset: number) => void;

  openNoteInTab: (noteId: number) => Promise<void>;
  closeTab: (tabId: number) => void;
  setActiveTab: (tabId: number) => void;

  loadNoteContent: (noteId: number) => Promise<void>;
  setCurrentNoteContent: (content: string) => void;
  saveCurrentNote: () => Promise<void>;

  createNewNote: () => Promise<void>;
  deleteCurrentNote: () => Promise<void>;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  reset: () => void;
}

//------------------------------------------------------------------------------//
// 초기 상태
//------------------------------------------------------------------------------//
const initialState = {
  notes: [],
  total: 0,
  isLoadingNotes: false,
  tags: [],
  isLoadingTags: false,
  searchQuery: '',
  selectedTagIds: [],
  limit: 50,
  offset: 0,
  tabs: [],
  activeTabId: null,
  currentNote: null,
  currentNoteContent: '',
  isLoadingNote: false,
  isSaving: false,
  isSidebarOpen: true,
};

//------------------------------------------------------------------------------//
// 노트 스토어
//------------------------------------------------------------------------------//
export const useNoteStore = create<NoteStoreState>((set, get) => ({
  ...initialState,

  //----------------------------------------------------------------------------//
  // 노트 목록 로드
  //----------------------------------------------------------------------------//
  loadNotes: async () => {
    set({ isLoadingNotes: true });
    try {
      const { searchQuery, selectedTagIds, limit, offset } = get();
      const params = {
        search: searchQuery || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        limit,
        offset,
      };
      const response = await noteApi.listNotes(params);
      set({ notes: response.notes, total: response.total, isLoadingNotes: false });
    } catch {
      set({ isLoadingNotes: false });
      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showError('Failed to load notes');
    }
  },

  //----------------------------------------------------------------------------//
  // 태그 목록 로드
  //----------------------------------------------------------------------------//
  loadTags: async () => {
    set({ isLoadingTags: true });
    try {
      const response = await noteApi.listTags();
      set({ tags: response.tags, isLoadingTags: false });
    } catch {
      set({ isLoadingTags: false });
      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showError('Failed to load tags');
    }
  },

  //----------------------------------------------------------------------------//
  // 검색 및 필터 설정
  //----------------------------------------------------------------------------//
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, offset: 0 });
    get().loadNotes();
  },

  setSelectedTagIds: (tagIds: number[]) => {
    set({ selectedTagIds: tagIds, offset: 0 });
    get().loadNotes();
  },

  setOffset: (offset: number) => {
    set({ offset });
    get().loadNotes();
  },

  //----------------------------------------------------------------------------//
  // 탭 관리
  //----------------------------------------------------------------------------//
  openNoteInTab: async (noteId: number) => {
    const { tabs, activeTabId } = get();

    // 이미 열려있는 탭인지 확인
    const existingTab = tabs.find(tab => tab.id === noteId);
    if (existingTab) {
      set({
        tabs: tabs.map(tab => ({ ...tab, isActive: tab.id === noteId })),
        activeTabId: noteId,
      });
      await get().loadNoteContent(noteId);
      return;
    }

    // 현재 활성 탭의 변경사항 확인
    if (activeTabId !== null) {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (activeTab?.isDirty) {
        // TODO: 저장 확인 다이얼로그 표시
        // 지금은 자동 저장
        await get().saveCurrentNote();
      }
    }

    // 새 탭 추가
    const note = get().notes.find(n => n.id === noteId);
    if (!note) {
      await get().loadNoteContent(noteId);
      return;
    }

    const newTab: NoteTab = {
      id: noteId,
      title: note.title,
      isDirty: false,
      isActive: true,
    };

    set({
      tabs: [...tabs.map(tab => ({ ...tab, isActive: false })), newTab],
      activeTabId: noteId,
    });

    await get().loadNoteContent(noteId);
  },

  closeTab: (tabId: number) => {
    const { tabs, activeTabId } = get();
    const closingTab = tabs.find(tab => tab.id === tabId);

    if (closingTab?.isDirty) {
      // TODO: 저장 확인 다이얼로그
      // 지금은 그냥 닫음
    }

    const newTabs = tabs.filter(tab => tab.id !== tabId);

    // 닫는 탭이 활성 탭이면 다른 탭을 활성화
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[newTabs.length - 1];
        set({
          tabs: newTabs.map(tab => ({ ...tab, isActive: tab.id === newActiveTab.id })),
          activeTabId: newActiveTab.id,
        });
        get().loadNoteContent(newActiveTab.id);
      } else {
        set({
          tabs: [],
          activeTabId: null,
          currentNote: null,
          currentNoteContent: '',
        });
      }
    } else {
      set({ tabs: newTabs });
    }
  },

  setActiveTab: (tabId: number) => {
    const { tabs, activeTabId } = get();

    if (activeTabId === tabId) return;

    // 현재 활성 탭의 변경사항 확인
    if (activeTabId !== null) {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (activeTab?.isDirty) {
        // TODO: 저장 확인 다이얼로그
        // 지금은 자동 저장
        get().saveCurrentNote();
      }
    }

    set({
      tabs: tabs.map(tab => ({ ...tab, isActive: tab.id === tabId })),
      activeTabId: tabId,
    });

    get().loadNoteContent(tabId);
  },

  //----------------------------------------------------------------------------//
  // 노트 컨텐츠 관리
  //----------------------------------------------------------------------------//
  loadNoteContent: async (noteId: number) => {
    set({ isLoadingNote: true });
    try {
      const response = await noteApi.getNoteById(noteId);
      set({
        currentNote: response.note,
        currentNoteContent: response.note.content,
        isLoadingNote: false,
      });
    } catch {
      set({ isLoadingNote: false });
      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showError('Failed to load note');
    }
  },

  setCurrentNoteContent: (content: string) => {
    const { currentNote, tabs, activeTabId } = get();
    if (!currentNote) return;

    const isDirty = content !== currentNote.content;

    set({
      currentNoteContent: content,
      tabs: tabs.map(tab => (tab.id === activeTabId ? { ...tab, isDirty } : tab)),
    });
  },

  saveCurrentNote: async () => {
    const { currentNote, currentNoteContent, tabs, activeTabId } = get();
    if (!currentNote) return;

    set({ isSaving: true });
    try {
      const response = await noteApi.updateNote(currentNote.id, {
        content: currentNoteContent,
      });

      set({
        currentNote: response.note,
        currentNoteContent: response.note.content,
        tabs: tabs.map(tab => (tab.id === activeTabId ? { ...tab, isDirty: false } : tab)),
        isSaving: false,
      });

      // 노트 리스트 갱신
      get().loadNotes();

      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showSuccess('Note saved successfully');
    } catch {
      set({ isSaving: false });
      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showError('Failed to save note');
    }
  },

  //----------------------------------------------------------------------------//
  // 노트 생성/삭제
  //----------------------------------------------------------------------------//
  createNewNote: async () => {
    try {
      const response = await noteApi.createNote({
        title: 'New Note',
        content: '',
        tagNames: [],
      });

      // 노트 리스트 갱신
      await get().loadNotes();

      // 새 노트를 탭에서 열기
      await get().openNoteInTab(response.note.id);

      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showSuccess('Note created successfully');
    } catch {
      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showError('Failed to create note');
    }
  },

  deleteCurrentNote: async () => {
    const { currentNote, activeTabId } = get();
    if (!currentNote) return;

    try {
      await noteApi.deleteNote(currentNote.id);

      // 탭 닫기
      if (activeTabId !== null) {
        get().closeTab(activeTabId);
      }

      // 노트 리스트 갱신
      get().loadNotes();
    } catch (error) {
      const { useSnackbarStore } = await import('./snackbarStore');
      useSnackbarStore.getState().showError('Failed to delete note');
      throw error; // NoteEditor에서 캐치할 수 있도록 rethrow
    }
  },

  //----------------------------------------------------------------------------//
  // 사이드바 토글
  //----------------------------------------------------------------------------//
  toggleSidebar: () => {
    set({ isSidebarOpen: !get().isSidebarOpen });
  },

  setSidebarOpen: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  //----------------------------------------------------------------------------//
  // 리셋
  //----------------------------------------------------------------------------//
  reset: () => {
    set(initialState);
  },
}));
