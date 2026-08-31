# atencli-web

Frontend da plataforma **Atenclin** — sistema de atendimento inteligente para clínicas, com integração de WhatsApp, agendamento e IA.

## Stack

- Angular 18
- TypeScript
- PrimeNG · PrimeFlex
- SCSS

## Pré-requisitos

- Node.js 18+
- Backend [`atencli-api`](https://github.com/klayrocha/atencli-api) rodando em `http://localhost:8080`

## Instalação

```bash
npm install
```

## Executar localmente

```bash
npx ng serve
```

Acesse em `http://localhost:4200`.

## Build de produção

```bash
npx ng build
```

## Autenticação

| Método | Endpoint |
|---|---|
| E-mail / senha | `POST /api/v1/auth` → JWT no header `Authorization` |
| Google OAuth2 | `GET /oauth2/authorization/google` → callback em `/oauth2/callback?token=` |

## Funcionalidades

- Login com e-mail/senha e Google OAuth2
- Recuperação de senha
- Dashboard com saudação personalizada e indicadores da clínica
- Sidebar colapsável e topbar com menu do usuário
- Drawer "Minha conta" com alteração de senha (validação de força em tempo real)
- Usuários Google não visualizam a opção de alterar senha
