import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    lang: 'en-US',
    title: 'Laju',
    titleTemplate: ':title | Laju Framework',
    description: 'High-performance TypeScript web framework with AI-native architecture',

    lastUpdated: true,
    cleanUrls: true,
    ignoreDeadLinks: [
      /^\/guide\//,
      /^\/api\//,
      /^\/examples\//
    ],

    head: [
      ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
      ['meta', { name: 'theme-color', content: '#f97316' }],
      ['meta', { name: 'og:type', content: 'website' }],
      ['meta', { name: 'og:locale', content: 'en' }],
      ['meta', { name: 'og:site_name', content: 'Laju Framework' }],
    ],

    themeConfig: {
      logo: '/logo.png',

      nav: [
        { text: 'Guide', link: '/guide/' },
        { text: 'API', link: '/api/' },
        { text: 'Examples', link: '/examples/' },
        {
          text: 'v1.0.9',
          items: [
            { text: 'Changelog', link: 'https://github.com/maulanashalihin/laju/releases' },
            { text: 'Contributing', link: 'https://github.com/maulanashalihin/laju/blob/main/CONTRIBUTING.md' }
          ]
        }
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Getting Started',
            collapsed: false,
            items: [
              { text: 'Quick Start', link: '/guide/' },
              { text: 'Introduction', link: '/guide/introduction' },
              { text: 'Installation', link: '/guide/installation' },
              { text: 'AI Development', link: '/guide/ai-development' },
            ]
          },
          {
            text: 'Core Concepts',
            collapsed: false,
            items: [
              { text: 'Project Structure', link: '/guide/project-structure' },
              { text: 'Routing', link: '/guide/routing' },
              { text: 'Controllers', link: '/guide/controllers' },
              { text: 'Database', link: '/guide/database' },
            ]
          },
          {
            text: 'Frontend',
            collapsed: false,
            items: [
              { text: 'Svelte 5', link: '/guide/svelte' },
              { text: 'Inertia.js', link: '/guide/inertia' },
              { text: 'Forms', link: '/guide/forms' },
              { text: 'Styling', link: '/guide/styling' },
            ]
          },
          {
            text: 'Features',
            collapsed: false,
            items: [
              { text: 'Authentication', link: '/guide/authentication' },
              { text: 'Validation', link: '/guide/validation' },
              { text: 'Middleware', link: '/guide/middleware' },
              { text: 'File Storage', link: '/guide/storage' },
              { text: 'Email', link: '/guide/email' },
              { text: 'Caching', link: '/guide/caching' },
            ]
          },
          {
            text: 'Deployment',
            collapsed: false,
            items: [
              { text: 'Building', link: '/guide/building' },
              { text: 'Production', link: '/guide/production' },
              { text: 'Testing', link: '/guide/testing' },
              { text: 'CI/CD', link: '/guide/cicd' },
            ]
          }
        ],

        '/api/': [
          {
            text: 'API Reference',
            items: [
              { text: 'Overview', link: '/api/' },
              { text: 'Request', link: '/api/request' },
              { text: 'Response', link: '/api/response' },
              { text: 'Database', link: '/api/database' },
              { text: 'Services', link: '/api/services' },
            ]
          }
        ],

        '/examples/': [
          {
            text: 'Examples',
            items: [
              { text: 'Overview', link: '/examples/' },
              { text: 'Blog System', link: '/examples/blog' },
              { text: 'Todo App', link: '/examples/todo' },
              { text: 'E-commerce', link: '/examples/ecommerce' },
              { text: 'API Server', link: '/examples/api' },
            ]
          }
        ]
      },

      editLink: {
        pattern: 'https://github.com/maulanashalihin/laju-doc/edit/main/docs/:path',
        text: 'Edit this page on GitHub'
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/maulanashalihin/laju' },
        { icon: 'twitter', link: 'https://twitter.com/maulanashalihin' }
      ],

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2025 Maulana Shalihin'
      },

      search: {
        provider: 'local'
      },

      outline: {
        level: 'deep'
      }
    }
  })
)
