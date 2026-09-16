# Changelog

## [Unreleased]

## [0.2.0] - 2026-09-16

### Adicionado

- Passo 6 do onboarding para configuração do WhatsApp Business.
- Rotas `/wizard-step-6-whatsapp` e `/configuracoes/whatsapp`.
- Painel de status da integração com nome verificado, número conectado, tipo de conexão e sincronização.
- Controle visual de acesso para administradores e gestores.
- Simulação local do fluxo de conexão com estado de carregamento e resultado bem-sucedido.
- Ações simuladas para pausar, ativar e desconectar a integração.

### Segurança

- A tela não solicita nem armazena access token, App Secret ou chave de criptografia da Meta.
- Nenhuma integração HTTP ou carregamento do SDK da Meta foi incluído nesta versão.

## [0.1.3] - 2026-09-16

### Adicionado

- Renovação automática do token de sessão a partir do header `Authorization` retornado pela API a cada requisição autenticada.
- Redirecionamento automático para o login quando uma chamada autenticada retorna 401.
- Validação visível no passo de Serviços: destaque dos campos pendentes, mensagem de erro e navegação automática até o primeiro serviço incompleto.

### Alterado

- Payload de planos de saúde revertido para o formato simplificado `{ healthPlanIds }`.
- Combo de cargos da equipe restrito a Administrador, Gestor e Atendente/Recepcionista.
- Remoção de termos em inglês exibidos nos passos de Serviços, Horários e Equipe ("BULK ACTION", "WORKING_HOURS", "CLOSED", "SPECIFIC_DATE", "INVITATION_STATUS", "INVITATION_PENDING").

## [0.1.2] - 2026-09-12

### Adicionado

- Integração do onboarding com os catálogos e endpoints de persistência de clínica, planos de saúde, especialidades, serviços e disponibilidade.
- Carregamento dos dados já cadastrados ao reabrir os passos do wizard, incluindo especialidades, serviços e horários.
- Integração da tela de equipe com listagem de membros, convites, reenvio, cancelamento, edição de acesso e transferência de propriedade.
- Proteção do administrador logado contra edição, desativação e transferência indevida.
- Cópia de valores sugeridos para valor praticado e de valor praticado para valor de convênio no passo de serviços.
- Layout compacto e responsivo para a lista de exceções de horário.

### Adicionado

#### Wizard de Onboarding da Clínica
- Componente compartilhado `WizardSummaryComponent` com barra lateral reutilizável em todos os passos:
  - Gráfico de progresso circular dinâmico SVG
  - Lista de etapas com status de conclusão
  - Card "Quase lá! 🎉" com botão "Ativar atendimento"
- **Passo 1 — Sobre a Clínica (`/wizard-step-1-aboult`):**
  - Stepper horizontal numerado de 1 a 8
  - Formulário: Nome da clínica, Tipo de clínica, Descrição curta, Cidade, Estado, Telefone e E-mail
  - Campo "Aceita plano de saúde?" com seleção visual Sim/Não
  - Card de recomendação por IA com preenchimento automático inteligente
- **Passo 2 — Especialidade (`/wizard-step-2-specialty`):**
  - Campo de busca em tempo real com limpeza rápida
  - Área de chips/tags removíveis para especialidades ativas
  - Grid de cards interativos para seleção com checkbox customizado
  - Sugestão inteligente por IA
- **Passo 3 — Serviços (`/wizard-step-3-services`):**
  - Tabela com 30 serviços odontológicos paginados (10 por página)
  - Colunas: habilitação, nome/categoria, sugestão de valor, valor praticado, valor convênio e duração
  - Bulk Actions: "Aplicar Duração Padrão" e "Aceitar Sugestões"
  - Paginação reativa com signals e computed
  - Banner de recomendação por IA
- **Passo 4 — Horários (`/wizard-step-4-schedule`):**
  - Seção de Horários de Funcionamento Padrão: 7 cards (Seg–Dom) com toggle e inputs de horário
  - Seção de Exceções com accordion colapsável e formulário de data/tipo/período
  - Preview do Calendário com grid visual de slots 8h–18h × 7 dias
  - Card API Example (dark) com payload JSON dinâmico no painel lateral
- **Passo 5 — Equipe (`/wizard-step-5-team`):**
  - Tabela de membros com avatar colorido (iniciais), nome, e-mail, status e perfil
  - Status badges semânticos: ACTIVE, INACTIVE, INVITATION_PENDING, EXPIRY60H_EXPIRED, CANCATION_CANCELLED
  - Edição inline de membros existentes
  - Painel animado "Convidar Novo Membro" com formulário de e-mail e perfil
  - Seção de Convites Pendentes em accordion com ações de reenvio/cancelamento

#### Identidade Visual
- Logo oficial com mascote Atenclin (`logo.png`) adicionado ao projeto
- Favicons atualizados (`favicon.ico`, `favicon.svg`) com cache busting no `index.html`
- Tipografia Google Fonts Inter integrada ao `index.html`
- Paleta de cores unificada via variáveis CSS globais (verde lima `#84cc16` como cor principal)

#### Autenticação e Cadastro
- Nova landing page e tela de cadastro de usuário (`/register`):
  - Formulário com nome completo, e-mail, telefone/WhatsApp, senha e confirmação de senha
  - Integração com o endpoint `POST /api/v1/user`
  - Painel lateral com apresentação das vantagens e diferenciais da Atenclin
  - Validação de segurança de senha em tempo real com indicadores visuais
  - Tela de confirmação pós-cadastro
- Link "Cadastre-se aqui" adicionado na tela de login (`/login`)
- Login com e-mail e senha via `POST /api/v1/auth` com JWT no header `Authorization`
- Login com Google via OAuth2 Authorization Code Flow (`/oauth2/authorization/google`)
- Rota `/oauth2/callback` que captura o token JWT retornado pelo backend e inicia a sessão
- Funcionalidade "Esqueci a senha" via `POST /api/v1/user/forgot-password`
- Sessão persistida em `sessionStorage` (`ch_user`, `ch_token`, `ch_profile`)

#### Layout e Navegação
- Sidebar colapsável com logo Atenclin e menu de navegação
- Topbar com exibição da clínica atual, data e menu do usuário
- Rotas de onboarding adicionadas ao `app.routes.ts` com `authGuard`

#### Perfil e Conta
- Busca automática do perfil completo via `GET /api/v1/user/{uuid}` após login
- Drawer lateral "Minha conta" acessível pelo dropdown do usuário na topbar
- Alteração de senha com validação em tempo real e mensagens amigáveis de erro
- Token atualizado automaticamente após troca de senha bem-sucedida
- Usuários autenticados via Google não visualizam a opção de alterar senha

#### Dashboard
- Banner de destaque: "Chegou a hora de configurar sua clínica! 🚀" com link para o Wizard
- Saudação personalizada com o primeiro nome do usuário logado
- Cards de pulso da clínica, jornada de atendimento, ações prioritárias e próximas consultas
