# Project Structure

Understanding the Laju framework directory layout and conventions.

## Directory Overview

```
my-app/
├── app/                    # Backend application code
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Custom middleware
│   ├── services/           # Business logic layer
│   └── validators/         # Input validation schemas
├── resources/              # Frontend resources
│   ├── js/                 # JavaScript/Svelte code
│   │   ├── Pages/          # Inertia pages
│   │   └── Components/     # Reusable components
│   └── views/              # HTML templates (Eta)
├── routes/                 # Route definitions
├── migrations/             # Database migrations
├── commands/               # CLI commands
├── tests/                  # Test suite
├── public/                 # Static assets
├── storage/                # Local file storage
├── dist/                   # Compiled frontend (Vite)
├── build/                  # Production build
├── data/                   # SQLite databases
└── type/                   # TypeScript definitions
```

## Backend (`app/`)

### Controllers (`app/controllers/`)

Request handlers that coordinate between routes and services.

```
app/controllers/
├── LoginController.ts      # Login/logout logic
├── RegisterController.ts   # Registration logic
├── ProfileController.ts    # User profile
├── PostController.ts       # Blog posts (example)
└── ...
```

**Naming Convention:** `PascalCase` + `Controller.ts`

**Example:**
```typescript
// app/controllers/PostController.ts
import { Request, Response } from "../../type";
import DB from "../services/DB";

class PostController {
  public async index(request: Request, response: Response) {
    const posts = await DB.selectFrom("posts").selectAll().execute();
    return response.inertia("posts/index", { posts });
  }
}

// IMPORTANT: Export as instance (not class)
export default new PostController();
```

### Services (`app/services/`)

Business logic and external integrations.

```
app/services/
├── DB.ts                   # Kysely database service
├── Authenticate.ts         # Authentication service
├── Mailer.ts               # Email service
├── S3.ts                   # S3 storage service
└── ...
```

**Naming Convention:** `PascalCase.ts`

### Middleware (`app/middlewares/`)

Request processing pipeline components.

```
app/middlewares/
├── auth.ts                 # Authentication middleware
├── csrf.ts                 # CSRF protection
├── inertia.ts              # Inertia.js integration
└── rateLimit.ts            # Rate limiting
```

**Naming Convention:** `camelCase.ts`

### Validators (`app/validators/`)

Zod validation schemas for input validation.

```
app/validators/
├── AuthValidator.ts        # Auth validation
├── PostValidator.ts        # Post validation
└── ...
```

**Example:**
```typescript
// app/validators/PostValidator.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category_id: z.string().optional(),
});
```

## Frontend (`resources/`)

### Pages (`resources/js/Pages/`)

Inertia.js pages — one file per route.

```
resources/js/Pages/
├── auth/
│   ├── login.svelte
│   ├── register.svelte
│   └── forgot-password.svelte
├── home.svelte
├── profile.svelte
└── posts/                  # Example
    ├── index.svelte
    ├── show.svelte
    └── form.svelte
```

**Naming Convention:** `kebab-case.svelte`

**Example:**
```svelte
<!-- resources/js/Pages/posts/index.svelte -->
<script>
  import { router } from '@inertiajs/svelte'
  let { posts, flash } = $props()
</script>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold">Posts</h1>
  
  {#if flash?.success}
    <div class="alert alert-success">{flash.success}</div>
  {/if}
  
  {#each posts as post}
    <div class="card">
      <h2>{post.title}</h2>
    </div>
  {/each}
</div>
```

### Components (`resources/js/Components/`)

Reusable Svelte components.

```
resources/js/Components/
├── Header.svelte
├── DarkModeToggle.svelte
└── ...
```

**Naming Convention:** `PascalCase.svelte`

### Views (`resources/views/`)

Eta HTML templates for server-side rendering.

```
resources/views/
├── index.html              # Landing page
├── inertia.html            # Inertia layout
└── partials/
    └── header.html
```

## Routes (`routes/`)

All HTTP routes defined in one file:

```
routes/
└── web.ts                  # All routes
```

**Example:**
```typescript
// routes/web.ts
import Route from "hyper-express";
import PostController from "../app/controllers/PostController";
import Auth from "../app/middlewares/auth";

// Public routes
Route.get("/", HomeController.index);

// Protected routes
Route.get("/posts", [Auth], PostController.index);
Route.get("/posts/create", [Auth], PostController.create);
Route.post("/posts", [Auth], PostController.store);
```

## Database (`migrations/`)

Database schema migrations:

```
migrations/
├── 20230513055909_users.ts
├── 20230514062913_sessions.ts
└── ...
```

**Naming Convention:** `YYYYMMDDHHMMSS_description.ts`

**Example:**
```typescript
// migrations/20250130000000_create_posts.ts
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("posts")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("created_at", "integer")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("posts").execute();
}
```

## Import Paths

Laju supports absolute imports from project root:

```typescript
// ✅ Absolute imports (recommended)
import DB from "app/services/DB";
import PostController from "app/controllers/PostController";
import { Request, Response } from "type";

// ❌ Relative imports (avoid)
import DB from "../../app/services/DB";
```

**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "app/*": ["app/*"],
      "routes/*": ["routes/*"],
      "resources/*": ["resources/*"],
      "type/*": ["type/*"]
    }
  }
}
```

## File Naming Summary

| Type | Convention | Example |
|------|-----------|---------|
| Controllers | PascalCase + Controller.ts | `PostController.ts` |
| Services | PascalCase.ts | `DB.ts`, `Mailer.ts` |
| Middleware | camelCase.ts | `auth.ts`, `rateLimit.ts` |
| Migrations | timestamp_description.ts | `20250130000000_create_posts.ts` |
| Pages | kebab-case.svelte | `index.svelte`, `forgot-password.svelte` |
| Components | PascalCase.svelte | `Header.svelte` |
| Views | kebab-case.html | `inertia.html` |

## Next Steps

- [Routing](./routing) — Define HTTP routes
- [Controllers](./controllers) — Handle requests
- [Database](./database) — Store and query data