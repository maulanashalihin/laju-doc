# Quick Start

Get your first Laju application running in 5 minutes.

## Choose Your Path

Laju supports two development workflows:

### 🤖 Path A: AI-Assisted (Recommended)

Let AI handle the coding. You just describe what you want.

**Time:** 5 minutes  
**Effort:** Minimal — just describe features  
**Best for:** Rapid prototyping, beginners, MVPs

### 💻 Path B: Manual Coding

Write every line of code yourself.

**Time:** 15-20 minutes  
**Effort:** Full control  
**Best for:** Learning, custom requirements

---

## Path A: AI-Assisted Development

### Step 1: Create Project (30 seconds)

```bash
npx create-laju-app my-app && cd my-app
npm run migrate && npm run dev
```

Visit `http://localhost:5555` — you should see the welcome page.

### Step 2: Product Agent — Define Requirements (1 minute)

Open your AI assistant (Claude, ChatGPT, etc.) and type:

```
@workflow/agents/product.md

I want to build a blog system with:
- Posts with title, content, and cover image
- Categories for organizing posts
- Comments system (users must login)
- Clean, modern design with blue accents
- Mobile responsive
```

**What AI will do:**
- Create PRD.md (Product Requirements)
- Create USER_STORIES.md
- Create ROADMAP.md
- Define Design Direction (colors, typography)

**Review:** Check `workflow/outputs/01-product/` and approve before continuing.

### Step 3: Tech Lead Agent — Technical Design (1 minute)

```
@workflow/agents/tech-lead.md

Lanjutkan dari Product Agent.
Kebutuhan produk sudah di-approve client.
```

**What AI will do:**
- Create TECH_SPEC.md
- Create ARCHITECTURE.md
- Create PAGE_ROUTES.md
- Create DATABASE_SCHEMA.md
- Create TASKS.md

**Review:** Check `workflow/outputs/02-engineering/` and approve before continuing.

### Step 4: Developer Agent — Build Features (2 minutes)

```
@workflow/agents/developer.md

Implement semua fitur dari TASKS.md.
```

**What AI will do:**
- Create controllers
- Create Svelte pages dengan Header component
- Add routes
- Create migrations dan update type/db-types.ts
- Git commit setiap fitur

**Review:** Test di `http://localhost:5555` dan approve sebelum QA.

### Step 5: QA Agent — Testing (1 minute)

```
@workflow/agents/qa.md

Test aplikasi dan buat test report.
```

**What AI will do:**
- Code review
- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)
- Test report

**Review:** Approve test results sebelum deploy.

### Step 6: DevOps Agent — Deploy (Optional)

```
@workflow/agents/devops.md

Deploy ke production server.
```

**Total time: 5 minutes** ⏱️

---

## Path B: Manual Development

### Step 1: Create Project

```bash
npx create-laju-app my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

### Step 2: Create Your First Controller

```bash
node laju make:controller PostController
```

Edit `app/controllers/PostController.ts`:

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";

export const PostController = {
  async index(request: Request, response: Response) {
    const posts = await DB.selectFrom("posts")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(10)
      .execute();
    
    return response.inertia("posts/index", { posts });
  }
};

export default PostController;
```

### Step 3: Create Database Migration

Create `migrations/20250130000000_create_posts.ts`:

```typescript
export default {
  name: '20250130000000_create_posts',
  
  up: async (DB: Kysely<any>) => {
    await DB.schema
      .createTable("posts")
      .addColumn("id", "text", (col) => col.primaryKey().notNull())
      .addColumn("title", "text", (col) => col.notNull())
      .addColumn("content", "text")
      .addColumn("user_id", "text", (col) => col.references("users.id"))
      .addColumn("created_at", "integer")
      .addColumn("updated_at", "integer")
      .execute();
  },
  
  down: async (DB: Kysely<any>) => {
    await DB.schema.dropTable("posts").execute();
  }
};
```

Run migration:
```bash
npm run migrate
```

**⚠️ Update type/db-types.ts untuk type safety:**

```typescript
export interface PostTable {
  id: string;
  title: string;
  content: string | null;
  user_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface DB {
  // ... existing tables
  posts: PostTable;
}

export type Post = Selectable<PostTable>;
export type NewPost = Insertable<PostTable>;
export type PostUpdate = Updateable<PostTable>;
```

### Step 4: Create Svelte Page

Create `resources/js/Pages/posts/index.svelte`:

```svelte
<script>
  import Header from '../../Components/Header.svelte'
  let { posts } = $props()
</script>

<Header group="posts" />

<div class="max-w-4xl mx-auto p-6 pt-24">
  <h1 class="text-3xl font-bold mb-6">Blog Posts</h1>
  
  <div class="space-y-4">
    {#each posts as post}
      <div class="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <h2 class="text-xl font-semibold">{post.title}</h2>
        <p class="text-slate-600 dark:text-slate-400 mt-2">{post.content}</p>
      </div>
    {/each}
  </div>
</div>
```

### Step 5: Add Route

Edit `routes/web.ts`:

```typescript
import PostController from "../app/controllers/PostController";
import Auth from "../app/middlewares/auth";

// Add this line
Route.get("/posts", [Auth], PostController.index);
```

Visit `http://localhost:5555/posts` — your blog is live!

**Total time: 15-20 minutes** ⏱️

---

## Next Steps

Choose your path:

### AI Path
- [AI Development Workflow](./ai-development) — Deep dive into 5-Agent Workflow
- [AI Best Practices](./ai-development#best-practices) — Get better results from AI

### Manual Path
- [Project Structure](./project-structure) — Understand the layout
- [Routing](./routing) — Full routing guide
- [Controllers](./controllers) — Build backend logic
- [Database](./database) — Master Kysely queries dengan type safety
- [Authentication](./authentication) — Add login/register

### Both Paths
- [Testing](./testing) — Write tests for your app
- [Production](./production) — Deploy to production
- [CI/CD](./cicd) — Setup GitHub Actions

---

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5555
lsof -ti:5555 | xargs kill -9
```

### Database locked
```bash
# WAL mode handles this — just retry
# Or reset database (DEVELOPMENT ONLY)
npm run refresh
```

### Module not found
```bash
npm install
```

### Kysely type errors
Pastikan `type/db-types.ts` sudah diupdate sesuai migration.

[Full Troubleshooting Guide](https://github.com/maulanashalihin/laju/blob/main/docs/99-troubleshooting.md)
