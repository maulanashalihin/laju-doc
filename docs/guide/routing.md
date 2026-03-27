# Routing

Learn how to define routes in Laju Framework.

## Introduction

Routes define how your application responds to HTTP requests. Laju uses **HyperExpress** as the underlying HTTP server framework.

### Request Flow

```
HTTP Request → Route → Middleware → Handler → Response
```

## Basic Routing

Routes are defined in `routes/web.ts`:

```typescript
import HyperExpress from 'hyper-express';
import PublicHandler from "../app/handlers/public.handler";

const Route = new HyperExpress.Router();

// GET request
Route.get("/", PublicHandler.index);

// POST request
Route.post("/login", AuthHandler.processLogin);

// PUT request
Route.put("/users/:id", UserHandler.update);

// DELETE request
Route.delete("/users/:id", UserHandler.destroy);

export default Route;
```

## HTTP Methods

```typescript
Route.get("/path", handler);      // GET
Route.post("/path", handler);     // POST
Route.put("/path", handler);      // PUT
Route.patch("/path", handler);    // PATCH
Route.delete("/path", handler);   // DELETE
```

## Route Parameters

### URL Parameters

```typescript
// routes/web.ts
Route.get("/users/:id", UserHandler.show);
Route.get("/posts/:postId/comments/:commentId", CommentHandler.show);

// Handler
export const UserHandler = {
  async show(request: Request, response: Response) {
    const { id } = request.params;
    const user = await DB.selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return response.json({ user });
  }
};
```

### Query Parameters

```typescript
// URL: /search?q=hello&page=2

export const SearchHandler = {
  async search(request: Request, response: Response) {
    const { q, page } = request.query;

    const results = await DB.selectFrom("posts")
      .selectAll()
      .where("title", "like", `%${q}%`)
      .limit(10)
      .offset((page - 1) * 10)
      .execute();

    return response.json({ results });
  }
};
```

## Route Middleware

Apply middleware to specific routes:

```typescript
import Auth from "../app/middlewares/auth.middleware";
import { authRateLimit } from "../app/middlewares/rate-limit.middleware";

// Public routes
Route.get("/", PublicHandler.index);

// Protected routes
Route.get("/home", [Auth], AppHandler.homePage);

// Multiple middleware
Route.post("/api/upload/image", [Auth, uploadRateLimit], UploadHandler.uploadImage);
```

## Handler Pattern

Handlers are implemented as **plain JavaScript objects** with methods:

```typescript
// app/handlers/auth.handler.ts
export const AuthHandler = {
  async loginPage(request: Request, response: Response) {
    return response.inertia("auth/login");
  },

  async processLogin(request: Request, response: Response) {
    const body = await request.json();
    // Process login logic
    return response.redirect("/home");
  }
};

export default AuthHandler;
```

## Wildcard Routes

Use `*` for catch-all paths:

```typescript
// Serve files from local storage
Route.get("/storage/*", StorageHandler.serveFile);

// Serve public assets
Route.get("/public/*", AssetHandler.publicFolder);
```

## Route Organization

Organize routes by sections in `routes/web.ts`:

```typescript
/**
 * Public Routes
 */
Route.get("/", PublicHandler.index);
Route.get("/login", AuthHandler.loginPage);

/**
 * Protected Routes
 */
Route.get("/home", [Auth], AppHandler.homePage);
Route.get("/profile", [Auth], AppHandler.profilePage);

/**
 * API Routes
 */
Route.post("/api/upload/image", [Auth, uploadRateLimit], UploadHandler.uploadImage);

export default Route;
```

## Registering Routes

Routes are registered in `server.ts`:

```typescript
import HyperExpress from 'hyper-express';
import Web from "./routes/web";

const webserver = new HyperExpress.Server();
webserver.use(Web);
```

## Available Middleware

| Middleware | Purpose | Usage |
|------------|---------|-------|
| `Auth` | Session-based authentication | `[Auth]` |
| `authRateLimit` | Rate limiting for login (5 req/15min) | `[authRateLimit]` |
| `apiRateLimit` | General API rate limiting (100 req/15min) | `[apiRateLimit]` |
| `uploadRateLimit` | File upload limiting (50 req/hour) | `[uploadRateLimit]` |

## Next Steps

- [Handlers](/guide/handlers) - Learn about request handlers
- [Middleware](/guide/middleware) - Learn about middleware
