export type RequestKind = 'lgpd' | 'contact';
export interface ValidatedPayload { email: string; [key: string]: string | boolean; }

const requesterTypes = ['Cliente/Usuário', 'Colaborador', 'Ex Colaborador', 'Fornecedor/Prestador', 'Outro'];
const rights = ['Confirmação de existência de tratamento', 'Acesso completo aos dados', 'Correção ou atualização dos dados', 'Anonimização, bloqueio ou eliminação de dados tratados em desconformidade com a lei', 'Vedação de dados pessoais'];
const contactTypes = ['Dúvida', 'Elogio/Sugestão', 'Crítica/Reclamação', 'Denúncia*'];

export function validatePayload(kind: RequestKind, input: unknown): ValidatedPayload {
  const body = input as Record<string, unknown>;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dados inválidos.');
  const fields = kind === 'lgpd'
    ? ['nome', 'email', 'celular', 'documentos', 'descricao', 'selectedInfo', 'selectedOption']
    : body.tipo === 'Denúncia*' ? ['mensagem', 'tipo'] : ['nome', 'email', 'assunto', 'mensagem', 'tipo'];
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > (['descricao', 'mensagem'].includes(field) ? 10000 : 500)) {
      throw new Error('Preencha todos os campos obrigatórios.');
    }
    result[field] = body[field].trim();
  }
  if (kind === 'contact' && body.tipo === 'Denúncia*') {
    for (const field of ['nome', 'email', 'assunto']) {
      result[field] = typeof body[field] === 'string' ? body[field].trim() : '';
      if (result[field].length > 500) throw new Error('Dados inválidos.');
    }
  }
  if (result.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email) || /[\r\n]/.test(result.email))) throw new Error('Informe um e-mail válido.');
  if (kind === 'lgpd') {
    if (body.isChecked !== true || !requesterTypes.includes(result.selectedOption) || !rights.includes(result.selectedInfo)) throw new Error('Solicitação ou aceite inválido.');

    result.outroSelected = typeof body.outroSelected === 'string' ? body.outroSelected.trim() : '';
    if (result.outroSelected.length > 500 || (result.selectedOption === 'Outro' && !result.outroSelected)) throw new Error('Informe quem está realizando a solicitação.');
  } else {
    if (!contactTypes.includes(result.tipo)) throw new Error('Tipo de manifestação inválido.');
    result.phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    if (result.phone.length > 500) throw new Error('Telefone inválido.');
  }
  return { ...result, email: result.email, ...(kind === 'lgpd' ? { isChecked: true } : {}) };
}

export function emailText(kind: RequestKind, data: ValidatedPayload) {
  const labels: Record<string, string> = {
    nome: 'Nome completo', email: 'E-mail', celular: 'Telefone celular', documentos: 'RG e CPF',
    descricao: 'Descrição da solicitação e finalidade', selectedInfo: 'Direito solicitado',
    selectedOption: 'Quem solicita', outroSelected: 'Outro', isChecked: 'Aceite do Aviso de Privacidade',
    phone: 'Telefone', assunto: 'Assunto', mensagem: 'Mensagem', tipo: 'Tipo de manifestação',
  };
  return `${kind === 'lgpd' ? 'Solicitação de Dados — LGPD' : 'Ouvidoria'}\n\n` +
    Object.entries(data).map(([key, value]) => `${labels[key]}: ${value === true ? 'Sim' : value}`).join('\n\n');
}
