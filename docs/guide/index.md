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

### Step 2: Initialize with AI (1 minute)

Open your AI assistant (Claude, ChatGPT, etc.) and type:

```
@workflow/INIT_AGENT.md

I want to build a blog system with:
- Posts with title, content, and cover image
- Categories for organizing posts
- Comments system (users must login)
- Clean, modern design with blue accents
- Mobile responsive
```

**What AI will do:**
- Create README, PRD, TDD, PROGRESS documents
- Setup design system (Tailwind config, colors)
- Create database migrations
- Prepare project structure
- Initialize git

### Step 3: Build Features (2 minutes)

After AI finishes initialization, mention:

```
@workflow/TASK_AGENT.md

Create the blog index page showing:
- List of posts with pagination
- Category filter sidebar
- Search functionality
- "New Post" button for authenticated users
```

**What AI will do:**
- Create `BlogController.ts`
- Create `resources/js/Pages/blog/index.svelte`
- Add routes to `routes/web.ts`
- Run migrations
- Test the feature

### Step 4: Review & Continue (1 minute)

Open `http://localhost:5555/blog` — your blog is live!

Continue building:
```
@workflow/TASK_AGENT.md
"Now create the individual post page with comments section"
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

class PostController {
  public async index(request: Request, response: Response) {
    const posts = await DB.selectFrom("posts")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(10)
      .execute();
    
    return response.inertia("posts/index", { posts });
  }
}

export default new PostController();
```

### Step 3: Create Database Migration

Create `migrations/20250130000000_create_posts.ts`:

```typescript
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("posts")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("posts").execute();
}
```

Run migration:
```bash
npm run migrate
```

### Step 4: Create Svelte Page

Create `resources/js/Pages/posts/index.svelte`:

```svelte
<script>
  let { posts } = $props()
</script>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Blog Posts</h1>
  
  <div class="space-y-4">
    {#each posts as post}
      <div class="bg-slate-800 rounded-lg p-4">
        <h2 class="text-xl font-semibold text-white">{post.title}</h2>
        <p class="text-slate-400 mt-2">{post.content}</p>
      </div>
    {/each}
  </div>
</div>
```

### Step 5: Add Route

Edit `routes/web.ts`:

```typescript
import PostController from "../app/controllers/PostController";

// Add this line
Route.get("/posts", PostController.index);
```

Visit `http://localhost:5555/posts` — your blog is live!

**Total time: 15-20 minutes** ⏱️

---

## Next Steps

Choose your path:

### AI Path
- [Learn AI Agent Workflows](./ai-development) — Deep dive into INIT_AGENT, TASK_AGENT, MANAGER_AGENT
- [AI Best Practices](./ai-development#tips) — Get better results from AI

### Manual Path
- [Project Structure](./project-structure) — Understand the layout
- [Routing](./routing) — Full routing guide
- [Controllers](./controllers) — Build backend logic
- [Database](./database) — Master Kysely queries
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

[Full Troubleshooting Guide](https://github.com/maulanashalihin/laju/blob/main/docs/99-troubleshooting.md)