export const apps = [
  {
    name: 'note-forest',
    script: 'backend/dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
  },
];
