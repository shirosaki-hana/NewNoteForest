import { useCallback, useEffect, useState, useRef } from 'react';
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
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../stores/noteStore';
import { useDialogStore } from '../stores/dialogStore';
import { useSnackbarStore } from '../stores/snackbarStore';
import { updateNote } from '../api/notes';
import {
  noteToMarkdown,
  parseMarkdownWithFrontMatter,
  downloadMarkdownFile,
  readMarkdownFile,
} from '../lib/markdownExport';

// Milkdown imports
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { prism, prismConfig } from '@milkdown/plugin-prism';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { history } from '@milkdown/kit/plugin/history';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { replaceAll, $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';

// Refractor (for Milkdown prism plugin)
import { refractor } from 'refractor/core';
import javascript from 'refractor/javascript';
import typescript from 'refractor/typescript';
import jsx from 'refractor/jsx';
import tsx from 'refractor/tsx';
import css from 'refractor/css';
import python from 'refractor/python';
import java from 'refractor/java';
import json from 'refractor/json';
import bash from 'refractor/bash';
import markdown from 'refractor/markdown';
import sql from 'refractor/sql';
import yaml from 'refractor/yaml';

// Register languages with refractor
refractor.register(javascript);
refractor.register(typescript);
refractor.register(jsx);
refractor.register(tsx);
refractor.register(css);
refractor.register(python);
refractor.register(java);
refractor.register(json);
refractor.register(bash);
refractor.register(markdown);
refractor.register(sql);
refractor.register(yaml);

// Task list checkbox toggle plugin
const taskListTogglePluginKey = new PluginKey('taskListToggle');
const taskListTogglePlugin = $prose(() => {
  return new Plugin({
    key: taskListTogglePluginKey,
    props: {
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement;
        // Check if click is on a task list item (the ::before pseudo element area)
        const listItem = target.closest('li[data-item-type="task"]');
        if (!listItem) return false;

        // Check if click is in the checkbox area (left part of the item)
        const rect = listItem.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        // Only toggle if clicking in the first 28px (checkbox area)
        if (clickX > 28) return false;

        // Find the position of this list item in the document
        const { state, dispatch } = view;
        const $pos = state.doc.resolve(pos);
        
        // Find the list_item node
        for (let depth = $pos.depth; depth >= 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === 'list_item' && node.attrs.checked !== null) {
            const nodePos = $pos.before(depth);
            const newAttrs = {
              ...node.attrs,
              checked: node.attrs.checked === 'true' ? 'false' : 'true',
            };
            dispatch(state.tr.setNodeMarkup(nodePos, undefined, newAttrs));
            return true;
          }
        }
        return false;
      },
    },
  });
});

//------------------------------------------------------------------------------//
// Milkdown 에디터 래퍼 컴포넌트
//------------------------------------------------------------------------------//
interface MilkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

function MilkdownEditor({ content, onChange }: MilkdownEditorProps) {
  const contentRef = useRef(content);
  const editorRef = useRef<Editor | null>(null);
  const isExternalUpdate = useRef(false);

  // content prop이 변경되면 ref 업데이트
  useEffect(() => {
    if (contentRef.current !== content && editorRef.current) {
      isExternalUpdate.current = true;
      contentRef.current = content;
      editorRef.current.action(replaceAll(content));
    }
  }, [content]);

  const { get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx.set(prismConfig.key, {
          configureRefractor: () => refractor,
        });
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          // 외부 업데이트로 인한 변경은 무시
          if (isExternalUpdate.current) {
            isExternalUpdate.current = false;
            return;
          }
          contentRef.current = markdown;
          onChange(markdown);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(prism)
      .use(listener)
      .use(history)
      .use(clipboard)
      .use(taskListTogglePlugin)
  );

  // 에디터 인스턴스 저장
  useEffect(() => {
    editorRef.current = get() ?? null;
  }, [get]);

  return <Milkdown />;
}

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

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [importNote, showSuccess, showError, t]
  );

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
          <input type='file' ref={fileInputRef} onChange={handleFileChange} accept='.md' style={{ display: 'none' }} />
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

      {/* Milkdown 에디터 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          pb: 2,
          // Milkdown 스타일 커스터마이징
          '& .milkdown': {
            height: '100%',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
            fontSize: '15px',
            lineHeight: 1.6,
            color: theme.palette.text.primary,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '& .editor': {
              padding: 0,
            },
          },
          '& .ProseMirror': {
            outline: 'none',
            minHeight: '100%',
          },
          // 제목 스타일
          '& .ProseMirror h1, & .ProseMirror h2, & .ProseMirror h3, & .ProseMirror h4, & .ProseMirror h5, & .ProseMirror h6': {
            marginTop: '24px',
            marginBottom: '12px',
            fontWeight: 600,
            lineHeight: 1.3,
            color: theme.palette.text.primary,
          },
          '& .ProseMirror h1': {
            fontSize: '2rem',
            borderBottom: `1px solid ${theme.palette.divider}`,
            paddingBottom: '8px',
          },
          '& .ProseMirror h2': {
            fontSize: '1.5rem',
          },
          '& .ProseMirror h3': {
            fontSize: '1.25rem',
          },
          // 문단 스타일
          '& .ProseMirror p': {
            marginTop: '8px',
            marginBottom: '8px',
          },
          // 링크 스타일
          '& .ProseMirror a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'underline',
              color: theme.palette.primary.light,
            },
          },
          // 인라인 코드
          '& .ProseMirror code': {
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontFamily: '"JetBrains Mono", "Menlo", "Monaco", "Courier New", monospace',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2',
          },
          // 코드 블록
          '& .ProseMirror pre': {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            padding: '16px',
            marginTop: '8px',
            marginBottom: '16px',
            overflow: 'auto',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
            '& code': {
              padding: 0,
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              color: 'inherit',
            },
          },
          // 인용구
          '& .ProseMirror blockquote': {
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            paddingLeft: '16px',
            margin: '16px 0',
            color: theme.palette.text.secondary,
            fontStyle: 'italic',
            '& p': {
              marginTop: '8px',
              marginBottom: '8px',
            },
          },
          // 리스트
          '& .ProseMirror ul, & .ProseMirror ol': {
            paddingLeft: '24px',
            marginTop: '8px',
            marginBottom: '16px',
            '& li': {
              marginBottom: '4px',
            },
          },
          // 체크리스트 (GFM task list)
          '& .ProseMirror li[data-item-type="task"]': {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            listStyleType: 'none',
            position: 'relative',
            marginLeft: '-1em',
            '&::before': {
              content: '""',
              width: '16px',
              height: '16px',
              minWidth: '16px',
              border: `2px solid ${theme.palette.divider}`,
              borderRadius: '3px',
              marginTop: '3px',
              cursor: 'pointer',
              backgroundColor: theme.palette.background.paper,
              transition: 'all 0.15s ease',
            },
            '&:hover::before': {
              borderColor: theme.palette.primary.main,
            },
          },
          '& .ProseMirror li[data-item-type="task"][data-checked="true"]': {
            '&::before': {
              backgroundColor: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E")`,
              backgroundSize: '12px',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            },
            '& > p': {
              textDecoration: 'line-through',
              opacity: 0.7,
            },
          },
          // 테이블
          '& .ProseMirror table': {
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '8px',
            marginBottom: '16px',
            border: `1px solid ${theme.palette.divider}`,
            '& th, & td': {
              padding: '8px 12px',
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'left',
            },
            '& th': {
              fontWeight: 600,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
          // 구분선
          '& .ProseMirror hr': {
            border: 'none',
            borderTop: `1px solid ${theme.palette.divider}`,
            margin: '24px 0',
          },
          // 이미지
          '& .ProseMirror img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            marginTop: '8px',
            marginBottom: '16px',
          },
        }}
      >
        <MilkdownProvider>
          <MilkdownEditor content={currentNoteContent} onChange={handleContentChange} />
        </MilkdownProvider>
      </Box>
    </Box>
  );
}
