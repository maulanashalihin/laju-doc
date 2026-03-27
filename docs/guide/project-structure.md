# Project Structure

Understanding the Laju framework directory layout and conventions.

## Directory Overview

```
my-app/
├── app/                    # Backend application code
│   ├── handlers/           # Request handlers
│   ├── middlewares/        # Custom middleware
│   ├── services/           # Business logic layer
│   ├── repositories/       # Data access layer
│   └── validators/         # Input validation schemas
├── frontend/               # Frontend application
│   └── src/
│       ├── Pages/          # Inertia pages (Svelte)
│       ├── Components/     # Reusable components
│       └── languages/      # i18n translations
├── routes/                 # Route definitions
├── migrations/             # Database migrations
├── commands/               # CLI commands
│   └── native/             # Built-in commands
├── tests/                  # Test suite
│   ├── e2e/                # End-to-end tests
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── templates/              # HTML templates (Eta)
├── skills/                 # AI skills/agents
├── workflow/               # Workflow documentation
├── public/                 # Static assets
├── storage/                # Local file storage
│   └── assets/             # Uploaded files
├── dist/                   # Compiled frontend (Vite)
├── build/                  # Production build
├── data/                   # SQLite databases
├── type/                   # TypeScript definitions
├── logs/                   # Application logs
└── benchmark/              # Performance benchmarks
```

## Backend (`app/`)

### Handlers (`app/handlers/`)

Request handlers that coordinate between routes and services.

```
app/handlers/
├── auth.handler.ts         # Authentication handlers
├── app.handler.ts          # App/general handlers
├── asset.handler.ts        # Asset management
├── public.handler.ts       # Public page handlers
├── s3.handler.ts           # S3 storage handlers
├── storage.handler.ts      # Local storage handlers
└── upload.handler.ts       # File upload handlers
```

**Naming Convention:** `kebab-case` + `.handler.ts`

**Example:**
```typescript
// app/handlers/post.handler.ts
import { Request, Response } from "../../type";
import DB from "../services/DB";

export const PostHandler = {
  async index(request: Request, response: Response) {
    const posts = await DB.selectFrom("posts").selectAll().execute();
    return response.inertia("posts/index", { posts });
  }
};

export default PostHandler;
```

### Services (`app/services/`)

Business logic and external integrations.

```
app/services/
├── DB.ts                   # Kysely database service
├── SQLite.ts               # SQLite connection
├── Authenticate.ts         # Authentication service
├── CSRF.ts                 # CSRF protection service
├── CacheService.ts         # Caching service
├── Mailer.ts               # Email service (Resend)
├── Resend.ts               # Resend email client
├── S3.ts                   # S3 storage service
├── LocalStorage.ts         # Local file storage
├── UploadService.ts        # File upload handling
├── ImageProcessor.ts       # Image manipulation
├── FileValidator.ts        # File validation
├── Logger.ts               # Logging service
├── Translation.ts          # i18n service
├── View.ts                 # Template rendering
├── Migrator.ts             # Database migrations
├── RateLimiter.ts          # Rate limiting
├── Redis.ts                # Redis client
├── Validator.ts            # Input validation
├── GoogleAuth.ts           # Google OAuth
└── languages/              # Translation files
```

**Naming Convention:** `PascalCase.ts`

### Repositories (`app/repositories/`)

Data access layer that abstracts database operations.

```
app/repositories/
├── user.repository.ts      # User data access
└── asset.repository.ts     # Asset data access
```

**Naming Convention:** `kebab-case` + `.repository.ts`

**Example:**
```typescript
// app/repositories/user.repository.ts
import DB from "../services/DB";

export const UserRepository = {
  async findById(id: string) {
    return await DB.selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  },

  async create(data: any) {
    return await DB.insertInto("users")
      .values(data)
      .returningAll()
      .executeTakeFirst();
  }
};

export default UserRepository;
```

### Middleware (`app/middlewares/`)

Request processing pipeline components.

```
app/middlewares/
├── auth.middleware.ts           # Authentication middleware
├── csrf.middleware.ts           # CSRF protection
├── inertia.middleware.ts        # Inertia.js integration
├── rate-limit.middleware.ts     # Rate limiting
└── security-headers.middleware.ts # Security headers
```

**Naming Convention:** `kebab-case` + `.middleware.ts`

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

## Frontend (`frontend/`)

### Pages (`frontend/src/Pages/`)

Inertia.js pages — one file per route.

```
frontend/src/Pages/
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
<!-- frontend/src/Pages/posts/index.svelte -->
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

### Components (`frontend/src/Components/`)

Reusable Svelte components.

```
frontend/src/Components/
├── Header.svelte
├── DarkModeToggle.svelte
├── LajuIcon.svelte
├── helper.js               # Helper utilities
├── translation.js          # Translation helper
└── languages/              # i18n JSON files
```

**Naming Convention:** `PascalCase.svelte` for components, `camelCase.js` for utilities

### Templates (`templates/`)

Eta HTML templates for server-side rendering.

```
templates/
├── index.html              # Landing page
├── inertia.html            # Inertia layout
├── test.html               # Test page
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
import PostHandler from "../app/handlers/post.handler";
import Auth from "../app/middlewares/auth.middleware";

// Public routes
Route.get("/", HomeHandler.index);

// Protected routes
Route.get("/posts", [Auth], PostHandler.index);
Route.get("/posts/create", [Auth], PostHandler.create);
Route.post("/posts", [Auth], PostHandler.store);
```

## Commands (`commands/`)

CLI commands for development and deployment.

```
commands/
├── index.ts                # Command loader
└── native/                 # Built-in commands
    ├── MakeCommand.ts      # Create new files
    ├── MakeController.ts   # Create handler
    ├── Migrate.ts          # Run migrations
    ├── Rollback.ts         # Rollback migrations
    ├── RefreshDatabase.ts  # Reset database
    └── TailwindMigrate.ts  # Tailwind migration
```

## Database (`migrations/`)

Database schema migrations:

```
migrations/
├── 20230513055909_users.ts
├── 20230514062913_sessions.ts
├── 20240101000001_create_password_reset_tokens.ts
├── 20240101000002_create_email_verification_tokens.ts
├── 20250110233301_assets.ts
├── 20251023082000_create_backup_files.ts
└── 20251210000000_create_cache_table.ts
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

## Tests (`tests/`)

Test suite organized by type:

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
├── integration/            # Integration tests
├── unit/                   # Unit tests
├── fixtures/               # Test fixtures
└── setup.ts                # Test configuration
```

## Skills (`skills/`)

AI-powered skills and agent configurations.

```
skills/
├── README.md               # Skills documentation
├── examples.md             # Usage examples
├── quick-reference.md      # Quick reference
├── agents/                 # Agent configurations
└── outputs/                # Generated outputs
```

## Workflow (`workflow/`)

Development workflow documentation and guides.

```
workflow/
├── create-controller.md
├── create-svelte-inertia-page.md
├── deployment-guide.md
├── eta-template-engine-ssr.md
├── feature-implementation-patterns.md
├── hyper-express.md
├── kysely.md
├── repository-pattern.md
└── testing-guide.md
```

## Import Paths

Laju supports absolute imports from project root:

```typescript
// ✅ Absolute imports (recommended)
import DB from "app/services/DB";
import PostHandler from "app/handlers/post.handler";
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
      "frontend/*": ["frontend/*"],
      "type/*": ["type/*"]
    }
  }
}
```

## File Naming Summary

| Type | Convention | Example |
|------|-----------|---------|
| Handlers | kebab-case + .handler.ts | `post.handler.ts`, `auth.handler.ts` |
| Services | PascalCase.ts | `DB.ts`, `Mailer.ts` |
| Repositories | kebab-case + .repository.ts | `user.repository.ts` |
| Middleware | kebab-case + .middleware.ts | `auth.middleware.ts`, `rate-limit.middleware.ts` |
| Migrations | timestamp_description.ts | `20250130000000_create_posts.ts` |
| Pages | kebab-case.svelte | `index.svelte`, `forgot-password.svelte` |
| Components | PascalCase.svelte | `Header.svelte` |
| Templates | kebab-case.html | `inertia.html` |
| Commands | PascalCase.ts | `MakeCommand.ts` |

## Next Steps

- [Routing](./routing) — Define HTTP routes
- [Controllers](./controllers) — Handle requests
- [Database](./database) — Store and query data