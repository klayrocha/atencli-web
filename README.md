# atencli-web

Frontend da plataforma **Atenclin** — sistema de atendimento inteligente para clínicas, com integração de WhatsApp, agendamento e IA.

## Stack

- Angular 18
- TypeScript
- PrimeNG · PrimeFlex
- SCSS

## Pré-requisitos

- Node.js 22 (para desenvolvimento e geração do build)
- Backend [`atencli-api`](https://github.com/klayrocha/atencli-api) rodando em `http://localhost:8080`

## Instalação

```bash
npm ci
npm ci --prefix help
```

## Executar localmente

```bash
npm start
```

Acesse em `http://localhost:4200`.

## Build de produção

Para instalar as dependências e preparar Angular e ajuda em um único comando:

```bash
./scripts/preparar-prod.sh
```

O script pode ser chamado de qualquer diretório pelo seu caminho completo.
Requer Node.js 22 e acesso ao registro npm. Executa `npm ci` nos dois projetos
e `npm run build -- -c production --base-href /web/ --deploy-url /web/`.
Interrompe em caso de erro e confere os arquivos gerados. Publique todo o conteúdo
de `dist/atencli-web/browser/`, incluindo `ajuda-docs/`, em `/web/` no servidor.
O script não envia arquivos nem altera a produção.

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

## Central de ajuda

A documentação usa Docusaurus em [`help/`](help/README.md). `npm start` gera a
ajuda estática e inicia somente o Angular. `npm run build -- --base-href /web/`
gera o front e a pasta `ajuda-docs/` em `dist/atencli-web/browser/`; publique o
conteúdo completo dessa pasta em `/web/`. Para hospedar na raiz, use `npm run build`.
Não é necessário Node no servidor de produção.

O menu abre `/ajuda` dentro da aplicação, com `authGuard`. Os arquivos da ajuda
são exibidos em um iframe local. O guard protege a rota Angular, mas não impede
acesso direto a `ajuda-docs/`; conteúdo privado exige autenticação no servidor.
