#!/bin/sh
# Prepara os arquivos estáticos; não publica nem altera o servidor.
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf '%s\n' 'Erro: instale Node.js 22 e npm antes de executar este script.' >&2
  exit 1
fi

node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Erro: use Node.js 22 ou superior (recomendado: 22)."); process.exit(1); }'

if [ ! -f package-lock.json ] || [ ! -f help/package-lock.json ]; then
  printf '%s\n' 'Erro: os arquivos package-lock.json do front e da ajuda são obrigatórios.' >&2
  exit 1
fi

printf '\n%s\n' '[1/3] Instalando dependências do front e da ajuda...'
# Inclui as ferramentas de build mesmo quando NODE_ENV=production.
npm ci --include=dev --no-audit --no-fund
npm ci --prefix help --include=dev --no-audit --no-fund

printf '\n%s\n' '[2/3] Gerando documentação e Angular para /web/...'
npm run build -- -c production --base-href /web/ --deploy-url /web/

printf '\n%s\n' '[3/3] Conferindo os arquivos de publicação...'
OUTPUT_DIR="$PROJECT_DIR/dist/atencli-web/browser"
for file in index.html ajuda-docs/index.html ajuda-docs/search-index.json; do
  if [ ! -s "$OUTPUT_DIR/$file" ]; then
    printf 'Erro: arquivo de publicação ausente ou vazio: %s\n' "$OUTPUT_DIR/$file" >&2
    exit 1
  fi
done

printf '\n%s\n' 'Produção preparada com sucesso.'
printf 'Publique todo o conteúdo de: %s\n' "$OUTPUT_DIR"
printf '%s\n' 'Destino: /web/ (incluindo ajuda-docs/).' 'Nenhum arquivo foi enviado ao servidor.'
