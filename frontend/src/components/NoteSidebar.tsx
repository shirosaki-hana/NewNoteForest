import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  IconButton,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  LocalOffer as TagIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

//------------------------------------------------------------------------------//
// 상수
//------------------------------------------------------------------------------//
const SIDEBAR_WIDTH = 280;

interface NoteSidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

//------------------------------------------------------------------------------//
// 노트 사이드바 컴포넌트
//------------------------------------------------------------------------------//
export default function NoteSidebar({ open, onClose, variant = 'permanent' }: NoteSidebarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [viewMode, setViewMode] = useState<'notes' | 'tags'>('notes');
  const [searchInput, setSearchInput] = useState('');

  const { openSettings } = useSettingsStore();
  const { logout } = useAuthStore();
  const {
    notes,
    tags,
    isLoadingNotes,
    isLoadingTags,
    searchQuery,
    selectedTagIds,
    offset,
    total,
    loadNotes,
    loadTags,
    setSearchQuery,
    setSelectedTagIds,
    setOffset,
    openNoteInTab,
    createNewNote,
    activeTabId,
  } = useNoteStore();

  //----------------------------------------------------------------------------//
  // 초기 로드
  //----------------------------------------------------------------------------//
  useEffect(() => {
    loadNotes();
    loadTags();
  }, [loadNotes, loadTags]);

  //----------------------------------------------------------------------------//
  // 검색 핸들러
  //----------------------------------------------------------------------------//
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  //----------------------------------------------------------------------------//
  // 태그 필터 토글
  //----------------------------------------------------------------------------//
  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  //----------------------------------------------------------------------------//
  // 노트 선택
  //----------------------------------------------------------------------------//
  const handleNoteSelect = (noteId: number) => {
    openNoteInTab(noteId);
    if (isMobile) {
      onClose();
    }
  };

  //----------------------------------------------------------------------------//
  // 더 보기 (페이지네이션)
  //----------------------------------------------------------------------------//
  const handleLoadMore = () => {
    setOffset(offset + 50);
  };

  //----------------------------------------------------------------------------//
  // 로그아웃
  //----------------------------------------------------------------------------//
  const handleLogout = async () => {
    await logout();
  };

  //----------------------------------------------------------------------------//
  // 사이드바 내용
  //----------------------------------------------------------------------------//
  const sidebarContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' component='div' sx={{ fontWeight: 600 }}>
          NoteForest
        </Typography>
        <Box>
          <IconButton size='small' onClick={createNewNote} color='primary'>
            <AddIcon />
          </IconButton>
          {isMobile && (
            <IconButton size='small' onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* 검색 */}
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            size='small'
            placeholder={t('note.sidebar.searchPlaceholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchInput && (
                <IconButton size='small' onClick={handleSearchClear}>
                  <CloseIcon fontSize='small' />
                </IconButton>
              ),
            }}
          />
        </form>
      </Box>

      {/* 탭 (노트 리스트 / 태그) */}
      <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tab label={t('note.sidebar.notesTab')} value='notes' />
        <Tab label={t('note.sidebar.tagsTab')} value='tags' />
      </Tabs>

      {/* 컨텐츠 영역 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'notes' ? (
          <>
            {/* 선택된 태그 필터 표시 */}
            {selectedTagIds.length > 0 && (
              <Box sx={{ p: 2, pb: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedTagIds.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? <Chip key={tagId} label={tag.name} size='small' onDelete={() => handleTagToggle(tagId)} /> : null;
                  })}
                </Box>
              </Box>
            )}

            {/* 노트 리스트 */}
            {isLoadingNotes && notes.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : notes.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                  {searchQuery || selectedTagIds.length > 0 ? t('note.sidebar.noNotesFound') : t('note.sidebar.noNotesYet')}
                </Typography>
              </Box>
            ) : (
              <>
                <List sx={{ py: 0 }}>
                  {notes.map(note => (
                    <ListItem key={note.id} disablePadding>
                      <ListItemButton selected={activeTabId === note.id} onClick={() => handleNoteSelect(note.id)}>
                        <ListItemText
                          primary={note.title || t('note.sidebar.untitled')}
                          secondary={
                            note.tags.length > 0 && (
                              <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {note.tags.slice(0, 3).map(tag => (
                                  <Chip
                                    key={tag.id}
                                    label={tag.name}
                                    size='small'
                                    variant='outlined'
                                    sx={{ height: 18, fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            )
                          }
                          primaryTypographyProps={{
                            noWrap: true,
                            fontSize: '0.9rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>

                {/* 더 보기 버튼 */}
                {notes.length < total && (
                  <Box sx={{ p: 2 }}>
                    <Button fullWidth variant='outlined' size='small' onClick={handleLoadMore} disabled={isLoadingNotes}>
                      {isLoadingNotes ? t('note.sidebar.loading') : t('note.sidebar.loadMore', { current: notes.length, total })}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* 태그 리스트 */}
            {isLoadingTags ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : tags.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                  {t('note.sidebar.noTagsYet')}
                </Typography>
              </Box>
            ) : (
              <List>
                {tags.map(tag => (
                  <ListItem key={tag.id} disablePadding>
                    <ListItemButton
                      selected={selectedTagIds.includes(tag.id)}
                      onClick={() => {
                        handleTagToggle(tag.id);
                        setViewMode('notes');
                      }}
                    >
                      <TagIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <ListItemText primary={tag.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>

      {/* 하단 버튼 */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <List sx={{ py: 0 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={openSettings}>
              <SettingsIcon sx={{ mr: 2 }} />
              <ListItemText primary={t('note.sidebar.settings')} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              <ListItemText primary={t('note.sidebar.logout')} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  //----------------------------------------------------------------------------//
  // 렌더링
  //----------------------------------------------------------------------------//
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: variant === 'permanent' ? (open ? SIDEBAR_WIDTH : 0) : undefined,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? SIDEBAR_WIDTH : 0,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}
