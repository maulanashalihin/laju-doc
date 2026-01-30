# Laju Documentation

Documentation site for Laju Framework — built with VitePress.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
laju-doc/
├── docs/
│   ├── .vitepress/         # VitePress config
│   │   └── config.ts
│   ├── guide/              # Guide documentation
│   │   ├── index.md        # Quick Start
│   │   ├── introduction.md
│   │   ├── ai-development.md
│   │   └── ...
│   ├── api/                # API reference
│   ├── examples/           # Code examples
│   ├── public/             # Static assets
│   └── index.md            # Homepage
├── package.json
└── README.md
```

## 📝 Writing Documentation

### Adding New Pages

1. Create `.md` file in appropriate directory
2. Add frontmatter:
```yaml
---
title: Page Title
---
```

3. Update `config.ts` sidebar if needed

### Code Blocks

Use TypeScript syntax highlighting:

```typescript
// Example code
import DB from "app/services/DB";

const posts = await DB.selectFrom("posts").selectAll().execute();
```

### Custom Containers

::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger STOP
This is dangerous
:::

## 🎨 Theming

Edit `docs/.vitepress/config.ts` to customize:

- Colors: CSS variables in `head` section
- Logo: Replace `docs/public/logo.svg`
- Navbar: Edit `themeConfig.nav`
- Sidebar: Edit `themeConfig.sidebar`

## 🌐 Deployment

### GitHub Pages

```bash
npm run build
```

Push `docs/.vitepress/dist` to `gh-pages` branch.

### Vercel/Netlify

Connect repository and set build command:
```
npm run build
```

Output directory:
```
docs/.vitepress/dist
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-doc`)
3. Commit your changes (`git commit -m 'Add amazing doc'`)
4. Push to the branch (`git push origin feature/amazing-doc`)
5. Open a Pull Request

## 📄 License

MIT License — same as Laju Framework.