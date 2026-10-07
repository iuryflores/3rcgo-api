import test from 'node:test';
import assert from 'node:assert/strict';
import { lgpdEmailHtml } from '../src/email-template.js';
const data = { nome: 'Pessoa <script>alert(1)</script>', email: 'pessoa@example.com', celular: '62999999999', documentos: 'Documento fictício', descricao: 'Primeira linha\nSegunda linha & detalhes', selectedInfo: 'Acesso completo aos dados', selectedOption: 'Cliente/Usuário', outroSelected: '', isChecked: true };
test('escapa conteúdo informado e preserva quebras de linha na mensagem HTML', () => {
  const html = lgpdEmailHtml({ ...data, descricao: data.descricao.replace('\n', '\n') });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Primeira linha<br>Segunda linha &amp; detalhes'));
  assert.ok(html.includes('Aceite do Aviso de Privacidade:</strong> Sim'));
  assert.ok(!html.includes('>Outro</div>'));
});
test('inclui identificação adicional quando Outro está preenchido', () => {
  assert.ok(lgpdEmailHtml({ ...data, selectedOption: 'Outro', outroSelected: 'Representante legal' }).includes('Representante legal'));
});