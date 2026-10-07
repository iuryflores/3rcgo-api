module.exports = {
  apps: [{
    name: '3rcgo-server',
    cwd: '/opt/3rcgo-api/current',
    script: '/opt/3rcgo-api/current/dist/server.js',
    node_args: '--env-file=/opt/3rcgo-api/current/.env',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    restart_delay: 3000,
    time: true,
    env: { NODE_ENV: 'production' },
  }],
};