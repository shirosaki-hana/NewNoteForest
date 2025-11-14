import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useDialogStore } from '../stores/dialogStore';

//------------------------------------------------------------------------------//
// 공용 확인 다이얼로그 컴포넌트
//------------------------------------------------------------------------------//
export default function ConfirmDialog() {
  const { isOpen, title, message, confirmText, cancelText, handleConfirm, handleCancel } = useDialogStore();

  return (
    <Dialog open={isOpen} onClose={handleCancel} aria-labelledby='confirm-dialog-title' aria-describedby='confirm-dialog-description'>
      <DialogTitle id='confirm-dialog-title'>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id='confirm-dialog-description'>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color='inherit'>
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color='primary' variant='contained' autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
