module.exports = {
  apps: [
    {
      name: 'real-estate-crm',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        JWT_SECRET: (() => { if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required'); return process.env.JWT_SECRET; })(),
        PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || 'http://localhost:3000'
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      time: true
    }
  ]
};

