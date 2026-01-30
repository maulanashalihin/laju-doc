---
title: Response API
---

# Response API

The `Response` object in Laju extends HyperExpress Response with additional methods for rendering Inertia pages, handling flash messages, and managing HTTP responses.

## Overview

```typescript
import { Response } from "type";

class MyController {
  public async index(request: Request, response: Response) {
    // Return Inertia page
    return response.inertia("dashboard", { user: request.user });
  }
}
```

## Response Methods

### `response.inertia(component, props?, viewProps?)`

Render an Inertia.js page with a Svelte component. This enables SPA-like navigation without full page reloads.

```typescript
// Basic usage
return response.inertia("posts/index");

// With props
return response.inertia("posts/index", {
  posts: posts,
  meta: { title: "Blog Posts" }
});

// With view props (for SSR template)
return response.inertia("posts/index", 
  { posts },           // Inertia props
  { title: "My Blog" } // View props (HTML title)
);
```

**Parameters:**
- `component` (string) - The Svelte component path (relative to `resources/js/Pages/`)
- `props` (object, optional) - Data passed to the component
- `viewProps` (object, optional) - Data passed to the SSR template

```typescript
public async index(request: Request, response: Response) {
  const posts = await DB.selectFrom("posts")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(10)
    .execute();
  
  return response.inertia("posts/index", {
    posts,
    pagination: {
      page: 1,
      totalPages: 5
    }
  });
}
```

::: tip Component Path
The component path uses forward slashes and omits the `.svelte` extension:
- ✅ `"posts/index"` → `resources/js/Pages/posts/index.svelte`
- ✅ `"auth/login"` → `resources/js/Pages/auth/login.svelte`
- ❌ `"posts/index.svelte"` (don't include extension)
:::

### `response.json(data)`

Send a JSON response. Commonly used for API endpoints.

```typescript
// Simple JSON response
return response.json({ success: true });

// With data
return response.json({
  success: true,
  data: {
    id: "123",
    name: "John Doe",
    email: "john@example.com"
  }
});

// Error response
return response.status(400).json({
  success: false,
  error: "Validation failed",
  message: "Email is required"
});
```

**Chaining with status:**

```typescript
// 201 Created
return response.status(201).json({ 
  id: newUserId,
  message: "User created" 
});

// 404 Not Found
return response.status(404).json({ 
  error: "Resource not found" 
});

// 500 Server Error
return response.status(500).json({ 
  error: "Internal server error" 
});
```

### `response.redirect(url, status?)`

Redirect to another URL.

```typescript
// 302 redirect (default) - for GET requests
return response.redirect("/dashboard");

// 303 redirect - for POST/PUT/DELETE form submissions
return response.redirect("/posts", 303);

// 301 permanent redirect
return response.redirect("/new-url", 301);
```

::: warning Important: Use 303 for Form Submissions
Always use 303 status for redirects after POST, PUT, or PATCH operations:

```typescript
public async store(request: Request, response: Response) {
  // Process form submission...
  await DB.insertInto("posts").values({ title, content }).execute();
  
  // ✅ CORRECT - Use 303 for form submissions
  return response.redirect("/posts", 303);
}
```

This prevents browsers from resubmitting the form when the user refreshes the page.
:::

**Status Code Reference:**

| Status | Use Case |
|--------|----------|
| 301 | Permanent redirect (SEO-friendly) |
| 302 | Temporary redirect (default for GET) |
| 303 | See Other (after POST/PUT/PATCH) |
| 307 | Temporary redirect (preserve method) |
| 308 | Permanent redirect (preserve method) |

### `response.flash(type, message, ttl?)`

Set a flash message that will be displayed on the next request. Flash messages are stored in cookies and automatically cleared after being displayed.

```typescript
// Success message
return response
  .flash("success", "Profile updated successfully!")
  .redirect("/profile");

// Error message
return response
  .flash("error", "Invalid email or password")
  .redirect("/login");

// Info message
return response
  .flash("info", "Check your email for verification link")
  .redirect("/login");

// Warning message
return response
  .flash("warning", "Session expiring soon")
  .redirect("/dashboard");
```

**Flash Types:**
- `success` - Green styling, positive feedback
- `error` - Red styling, errors and failures
- `info` - Blue styling, neutral information
- `warning` - Yellow styling, cautionary messages

**Parameters:**
- `type` (string) - Message type: `'success'`, `'error'`, `'info'`, `'warning'`
- `message` (string) - The message content
- `ttl` (number, optional) - Time to live in milliseconds (default: 3000)

::: tip Displaying Flash Messages in Svelte
Flash messages are automatically passed to your Svelte components:

```svelte
<script>
  let { flash } = $props();
</script>

{#if flash?.error}
  <div class="bg-red-500/10 border border-red-500/20 p-4 rounded">
    <span class="text-red-400">{flash.error}</span>
  </div>
{/if}

{#if flash?.success}
  <div class="bg-green-500/10 border border-green-500/20 p-4 rounded">
    <span class="text-green-400">{flash.success}</span>
  </div>
{/if}
```
:::

### `response.status(code)`

Set the HTTP status code.

```typescript
// Common status codes
return response.status(200).json({ data });     // OK
return response.status(201).json({ created });  // Created
return response.status(400).json({ error });    // Bad Request
return response.status(401).json({ error });    // Unauthorized
return response.status(403).json({ error });    // Forbidden
return response.status(404).json({ error });    // Not Found
return response.status(422).json({ errors });   // Unprocessable Entity
return response.status(500).json({ error });    // Internal Server Error
```

**Common Status Codes:**

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server error |

### `response.cookie(name, value, maxAge?)`

Set a cookie.

```typescript
// Session cookie (expires when browser closes)
return response.cookie("session_id", token);

// Persistent cookie (1 hour)
return response.cookie("remember_me", token, 3600);

// 30 days
return response.cookie("auth_id", token, 30 * 24 * 60 * 60 * 1000);
```

### `response.clearCookie(name)`

Clear a cookie.

```typescript
return response
  .clearCookie("auth_id")
  .redirect("/login");
```

### `response.setHeader(name, value)`

Set a custom HTTP header.

```typescript
return response
  .setHeader("X-Request-ID", requestId)
  .setHeader("Cache-Control", "no-cache")
  .json({ data });
```

### `response.type(contentType)`

Set the Content-Type header.

```typescript
// HTML response
return response.type("html").send("<h1>Hello</h1>");

// Plain text
return response.type("text").send("Plain text response");

// JSON (default for response.json())
return response.type("json").send('{"key": "value"}');
```

### `response.send(data)`

Send raw data as response body.

```typescript
// String
return response.send("Hello World");

// Buffer
return response.send(Buffer.from("Binary data"));

// HTML
return response.type("html").send("<html>...</html>");
```

## Method Chaining

Most response methods return the response object, allowing method chaining:

```typescript
// Chain multiple methods
return response
  .status(201)
  .setHeader("X-Custom-Header", "value")
  .json({ success: true, data });

// Flash + redirect
return response
  .flash("success", "Operation completed")
  .redirect("/dashboard", 303);

// Cookie + redirect
return response
  .cookie("session", sessionId, 3600)
  .redirect("/dashboard");
```

## Complete Examples

### REST API Controller

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";

class ApiController {
  // GET /api/users
  public async index(request: Request, response: Response) {
    const users = await DB.selectFrom("users")
      .select(["id", "name", "email"])
      .execute();
    
    return response.json({
      success: true,
      data: users,
      meta: {
        total: users.length,
        timestamp: Date.now()
      }
    });
  }

  // GET /api/users/:id
  public async show(request: Request, response: Response) {
    const { id } = request.params;
    
    const user = await DB.selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    
    if (!user) {
      return response.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    return response.json({
      success: true,
      data: user
    });
  }

  // POST /api/users
  public async store(request: Request, response: Response) {
    try {
      const body = await request.json();
      
      const result = await DB.insertInto("users")
        .values({
          id: crypto.randomUUID(),
          name: body.name,
          email: body.email,
          created_at: Date.now()
        })
        .executeTakeFirst();
      
      return response.status(201).json({
        success: true,
        id: result.insertId,
        message: "User created"
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: "Failed to create user"
      });
    }
  }

  // DELETE /api/users/:id
  public async destroy(request: Request, response: Response) {
    const { id } = request.params;
    
    await DB.deleteFrom("users")
      .where("id", "=", id)
      .execute();
    
    return response.status(204).send();
  }
}

export default new ApiController();
```

### Form Handling with Flash Messages

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";
import Validator from "../services/Validator";
import { contactSchema } from "../validators/ContactValidator";

class ContactController {
  // Show contact form
  public async create(request: Request, response: Response) {
    return response.inertia("contact/form");
  }

  // Process form submission
  public async store(request: Request, response: Response) {
    try {
      const body = await request.json();
      
      // Validate
      const validation = Validator.validate(contactSchema, body);
      
      if (!validation.success) {
        const firstError = Object.values(validation.errors || {})[0]?.[0];
        return response
          .flash("error", firstError || "Validation failed")
          .redirect("/contact", 303);
      }
      
      // Save to database
      await DB.insertInto("contacts")
        .values({
          name: validation.data!.name,
          email: validation.data!.email,
          message: validation.data!.message,
          created_at: Date.now()
        })
        .execute();
      
      // Success - flash message and redirect
      return response
        .flash("success", "Thank you! Your message has been sent.")
        .redirect("/contact", 303);
        
    } catch (error) {
      console.error("Contact form error:", error);
      
      return response
        .flash("error", "Something went wrong. Please try again.")
        .redirect("/contact", 303);
    }
  }
}

export default new ContactController();
```

### Authentication Flow

```typescript
import { Request, Response } from "../../type";
import Authenticate from "../services/Authenticate";
import { UserRepository } from "../repositories/UserRepository";

class AuthController {
  // Login page
  public async login(request: Request, response: Response) {
    return response.inertia("auth/login");
  }

  // Process login
  public async processLogin(request: Request, response: Response) {
    const { email, password } = await request.json();
    
    const user = await UserRepository.findByEmail(email);
    
    if (!user) {
      return response
        .flash("error", "Invalid credentials")
        .redirect("/login");
    }
    
    const validPassword = await Authenticate.compare(password, user.password);
    
    if (!validPassword) {
      return response
        .flash("error", "Invalid credentials")
        .redirect("/login");
    }
    
    // Create session and redirect
    return Authenticate.process(user, request, response, "/dashboard");
  }

  // Logout
  public async logout(request: Request, response: Response) {
    await Authenticate.logout(request, response);
    // This clears cookie and redirects to login
  }

  // Dashboard (protected)
  public async dashboard(request: Request, response: Response) {
    if (!request.user) {
      return response
        .flash("error", "Please login first")
        .redirect("/login");
    }
    
    return response.inertia("dashboard", {
      user: request.user
    });
  }
}

export default new AuthController();
```

## TypeScript Types

### Importing Response Type

```typescript
// From type module (recommended)
import { Response } from "../../type";

// Or from hyper-express directly
import { Response } from "hyper-express";
```

### Response Interface

```typescript
interface Response extends HyperExpress.Response {
  // Inertia rendering
  inertia(
    component: string, 
    inertiaProps?: Record<string, unknown>, 
    viewProps?: Record<string, unknown>
  ): Promise<unknown>;
  
  // Flash messages
  flash(type: string, message: string, ttl?: number): Response;
  
  // Standard methods (inherited)
  json(data: any): Response;
  send(data: string | Buffer): Response;
  status(code: number): Response;
  redirect(url: string, status?: number): Response;
  cookie(name: string, value: string, maxAge?: number): Response;
  setHeader(name: string, value: string): Response;
  type(contentType: string): Response;
}
```

## Best Practices

1. **Use 303 for POST redirects** - Prevents form resubmission
2. **Return appropriate status codes** - Helps clients understand the response
3. **Use flash messages for user feedback** - Better UX for form submissions
4. **Chain methods for cleaner code** - `response.flash().redirect()`
5. **Always return the response** - Ensures proper request handling

## Related

- [Request API](./request) - Request object properties and methods
- [Database API](./database) - Database operations with Kysely
- [Services API](./services) - Built-in services overview
