# Handlers

Learn how to create handlers in Laju Framework.

## Creating a Handler

**Using CLI:**
```bash
node laju make:controller PostHandler
```

**Manual creation** (`app/handlers/post.handler.ts`):

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";

export const PostHandler = {
  // List all posts
  async index(request: Request, response: Response) {
    const posts = await DB.selectFrom("posts")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();
    return response.inertia("posts/index", { posts });
  },

  // Show create form
  async create(request: Request, response: Response) {
    return response.inertia("posts/create");
  },

  // Store new post
  async store(request: Request, response: Response) {
    const { title, content } = await request.json();

    await DB.insertInto("posts").values({
      title,
      content,
      user_id: request.user.id,
      created_at: Date.now(),
      updated_at: Date.now()
    }).execute();

    return response.redirect("/posts");
  },

  // Show single post
  async show(request: Request, response: Response) {
    const { id } = request.params;
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }

    return response.inertia("posts/show", { post });
  },

  // Show edit form
  async edit(request: Request, response: Response) {
    const { id } = request.params;
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }

    return response.inertia("posts/edit", { post });
  },

  // Update post
  async update(request: Request, response: Response) {
    const { id } = request.params;
    const { title, content } = await request.json();

    await DB.updateTable("posts")
      .set({
        title,
        content,
        updated_at: Date.now()
      })
      .where("id", "=", id)
      .execute();

    return response.redirect("/posts");
  },

  // Delete post
  async destroy(request: Request, response: Response) {
    const { id } = request.params;
    await DB.deleteFrom("posts").where("id", "=", id).execute();
    return response.json({ success: true });
  }
};

export default PostHandler;
```

## Handler Organization

### ✅ Handler Pattern: Plain Objects

**Laju handlers are plain objects, not classes.** This makes them simpler and more predictable.

#### ✅ Correct Pattern

```typescript
// ✅ CORRECT - Plain object pattern
export const UserHandler = {
  async store(request: Request, response: Response) {
    const body = await request.json();
    const validated = validateUser(body);
    await DB.insertInto("users").values(validated).execute();
    return response.json({ success: true });
  },

  async index(request: Request, response: Response) {
    const users = await DB.selectFrom("users").selectAll().execute();
    return response.json({ users });
  }
};

export default UserHandler;
```

#### ✅ Use Separate Utility Functions

```typescript
// ✅ ALSO CORRECT - Extract to utility function
import { validateUser } from "../utils/validation";

export const UserHandler = {
  async store(request: Request, response: Response) {
    const body = await request.json();
    const validated = validateUser(body);
    await DB.insertInto("users").values(validated).execute();
    return response.json({ success: true });
  }
};

export default UserHandler;
```

#### Service Layer Pattern

```typescript
// app/services/UserService.ts
export const UserService = {
  async create(data: any) {
    const hashedPassword = await Authenticate.hash(data.password);
    const user = { ...data, password: hashedPassword };
    return await DB.insertInto("users").values(user).execute();
  }
};

export default UserService;

// In handler
import UserService from "../services/UserService";

export const UserHandler = {
  async store(request: Request, response: Response) {
    const body = await request.json();
    const user = await UserService.create(body);
    return response.json({ user });
  }
};

export default UserHandler;
```

#### Repository Pattern

For better separation of concerns, use repositories for data access:

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
  },

  async update(id: string, data: any) {
    return await DB.updateTable("users")
      .set(data)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }
};

export default UserRepository;

// In handler
import UserRepository from "../repositories/user.repository";

export const UserHandler = {
  async show(request: Request, response: Response) {
    const user = await UserRepository.findById(request.params.id);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }
    return response.json({ user });
  }
};
```

## Request & Response

### Request Methods

```typescript
async store(request: Request, response: Response) {
  // Get JSON body
  const data = await request.json();
  
  // Get text body
  const text = await request.text();
  
  // Get headers
  const contentType = request.header("content-type");
  const auth = request.headers.authorization;
  
  // Get cookies
  const authId = request.cookies.auth_id;
  
  // Get URL info
  const url = request.originalUrl;
  const method = request.method;
  const ip = request.ip;
  
  // Get user (from auth middleware)
  const userId = request.user?.id;
}
```

### Response Methods

```typescript
// JSON response
return response.json({ success: true, data: user });

// Inertia response (SPA)
return response.inertia("posts/index", { posts });

// Redirect
return response.redirect("/dashboard");

// HTML response
return response.type("html").send("<h1>Hello</h1>");

// Status code
return response.status(404).json({ error: "Not found" });

// Set cookie
return response.cookie("name", "value", 3600).json({ success: true });

// Set header
return response.setHeader("X-Custom", "value").json({ data });
```

### HTTP Redirect Status Codes

```typescript
// Default 302 (Found) - for GET requests
return response.redirect("/dashboard");

// 303 (See Other) - for POST/PUT/PATCH form submissions
return response.redirect("/profile", 303);

// 301 (Moved Permanently) - for permanent redirects
return response.redirect("/new-path", 301);
```

**⚠️ IMPORTANT**: Always use 303 for form submissions:

```typescript
// ✅ CORRECT - Use 303 for form updates
async update(request: Request, response: Response) {
  const body = await request.json();
  
  const validationResult = Validator.validate(updateSchema, body);
  if (!validationResult.success) {
    const errors = validationResult.errors || {};
    const firstError = Object.values(errors)[0]?.[0] || 'Validation error';
    return response.flash("error", firstError).redirect("/profile", 303);
  }
  
  await DB.updateTable("users")
    .set(body)
    .where("id", "=", request.user.id)
    .execute();
  
  return response
    .flash("success", "Profile updated successfully")
    .redirect("/profile", 303);
}
```

## Flash Messages

Flash messages allow you to send temporary messages to the next request via cookies.

### Usage in Handler

```typescript
// Send error message
return response
   .flash("error", "Email already registered")
   .redirect("/register");

// Send success message
return response
   .flash("success", "Registration successful!")
   .redirect("/login");
```

### Flash Messages in Frontend

```svelte
<script>
let { flash } = $props();
</script>

{#if flash?.error}
  <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
    <span class="text-red-400">{flash.error}</span>
  </div>
{/if}
```

## Common Patterns

### Pattern 1: List with Pagination

```typescript
async index(request: Request, response: Response) {
  const page = parseInt(request.query.page || "1");
  const perPage = 10;
  const offset = (page - 1) * perPage;
  
  const posts = await DB.selectFrom("posts")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(perPage)
    .offset(offset)
    .execute();
  
  const total = await DB.selectFrom("posts")
    .select(({ fn }) => [fn.count("*").as("count")])
    .executeTakeFirst();
  
  return response.inertia("posts/index", {
    posts,
    pagination: {
      page,
      perPage,
      total: total.count,
      totalPages: Math.ceil(total.count / perPage)
    }
  });
}
```

### Pattern 2: Search & Filter

```typescript
async index(request: Request, response: Response) {
  const { search, status, sort } = request.query;
  
  let query = DB.selectFrom("posts").selectAll();
  
  // Search
  if (search) {
    query = query.where("title", "like", `%${search}%`) as any;
  }
  
  // Filter
  if (status) {
    query = query.where("status", "=", status) as any;
  }
  
  // Sort
  const sortBy = sort || "created_at";
  query = query.orderBy(sortBy, "desc") as any;
  
  const posts = await query.execute();
  
  return response.inertia("posts/index", { posts, search, status, sort });
}
```

## Next Steps

- [Validation](/guide/validation) - Validate user input
- [Database](/guide/database) - Database operations
- [Middleware](/guide/middleware) - Learn about middleware
