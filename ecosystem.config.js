/**
 * PM2 Ecosystem Configuration for CountIn
 *
 * Commands:
 *   pm2 start ecosystem.config.js
 *   pm2 stop countin
 *   pm2 restart countin
 *   pm2 delete countin
 *   pm2 logs countin
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'countin',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/countin/apps/web',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Load environment variables from file
      env_file: '/var/www/countin/.env.production',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/countin-error.log',
      out_file: '/var/log/pm2/countin-out.log',
      merge_logs: true,

      // Restart settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Health check (optional)
      // exp_backoff_restart_delay: 100,
    },
  ],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'server-ip-or-hostname',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/countin.git',
      path: '/var/www/countin',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
