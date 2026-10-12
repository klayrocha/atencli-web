import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const [command, ...args] = process.argv.slice(2);
if (!['start', 'build', 'help'].includes(command)) {
  throw new Error('Comando esperado: start, build ou help.');
}
const baseIndex = args.indexOf('--base-href');
const baseHref = (baseIndex >= 0 ? args[baseIndex + 1] : args.find(arg => arg.startsWith('--base-href='))?.slice(12)) ?? '/';
if (!/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(baseHref) || !baseHref.endsWith('/')) {
  throw new Error('Use --base-href com um caminho local entre barras, como / ou /web/.');
}

function run(file, parameters, env = process.env) {
  const result = spawnSync(process.execPath, [file, ...parameters], { cwd: root, stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Node é necessário somente na máquina de desenvolvimento/build.
run('help/node_modules/@docusaurus/core/bin/docusaurus.mjs', ['build', 'help'], {
  ...process.env,
  HELP_BASE_URL: `${baseHref}ajuda-docs/`,
});
if (command !== 'help') {
  run('node_modules/@angular/cli/bin/ng.js', [command === 'start' ? 'serve' : 'build', ...args]);
}
