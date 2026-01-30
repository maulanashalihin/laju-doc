# API Reference

Complete API documentation for Laju Framework.

## Overview

Laju provides a clean, type-safe API for building web applications. The framework is built on top of HyperExpress with additional utilities for common tasks.

## Request Object

The `Request` object extends HyperExpress Request with additional properties.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `params` | `Record<string, string>` | URL parameters |
| `query` | `Record<string, string>` | Query string parameters |
| `body` | `any` | Request body (parsed JSON) |
| `headers` | `Record<string, string>` | Request headers |
| `cookies` | `Record<string, string>` | Parsed cookies |
| `user` | `User \| undefined` | Authenticated user |
| `session` | `Session \| undefined` | Session data |

### Methods

#### `request.json()`

Parse JSON body asynchronously.

```typescript
const body = await request.json();
```

#### `request.file()`

Get uploaded file.

```typescript
const file = await request.file("avatar");
```

## Response Object

The `Response` object extends HyperExpress Response with Laju-specific methods.

### Methods

#### `response.inertia(component, props)`

Render an Inertia.js page.

```typescript
return response.inertia("posts/index", {
  posts: posts,
  meta: { title: "Blog Posts" }
});
```

#### `response.json(data)`

Send JSON response.

```typescript
return response.json({ success: true, data: posts });
```

#### `response.redirect(url, status?)`

Redirect to URL.

```typescript
// 302 redirect (default)
return response.redirect("/posts");

// 303 redirect (after POST/PUT/DELETE)
return response.redirect("/posts", 303);
```

#### `response.flash(type, message)`

Set flash message.

```typescript
return response
  .flash("success", "Post created!")
  .redirect("/posts");
```

#### `response.status(code)`

Set HTTP status code.

```typescript
return response.status(404).json({ error: "Not found" });
```

## Database (Kysely)

Laju uses Kysely for type-safe database queries.

### Basic Queries

#### Select

```typescript
// Select all
const posts = await DB.selectFrom("posts")
  .selectAll()
  .execute();

// Select specific columns
const posts = await DB.selectFrom("posts")
  .select(["id", "title", "created_at"])
  .execute();

// Select with where
const post = await DB.selectFrom("posts")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirst();
```

#### Insert

```typescript
await DB.insertInto("posts").values({
  id: uuidv7(),
  title: "Hello World",
  content: "...",
  created_at: Date.now(),
}).execute();
```

#### Update

```typescript
await DB.updateTable("posts")
  .set({ title: "Updated Title" })
  .where("id", "=", id)
  .execute();
```

#### Delete

```typescript
await DB.deleteFrom("posts")
  .where("id", "=", id)
  .execute();
```

### Joins

```typescript
const posts = await DB.selectFrom("posts")
  .innerJoin("users", "posts.user_id", "users.id")
  .select([
    "posts.id",
    "posts.title",
    "users.name as author_name"
  ])
  .execute();
```

### Ordering & Pagination

```typescript
const posts = await DB.selectFrom("posts")
  .selectAll()
  .orderBy("created_at", "desc")
  .limit(10)
  .offset((page - 1) * 10)
  .execute();
```

## Services

### DB

Database service with Kysely.

```typescript
import DB from "app/services/DB";
```

### Authenticate

Authentication utilities.

```typescript
import Authenticate from "app/services/Authenticate";

// Hash password
const hashedPassword = await Authenticate.hash("password123");

// Compare password
const isValid = await Authenticate.compare("password123", hashedPassword);

// Login user
return Authenticate.process(user, request, response);
```

### Mailer

Email sending service.

```typescript
import Mailer from "app/services/Mailer";

await Mailer.send({
  to: "user@example.com",
  subject: "Welcome",
  html: "<h1>Hello!</h1>"
});
```

### Validator

Zod validation helper.

```typescript
import Validator from "app/services/Validator";

const result = Validator.validate(schema, data);

if (!result.success) {
  return response.flash("error", result.errors[0]).redirect("/");
}
```

## Middleware

### Auth Middleware

Protect routes that require authentication.

```typescript
import Auth from "app/middlewares/auth";

Route.get("/dashboard", [Auth], DashboardController.index);
```

### Rate Limit Middleware

Limit request rate.

```typescript
import { authRateLimit } from "app/middlewares/rateLimit";

Route.post("/login", [authRateLimit], LoginController.processLogin);
```

## TypeScript Types

### Request

```typescript
import { Request } from "type";

class MyController {
  public async index(request: Request, response: Response) {
    // request has typed user property
    const userId = request.user?.id;
  }
}
```

### Response

```typescript
import { Response } from "type";

class MyController {
  public async index(request: Request, response: Response) {
    return response.inertia("page", {});
  }
}
```

## Error Handling

```typescript
try {
  // Your code
} catch (error: any) {
  console.error("Error:", error);
  
  if (error.code === "SQLITE_CONSTRAINT") {
    return response
      .flash("error", "Data already exists")
      .redirect("/", 303);
  }
  
  return response
    .flash("error", "Something went wrong")
    .redirect("/", 303);
}
```