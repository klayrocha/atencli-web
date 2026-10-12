# Central de ajuda Atenclin

Docusaurus gera HTML, CSS, JavaScript e índice de busca estáticos. O Angular
inclui essa saída na mesma publicação. Node é usado apenas no desenvolvimento
ou CI, nunca como serviço obrigatório no servidor de produção.

## Executar localmente

Requisito: Node.js 22. Na pasta `atencli-web`, instale as duas dependências:

```sh
npm ci
npm ci --prefix help
npm start
```

Acesse `http://localhost:4200/ajuda` após fazer login. O comando gera os artigos
com a busca e inicia somente o Angular. Não há necessidade da porta 3000.
Após editar artigos, execute `npm run help:build` (ou reinicie `npm start`) e
recarregue a ajuda. O build estático não acompanha alterações Markdown automaticamente.

Para edição isolada com atualização automática, `npm run help:start` continua
opcional na porta 3000, mas esse servidor não é usado pelo menu do Angular.
Não execute o modo isolado e a geração integrada simultaneamente, pois ambos
usam o cache do Docusaurus. A busca deve ser validada no build estático.

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

## Gerar e publicar

Na pasta `atencli-web`, para o caminho de produção `/web/`:

```sh
npm run build -- --base-href /web/
```

Para publicar na raiz do domínio, use `npm run build` sem `--base-href`.
O script `scripts/with-help.mjs` usa o mesmo prefixo para Angular e Docusaurus,
gera a ajuda primeiro e interrompe o processo caso qualquer build falhe.
Use os comandos npm acima; `ng build` sozinho não regenera a documentação.

Saída de publicação:

```text
dist/atencli-web/browser/
├── index.html                  # Aplicação Angular
├── *.js / *.css                # Recursos Angular
└── ajuda-docs/
    ├── index.html              # Página inicial da documentação
    ├── artigos/*/index.html    # Artigos estáticos
    ├── assets/                # CSS e JavaScript da documentação
    └── search-index*.json      # Busca local
```

Publique todo o conteúdo de `dist/atencli-web/browser/` no diretório `/web/`
do servidor HTTP. Não envie `node_modules`, código da API ou backups.
A rota do produto será `/web/ajuda` e os arquivos ficarão em `/web/ajuda-docs/`.
Não há subdomínio separado nem processo Docusaurus em produção.

O servidor precisa servir `index.html` de diretórios da documentação. Em Nginx,
adapte o `root` ao diretório pai da pasta física `web`:

```nginx
location /web/ajuda-docs/ {
    index index.html;
    try_files $uri $uri/ =404;
}
location /web/ {
    try_files $uri $uri/ /web/index.html;
}
```

Não aplique o fallback Angular aos arquivos da documentação: recursos ausentes
devem retornar 404. Permita frames da mesma origem se houver CSP/frame-ancestors
ou X-Frame-Options configurados. Não foi alterada a configuração do servidor.

## Autenticação

O menu navega para a rota Angular `/ajuda`, sob `authGuard`, e carrega a ajuda
em um iframe da mesma origem. Sem sessão válida, a rota redireciona ao login.
O iframe usa um caminho fixo relativo ao `<base href>` da aplicação.

**O guard não protege os arquivos estáticos contra acesso direto.** Qualquer
pessoa com a URL de `ajuda-docs/` consegue obter o conteúdo se o servidor servir
essa pasta publicamente. Para restringir também os arquivos e o índice de busca,
o servidor/proxy precisa validar a sessão em cada requisição. Essa proteção
adicional não está implementada; não coloque informações confidenciais nos artigos.

## Configuração e validação

`HELP_SITE_URL` define a origem canônica (padrão `https://www.atenclin.com`).
No build integrado, `HELP_BASE_URL` é derivado de
`--base-href`. O prefixo deve começar e terminar com `/`, como `/web/`.

```sh
npm run build -- --base-href /web/
```

Confira login obrigatório em `/web/ajuda`, navegação entre artigos, imagens,
busca por “horários” e recarregamento de páginas. O índice é servido localmente.

Referências:
- https://docusaurus.io/docs/deployment
- https://angular.dev/guide/routing/route-guards
