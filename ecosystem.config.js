module.exports = {
  apps: [
    {
      name: 'heatmail-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/heatmail',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5052
      },
      error_file: '/var/www/heatmail/logs/backend-error.log',
      out_file: '/var/www/heatmail/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'heatmail-worker',
      script: './backend/dist/workers/index.js',
      cwd: '/var/www/heatmail',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/www/heatmail/logs/worker-error.log',
      out_file: '/var/www/heatmail/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
