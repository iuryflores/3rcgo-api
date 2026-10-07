import { writeFileSync } from 'node:fs';

const keys = ['HOST', 'PORT', 'ALLOWED_ORIGINS', 'TRUST_PROXY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'LGPD_TO'] as const;
const values = Object.fromEntries(keys.map(key => [key, process.env[key] || '']));
const missing = keys.filter(key => !values[key]);
if (missing.length) throw new Error(`Configuração ausente: ${missing.join(', ')}`);
for (const key of ['PORT', 'SMTP_PORT']) {
  const port = Number(values[key]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${key} inválida.`);
}
if (!['true', 'false'].includes(values.SMTP_SECURE)) throw new Error('SMTP_SECURE deve ser true ou false.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.LGPD_TO)) throw new Error('LGPD_TO inválido.');
for (const origin of values.ALLOWED_ORIGINS.split(',')) {
  const url = new URL(origin.trim());
  if (url.origin !== origin.trim() || !['https:', 'http:'].includes(url.protocol)) throw new Error('ALLOWED_ORIGINS deve conter origens HTTP/HTTPS sem caminho.');
}
// Valores chegam por environment, nunca são interpolados em comandos shell.
writeFileSync('.env', keys.map(key => `${key}=${JSON.stringify(values[key])}`).join('\n') + '\n', { mode: 0o600 });
console.log('Configuração validada e .env criado sem exibir credenciais.');
