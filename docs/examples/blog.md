---
title: Blog Example
---

# Blog System Example

A complete blog system with posts, categories, comments, and an admin dashboard. This example demonstrates real-world patterns for building content management systems with Laju.

## Features

- ✅ **Post Management** - Create, edit, publish, and delete blog posts
- ✅ **Categories** - Organize posts by categories
- ✅ **Comments System** - Readers can comment on posts (authenticated users only)
- ✅ **Rich Text Editor** - Tiptap editor for post content
- ✅ **SEO-Friendly URLs** - Slug-based URLs for better SEO
- ✅ **Pagination** - Paginated post listings
- ✅ **Admin Dashboard** - Manage posts, categories, and comments
- ✅ **Search** - Full-text search for posts
- ✅ **Image Uploads** - Upload cover images for posts
- ✅ **Draft/Publish** - Save drafts before publishing

## Database Schema

### Migrations

Create `migrations/20250130000000_create_blog_tables.ts`:

```typescript
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Categories table
  await db.schema
    .createTable("categories")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("description", "text")
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();

  // Posts table
  await db.schema
    .createTable("posts")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("content", "text")
    .addColumn("excerpt", "text")
    .addColumn("cover_image", "text")
    .addColumn("status", "text", (col) => col.defaultTo("draft"))
    .addColumn("category_id", "text")
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("published_at", "integer")
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();

  // Comments table
  await db.schema
    .createTable("comments")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("post_id", "text", (col) => col.references("posts.id").onDelete("cascade"))
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();

  // Indexes
  await db.schema
    .createIndex("posts_slug_idx")
    .on("posts")
    .column("slug")
    .execute();

  await db.schema
    .createIndex("posts_status_published_idx")
    .on("posts")
    .columns(["status", "published_at"])
    .execute();

  await db.schema
    .createIndex("posts_category_idx")
    .on("posts")
    .column("category_id")
    .execute();

  await db.schema
    .createIndex("comments_post_idx")
    .on("comments")
    .column("post_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("comments").execute();
  await db.schema.dropTable("posts").execute();
  await db.schema.dropTable("categories").execute();
}
```

### Type Definitions

Add to `type/db-types.ts`:

```typescript
export interface CategoryTable {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}

export interface PostTable {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  status: "draft" | "published";
  category_id: string | null;
  user_id: string | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface CommentTable {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: number;
  updated_at: number;
}

// Update DB interface
export interface DB {
  users: UserTable;
  sessions: SessionTable;
  categories: CategoryTable;
  posts: PostTable;
  comments: CommentTable;
  // ... other tables
}
```

## Controllers

### BlogController

Create `app/controllers/BlogController.ts`:

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";
import Validator from "../services/Validator";
import { z } from "zod";
import { randomUUID } from "crypto";

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().max(500).optional(),
  cover_image: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(["draft", "published"])
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(2000)
});

class BlogController {
  // List all posts with pagination
  public async index(request: Request, response: Response) {
    const page = parseInt(request.query.page || "1");
    const category = request.query.category;
    const search = request.query.search;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    let query = DB.selectFrom("posts")
      .innerJoin("users", "posts.user_id", "users.id")
      .leftJoin("categories", "posts.category_id", "categories.id")
      .select([
        "posts.id",
        "posts.title",
        "posts.slug",
        "posts.excerpt",
        "posts.cover_image",
        "posts.status",
        "posts.published_at",
        "posts.created_at",
        "users.name as author_name",
        "categories.name as category_name",
        "categories.slug as category_slug"
      ])
      .where("posts.status", "=", "published");

    if (category) {
      query = query.where("categories.slug", "=", category);
    }

    if (search) {
      query = query.where((eb) => eb.or([
        eb("posts.title", "like", `%${search}%`),
        eb("posts.content", "like", `%${search}%`)
      ]));
    }

    const posts = await query
      .orderBy("posts.published_at", "desc")
      .limit(perPage)
      .offset(offset)
      .execute();

    // Get categories for sidebar
    const categories = await DB.selectFrom("categories")
      .selectAll()
      .orderBy("name")
      .execute();

    return response.inertia("blog/index", {
      posts,
      categories,
      page,
      category,
      search
    });
  }

  // Show single post
  public async show(request: Request, response: Response) {
    const { slug } = request.params;

    const post = await DB.selectFrom("posts")
      .innerJoin("users", "posts.user_id", "users.id")
      .leftJoin("categories", "posts.category_id", "categories.id")
      .select([
        "posts.id",
        "posts.title",
        "posts.slug",
        "posts.content",
        "posts.cover_image",
        "posts.published_at",
        "posts.created_at",
        "posts.user_id",
        "users.name as author_name",
        "categories.name as category_name"
      ])
      .where("posts.slug", "=", slug)
      .where("posts.status", "=", "published")
      .executeTakeFirst();

    if (!post) {
      return response.status(404).inertia("errors/404");
    }

    // Get comments
    const comments = await DB.selectFrom("comments")
      .innerJoin("users", "comments.user_id", "users.id")
      .select([
        "comments.id",
        "comments.content",
        "comments.created_at",
        "users.name as author_name",
        "users.avatar as author_avatar"
      ])
      .where("comments.post_id", "=", post.id)
      .orderBy("comments.created_at", "desc")
      .execute();

    return response.inertia("blog/show", {
      post,
      comments
    });
  }

  // Show create form
  public async create(request: Request, response: Response) {
    const categories = await DB.selectFrom("categories")
      .selectAll()
      .orderBy("name")
      .execute();

    return response.inertia("blog/form", { categories });
  }

  // Store new post
  public async store(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const body = await request.json();
    const validation = Validator.validate(postSchema, body);

    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]?.[0];
      return response.flash("error", firstError || "Validation failed")
        .redirect("/blog/create", 303);
    }

    const data = validation.data!;

    // Check slug uniqueness
    const existing = await DB.selectFrom("posts")
      .select("id")
      .where("slug", "=", data.slug)
      .executeTakeFirst();

    if (existing) {
      return response.flash("error", "Slug already exists")
        .redirect("/blog/create", 303);
    }

    await DB.insertInto("posts")
      .values({
        id: randomUUID(),
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 200) + "...",
        cover_image: data.cover_image || null,
        category_id: data.category_id || null,
        user_id: request.user.id,
        status: data.status,
        published_at: data.status === "published" ? Date.now() : null,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .execute();

    return response
      .flash("success", "Post created successfully!")
      .redirect("/blog", 303);
  }

  // Show edit form
  public async edit(request: Request, response: Response) {
    const { id } = request.params;

    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!post) {
      return response.status(404).inertia("errors/404");
    }

    if (post.user_id !== request.user?.id && request.user?.is_admin !== 1) {
      return response.status(403).json({ error: "Forbidden" });
    }

    const categories = await DB.selectFrom("categories")
      .selectAll()
      .orderBy("name")
      .execute();

    return response.inertia("blog/form", { post, categories });
  }

  // Update post
  public async update(request: Request, response: Response) {
    const { id } = request.params;
    const body = await request.json();

    const post = await DB.selectFrom("posts")
      .select("user_id", "status")
      .where("id", "=", id)
      .executeTakeFirst();

    if (!post) {
      return response.status(404).json({ error: "Not found" });
    }

    if (post.user_id !== request.user?.id && request.user?.is_admin !== 1) {
      return response.status(403).json({ error: "Forbidden" });
    }

    const validation = Validator.validate(postSchema, body);

    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]?.[0];
      return response.flash("error", firstError || "Validation failed")
        .redirect(`/blog/${id}/edit`, 303);
    }

    const data = validation.data!;

    await DB.updateTable("posts")
      .set({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        cover_image: data.cover_image,
        category_id: data.category_id,
        status: data.status,
        published_at: data.status === "published" && post.status === "draft" 
          ? Date.now() 
          : undefined,
        updated_at: Date.now()
      })
      .where("id", "=", id)
      .execute();

    return response
      .flash("success", "Post updated successfully!")
      .redirect("/blog", 303);
  }

  // Delete post
  public async destroy(request: Request, response: Response) {
    const { id } = request.params;

    const post = await DB.selectFrom("posts")
      .select("user_id")
      .where("id", "=", id)
      .executeTakeFirst();

    if (!post) {
      return response.status(404).json({ error: "Not found" });
    }

    if (post.user_id !== request.user?.id && request.user?.is_admin !== 1) {
      return response.status(403).json({ error: "Forbidden" });
    }

    await DB.deleteFrom("posts")
      .where("id", "=", id)
      .execute();

    return response
      .flash("success", "Post deleted!")
      .redirect("/blog", 303);
  }

  // Add comment
  public async addComment(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ error: "Login required" });
    }

    const { slug } = request.params;
    const body = await request.json();

    const validation = Validator.validate(commentSchema, body);

    if (!validation.success) {
      return response.status(422).json({
        error: Object.values(validation.errors || {})[0]?.[0]
      });
    }

    const post = await DB.selectFrom("posts")
      .select("id")
      .where("slug", "=", slug)
      .executeTakeFirst();

    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }

    await DB.insertInto("comments")
      .values({
        id: randomUUID(),
        post_id: post.id,
        user_id: request.user.id,
        content: validation.data!.content,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .execute();

    return response
      .flash("success", "Comment added!")
      .redirect(`/blog/${slug}`, 303);
  }
}

export default new BlogController();
```

## Svelte Pages

### Blog Index Page

Create `resources/js/Pages/blog/index.svelte`:

```svelte
<script>
  import { router, Link } from '@inertiajs/svelte';
  import Header from '../../Components/Header.svelte';
  
  let { posts, categories, page, category, search, user } = $props();
  
  let searchQuery = $state(search || '');
  
  function handleSearch(e) {
    e.preventDefault();
    router.get('/blog', { search: searchQuery, page: 1 });
  }
</script>

<Header />

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-3">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
            Blog
          </h1>
          {#if user}
            <a href="/blog/create" class="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition">
              New Post
            </a>
          {/if}
        </div>
        
        <!-- Search -->
        <form onsubmit={handleSearch} class="mb-8">
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search posts..."
              class="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button type="submit" class="bg-slate-800 text-white px-4 py-2 rounded-lg">
              Search
            </button>
          </div>
        </form>
        
        <!-- Posts Grid -->
        <div class="grid gap-6">
          {#each posts as post}
            <article class="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
              {#if post.cover_image}
                <img src={post.cover_image} alt={post.title} class="w-full h-48 object-cover" />
              {/if}
              <div class="p-6">
                <div class="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  {#if post.category_name}
                    <span class="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-2 py-1 rounded">
                      {post.category_name}
                    </span>
                  {/if}
                  <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{post.author_name}</span>
                </div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  <a href={`/blog/${post.slug}`} class="hover:text-brand-600 transition">
                    {post.title}
                  </a>
                </h2>
                <p class="text-slate-600 dark:text-slate-400 mb-4">
                  {post.excerpt}
                </p>
                <a href={`/blog/${post.slug}`} class="text-brand-600 hover:text-brand-700 font-medium">
                  Read more →
                </a>
              </div>
            </article>
          {/each}
        </div>
        
        <!-- Pagination -->
        <div class="flex justify-center gap-2 mt-8">
          {#if page > 1}
            <a href={`/blog?page=${page - 1}`} class="px-4 py-2 border rounded-lg hover:bg-slate-100">
              Previous
            </a>
          {/if}
          <span class="px-4 py-2">Page {page}</span>
          {#if posts.length === 10}
            <a href={`/blog?page=${page + 1}`} class="px-4 py-2 border rounded-lg hover:bg-slate-100">
              Next
            </a>
          {/if}
        </div>
      </div>
      
      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <h3 class="font-bold text-slate-900 dark:text-white mb-4">Categories</h3>
          <ul class="space-y-2">
            <li>
              <a href="/blog" class:text-brand-600={!category} class="hover:text-brand-600 transition">
                All Posts
              </a>
            </li>
            {#each categories as cat}
              <li>
                <a 
                  href={`/blog?category=${cat.slug}`}
                  class:text-brand-600={category === cat.slug}
                  class="hover:text-brand-600 transition"
                >
                  {cat.name}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Single Post Page

Create `resources/js/Pages/blog/show.svelte`:

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  import Header from '../../Components/Header.svelte';
  
  let { post, comments, user, flash } = $props();
  
  let commentContent = $state('');
  
  function submitComment(e) {
    e.preventDefault();
    router.post(`/blog/${post.slug}/comments`, {
      content: commentContent
    }, {
      onSuccess: () => {
        commentContent = '';
      }
    });
  }
</script>

<Header />

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
  <article class="max-w-4xl mx-auto px-4 py-8">
    {#if post.cover_image}
      <img src={post.cover_image} alt={post.title} class="w-full h-64 md:h-96 object-cover rounded-xl mb-8" />
    {/if}
    
    <div class="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
        {#if post.category_name}
          <span class="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-2 py-1 rounded">
            {post.category_name}
          </span>
        {/if}
        <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
        <span>•</span>
        <span>{post.author_name}</span>
      </div>
      
      <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
        {post.title}
      </h1>
      
      <div class="prose dark:prose-invert max-w-none">
        {@html post.content}
      </div>
    </div>
    
    <!-- Comments Section -->
    <div class="mt-8 bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Comments ({comments.length})
      </h2>
      
      {#if user}
        <form onsubmit={submitComment} class="mb-8">
          <textarea
            bind:value={commentContent}
            placeholder="Write a comment..."
            rows="3"
            class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white mb-2"
          ></textarea>
          <button type="submit" class="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            Post Comment
          </button>
        </form>
      {:else}
        <p class="text-slate-500 mb-6">
          <a href="/login" class="text-brand-600 hover:underline">Login</a> to leave a comment.
        </p>
      {/if}
      
      <div class="space-y-4">
        {#each comments as comment}
          <div class="border-b border-slate-200 dark:border-slate-800 pb-4 last:border-0">
            <div class="flex items-center gap-2 mb-2">
              {#if comment.author_avatar}
                <img src={comment.author_avatar} alt="" class="w-8 h-8 rounded-full" />
              {:else}
                <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                  {comment.author_name.charAt(0)}
                </div>
              {/if}
              <span class="font-medium text-slate-900 dark:text-white">{comment.author_name}</span>
              <span class="text-slate-500 text-sm">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p class="text-slate-700 dark:text-slate-300">{comment.content}</p>
          </div>
        {/each}
      </div>
    </div>
  </article>
</div>
```

### Post Form Page

Create `resources/js/Pages/blog/form.svelte`:

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  import Header from '../../Components/Header.svelte';
  
  let { post, categories, flash } = $props();
  
  let form = $state({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    cover_image: post?.cover_image || '',
    category_id: post?.category_id || '',
    status: post?.status || 'draft'
  });
  
  let isLoading = $state(false);
  
  function generateSlug() {
    form.slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  function handleSubmit(e) {
    e.preventDefault();
    isLoading = true;
    
    const url = post ? `/blog/${post.id}` : '/blog';
    const method = post ? 'put' : 'post';
    
    router[method](url, form, {
      onFinish: () => isLoading = false
    });
  }
</script>

<Header />

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-8">
      {post ? 'Edit Post' : 'New Post'}
    </h1>
    
    <form onsubmit={handleSubmit} class="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 space-y-6">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
        <input
          type="text"
          bind:value={form.title}
          onblur={!post ? generateSlug : null}
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          required
        />
      </div>
      
      <!-- Slug -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
        <input
          type="text"
          bind:value={form.slug}
          pattern="[a-z0-9-]+"
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          required
        />
        <p class="text-sm text-slate-500 mt-1">URL-friendly identifier (e.g., "my-first-post")</p>
      </div>
      
      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
        <select
          bind:value={form.category_id}
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        >
          <option value="">Uncategorized</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </div>
      
      <!-- Content -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
        <textarea
          bind:value={form.content}
          rows="10"
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          required
        ></textarea>
      </div>
      
      <!-- Excerpt -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Excerpt</label>
        <textarea
          bind:value={form.excerpt}
          rows="3"
          maxlength="500"
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        ></textarea>
        <p class="text-sm text-slate-500 mt-1">Brief summary (auto-generated if empty)</p>
      </div>
      
      <!-- Cover Image -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cover Image URL</label>
        <input
          type="url"
          bind:value={form.cover_image}
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        />
      </div>
      
      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
        <select
          bind:value={form.status}
          class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      
      <!-- Submit -->
      <div class="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          class="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : (post ? 'Update' : 'Create')}
        </button>
        <a href="/blog" class="px-6 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          Cancel
        </a>
      </div>
    </form>
  </div>
</div>
```

## Routes Configuration

Add to `routes/web.ts`:

```typescript
import BlogController from "../app/controllers/BlogController";
import Auth from "../app/middlewares/auth";

// Public routes
Route.get("/blog", BlogController.index);
Route.get("/blog/:slug", BlogController.show);

// Protected routes (require authentication)
Route.get("/blog/create", [Auth], BlogController.create);
Route.post("/blog", [Auth], BlogController.store);
Route.get("/blog/:id/edit", [Auth], BlogController.edit);
Route.put("/blog/:id", [Auth], BlogController.update);
Route.delete("/blog/:id", [Auth], BlogController.destroy);
Route.post("/blog/:slug/comments", [Auth], BlogController.addComment);
```

## AI Prompt Example

To build this blog system using AI:

```
@workflow/INIT_AGENT.md

Create a blog system with these features:
- Blog posts with title, slug, content, excerpt, cover image
- Categories to organize posts
- Comments system (authenticated users only)
- SEO-friendly slug-based URLs
- Post status: draft and published
- Pagination for post listings
- Search functionality
- Category filtering
- Only post authors or admins can edit/delete posts
- Clean, modern design with blue accents
- Dark mode support
```

Then continue with:

```
@workflow/TASK_AGENT.md

Create the blog index page with:
- Grid layout for posts
- Category sidebar
- Search bar
- Pagination
- "New Post" button for authenticated users
```

```
@workflow/TASK_AGENT.md

Create the single post page with:
- Full post content display
- Author and date info
- Comments section
- Comment form for logged-in users
- Related posts sidebar
```

## Next Steps

- Add rich text editor (Tiptap or Quill)
- Implement image upload with drag-and-drop
- Add post tags
- Create RSS feed
- Add social sharing buttons
- Implement post likes/bookmarks
- Add reading time estimation
- Create admin dashboard

## Related

- [Todo Example](./todo) - Simple CRUD application
- [E-commerce Example](./ecommerce) - Online store patterns
- [API Example](./api) - REST API development
