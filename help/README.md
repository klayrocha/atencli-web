# Central de ajuda Atenclin

Site público em Docusaurus, independente da API e do build Angular. O código
fica em `atencli-web/help` para que documentação e produto possam ser revisados
no mesmo repositório. Não precisa de banco, login ou serviço de busca externo.

## Executar localmente

Requisito: Node.js 20 ou superior (validado com Node 22).

```sh
cd atencli-web
npm ci --prefix help
npm run help:start
```

Abra http://localhost:3000. O menu Ajuda do Angular em desenvolvimento aponta
para esse endereço. Execute o Angular em outro terminal com `npm start`.

A busca local é gerada no build. Para testar a busca e as páginas como serão
publicadas, prefira:

```sh
npm run help:build
npm run help:serve
```

Pare o servidor de desenvolvimento antes de usar `serve`, pois ambos usam a
porta 3000. O servidor escuta somente na interface local.

## Editar conteúdo

- Artigos: `docs/*.md`.
- Ordem e categorias: `sidebars.js`.
- Página inicial: `src/pages/index.jsx`.
- Identidade visual: `src/css/custom.css`.
- Logo e imagens: `static/img/`.
- Configuração: `docusaurus.config.js`.

Cada artigo possui título, descrição e data da última revisão no front matter.
Atualize `last_update.date` ao revisar o texto. Use links relativos entre os
arquivos Markdown. O build falha quando encontra links internos quebrados.

Modelo de artigo:

```md
---
title: "Título que descreve a ação"
description: "O que a pessoa conseguirá fazer."
last_update:
  date: 2026-10-12
---

## Antes de começar

Requisitos e permissões.

## Passo a passo

1. Abra a tela.
2. Execute a ação.
3. Confira o resultado.

## Se algo não funcionar

Causas conhecidas e próximas ações.

## Veja também

[Guia relacionado](./primeiros-passos.md)
```

Os artigos iniciais foram escritos a partir das telas e contratos do projeto.
Não são uma cópia do suporte Kommo. As capturas de tela ainda não estão
incluídas: adicione imagens revisadas de um ambiente de demonstração, com texto
alternativo e sem dados de pacientes, senhas ou links pessoais de convite.
Exemplo: `![Painel de status do canal](/img/whatsapp-status.png)` após adicionar
esse arquivo. Não crie links para imagens inexistentes.

Não há formulário de suporte, avaliação de artigo ou chat nesta primeira versão.
Não há promessa de importação de histórico ou funcionalidades não confirmadas.

## Publicar

Destino previsto: `https://ajuda.atenclin.com/`. DNS, certificado TLS e publicação
não são configurados automaticamente por este projeto.

No ambiente de build, use a pasta `help` como raiz:

```sh
npm ci
npm run build
```

Publique **somente `help/build/`** em uma hospedagem estática. Em Nginx, por
exemplo, a raiz do virtual host pode apontar para esse diretório e usar:

```nginx
location / {
    try_files $uri $uri/ =404;
}
error_page 404 /404.html;
```

O build usa barras finais e gera páginas em diretórios. Teste o acesso direto
a `/artigos/whatsapp/`, a busca e uma URL inexistente depois da publicação.
Não envie a pasta inteira do workspace, a API, backups ou `node_modules`.

Variáveis opcionais durante o build:

- `HELP_SITE_URL`: origem pública; padrão `https://ajuda.atenclin.com`.
- `HELP_BASE_URL`: caminho base com barras inicial e final; padrão `/`.
- `ATENCLIN_APP_URL`: link de retorno ao produto; padrão
  `https://www.atenclin.com/web/`.

O endereço do menu Angular fica em `src/environments/environment*.ts`, campo
`helpUrl`. Se mudar o domínio da documentação, atualize também esse campo.
Publique a central antes de publicar a alteração do menu para evitar um link
sem destino em produção. A rota `/ajuda` permanece disponível como acesso
público com links para os guias.

## Validação

```sh
npm run help:build
npm run build -- --configuration development
```

O primeiro comando valida a geração estática e os links; o segundo valida a
integração com o Angular. Confira a busca na versão compilada, incluindo termos
com acento como “convênio” e “horários”. O índice é servido pelo próprio site.

Documentação de referência:
- https://docusaurus.io/docs
- https://github.com/easyops-cn/docusaurus-search-local
