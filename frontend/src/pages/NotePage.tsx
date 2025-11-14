import { Box, useTheme, useMediaQuery } from '@mui/material';
import NoteSidebar from '../components/NoteSidebar';
import NoteTabBar from '../components/NoteTabBar';
import NoteEditor from '../components/NoteEditor';
import SettingsDialog from '../components/SettingsDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import GlobalSnackbar from '../components/GlobalSnackbar';
import { useNoteStore } from '../stores/noteStore';

//------------------------------------------------------------------------------//
// 노트 페이지 컴포넌트
//------------------------------------------------------------------------------//
export default function NotePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useNoteStore();

  //----------------------------------------------------------------------------//
  // 사이드바 제어
  //----------------------------------------------------------------------------//
  const handleSidebarToggle = () => {
    toggleSidebar();
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  //----------------------------------------------------------------------------//
  // 렌더링
  //----------------------------------------------------------------------------//
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 사이드바 */}
      <NoteSidebar open={isSidebarOpen} onClose={handleSidebarClose} variant={isMobile ? 'temporary' : 'permanent'} />

      {/* 메인 컨텐츠 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ml: isMobile ? 0 : isSidebarOpen ? 0 : '-280px',
          transition: 'margin-left 0.2s',
        }}
      >
        {/* 탭 바 */}
        <NoteTabBar onMenuClick={handleSidebarToggle} />

        {/* 에디터 */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <NoteEditor />
        </Box>
      </Box>

      {/* 설정 다이얼로그 */}
      <SettingsDialog />

      {/* 공용 확인 다이얼로그 */}
      <ConfirmDialog />

      {/* 글로벌 스낵바 */}
      <GlobalSnackbar />
    </Box>
  );
}
