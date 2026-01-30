# Controllers

Learn how to create controllers in Laju Framework.

## Creating a Controller

**Using CLI:**
```bash
node laju make:controller PostController
```

**Manual creation** (`app/controllers/PostController.ts`):

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";

class PostController {
  // List all posts
  public async index(request: Request, response: Response) {
    const posts = await DB.selectFrom("posts")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();
    return response.inertia("posts/index", { posts });
  }

  // Show create form
  public async create(request: Request, response: Response) {
    return response.inertia("posts/create");
  }

  // Store new post
  public async store(request: Request, response: Response) {
    const { title, content } = await request.json();
    
    await DB.insertInto("posts").values({
      title,
      content,
      user_id: request.user.id,
      created_at: Date.now(),
      updated_at: Date.now()
    }).execute();
    
    return response.redirect("/posts");
  }

  // Show single post
  public async show(request: Request, response: Response) {
    const { id } = request.params;
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    
    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }
    
    return response.inertia("posts/show", { post });
  }

  // Show edit form
  public async edit(request: Request, response: Response) {
    const { id } = request.params;
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    
    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }
    
    return response.inertia("posts/edit", { post });
  }

  // Update post
  public async update(request: Request, response: Response) {
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
  }

  // Delete post
  public async destroy(request: Request, response: Response) {
    const { id } = request.params;
    await DB.deleteFrom("posts").where("id", "=", id).execute();
    return response.json({ success: true });
  }
}

export default new PostController();
```

## Controller Organization

### ⚠️ CRITICAL: Don't Use `this`

**Laju exports controller instances, not classes.** This affects how you organize controller code.

#### ❌ DON'T: Use `this` for internal methods

```typescript
// ❌ WRONG - this.method() doesn't work
class UserController {
  public async store(request: Request, response: Response) {
    const body = await request.json();
    const validated = this.validateUser(body); // This will fail!
    await DB.insertInto("users").values(validated).execute();
    return response.json({ success: true });
  }

  private validateUser(data: any) {
    return data;
  }
}

export default new UserController();
```

#### ✅ DO: Use Static Methods

```typescript
// ✅ CORRECT - Use static methods
class UserController {
  public async store(request: Request, response: Response) {
    const body = await request.json();
    const validated = UserController.validateUser(body);
    await DB.insertInto("users").values(validated).execute();
    return response.json({ success: true });
  }

  private static validateUser(data: any) {
    return data;
  }
}

export default new UserController();
```

#### ✅ DO: Use Separate Utility Functions

```typescript
// ✅ ALSO CORRECT - Extract to utility function
import { validateUser } from "../utils/validation";

class UserController {
  public async store(request: Request, response: Response) {
    const body = await request.json();
    const validated = validateUser(body);
    await DB.insertInto("users").values(validated).execute();
    return response.json({ success: true });
  }
}

export default new UserController();
```

#### Service Layer Pattern

```typescript
// app/services/UserService.ts
class UserService {
  async create(data: any) {
    const hashedPassword = await Authenticate.hash(data.password);
    const user = { ...data, password: hashedPassword };
    return await DB.insertInto("users").values(user).execute();
  }
}

export default new UserService();

// In controller
import UserService from "../services/UserService";

class UserController {
  public async store(request: Request, response: Response) {
    const body = await request.json();
    const user = await UserService.create(body);
    return response.json({ user });
  }
}

export default new UserController();
```

## Request & Response

### Request Methods

```typescript
public async store(request: Request, response: Response) {
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
public async update(request: Request, response: Response) {
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

### Usage in Controller

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
public async index(request: Request, response: Response) {
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
public async index(request: Request, response: Response) {
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
