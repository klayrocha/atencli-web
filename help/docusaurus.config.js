const appUrl = process.env.ATENCLIN_APP_URL || 'https://www.atenclin.com/web/';

/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'Ajuda Atenclin',
  tagline: 'Mais clareza para cuidar de cada atendimento.',
  favicon: 'img/favicon.svg',
  url: process.env.HELP_SITE_URL || 'https://ajuda.atenclin.com',
  baseUrl: process.env.HELP_BASE_URL || '/',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: { hooks: { onBrokenMarkdownLinks: 'throw' } },
  i18n: { defaultLocale: 'pt-BR', locales: ['pt-BR'] },
  presets: [['classic', {
    docs: { routeBasePath: 'artigos', sidebarPath: './sidebars.js', showLastUpdateTime: true },
    blog: false,
    theme: { customCss: './src/css/custom.css' },
  }]],
  themes: [['@easyops-cn/docusaurus-search-local', {
    hashed: true, language: ['pt'], docsRouteBasePath: '/artigos',
    indexBlog: false, indexPages: true, highlightSearchTermsOnTargetPage: true,
  }]],
  themeConfig: {
    colorMode: { defaultMode: 'light', disableSwitch: true },
    navbar: {
      title: 'Atenclin | Ajuda', logo: { alt: 'Atenclin', src: 'img/logo.png' },
      items: [
        { to: '/artigos/primeiros-passos', label: 'Comece por aqui', position: 'left' },
        { href: appUrl, label: 'Acessar Atenclin ↗', position: 'right' },
      ],
    },
    footer: { style: 'light', copyright: 'Atenclin · Central de ajuda' },
    docs: { sidebar: { hideable: true } },
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
  },
};
