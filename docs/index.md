---
layout: home

hero:
  name: "Laju"
  text: "The AI-Native TypeScript Framework"
  tagline: Build production-ready applications 10x faster with built-in auth, database, and AI workflows
  image:
    src: /logo.png
    alt: Laju Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/maulanashalihin/laju

features:
  - icon: 🤖
    title: AI-First Design
    details: Built for AI-assisted development. 5-Agent Workflow with mandatory review points. Just describe your app and AI handles the rest.
  - icon: ⚡
    title: Blazing Fast
    details: 258,611 requests/sec with HyperExpress. 11x faster than Express.js and 3,232x faster than Laravel.
  - icon: 🔋
    title: Batteries Included
    details: Authentication, OAuth, file storage, email, caching, rate limiting, and more — all pre-configured.
  - icon: 🛠️
    title: Modern Stack
    details: Svelte 5, TypeScript, Inertia.js, TailwindCSS, and Vite. The best tools, perfectly integrated.
  - icon: 🚀
    title: Production Ready
    details: GitHub Actions CI/CD, automated testing, auto-deployment, and auto-rollback built-in.
  - icon: 📱
    title: Full-Stack Monolith
    details: Backend and frontend in one codebase. No API maintenance, no client-side routing complexity.

---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #f97316 30%, #fb923c);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #f97316 30%, #fb923c 70%);
  --vp-home-hero-image-filter: blur(60px) opacity(0.4);
}
</style>

## Quick Start

### With AI (Easiest)

```bash
npx create-laju-app my-app && cd my-app
npm run migrate && npm run dev
```

Then mention in your AI assistant:

```
@workflow/agents/product.md

"I want to build a blog with posts, categories, and comments"
```

Continue with 5-Agent Workflow: Product → Tech Lead → Developer → QA → DevOps

### Manual

```bash
npx create-laju-app my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

Visit `http://localhost:5555` — your app is running!

## Why Laju?

### Compare with Express.js

| Feature | Express.js | Laju |
|---------|-----------|------|
| Built-in Auth | ❌ Manual setup | ✅ Session + OAuth |
| Frontend | ❌ Not included | ✅ Svelte 5 + Inertia |
| Database | ❌ Bring your own | ✅ SQLite + Kysely |
| Testing | ❌ Manual config | ✅ Vitest + Playwright |
| Performance | 22k req/s | 258k req/s |

### Compare with Laravel

| Feature | Laravel | Laju |
|---------|---------|------|
| Language | PHP | TypeScript |
| Performance | 80 req/s | 258k req/s |
| Frontend | ⚠️ Blade/Inertia separate | ✅ Svelte 5 + Inertia built-in |
| Auth Setup | ⚠️ Manual config | ✅ Pre-configured |
| Type Safety | ❌ Runtime only | ✅ Compile-time |
| Async/Performance | ⚠️ Blocking I/O | ✅ Non-blocking |

### Compare with Next.js

| Feature | Next.js | Laju |
|---------|---------|------|
| React Complexity | ⚠️ Required | ✅ Svelte (simpler) |
| Vercel Lock-in | ⚠️ Pushed | ✅ Self-host friendly |
| Built-in Auth | ❌ NextAuth setup | ✅ Included |
| API Routes | ❌ Separate | ✅ Direct integration |
| Hydration | ⚠️ Required | ✅ Optional SSR |

## Community

- [GitHub Discussions](https://github.com/maulanashalihin/laju/discussions)
- [Twitter](https://twitter.com/maulanashalihin)
- [Website](https://laju.dev)

## License

MIT License — Free for personal and commercial use.