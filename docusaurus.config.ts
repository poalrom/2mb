import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: '2mb',
  tagline: 'Modes-based Memory Bank Agentic Workflow',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://poalrom.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/2mb',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'poalrom', // Usually your GitHub org/user name.
  projectName: '2mb', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        // Disable docs and blog since we only want the single page
        docs: {
          routeBasePath: '/memory-bank',
          path: './memory-bank',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/poalrom/2mb/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-mdc-rules',
      {
        id: 'docusaurus-plugin-mdc-rules',
        sourceDir: '.cursor/rules',
        targetPath: '/rules',
        includeMetadata: true,
      }
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  // In order for Mermaid code blocks in Markdown to work,
  // you also need to enable the Remark plugin with this option
  markdown: {
    mermaid: true,
  },

  themeConfig: {
    // Replace with your project's social card
    image: 'img/2mb-social-card.jpg',
    navbar: {
      title: '2MB',
      logo: {
        alt: '2MB Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: '/rules/main',
          label: 'Rules',
          position: 'left',
        },
        {
          href: '/memory-bank/project_brief',
          label: 'Memory Bank',
          position: 'left',
        },
        {
          href: 'https://github.com/poalrom/2mb',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Rules',
              href: '/rules/main',
            },
            {
              label: 'Memory Bank',
              href: '/memory-bank/project_brief',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/poalrom/2mb',
            },
            {
              label: 'Issues',
              href: 'https://github.com/poalrom/2mb/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 2MB Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
