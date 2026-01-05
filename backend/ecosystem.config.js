/**
 * PM2 Ecosystem Configuration
 * Production-ready process management for Node.js backend
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 logs
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'dating-app-backend',
      script: './server.js',
      cwd: './backend',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || 3000,
      },

      // Auto-restart configuration
      autorestart: true,
      watch: false, // Disable watch in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true, // Add timestamp to logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true, // Merge logs from all instances
      
      // Process management
      min_uptime: '10s', // Minimum uptime to consider app stable
      max_restarts: 10, // Maximum restarts in 1 minute
      restart_delay: 4000, // Delay between restarts (ms)
      
      // Graceful shutdown
      kill_timeout: 5000, // Time to wait for graceful shutdown (ms)
      wait_ready: true, // Wait for app to be ready
      listen_timeout: 10000, // Time to wait for app to listen (ms)
      
      // Advanced options
      instance_var: 'INSTANCE_ID', // Environment variable for instance ID
      ignore_watch: [
        'node_modules',
        'logs',
        'coverage',
        '.git',
        '*.log',
      ],
      
      // Source map support (if using TypeScript)
      source_map_support: true,
      
      // Node.js options
      node_args: [
        '--max-old-space-size=1024', // Limit heap size to 1GB
        '--enable-source-maps', // Enable source maps for better error traces
      ],
    },
    // Optional: Worker process for background jobs
    {
      name: 'dating-app-worker',
      script: './worker.js',
      cwd: './backend',
      instances: 1, // Single instance for worker
      exec_mode: 'fork', // Fork mode (not cluster)
      
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/dating-app.git',
      path: '/var/www/dating-app',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y git',
    },
  },
};
