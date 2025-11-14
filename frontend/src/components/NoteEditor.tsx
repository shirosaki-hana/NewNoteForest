import { useCallback, useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  LocalOffer as TagIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { useNoteStore } from '../stores/noteStore';
import { useThemeStore } from '../stores/themeStore';
import { useDialogStore } from '../stores/dialogStore';
import { useSnackbarStore } from '../stores/snackbarStore';

//------------------------------------------------------------------------------//
// 노트 에디터 컴포넌트
//------------------------------------------------------------------------------//
export default function NoteEditor() {
  const theme = useTheme();
  const { mode } = useThemeStore();
  const { openDialog } = useDialogStore();
  const { showError, showSuccess } = useSnackbarStore();
  const {
    currentNote,
    currentNoteContent,
    isLoadingNote,
    isSaving,
    setCurrentNoteContent,
    saveCurrentNote,
    deleteCurrentNote,
  } = useNoteStore();
  
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  
  //----------------------------------------------------------------------------//
  // 현재 노트가 변경되면 제목 업데이트
  //----------------------------------------------------------------------------//
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
    }
  }, [currentNote]);
  
  //----------------------------------------------------------------------------//
  // 제목 저장
  //----------------------------------------------------------------------------//
  const handleTitleBlur = useCallback(async () => {
    if (!currentNote || title === currentNote.title) return;
    
    try {
      const { updateNote } = await import('../api/notes');
      await updateNote(currentNote.id, { title });
      // 노트 리스트 갱신
      const { loadNotes } = useNoteStore.getState();
      loadNotes();
    } catch {
      showError('Failed to update title');
    }
  }, [currentNote, title, showError]);
  
  //----------------------------------------------------------------------------//
  // 태그 추가
  //----------------------------------------------------------------------------//
  const handleAddTag = useCallback(async () => {
    if (!currentNote || !tagInput.trim()) return;
    
    try {
      const { updateNote } = await import('../api/notes');
      const newTagNames = [...currentNote.tags.map(t => t.name), tagInput.trim()];
      await updateNote(currentNote.id, { tagNames: newTagNames });
      
      setTagInput('');
      setShowTagInput(false);
      
      // 노트 리스트 갱신
      const { loadNoteContent, loadNotes, loadTags } = useNoteStore.getState();
      await loadNoteContent(currentNote.id);
      loadNotes();
      loadTags();
      showSuccess('Tag added successfully');
    } catch {
      showError('Failed to add tag');
    }
  }, [currentNote, tagInput, showError, showSuccess]);
  
  //----------------------------------------------------------------------------//
  // 태그 제거
  //----------------------------------------------------------------------------//
  const handleRemoveTag = useCallback(async (tagName: string) => {
    if (!currentNote) return;
    
    try {
      const { updateNote } = await import('../api/notes');
      const newTagNames = currentNote.tags
        .map(t => t.name)
        .filter(name => name !== tagName);
      await updateNote(currentNote.id, { tagNames: newTagNames });
      
      // 노트 리스트 갱신
      const { loadNoteContent, loadNotes, loadTags } = useNoteStore.getState();
      await loadNoteContent(currentNote.id);
      loadNotes();
      loadTags();
    } catch {
      showError('Failed to remove tag');
    }
  }, [currentNote, showError]);
  
  //----------------------------------------------------------------------------//
  // 컨텐츠 변경
  //----------------------------------------------------------------------------//
  const handleContentChange = useCallback((value: string) => {
    setCurrentNoteContent(value);
  }, [setCurrentNoteContent]);
  
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
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteCurrentNote();
          showSuccess('Note deleted successfully');
        } catch {
          showError('Failed to delete note');
        }
      },
    });
  }, [deleteCurrentNote, openDialog, showError, showSuccess]);
  
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
        <Typography variant="h6" color="text.secondary">
          Select a note to start editing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or create a new one from the sidebar
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
          <Tooltip title="Save (Ctrl+S)">
            <span>
              <IconButton
                size="small"
                onClick={handleSave}
                disabled={isSaving}
                color="primary"
              >
                {isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Delete note">
            <IconButton size="small" onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(currentNote.updatedAt).toLocaleString()}
        </Typography>
      </Box>
      
      {/* 제목 */}
      <Box sx={{ px: 3, pt: 2 }}>
        <TextField
          fullWidth
          variant="standard"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          InputProps={{
            sx: {
              fontSize: '1.5rem',
              fontWeight: 600,
            },
            disableUnderline: true,
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
        {currentNote.tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            size="small"
            onDelete={() => handleRemoveTag(tag.name)}
            icon={<TagIcon />}
          />
        ))}
        
        {showTagInput ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <TextField
              size="small"
              placeholder="Tag name"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
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
            <Button size="small" onClick={handleAddTag}>
              Add
            </Button>
            <Button
              size="small"
              onClick={() => {
                setShowTagInput(false);
                setTagInput('');
              }}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <Chip
            label="Add tag"
            size="small"
            icon={<AddIcon />}
            onClick={() => setShowTagInput(true)}
            variant="outlined"
          />
        )}
      </Box>
      
      {/* 에디터 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          pb: 2,
        }}
      >
        <CodeMirror
          value={currentNoteContent}
          onChange={handleContentChange}
          extensions={[markdown()]}
          theme={mode === 'dark' ? 'dark' : 'light'}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          style={{
            fontSize: '14px',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
        />
      </Box>
    </Box>
  );
}

