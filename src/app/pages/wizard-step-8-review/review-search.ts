import { WIZARD_STEPS_DEFAULT } from '../wizard-shared/wizard.models';

// Local mock knowledge base: descriptions of settings, not saved clinic data.
const REVIEW_CONTENT = [
  { route: '/wizard-step-1-aboult', summary: 'Nome e descrição da clínica, tipo de estabelecimento, telefone, e-mail, cidade, estado e planos de saúde aceitos.', keywords: 'dados contato endereço local localização convenio convenios plano cadastro perfil' },
  { route: '/wizard-step-2-specialty', summary: 'Especialidades e áreas de atuação oferecidas pela clínica.', keywords: 'especialidade especialidades area medicina medico odontologia dermatologia cardiologia' },
  { route: '/wizard-step-3-services', summary: 'Serviços e procedimentos, preços particulares e por convênio, além da duração de cada atendimento.', keywords: 'servico consulta exame procedimento valor valores preco precos custo tabela duracao minutos' },
  { route: '/wizard-step-4-schedule', summary: 'Dias e horários de atendimento da clínica, expediente, intervalos e dias sem atendimento.', keywords: 'horario horarios agenda disponibilidade funcionamento abertura fechamento feriado folga pausa almoco semana' },
  { route: '/wizard-step-5-team', summary: 'Convites para a equipe, funções, permissões e profissionais que podem receber conversas.', keywords: 'usuario usuarios colaborador colaboradores funcionario funcionarios equipe acesso administrador gestor atendente convite convidar permissao senha' },
  { route: '/wizard-step-6-whatsapp', summary: 'Conexão do WhatsApp Business, número vinculado, status da integração e sincronização de contatos e histórico.', keywords: 'whatsapp whats zap meta conectar desconectar numero celular telefone canal integracao sincronizar pausar ativar' },
  { route: '/ia', summary: 'Modo de atuação da IA, tom de voz, mensagens, horários, assuntos permitidos e regras para chamar uma pessoa. Ativação ou pausa da IA.', keywords: 'ia inteligencia artificial assistente virtual robo bot automatico automacao resposta respostas humano transferencia seguranca tom voz mensagem horario ativar pausar' },
];

export const REVIEW_ENTRIES = WIZARD_STEPS_DEFAULT.filter(step => step.id < 8).map((step, index) => ({ ...step, ...REVIEW_CONTENT[index] }));
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ignoredWords = new Set('a o as os um uma de da do das dos e em na no nas nos para por com que eu meu minha meus minhas quero gostaria desejo preciso posso fazer mudar alterar ajustar configurar configuracao configuracoes revisar clinica'.split(' '));

export function searchReviewSteps(query: string) {
  const terms = normalize(query).split(' ').filter(term => term && !ignoredWords.has(term));
  if (!terms.length) return REVIEW_ENTRIES;
  return REVIEW_ENTRIES.filter(step => {
    const words = normalize(`${step.label} ${step.summary} ${step.keywords}`).split(' ');
    return terms.every(term => words.some(word => word.startsWith(term)));
  });
}
