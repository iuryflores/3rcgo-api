import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePayload, emailText } from '../src/validation.js';
const body = { nome: ' Pessoa ', email: 'pessoa@example.com', celular: '62999999999', documentos: 'Documento de teste', descricao: 'Acesso aos dados', selectedInfo: 'Acesso completo aos dados', selectedOption: 'Cliente/Usuário', outroSelected: '', isChecked: true };
test('preserva conteúdo da solicitação e normaliza espaços', () => {
  const result = validatePayload('lgpd', body);
  assert.equal(result.nome, 'Pessoa');
  assert.match(emailText('lgpd', result), /Aceite do Aviso de Privacidade: Sim/);
  assert.match(emailText('lgpd', result), /Direito solicitado: Acesso completo aos dados/);
});
test('recusa ausência de aceite, outro vazio e e-mail com quebra de linha', () => {
  assert.throws(() => validatePayload('lgpd', { ...body, isChecked: false }));
  assert.throws(() => validatePayload('lgpd', { ...body, selectedOption: 'Outro' }));
  assert.throws(() => validatePayload('lgpd', { ...body, email: 'pessoa@example.com\r\nBcc: outra@example.com' }));
});
test('recusa direitos desconhecidos e não aceita destinatário fornecido pelo usuário', () => {
  assert.throws(() => validatePayload('lgpd', { ...body, selectedInfo: 'desconhecido' }));
  assert.equal(validatePayload('lgpd', { ...body, to: 'intruso@example.com' }).to, undefined);
});
test('valida também manifestações da ouvidoria', () => {
  assert.equal(validatePayload('contact', { nome: 'Pessoa', email: 'pessoa@example.com', assunto: 'Teste', mensagem: 'Mensagem', tipo: 'Dúvida' }).tipo, 'Dúvida');
});
test('preserva denúncia anônima com somente tipo e mensagem', () => {
  const result = validatePayload('contact', { tipo: 'Denúncia*', mensagem: 'Relato de teste' });
  assert.equal(result.email, '');
  assert.equal(result.nome, '');
  assert.throws(() => validatePayload('contact', { tipo: 'Dúvida', mensagem: 'Teste' }));
});
