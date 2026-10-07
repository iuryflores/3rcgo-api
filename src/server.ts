import http, { type ServerResponse } from 'node:http';
import nodemailer from 'nodemailer';
import { validatePayload, emailText, type ValidatedPayload } from './validation.js';

const env = process.env;
for (const name of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'LGPD_TO', 'ALLOWED_ORIGINS']) {
  if (!env[name]) throw new Error(`Configure ${name} antes de iniciar a API.`);
}
const origins = new Set(env.ALLOWED_ORIGINS!.split(',').map(value => value.trim()));
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true',
  requireTLS: env.SMTP_SECURE !== 'true',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
});
const limits = new Map<string, { count: number; until: number }>();
const windowMs = 15 * 60 * 1000;
setInterval(() => {
  for (const [key, value] of limits) if (value.until < Date.now()) limits.delete(key);
}, 60000).unref();

function reply(res: ServerResponse, status: number, msg: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ msg }));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'GET' && req.url === '/health') return reply(res, 200, 'ok');
  const origin = req.headers.origin;
  if (!origin || !origins.has(origin)) return reply(res, 403, 'Origem não autorizada.');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const kind = req.url === '/terceiro/send-aviso/' ? 'lgpd' : null;
  if (!kind || req.method !== 'POST') return reply(res, 404, 'Rota não encontrada.');
  const forwardedIp = req.headers['x-real-ip'];
  const ip = (env.TRUST_PROXY === 'true' && typeof forwardedIp === 'string' ? forwardedIp : req.socket.remoteAddress) || 'unknown';
  let limit = limits.get(ip);
  if (!limit || limit.until < Date.now()) { limit = { count: 0, until: Date.now() + windowMs }; limits.set(ip, limit); }
  if (++limit.count > 5) { res.setHeader('Retry-After', Math.ceil((limit.until - Date.now()) / 1000)); return reply(res, 429, 'Aguarde alguns minutos antes de tentar novamente.'); }
  if (!req.headers['content-type']?.startsWith('application/json')) return reply(res, 415, 'Envie dados em JSON.');
  const chunks: Buffer[] = [];
  let bytes = 0;
  let data: ValidatedPayload;
  try {
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 32768) { reply(res, 413, 'Solicitação muito grande.'); return; }
      chunks.push(chunk);
    }
    data = validatePayload(kind, JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch { return reply(res, 400, 'Verifique os campos obrigatórios, o e-mail e o aceite.'); }
  try {
    const result = await transport.sendMail({
      from: env.MAIL_FROM, to: env.LGPD_TO,
      replyTo: data.email || undefined, subject: 'Solicitação de Dados — LGPD',
      text: emailText(kind, data),
    });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP recusou o destinatário.');
    reply(res, 200, 'Obrigado! Sua mensagem foi enviada!');
  } catch (error: unknown) {
    const failure = error as { code?: string; command?: string; responseCode?: number };
    console.error('Falha no envio SMTP.', {
      code: failure?.code || 'desconhecido',
      command: failure?.command || 'indisponível',
      responseCode: failure?.responseCode || 'indisponível',
    });
    reply(res, 502, 'Não foi possível enviar a solicitação. Tente novamente.');
  }
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.listen(Number(env.PORT || 9005), env.HOST || '127.0.0.1', () => console.log('API iniciada.'));
process.on('SIGTERM', () => server.close(() => { transport.close(); process.exit(0); }));
