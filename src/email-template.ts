import type { ValidatedPayload } from './validation.js';

function escapeHtml(value: string | boolean | undefined): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function lgpdEmailHtml(data: ValidatedPayload): string {
  const field = (label: string, value: string | boolean | undefined) => `<tr><td style="padding:12px 0;border-bottom:1px solid #dbe5d5"><div style="font-size:12px;font-weight:bold;color:#52654b;margin-bottom:5px">${escapeHtml(label)}</div><div style="font-size:16px;line-height:1.6;color:#2f3e2a;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>')}</div></td></tr>`;
  const section = (title: string, fields: string) => `<h2 style="margin:28px 0 6px;font-size:18px;color:#36502b">${title}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed">${fields}</table>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solicitação de Dados — LGPD</title></head>
<body style="margin:0;padding:0;background:#f3f6f0;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Nova solicitação de dados recebida pelo formulário do site.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe5d5;border-radius:12px;overflow:hidden">
<tr><td align="center" style="padding:24px 28px;background:#ffffff;border-radius:12px 12px 0 0"><img src="cid:cartorio-logo" alt="3º Cartório de Registro Civil e Tabelionato de Notas" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0"></td></tr>
<tr><td style="padding:30px 28px;background:#304925;color:#ffffff">
<p style="margin:0 0 18px;font-size:14px;color:#e1eadc">3º Cartório de Goiânia</p>
<h1 style="margin:0;font-size:26px;line-height:1.3;color:#ffffff">Solicitação de Dados</h1>
<p style="margin:10px 0 0;font-size:14px;color:#e1eadc">Lei Geral de Proteção de Dados · LGPD</p>
</td></tr>
<tr><td style="padding:4px 28px 28px">
${section('Identificação do solicitante', field('Nome completo', data.nome) + field('E-mail', data.email) + field('Telefone celular', data.celular) + field('RG e CPF', data.documentos))}
${section('Detalhes da solicitação', field('Quem solicita', data.selectedOption) + (data.outroSelected ? field('Outro', data.outroSelected) : '') + field('Direito solicitado', data.selectedInfo))}
<h2 style="margin:28px 0 12px;font-size:18px;color:#36502b">Descrição da solicitação e finalidade</h2>
<div style="padding:18px;background:#f3f6f0;border:1px solid #dbe5d5;border-radius:8px;font-size:16px;line-height:1.7;color:#2f3e2a;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(data.descricao).replace(/\r\n|\r|\n/g, '<br>')}</div>
<p style="margin:22px 0 0;padding:14px;background:#edf3e9;border-left:3px solid #5a8447;font-size:14px;line-height:1.6;color:#36502b"><strong>Aceite do Aviso de Privacidade:</strong> ${data.isChecked === true ? 'Sim' : 'Não'}</p>
</td></tr>
<tr><td style="padding:20px 28px;background:#f8faf6;border-top:1px solid #dbe5d5;border-radius:0 0 12px 12px;font-size:12px;line-height:1.7;color:#52654b">Mensagem enviada pelo formulário LGPD do site.<br>Para responder ao solicitante, use a opção “Responder” do seu e-mail.</td></tr>
</table></td></tr></table></body></html>`;
}