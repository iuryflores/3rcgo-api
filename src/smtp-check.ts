import nodemailer from 'nodemailer';
const env = process.env;
const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'LGPD_TO'];
const missing = required.filter(key => !env[key]?.trim());
if (missing.length) {
  console.error(`Configuração incompleta: ${missing.join(', ')}`);
  process.exit(1);
}
const port = Number(env.SMTP_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('SMTP_PORT inválida.');
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.LGPD_TO!)) {
  console.error('LGPD_TO deve conter um endereço de e-mail válido.');
  process.exit(1);
}
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST, port, secure: env.SMTP_SECURE === 'true',
  requireTLS: env.SMTP_SECURE !== 'true',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
});
try {
  await transport.verify();
  console.log('SMTP: conexão TLS e autenticação confirmadas. Nenhum e-mail enviado.');
} catch (error: unknown) {
  const failure = error as { code?: string; responseCode?: number };
  console.error(`Falha SMTP: código ${failure.code || 'desconhecido'}, resposta ${failure.responseCode || 'indisponível'}.`);
  process.exitCode = 1;
} finally {
  transport.close();
}