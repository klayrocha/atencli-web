# Changelog

## [Unreleased]

## [0.9.0] - 2026-10-25

### Adicionado

- Toggle “Tipo de exibição” nas etapas do atendimento, com os modos “Padrão” (acordeões) e “Mesma linha” (todas as colunas com rolagem horizontal).
- Confirmação individual de pausas da agenda, com validação na própria linha e bloqueio dos campos após confirmar.

### Alterado

- Pausas configuradas por dia de funcionamento, com ativação independente, máscara de horário e descrição obrigatória.
- Salvamento da agenda exige confirmar as novas pausas e valida horários, limites do expediente e sobreposições.

## [0.8.0] - 2026-10-19

### Adicionado

- Busca de serviços por nome ou área, ignorando maiúsculas e acentos.
- Filtro “Não quero ver na lista” com termos de exclusão em tags removíveis, combinado com a busca e preservando valores e seleções dos serviços ocultos.
- Flag “Mostrar apenas selecionados”, ativada automaticamente ao identificar campos inválidos no salvamento; limpa os filtros de texto e abre a página da primeira pendência.

### Alterado

- Paginação dos serviços acompanha os filtros e mostra a página atual, até três seguintes e reticências, mantendo os controles na mesma linha.
- Página atual ajustada ao desmarcar itens no filtro de selecionados, evitando páginas vazias.

## [0.7.0] - 2026-10-19

### Adicionado

- Etapa de configuração de profissionais, com serviços, horários e indisponibilidades, integrada à agenda.
- Suporte a múltiplas áreas de atuação da clínica nos catálogos de especialidades e serviços.

- Confirmação ao sair de configurações com alterações pendentes após concluir o onboarding: salva na API antes da navegação, permite continuar editando e mantém a tela em caso de falha.
- Aviso nativo do navegador ao fechar ou recarregar uma configuração com alterações pendentes.

### Corrigido

- Edição de clínica concluída carrega os dados da API sem substituir por rascunhos locais antigos.
- Salvamento de configurações separado da navegação; erros de salvamento exibidos e remoções de exceções de horário persistidas na API.

## [0.6.0] - 2026-10-12

### Adicionado

- Script `scripts/preparar-prod.sh` para instalar dependências, gerar Angular e ajuda para `/web/` e conferir os arquivos estáticos de publicação.
- Central de ajuda Docusaurus em `help/`, com busca local em português, 14 artigos iniciais e geração estática integrada ao build do front.
- Menu Ajuda abre a rota `/ajuda`, protegida pelo guard de autenticação, com documentação incorporada da pasta estática `ajuda-docs/`.
- Guia de edição, execução local e publicação da documentação em `help/README.md`.

### Alterado

- Cabeçalho da ajuda simplificado, sem logo e sem link de retorno ao Atenclin.
- Menu lateral recolhido automaticamente ao entrar na ajuda, mantendo a expansão manual.

### Corrigido

- Acesso à revisão por `source=menu` redireciona para a configuração inicial quando o progresso da clínica salvo no navegador ainda não está concluído, inclusive no acesso direto.

## [0.5.0] - 2026-10-08

### Adicionado

- Tela de Tarefas integrada à API, com resumo, filtros, criação, edição, conclusão individual e em massa, cancelamento, reabertura e acesso à conversa vinculada.
- Agenda e acompanhamento automático integrados ao atendimento.
- Rota pública `/invite/:token`, sem guard de autenticação, para consultar e confirmar convites com senha ou Google, incluindo tratamento de convites expirados, cancelados e já aceitos.
- Modal de atribuição de atendimento humano em Conversas, com atendentes habilitados da clínica, destaque para o usuário logado e avatar com iniciais quando não há foto.
- Seletor de 10, 25, 50 ou 100 serviços por página no onboarding.

### Alterado

- Aceitar sugestões preenche os valores praticado e de convênio dos serviços habilitados em todas as páginas.
- Valor de convênio oculto e enviado como `null` quando a clínica não aceita plano de saúde.
- Exceções de horário só podem ser adicionadas em dias com atendimento padrão válido, com mensagem explicativa e botão desabilitado.

### Corrigido

- Erros de convite, incluindo HTTP 409 por e-mail cadastrado ou convite pendente, exibidos no formulário sem apagar os dados preenchidos.
- Paginação dos serviços recalculada ao carregar o catálogo e alterar a quantidade por página, incluindo lista vazia.
- Contrato dos detalhes de convite alinhado aos campos `clinicName` e `invitedName` retornados pela API.
- Proteção contra respostas atrasadas e falhas ao atribuir responsáveis às conversas.

### Integração

- Requer a API com `GET /api/v1/whatsapp/conversation-assignees` e suporte a `planPrice` nulo para clínicas sem plano de saúde, incluindo a migração V28.

## [0.4.0] - 2026-09-28

### Adicionado

- Tela de conversas integrada ao backend, com lista e mensagens paginadas, dados do contato, filtros por responsável, busca nas conversas carregadas e envio de texto.
- Rascunhos independentes por contato, preservação do texto em falhas de envio e proteção contra respostas atrasadas ao trocar de conversa.
- Ícones de foto nos perfis e layout responsivo para desktop e celular.
- Intervalo entre consultas configurável de 1 a 120 minutos, com switch de ativação, campo restrito a três dígitos e persistência na API.
- Progresso do onboarding salvo por clínica neste navegador, retomada da configuração e etapas concluídas com links de revisão nos indicadores superiores e no resumo lateral.
- Testes dos contratos HTTP, paginação, envio, progresso, navegação, intervalos e fechamento de dias.

### Alterado

- Banner inicial adaptado ao andamento da configuração e oculto após a conclusão.
- Menu Configurações direcionado à revisão, com a seção de ajustes expandida e o box de conclusão oculto quando acessado pelo menu.
- Botão Revisar passa a validar e salvar as regras da IA antes de avançar, substituindo o botão separado de salvar.
- Ação final renomeada para “Acompanhar atendimentos”, mantida apenas no resumo lateral e direcionada a Conversas.
- Título do box de conclusão alinhado ao lado do ícone.
- Banners de sugestão de IA em Especialidades e Serviços comentados para uso posterior.
- Remoção das simulações de notas internas, sugestões de IA e contagem de não lidas da tela de conversas integrada.

### Corrigido

- Dias desmarcados no passo Horários agora removem os horários recorrentes e intervalos associados na API, preservando exceções por data.
- Reabertura dos horários mantém todos os dias fechados quando não existem horários cadastrados.
- Progresso concluído permanece em 100% ao voltar para editar etapas.

## [0.3.0] - 2026-09-22

### Adicionado

- Integração do WhatsApp Business com a API e o Embedded Signup da Meta, com consulta de status e ativação ou pausa da integração.
- Tratamento de carregamento, cancelamento, erros e validação do PIN na conexão do WhatsApp.
- Passo 7 do onboarding para configuração da IA em `/ia`, com modo de atendimento, tom de voz, tamanho das respostas, horários, mensagens, assuntos permitidos e regras de transferência para atendimento humano.
- Persistência das configurações e controle de ativação da IA pela API, com acesso para administradores e gestores.
- Passo 8 com conclusão do onboarding, acesso aos atendimentos e revisão das configurações com busca por assunto.
- Testes para conexão com a Meta, configuração do WhatsApp, regras da IA e busca das etapas de revisão.

### Alterado

- Substituição da simulação local do WhatsApp pela integração com o backend e remoção da ação simulada de desconexão.
- Layout responsivo da conexão do WhatsApp e destaque do botão de início do atendimento ao concluir o onboarding.

### Segurança

- Remoção das credenciais de demonstração exibidas na tela de login.
- Validação da origem das mensagens da Meta e tratamento de erros sem exibir detalhes internos retornados pela API.

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
