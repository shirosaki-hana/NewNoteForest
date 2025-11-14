export default {
  translation: {
    // Common
    common: {
      appName: 'NoteForest',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
    },

    // Auth
    auth: {
      setup: {
        title: 'Setup Password',
        subtitle: 'Set an administrator password to get started',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        passwordHelper: 'At least 8 characters, including letters and numbers',
        submit: 'Set Password',
        submitting: 'Setting...',
        passwordMismatch: 'Passwords do not match',
        invalidFormat: 'Invalid password format',
      },
      login: {
        title: 'Sign In',
        subtitle: 'Sign in to continue',
        password: 'Password',
        submit: 'Sign In',
        submitting: 'Signing in...',
      },
      logout: 'Sign Out',
    },

    // Settings
    settings: {
      title: 'Settings',
      theme: {
        title: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      language: {
        title: 'Language',
        ko: '한국어',
        en: 'English',
      },
    },

    // Note
    note: {
      unsavedChanges: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you really want to close this note?',
        confirm: 'Close',
        cancel: 'Cancel',
      },
      editor: {
        selectNote: 'Select a note to start editing',
        createNewNote: 'or create a new one from the sidebar',
        noteTitle: 'Note Title',
        lastUpdated: 'Last updated',
        saveShortcut: 'Save (Ctrl+S)',
        deleteNote: 'Delete note',
        viewMode: 'View Mode',
        editMode: 'Edit Mode',
        toggleViewMode: 'Switch to view mode',
        toggleEditMode: 'Switch to edit mode',
        deleteDialog: {
          title: 'Delete Note',
          message: 'Are you sure you want to delete this note? This action cannot be undone.',
          confirm: 'Delete',
          cancel: 'Cancel',
        },
        tag: {
          add: 'Add tag',
          tagName: 'Tag name',
          addButton: 'Add',
          cancelButton: 'Cancel',
        },
        messages: {
          titleUpdateFailed: 'Failed to update title',
          tagAdded: 'Tag added successfully',
          tagAddFailed: 'Failed to add tag',
          tagRemoveFailed: 'Failed to remove tag',
          noteDeleted: 'Note deleted successfully',
          noteDeleteFailed: 'Failed to delete note',
        },
      },
      sidebar: {
        searchPlaceholder: 'Search notes...',
        notesTab: 'Notes',
        tagsTab: 'Tags',
        untitled: 'Untitled',
        noNotesFound: 'No notes found',
        noNotesYet: 'No notes yet. Create one!',
        noTagsYet: 'No tags yet',
        loading: 'Loading...',
        loadMore: 'Load More ({{current}}/{{total}})',
        settings: 'Settings',
        logout: 'Logout',
      },
      tabBar: {
        openNote: 'Open a note to start editing',
        untitled: 'Untitled',
      },
      store: {
        loadNotesFailed: 'Failed to load notes',
        loadTagsFailed: 'Failed to load tags',
        loadNoteFailed: 'Failed to load note',
        noteSaved: 'Note saved successfully',
        saveNoteFailed: 'Failed to save note',
        noteCreated: 'Note created successfully',
        createNoteFailed: 'Failed to create note',
        deleteNoteFailed: 'Failed to delete note',
      },
    },

    // Errors
    errors: {
      statusCheckFailed: 'Failed to check status',
      setupFailed: 'Failed to set password',
      loginFailed: 'Failed to sign in',
      logoutFailed: 'Failed to sign out',
      network: 'Network error',
      unknown: 'Unknown error occurred',
    },
  },
};
