import { Snackbar, Alert } from '@mui/material';
import { useSnackbarStore } from '../stores/snackbarStore';

//------------------------------------------------------------------------------//
// 글로벌 스낵바 컴포넌트
//------------------------------------------------------------------------------//
export default function GlobalSnackbar() {
  const { isOpen, message, severity, autoHideDuration, closeSnackbar } = useSnackbarStore();
  
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={closeSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={closeSnackbar}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

