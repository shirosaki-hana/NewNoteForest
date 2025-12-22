import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Chip,
  Typography,
  Button,
  Tooltip,
  CircularProgress,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  LocalOffer as TagIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useDialogStore } from '../stores/dialogStore';
import { useSnackbarStore } from '../stores/snackbarStore';
import { updateNote } from '../api/notes';
import MarkdownRenderer from './MarkdownRenderer';
import {
  noteToMarkdown,
  parseMarkdownWithFrontMatter,
  downloadMarkdownFile,
  readMarkdownFile,
} from '../lib/markdownExport';

//------------------------------------------------------------------------------//
// 노트 에디터 컴포넌트
//------------------------------------------------------------------------------//
export default function NoteEditor() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { openDialog } = useDialogStore();
  const { showError, showSuccess } = useSnackbarStore();
  const { currentNote, currentNoteContent, isLoadingNote, isSaving, setCurrentNoteContent, saveCurrentNote, deleteCurrentNote, importNote } =
    useNoteStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [prevNoteId, setPrevNoteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  //----------------------------------------------------------------------------//
  // CodeMirror 테마 생성 (Material-UI 테마와 연동)
  //----------------------------------------------------------------------------//
  const codeMirrorTheme = useMemo(
    () =>
      EditorView.theme(
        {
          '&': {
            backgroundColor: `${theme.palette.background.default}`,
            height: '100%',
          },
          '.cm-content': {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
            fontSize: '15px',
            lineHeight: '1.6',
          },
          '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: theme.palette.primary.main,
          },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.12)',
          },
          '.cm-activeLine': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          },
          '.cm-gutters': {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.secondary,
            border: 'none',
          },
          '.cm-activeLineGutter': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            color: theme.palette.text.disabled,
          },
        },
        { dark: theme.palette.mode === 'dark' }
      ),
    [theme]
  );

  //----------------------------------------------------------------------------//
  // 현재 노트가 변경되면 제목 업데이트
  //----------------------------------------------------------------------------//
  // 다른 노트로 전환될 때만 title을 초기화
  if (currentNote && currentNote.id !== prevNoteId) {
    setPrevNoteId(currentNote.id);
    setTitle(currentNote.title);
  } else if (!currentNote && prevNoteId !== null) {
    setPrevNoteId(null);
    setTitle('');
  }

  //----------------------------------------------------------------------------//
  // 제목 저장
  //----------------------------------------------------------------------------//
  const handleTitleBlur = useCallback(async () => {
    if (!currentNote || title === currentNote.title) return;

    try {
      await updateNote(currentNote.id, { title });
      // 노트 리스트 갱신
      const { loadNotes } = useNoteStore.getState();
      loadNotes();
    } catch {
      showError(t('note.editor.messages.titleUpdateFailed'));
    }
  }, [currentNote, title, showError, t]);

  //----------------------------------------------------------------------------//
  // 태그 추가
  //----------------------------------------------------------------------------//
  const handleAddTag = useCallback(async () => {
    if (!currentNote || !tagInput.trim()) return;

    try {
      const newTagNames = [...currentNote.tags.map(t => t.name), tagInput.trim()];
      const response = await updateNote(currentNote.id, { tagNames: newTagNames });

      setTagInput('');
      setShowTagInput(false);

      // currentNote만 업데이트 (편집 중인 content는 유지)
      const { updateCurrentNote, loadNotes, loadTags } = useNoteStore.getState();
      updateCurrentNote(response.note);
      loadNotes();
      loadTags();
      showSuccess(t('note.editor.messages.tagAdded'));
    } catch {
      showError(t('note.editor.messages.tagAddFailed'));
    }
  }, [currentNote, tagInput, showError, showSuccess, t]);

  //----------------------------------------------------------------------------//
  // 태그 제거
  //----------------------------------------------------------------------------//
  const handleRemoveTag = useCallback(
    async (tagName: string) => {
      if (!currentNote) return;

      try {
        const newTagNames = currentNote.tags.map(t => t.name).filter(name => name !== tagName);
        const response = await updateNote(currentNote.id, { tagNames: newTagNames });

        // currentNote만 업데이트 (편집 중인 content는 유지)
        const { updateCurrentNote, loadNotes, loadTags } = useNoteStore.getState();
        updateCurrentNote(response.note);
        loadNotes();
        loadTags();
      } catch {
        showError(t('note.editor.messages.tagRemoveFailed'));
      }
    },
    [currentNote, showError, t]
  );

  //----------------------------------------------------------------------------//
  // 컨텐츠 변경
  //----------------------------------------------------------------------------//
  const handleContentChange = useCallback(
    (value: string) => {
      setCurrentNoteContent(value);
    },
    [setCurrentNoteContent]
  );

  //----------------------------------------------------------------------------//
  // 저장 핸들러
  //----------------------------------------------------------------------------//
  const handleSave = useCallback(() => {
    saveCurrentNote();
  }, [saveCurrentNote]);

  //----------------------------------------------------------------------------//
  // 삭제 핸들러
  //----------------------------------------------------------------------------//
  const handleDelete = useCallback(() => {
    openDialog({
      title: t('note.editor.deleteDialog.title'),
      message: t('note.editor.deleteDialog.message'),
      confirmText: t('note.editor.deleteDialog.confirm'),
      cancelText: t('note.editor.deleteDialog.cancel'),
      onConfirm: async () => {
        try {
          await deleteCurrentNote();
          showSuccess(t('note.editor.messages.noteDeleted'));
        } catch {
          showError(t('note.editor.messages.noteDeleteFailed'));
        }
      },
    });
  }, [deleteCurrentNote, openDialog, showError, showSuccess, t]);

  //----------------------------------------------------------------------------//
  // 보기 모드 전환
  //----------------------------------------------------------------------------//
  const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: 'edit' | 'view' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }, []);

  //----------------------------------------------------------------------------//
  // 노트 내보내기 (Export)
  //----------------------------------------------------------------------------//
  const handleExport = useCallback(() => {
    if (!currentNote) return;

    try {
      const markdown = noteToMarkdown({
        title: currentNote.title,
        tags: currentNote.tags.map(t => t.name),
        content: currentNoteContent,
      });

      // 파일명에서 사용할 수 없는 문자 제거
      const safeTitle = currentNote.title.replace(/[<>:"/\\|?*]/g, '_');
      downloadMarkdownFile(safeTitle, markdown);
      
      showSuccess(t('note.editor.importExport.exportSuccess'));
    } catch {
      showError(t('note.editor.importExport.exportFailed'));
    }
  }, [currentNote, currentNoteContent, showSuccess, showError, t]);

  //----------------------------------------------------------------------------//
  // 노트 불러오기 (Import)
  //----------------------------------------------------------------------------//
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    if (!file.name.toLowerCase().endsWith('.md')) {
      showError(t('note.editor.importExport.invalidFile'));
      event.target.value = '';
      return;
    }

    try {
      const content = await readMarkdownFile(file);
      const parsed = parseMarkdownWithFrontMatter(content);

      if (parsed.isValid && parsed.title) {
        // 유효한 front-matter가 있는 경우
        await importNote({
          title: parsed.title,
          content: parsed.content,
          tagNames: parsed.tags || [],
        });
        showSuccess(t('note.editor.importExport.importSuccess'));
      } else {
        // front-matter가 없거나 유효하지 않은 경우 - 새 노트로 생성
        const fileName = file.name.replace(/\.md$/i, '');
        await importNote({
          title: fileName || 'Imported Note',
          content: parsed.content,
          tagNames: [],
        });
        showSuccess(t('note.editor.importExport.importAsNewNote'));
      }
    } catch {
      showError(t('note.editor.importExport.importFailed'));
    }

    // 같은 파일 다시 선택할 수 있도록 초기화
    event.target.value = '';
  }, [importNote, showSuccess, showError, t]);

  //----------------------------------------------------------------------------//
  // 키보드 단축키
  //----------------------------------------------------------------------------//
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  //----------------------------------------------------------------------------//
  // 로딩 중
  //----------------------------------------------------------------------------//
  if (isLoadingNote) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  //----------------------------------------------------------------------------//
  // 노트가 선택되지 않음
  //----------------------------------------------------------------------------//
  if (!currentNote) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant='h6' color='text.secondary'>
          {t('note.editor.selectNote')}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {t('note.editor.createNewNote')}
        </Typography>
      </Box>
    );
  }

  //----------------------------------------------------------------------------//
  // 에디터 렌더링
  //----------------------------------------------------------------------------//
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 툴바 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={t('note.editor.saveShortcut')}>
            <span>
              <IconButton size='small' onClick={handleSave} disabled={isSaving} color='primary'>
                {isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={t('note.editor.deleteNote')}>
            <IconButton size='small' onClick={handleDelete} color='error'>
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ ml: 1, borderLeft: 1, borderColor: 'divider', pl: 1, display: 'flex', gap: 0.5 }}>
            <Tooltip title={t('note.editor.importExport.import')}>
              <IconButton size='small' onClick={handleImportClick}>
                <ImportIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('note.editor.importExport.export')}>
              <IconButton size='small' onClick={handleExport}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Hidden file input for import */}
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            accept='.md'
            style={{ display: 'none' }}
          />

          <Box sx={{ ml: 1, borderLeft: 1, borderColor: 'divider', pl: 1 }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size='small' aria-label='view mode'>
              <ToggleButton value='edit' aria-label='edit mode'>
                <Tooltip title={t('note.editor.toggleEditMode')}>
                  <EditIcon fontSize='small' />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value='view' aria-label='view mode'>
                <Tooltip title={t('note.editor.toggleViewMode')}>
                  <ViewIcon fontSize='small' />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Typography variant='caption' color='text.secondary'>
          {t('note.editor.lastUpdated')}: {new Date(currentNote.updatedAt).toLocaleString()}
        </Typography>
      </Box>

      {/* 제목 */}
      <Box sx={{ px: 3, pt: 2 }}>
        <TextField
          fullWidth
          variant='standard'
          placeholder={t('note.editor.noteTitle')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          slotProps={{
            input: {
              sx: {
                fontSize: '1.5rem',
                fontWeight: 600,
              },
              disableUnderline: true,
            },
          }}
        />
      </Box>

      {/* 태그 */}
      <Box
        sx={{
          px: 3,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {currentNote.tags.map(tag => (
          <Chip key={tag.id} label={tag.name} size='small' onDelete={() => handleRemoveTag(tag.name)} icon={<TagIcon />} />
        ))}

        {showTagInput ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <TextField
              size='small'
              placeholder={t('note.editor.tag.tagName')}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddTag();
                } else if (e.key === 'Escape') {
                  setShowTagInput(false);
                  setTagInput('');
                }
              }}
              autoFocus
              sx={{ width: 120 }}
            />
            <Button size='small' onClick={handleAddTag}>
              {t('note.editor.tag.addButton')}
            </Button>
            <Button
              size='small'
              onClick={() => {
                setShowTagInput(false);
                setTagInput('');
              }}
            >
              {t('note.editor.tag.cancelButton')}
            </Button>
          </Box>
        ) : (
          <Chip label={t('note.editor.tag.add')} size='small' icon={<AddIcon />} onClick={() => setShowTagInput(true)} variant='outlined' />
        )}
      </Box>

      {/* 에디터 / 렌더러 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          pb: 2,
        }}
      >
        {viewMode === 'edit' ? (
          <CodeMirror
            value={currentNoteContent}
            onChange={handleContentChange}
            extensions={[markdown(), codeMirrorTheme, EditorView.lineWrapping]}
            theme='none'
          />
        ) : (
          <MarkdownRenderer content={currentNoteContent} />
        )}
      </Box>
    </Box>
  );
}
