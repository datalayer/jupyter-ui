/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/** @type {import('@docusaurus/types').DocusaurusConfig} */

// const path = require('path');

module.exports = {
  title: '🪐 ⚛️ Jupyter UI',
  tagline: 'React.js components 💯% compatible with 🪐 Jupyter.',
  url: 'https://jupyter-ui.datalayer.tech',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'datalayer',
  projectName: 'Jupyter UI',
  plugins: [
    '@datalayer/jupyter-docusaurus-plugin',
    '@docusaurus/theme-live-codeblock',
    'docusaurus-lunr-search',
  ],
  /*
			'docusaurus-plugin-typedoc',
			{
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
			},
  */
    themes: [
      '@docusaurus/theme-mermaid',
    ],
    themeConfig: {
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
      },
      prism: {
        additionalLanguages: ['bash'],
      },
      liveCodeBlock: {
        playgroundPosition: 'bottom',
      },
      navbar: {
        title: 'Jupyter UI',
        logo: {
          alt: 'Datalayer Logo',
          src: 'img/datalayer/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'about/index',
            position: 'left',
            label: 'About',
          },
          {
            type: 'doc',
            docId: '/category/develop',
            position: 'left',
            label: 'Develop',
          },
          {
            type: 'doc',
            docId: '/category/components',
            position: 'left',
            label: 'Components',
          },
          {
            type: 'doc',
            docId: '/category/state',
            position: 'left',
            label: 'State',
          },
          {
            type: 'doc',
            docId: '/category/deployments',
            position: 'left',
            label: 'Deployments',
          },
          {
            type: 'doc',
            docId: '/category/examples',
            position: 'left',
            label: 'Examples',
          },
          {
            type: 'doc',
            docId: '/category/integrations',
            position: 'left',
            label: 'Integrations',
          },
          {
            type: 'doc',
            docId: '/category/themes',
            position: 'left',
            label: 'Themes',
          },
          {
            type: 'doc',
            docId: '/category/demos',
            position: 'left',
            label: 'Demos',
          },
          {
            type: 'doc',
            docId: 'resources/index',
            position: 'left',
            label: 'Resources',
          },
          {
            type: 'doc',
            docId: 'support/index',
            position: 'left',
            label: 'Support',
          },
          {
            type: 'doc',
            docId: 'license/index',
            position: 'left',
            label: 'License',
          },
          {
            href: 'https://www.linkedin.com/company/datalayer',
            position: 'right',
            className: 'header-linkedin-link',
            'aria-label': 'Linkedin',
          },
          {
            href: 'https://x.com/DatalayerIO',
            position: 'right',
            className: 'header-x-link',
            'aria-label': 'X',
          },
          {
            href: 'https://github.com/datalayer/jupyter-ui',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
          {
            href: 'https://datalayer.tech',
            position: 'right',
            className: 'header-datalayer-io-link',
            'aria-label': 'Datalayer Tech',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/datalayer',
              },
              {
                label: 'X',
                href: 'https://x.com/datalayerio',
              },
              {
                label: 'Linkedin',
                href: 'https://www.linkedin.com/company/datalayer',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Datalayer',
                href: 'https://datalayer.io',
              },
              {
                label: 'Datalayer Docs',
                href: 'https://docs.datalayer.io',
              },
              {
                label: 'Datalayer Tech',
                href: 'https://datalayer.tech',
              },
              {
                label: 'Datalayer Guide',
                href: 'https://datalayer.guide',
              },
              {
                label: 'Datalayer Blog',
                href: 'https://datalayer.blog',
              },
            ],
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Datalayer, Inc.`,
      },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/datalayer/jupyter-ui/edit/main',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://datalayer.blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
