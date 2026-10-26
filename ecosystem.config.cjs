module.exports = {
  apps: [
    {
      name: 'arcozap',
      cwd: __dirname,
      script: './node_modules/.bin/tsx',
      args: 'server.ts',
      interpreter: 'none',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '700M',
      time: true,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '3000',
        DATA_DIR: '/home/ubuntu/.local/share/arcozap',
      },
    },
  ],
};
