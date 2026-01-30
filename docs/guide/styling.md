# Styling

Learn how to style Laju applications with Tailwind CSS.

## Tailwind CSS v3 (Default)

Laju uses Tailwind CSS v3 with JavaScript configuration by default.

### Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.{svelte,html,js,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

### CSS Entry File

```css
/* resources/js/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Tailwind CSS v4 (Optional)

Tailwind CSS v4 uses CSS-first configuration with Vite plugin.

### CSS Configuration

```css
/* resources/js/index.css */
@import "tailwindcss";

@theme {
  --font-family-sans: 'Inter', sans-serif;
  --font-family-mono: 'Fira Code', monospace;

  --color-brand-400: #fb923c;
  --color-brand-500: #f97316;
  --color-brand-600: #ea580c;

  --shadow-soft: 0 2px 15px -3px rgba(0, 0, 0, 0.07);

  --animate-blob: blob 7s infinite;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
```

### Vite Configuration for v4

```javascript
// vite.config.mjs
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte()
  ],
});
```

## Migration Between Versions

Laju provides a migration script to switch between Tailwind CSS v3 and v4.

### Quick Reference

```bash
# Check current version
npm run tailwind:migrate check

# Upgrade to Tailwind CSS v4
npm run tailwind:migrate to-v4

# Downgrade to Tailwind CSS v3
npm run tailwind:migrate to-v3
```

### What the Script Does (v3 → v4)

1. Update `package.json`:
   - Change `tailwindcss` to `^4.0.0`
   - Add `@tailwindcss/vite` to devDependencies

2. Remove `postcss.config.mjs`

3. Update `resources/js/index.css` to use `@import "tailwindcss"`

4. Backup `tailwind.config.js`

5. Update `vite.config.mjs` to use `@tailwindcss/vite`

6. Automatically run `npm install`

### What the Script Does (v4 → v3)

1. Update `package.json`:
   - Change `tailwindcss` to `^3.4.17`
   - Add `autoprefixer`

2. Create `tailwind.config.js`

3. Create `postcss.config.mjs`

4. Update `resources/js/index.css` to use `@tailwind` directives

5. Revert `vite.config.mjs`

6. Automatically run `npm install`

## Which Version to Use?

### Tailwind CSS v3 (Stable)
- ✅ Proven and stable
- ✅ Compatible with all plugins
- ✅ Complete documentation
- ✅ Large community support

### Tailwind CSS v4 (Latest)
- ✅ CSS-first configuration (more modern)
- ✅ Better performance
- ✅ Faster build times
- ⚠️ Limited plugin compatibility
- ⚠️ Still in development

**Recommendation:** Use v3 for production, v4 for development/experimentation.

## Common Tailwind Patterns

### Dark Mode

```svelte
<div class="bg-white dark:bg-slate-900">
  <h1 class="text-slate-900 dark:text-white">Hello</h1>
</div>
```

### Responsive Design

```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Responsive grid -->
</div>
```

### Custom Colors

```svelte
<button class="bg-brand-500 hover:bg-brand-600 text-white">
  Custom Brand Button
</button>
```

### Form Styling

```svelte
<input 
  class="w-full px-4 py-2 border rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-blue-500
         dark:bg-slate-800 dark:border-slate-700"
/>
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5134
lsof -ti:5134 | xargs kill -9

# Or use a different port
VITE_PORT=3000 npm run dev
```

### Styling Not Working

1. Check Tailwind CSS version:
   ```bash
   npm run tailwind:migrate check
   ```

2. Make sure dev server is running:
   ```bash
   npm run dev
   ```

3. Clear cache and restart:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

## Next Steps

- [Svelte](/guide/svelte) - Build interactive components
- [Forms](/guide/forms) - Style form elements
