import { HttpErrorResponse } from '@angular/common/http';

const featureMessages: Record<string, string> = {
  INSTAGRAM: 'O Instagram está disponível nos planos Profissional e Plus. Faça o upgrade em Assinatura.',
  AUTOMATIC_FOLLOW_UP: 'O acompanhamento automático está disponível nos planos Profissional e Plus. Faça o upgrade em Assinatura.',
  META_TEMPLATES_OUTSIDE_WINDOW: 'Templates do WhatsApp fora da janela de 24 horas estão disponíveis nos planos Profissional e Plus. Faça o upgrade em Assinatura.',
};

/**
 * Traduz o HTTP 402 do backend (plano sem o recurso, sem assinatura ativa ou limite de usuários).
 * Retorna null para qualquer outro erro, para a tela seguir com a própria mensagem.
 */
export function planRestrictionMessage(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 402) return null;
  const message: string = typeof error.error?.message === 'string' ? error.error.message : '';
  const feature = message.match(/Current plan does not include (\w+)/)?.[1];
  if (feature) return featureMessages[feature] ?? 'O plano atual não inclui este recurso. Faça o upgrade em Assinatura.';
  const userLimit = message.match(/User limit reached for the current plan \((\d+)\)/)?.[1];
  if (userLimit === '1') return 'Sem assinatura ativa, apenas o dono da clínica pode acessar o sistema. Assine um plano em Assinatura para convidar a equipe.';
  if (userLimit) return `O plano atual permite até ${userLimit} usuários, contando convites pendentes. Cancele um convite, desative um usuário ou faça o upgrade em Assinatura.`;
  return 'Esta ação exige uma assinatura ativa. Acesse Assinatura para assinar ou regularizar o pagamento.';
}
