# Changelog

## [Unreleased]

### Adicionado

#### Autenticação e Cadastro
- Nova landing page e tela de cadastro de usuário (`/register`):
  - Formulário com nome completo, e-mail, telefone/WhatsApp, senha e confirmação de senha
  - Integração com o endpoint `POST /api/v1/user`
  - Painel lateral com apresentação das vantagens e diferenciais da Atenclin (WhatsApp integrado, IA 24/7, gestão de agenda, métricas em tempo real e conformidade LGPD)
  - Validação de segurança de senha em tempo real com indicadores visuais (mínimo 8 caracteres, pelo menos 1 letra maiúscula e 1 número)
  - Validação de correspondência de confirmação de senha
  - Tela de confirmação pós-cadastro informando envio dos dados de acesso por e-mail
- Link "Cadastre-se aqui" adicionado na tela de login (`/login`)
- Login com e-mail e senha via `POST /api/v1/auth` com JWT no header `Authorization`
- Login com Google via OAuth2 Authorization Code Flow (`/oauth2/authorization/google`)
- Rota `/oauth2/callback` que captura o token JWT retornado pelo backend e inicia a sessão
- Funcionalidade "Esqueci a senha" via `POST /api/v1/user/forgot-password` — resposta sempre neutra por segurança
- Sessão persistida em `sessionStorage` com dados do usuário (`ch_user`, `ch_token`, `ch_profile`)

#### Layout e navegação
- Sidebar colapsável com logo SVG e menu de navegação
- Topbar com exibição da clínica atual, data e menu do usuário (dropdown de troca desabilitado)
- Favicon SVG com identidade visual Atenclin (círculos concêntricos)

#### Perfil e conta
- Busca automática do perfil completo via `GET /api/v1/user/{uuid}` após login
- Drawer lateral "Minha conta" acessível pelo dropdown do usuário na topbar
- Exibe avatar com iniciais, nome completo e e-mail
- Alteração de senha com validação em tempo real:
  - Mínimo 8 caracteres
  - Letra maiúscula e minúscula
  - Número
  - Caractere especial
- Token atualizado automaticamente após troca de senha bem-sucedida
- Usuários autenticados via Google não visualizam a opção de alterar senha

#### Dashboard
- Saudação personalizada com o primeiro nome do usuário logado
- Cards de pulso da clínica, jornada de atendimento, ações prioritárias e próximas consultas
