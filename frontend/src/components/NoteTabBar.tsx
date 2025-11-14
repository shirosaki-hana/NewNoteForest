import {
  Box,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Menu as MenuIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useNoteStore } from '../stores/noteStore';

//------------------------------------------------------------------------------//
// Props
//------------------------------------------------------------------------------//
interface NoteTabBarProps {
  onMenuClick?: () => void;
}

//------------------------------------------------------------------------------//
// 탭 바 컴포넌트
//------------------------------------------------------------------------------//
export default function NoteTabBar({ onMenuClick }: NoteTabBarProps) {
  const theme = useTheme();
  const { tabs, setActiveTab, closeTab } = useNoteStore();
  
  //----------------------------------------------------------------------------//
  // 탭 클릭 핸들러
  //----------------------------------------------------------------------------//
  const handleTabClick = (tabId: number) => {
    setActiveTab(tabId);
  };
  
  //----------------------------------------------------------------------------//
  // 탭 닫기 핸들러
  //----------------------------------------------------------------------------//
  const handleCloseTab = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    closeTab(tabId);
  };
  
  //----------------------------------------------------------------------------//
  // 렌더링
  //----------------------------------------------------------------------------//
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 40,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* 메뉴 버튼 (모바일용) */}
      {onMenuClick && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            px: 1,
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <IconButton size="small" onClick={onMenuClick}>
            <MenuIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      {/* 탭들 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            height: 0,
          },
        }}
      >
        {tabs.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Open a note to start editing
            </Typography>
          </Box>
        ) : (
          tabs.map((tab) => (
            <Box
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                px: 2,
                minWidth: 120,
                maxWidth: 200,
                borderRight: 1,
                borderColor: 'divider',
                cursor: 'pointer',
                bgcolor: tab.isActive ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: tab.isActive ? 'action.selected' : 'action.hover',
                  '& .close-button': {
                    opacity: 1,
                  },
                },
                transition: 'background-color 0.15s',
              }}
            >
              {/* 수정 표시 */}
              {tab.isDirty && (
                <DotIcon
                  sx={{
                    fontSize: 12,
                    mr: 0.5,
                    color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                  }}
                />
              )}
              
              {/* 탭 제목 */}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  fontWeight: tab.isActive ? 500 : 400,
                  color: tab.isActive ? 'text.primary' : 'text.secondary',
                }}
              >
                {tab.title || 'Untitled'}
              </Typography>
              
              {/* 닫기 버튼 */}
              <IconButton
                className="close-button"
                size="small"
                onClick={(e) => handleCloseTab(e, tab.id)}
                sx={{
                  ml: 0.5,
                  p: 0.5,
                  opacity: tab.isActive ? 1 : 0,
                  transition: 'opacity 0.15s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

