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
