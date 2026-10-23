import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../dist/app.js';
import { MailService } from '../dist/mail/mail.service.js';

// Dummy configuration: HTTP tests replace SMTP and never send messages.
Object.assign(process.env, {
  SMTP_HOST: 'localhost', SMTP_USER: 'test', SMTP_PASS: 'test',
  MAIL_FROM: 'sender@example.com', LGPD_TO: 'receiver@example.com',
  ALLOWED_ORIGINS: 'https://example.com', TRUST_PROXY: 'false',
});
const payload = {
  nome: 'Pessoa', email: 'pessoa@example.com', celular: '62999999999',
  documentos: 'Documento fictício', descricao: 'Acesso aos dados',
  selectedInfo: 'Acesso completo aos dados', selectedOption: 'Cliente/Usuário', isChecked: true,
};

test('Nest HTTP preserves the email contract and protections', async () => {
  const app = await createApp();
  let deliveries = 0;
  const mail = app.get(MailService);
  mail.sendLgpd = async (data) => { deliveries++; assert.equal(data.nome, 'Pessoa'); };
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const post = (body, origin = 'https://example.com') => fetch(`${base}/terceiro/send-aviso/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
  try {
    const root = await fetch(base, { redirect: 'manual' });
    assert.equal(root.status, 302);
    assert.equal(root.headers.get('location'), '/docs');
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { msg: 'ok' });
    const docs = await fetch(`${base}/docs`);
    assert.equal(docs.status, 200);
    assert.match(await docs.text(), /swagger-ui/);
    const asset = await fetch(`${base}/docs/swagger-ui-init.js`);
    assert.equal(asset.status, 200);
    const specification = await fetch(`${base}/docs-json`);
    assert.equal(specification.status, 200);
    const document = await specification.json();
    assert.equal(document.info.title, '3rcgo API');
    assert.ok(document.paths['/health'].get);
    const operation = document.paths['/terceiro/send-aviso'].post;
    assert.equal(operation.requestBody.content['application/json'].schema.$ref, '#/components/schemas/LgpdDto');
    assert.ok(operation.responses['502']);
    const schema = document.components.schemas.LgpdDto;
    assert.ok(schema.required.includes('isChecked'));
    assert.ok(!schema.required.includes('outroSelected'));
    assert.equal(schema.properties.descricao.maxLength, 10000);
    assert.ok(schema.properties.selectedOption.enum.includes('Outro'));
    assert.equal((await post(payload, 'https://other.example')).status, 403);
    const options = await fetch(`${base}/terceiro/send-aviso/`, {
      method: 'OPTIONS', headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' },
    });
    assert.equal(options.status, 204);
    assert.equal(options.headers.get('access-control-allow-origin'), 'https://example.com');
    const success = await post({ ...payload, to: 'attacker@example.com' });
    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { msg: 'Obrigado! Sua mensagem foi enviada!' });
    assert.equal((await post({ ...payload, isChecked: false })).status, 400);
    assert.equal((await post({ ...payload, selectedInfo: 'inválido' })).status, 400);
    const { BadGatewayException } = await import('@nestjs/common');
    mail.sendLgpd = async () => { throw new BadGatewayException('Falha simulada.'); };
    const failure = await post(payload);
    assert.equal(failure.status, 502);
    assert.deepEqual(await failure.json(), { msg: 'Falha simulada.' });
    await post(payload);
    assert.equal((await post(payload)).status, 429);
    assert.equal(deliveries, 1);
    const oversized = await post({ ...payload, descricao: 'x'.repeat(40000) });
    assert.equal(oversized.status, 413);
  } finally { await app.close(); }
});
