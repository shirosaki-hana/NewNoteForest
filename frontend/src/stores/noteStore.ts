import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, Tag } from '@noteforest/types';
import * as noteApi from '../api/notes';
import { useSnackbarStore } from './snackbarStore';
import { useDialogStore } from './dialogStore';
import i18n from '../i18n';

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
  updateCurrentNote: (note: Note) => void;
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
// 헬퍼 함수: 탭 강제 닫기 (확인 다이얼로그 없이)
//------------------------------------------------------------------------------//
const forceCloseTab = (tabId: number, set: (partial: Partial<NoteStoreState>) => void, get: () => NoteStoreState) => {
  const { tabs, activeTabId } = get();
  const newTabs = tabs.filter((tab: NoteTab) => tab.id !== tabId);

  // 닫는 탭이 활성 탭이면 다른 탭을 활성화
  if (activeTabId === tabId) {
    if (newTabs.length > 0) {
      const newActiveTab = newTabs[newTabs.length - 1];
      set({
        tabs: newTabs.map((tab: NoteTab) => ({ ...tab, isActive: tab.id === newActiveTab.id })),
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
};

//------------------------------------------------------------------------------//
// 노트 스토어
//------------------------------------------------------------------------------//
export const useNoteStore = create<NoteStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      //----------------------------------------------------------------------------//
      // 노트 목록 로드
      //----------------------------------------------------------------------------//
      loadNotes: async () => {
        set({ isLoadingNotes: true });
        try {
          const { searchQuery, selectedTagIds, limit, offset, notes } = get();
          const params = {
            search: searchQuery || undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            limit,
            offset,
          };
          const response = await noteApi.listNotes(params);

          // offset이 0이면 새로 로드 (검색/필터 변경 시)
          // offset이 0보다 크면 기존 노트에 추가 (무한 스크롤)
          const newNotes = offset === 0 ? response.notes : [...notes, ...response.notes];

          set({ notes: newNotes, total: response.total, isLoadingNotes: false });
        } catch {
          set({ isLoadingNotes: false });
          useSnackbarStore.getState().showError(i18n.t('note.store.loadNotesFailed'));
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
          useSnackbarStore.getState().showError(i18n.t('note.store.loadTagsFailed'));
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
        const { tabs } = get();
        const closingTab = tabs.find(tab => tab.id === tabId);

        // 저장되지 않은 변경사항이 있는 경우 확인 다이얼로그 표시
        if (closingTab?.isDirty) {
          useDialogStore.getState().openDialog({
            title: i18n.t('note.unsavedChanges.title'),
            message: i18n.t('note.unsavedChanges.message'),
            confirmText: i18n.t('note.unsavedChanges.confirm'),
            cancelText: i18n.t('note.unsavedChanges.cancel'),
            onConfirm: () => {
              // 확인 시 강제로 탭 닫기
              forceCloseTab(tabId, set, get);
            },
          });
          return;
        }

        // 저장된 상태면 바로 닫기
        forceCloseTab(tabId, set, get);
      },

      setActiveTab: (tabId: number) => {
        const { tabs, activeTabId } = get();

        if (activeTabId === tabId) return;

        // 현재 활성 탭의 변경사항 확인
        if (activeTabId !== null) {
          const activeTab = tabs.find(tab => tab.id === activeTabId);
          if (activeTab?.isDirty) {
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
          useSnackbarStore.getState().showError(i18n.t('note.store.loadNoteFailed'));
        }
      },

      updateCurrentNote: (note: Note) => {
        const { tabs } = get();
        set({
          currentNote: note,
          tabs: tabs.map(tab => (tab.id === note.id ? { ...tab, title: note.title } : tab)),
        });
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

          useSnackbarStore.getState().showSuccess(i18n.t('note.store.noteSaved'));
        } catch {
          set({ isSaving: false });
          useSnackbarStore.getState().showError(i18n.t('note.store.saveNoteFailed'));
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

          useSnackbarStore.getState().showSuccess(i18n.t('note.store.noteCreated'));
        } catch {
          useSnackbarStore.getState().showError(i18n.t('note.store.createNoteFailed'));
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
          useSnackbarStore.getState().showError(i18n.t('note.store.deleteNoteFailed'));
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
    }),
    {
      name: 'note-store',
      partialize: state => ({
        // 편집 중인 탭과 내용 저장
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        currentNoteContent: state.currentNoteContent,

        // 필터와 UI 상태 저장
        searchQuery: state.searchQuery,
        selectedTagIds: state.selectedTagIds,
        isSidebarOpen: state.isSidebarOpen,
      }),
      onRehydrateStorage: () => async state => {
        if (!state) return;

        // 복원 후 서버 데이터 다시 로드
        try {
          // 노트 목록과 태그 로드
          await state.loadNotes();
          await state.loadTags();

          // 활성 탭이 있으면 해당 노트 로드
          if (state.activeTabId !== null) {
            await state.loadNoteContent(state.activeTabId);

            // 복원된 content와 서버의 content 비교하여 isDirty 상태 업데이트
            const restoredContent = state.currentNoteContent;
            const serverContent = state.currentNote?.content || '';

            if (restoredContent !== serverContent) {
              // 로컬에 저장된 편집 내용이 서버와 다르면 isDirty로 표시
              state.tabs = state.tabs.map(tab => (tab.id === state.activeTabId ? { ...tab, isDirty: true } : tab));

              // 복원된 컨텐츠를 유지
              state.currentNoteContent = restoredContent;
            }
          }
        } catch {
          // 복원 실패 시 조용히 넘어감
        }
      },
    }
  )
);
