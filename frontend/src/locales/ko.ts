export default {
  translation: {
    // Common
    common: {
      appName: 'NoteForest',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      cancel: '취소',
      save: '저장',
      close: '닫기',
    },

    // Auth
    auth: {
      setup: {
        title: '비밀번호 설정',
        subtitle: '시작하려면 관리자 비밀번호를 설정하세요',
        password: '비밀번호',
        confirmPassword: '비밀번호 확인',
        passwordHelper: '8자 이상, 영문과 숫자 포함',
        submit: '비밀번호 설정',
        submitting: '설정 중...',
        passwordMismatch: '비밀번호가 일치하지 않습니다',
        invalidFormat: '비밀번호 형식이 올바르지 않습니다',
      },
      login: {
        title: '로그인',
        subtitle: '로그인하여 계속하세요',
        password: '비밀번호',
        submit: '로그인',
        submitting: '로그인 중...',
      },
      logout: '로그아웃',
    },

    // Settings
    settings: {
      title: '설정',
      theme: {
        title: '테마',
        light: '라이트',
        dark: '다크',
        system: '시스템',
      },
      language: {
        title: '언어',
        ko: '한국어',
        en: 'English',
      },
    },
    // Note
    note: {
      unsavedChanges: {
        title: '저장되지 않은 변경사항',
        message: '저장하지 않은 변경사항이 있습니다. 정말로 닫으시겠습니까?',
        confirm: '닫기',
        cancel: '취소',
      },
      editor: {
        selectNote: '편집할 노트를 선택하세요',
        createNewNote: '또는 사이드바에서 새 노트를 만드세요',
        noteTitle: '노트 제목',
        lastUpdated: '마지막 업데이트',
        saveShortcut: '저장 (Ctrl+S)',
        deleteNote: '노트 삭제',
        viewMode: '읽기 모드',
        editMode: '편집 모드',
        toggleViewMode: '읽기 모드로 전환',
        toggleEditMode: '편집 모드로 전환',
        deleteDialog: {
          title: '노트 삭제',
          message: '이 노트를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.',
          confirm: '삭제',
          cancel: '취소',
        },
        tag: {
          add: '태그 추가',
          tagName: '태그 이름',
          addButton: '추가',
          cancelButton: '취소',
        },
        messages: {
          titleUpdateFailed: '제목 업데이트에 실패했습니다',
          tagAdded: '태그가 추가되었습니다',
          tagAddFailed: '태그 추가에 실패했습니다',
          tagRemoveFailed: '태그 제거에 실패했습니다',
          noteDeleted: '노트가 삭제되었습니다',
          noteDeleteFailed: '노트 삭제에 실패했습니다',
        },
      },
      sidebar: {
        searchPlaceholder: '노트 검색...',
        notesTab: '노트',
        tagsTab: '태그',
        untitled: '제목 없음',
        noNotesFound: '노트를 찾을 수 없습니다',
        noNotesYet: '아직 노트가 없습니다. 하나 만들어보세요!',
        noTagsYet: '아직 태그가 없습니다',
        loading: '로딩 중...',
        loadMore: '더 보기 ({{current}}/{{total}})',
        settings: '설정',
        logout: '로그아웃',
      },
      tabBar: {
        untitled: '제목 없음',
      },
      store: {
        loadNotesFailed: '노트 목록을 불러오는데 실패했습니다',
        loadTagsFailed: '태그 목록을 불러오는데 실패했습니다',
        loadNoteFailed: '노트를 불러오는데 실패했습니다',
        noteSaved: '노트가 저장되었습니다',
        saveNoteFailed: '노트 저장에 실패했습니다',
        noteCreated: '노트가 생성되었습니다',
        createNoteFailed: '노트 생성에 실패했습니다',
        deleteNoteFailed: '노트 삭제에 실패했습니다',
      },
    },

    // Errors
    errors: {
      statusCheckFailed: '상태 확인에 실패했습니다',
      setupFailed: '비밀번호 설정에 실패했습니다',
      loginFailed: '로그인에 실패했습니다',
      logoutFailed: '로그아웃에 실패했습니다',
      network: '네트워크 오류',
      unknown: '알 수 없는 오류가 발생했습니다',
    },
  },
};
