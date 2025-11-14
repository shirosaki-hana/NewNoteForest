import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'ko' | 'en';

interface SettingsState {
  // UI 상태
  isOpen: boolean;
  
  // 테마 설정
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark'; // 실제 적용되는 테마 (system 모드 시 OS 설정 반영)
  
  // 언어 설정
  language: Language;
  
  // Actions
  openSettings: () => void;
  closeSettings: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  updateEffectiveTheme: () => void;
  setLanguage: (lang: Language) => void;
}

// 시스템 다크모드 감지
const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 실제 적용될 테마 계산
const calculateEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  return mode === 'system' ? getSystemTheme() : mode;
};

// 초기 테마 가져오기 (기존 localStorage 마이그레이션 포함)
const getInitialTheme = (): ThemeMode => {
  // 기존 localStorage의 'theme' 키에서 마이그레이션
  const oldTheme = localStorage.getItem('theme');
  if (oldTheme && ['light', 'dark', 'system'].includes(oldTheme)) {
    return oldTheme as ThemeMode;
  }
  return 'system';
};

// 초기 언어 가져오기 (기존 localStorage 마이그레이션 포함)
const getInitialLanguage = (): Language => {
  // 기존 localStorage의 'language' 키에서 마이그레이션
  const oldLanguage = localStorage.getItem('language');
  if (oldLanguage && ['ko', 'en'].includes(oldLanguage)) {
    return oldLanguage as Language;
  }
  
  // 브라우저 언어 감지
  const browserLang = navigator.language.split('-')[0];
  return ['ko', 'en'].includes(browserLang) ? (browserLang as Language) : 'en';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => {
      // 시스템 테마 변경 감지
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        const currentMode = get().themeMode;
        if (currentMode === 'system') {
          set({ effectiveTheme: getSystemTheme() });
        }
      });

      return {
        // UI 상태 (persist 하지 않음)
        isOpen: false,

        // 테마 설정 (persist) - 기본값만 설정, 실제 값은 onRehydrateStorage에서 처리
        themeMode: 'system',
        effectiveTheme: getSystemTheme(),

        // 언어 설정 (persist) - 기본값만 설정, 실제 값은 onRehydrateStorage에서 처리
        language: 'en',

        // Actions
        openSettings: () => set({ isOpen: true }),
        closeSettings: () => set({ isOpen: false }),

        setThemeMode: (mode: ThemeMode) => {
          set({
            themeMode: mode,
            effectiveTheme: calculateEffectiveTheme(mode),
          });
        },

        updateEffectiveTheme: () => {
          const currentMode = get().themeMode;
          set({ effectiveTheme: calculateEffectiveTheme(currentMode) });
        },

        setLanguage: (lang: Language) => {
          i18n.changeLanguage(lang);
          set({ language: lang });
        },
      };
    },
    {
      name: 'settings',
      partialize: state => ({
        themeMode: state.themeMode,
        language: state.language,
      }),
      onRehydrateStorage: () => state => {
        if (!state) return;

        // 기존 localStorage에서 마이그레이션 (persist에 저장된 값이 없는 경우에만)
        const persistedSettings = localStorage.getItem('settings');
        
        if (!persistedSettings) {
          // persist된 데이터가 없으면 기존 localStorage에서 가져오기
          const migratedTheme = getInitialTheme();
          const migratedLanguage = getInitialLanguage();
          
          state.themeMode = migratedTheme;
          state.effectiveTheme = calculateEffectiveTheme(migratedTheme);
          state.language = migratedLanguage;
          
          // 기존 localStorage 키 정리
          localStorage.removeItem('theme');
          localStorage.removeItem('language');
        } else {
          // persist된 데이터가 있으면 effectiveTheme만 재계산
          state.effectiveTheme = calculateEffectiveTheme(state.themeMode);
        }
        
        // i18n 동기화
        i18n.changeLanguage(state.language);
      },
    }
  )
);
