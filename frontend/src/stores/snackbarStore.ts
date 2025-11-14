import { create } from 'zustand';

//------------------------------------------------------------------------------//
// 스낵바 타입
//------------------------------------------------------------------------------//
export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

//------------------------------------------------------------------------------//
// 스낵바 스토어 State
//------------------------------------------------------------------------------//
interface SnackbarStoreState {
  isOpen: boolean;
  message: string;
  severity: SnackbarSeverity;
  autoHideDuration: number;
  
  // Actions
  showSnackbar: (message: string, severity?: SnackbarSeverity, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  closeSnackbar: () => void;
}

//------------------------------------------------------------------------------//
// 스낵바 스토어
//------------------------------------------------------------------------------//
export const useSnackbarStore = create<SnackbarStoreState>((set) => ({
  isOpen: false,
  message: '',
  severity: 'info',
  autoHideDuration: 5000,
  
  //----------------------------------------------------------------------------//
  // 스낵바 표시
  //----------------------------------------------------------------------------//
  showSnackbar: (message: string, severity: SnackbarSeverity = 'info', duration: number = 5000) => {
    set({
      isOpen: true,
      message,
      severity,
      autoHideDuration: duration,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 성공 메시지
  //----------------------------------------------------------------------------//
  showSuccess: (message: string) => {
    set({
      isOpen: true,
      message,
      severity: 'success',
      autoHideDuration: 3000,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 에러 메시지
  //----------------------------------------------------------------------------//
  showError: (message: string) => {
    set({
      isOpen: true,
      message,
      severity: 'error',
      autoHideDuration: 6000,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 경고 메시지
  //----------------------------------------------------------------------------//
  showWarning: (message: string) => {
    set({
      isOpen: true,
      message,
      severity: 'warning',
      autoHideDuration: 5000,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 정보 메시지
  //----------------------------------------------------------------------------//
  showInfo: (message: string) => {
    set({
      isOpen: true,
      message,
      severity: 'info',
      autoHideDuration: 4000,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 스낵바 닫기
  //----------------------------------------------------------------------------//
  closeSnackbar: () => {
    set({ isOpen: false });
  },
}));

