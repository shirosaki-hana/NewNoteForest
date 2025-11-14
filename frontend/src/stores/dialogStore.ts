import { create } from 'zustand';

//------------------------------------------------------------------------------//
// 다이얼로그 스토어 State
//------------------------------------------------------------------------------//
interface DialogStoreState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  
  // Actions
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

//------------------------------------------------------------------------------//
// 다이얼로그 옵션
//------------------------------------------------------------------------------//
export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

//------------------------------------------------------------------------------//
// 다이얼로그 스토어
//------------------------------------------------------------------------------//
export const useDialogStore = create<DialogStoreState>((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,
  
  //----------------------------------------------------------------------------//
  // 다이얼로그 열기
  //----------------------------------------------------------------------------//
  openDialog: (options: DialogOptions) => {
    set({
      isOpen: true,
      title: options.title || 'Confirm',
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 다이얼로그 닫기
  //----------------------------------------------------------------------------//
  closeDialog: () => {
    set({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null,
    });
  },
  
  //----------------------------------------------------------------------------//
  // 확인 핸들러
  //----------------------------------------------------------------------------//
  handleConfirm: () => {
    const { onConfirm } = get();
    if (onConfirm) {
      onConfirm();
    }
    get().closeDialog();
  },
  
  //----------------------------------------------------------------------------//
  // 취소 핸들러
  //----------------------------------------------------------------------------//
  handleCancel: () => {
    const { onCancel } = get();
    if (onCancel) {
      onCancel();
    }
    get().closeDialog();
  },
}));

