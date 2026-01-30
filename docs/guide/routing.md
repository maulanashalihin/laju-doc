# Routing

Learn how to define routes in Laju Framework.

## Introduction

Routes define how your application responds to HTTP requests.

### Request Flow

```
HTTP Request → Route → Middleware → Controller → Response
```

## Basic Routing

Routes are defined in `routes/web.ts`:

```typescript
import Route from "./Route";
import HomeController from "../app/controllers/HomeController";

// GET request
Route.get("/", HomeController.index);

// POST request
Route.post("/contact", HomeController.contact);

// PUT request
Route.put("/users/:id", UserController.update);

// DELETE request
Route.delete("/posts/:id", PostController.destroy);
```

## HTTP Methods

```typescript
Route.get("/path", Controller.method);     // GET
Route.post("/path", Controller.method);    // POST
Route.put("/path", Controller.method);     // PUT
Route.patch("/path", Controller.method);   // PATCH
Route.delete("/path", Controller.method);  // DELETE
```

## Route Parameters

### URL Parameters

```typescript
// routes/web.ts
Route.get("/users/:id", UserController.show);
Route.get("/posts/:postId/comments/:commentId", CommentController.show);

// Controller
public async show(request: Request, response: Response) {
  const { id } = request.params;
  const user = await DB.selectFrom("users")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  return response.json({ user });
}
```

### Query Parameters

```typescript
// URL: /search?q=hello&page=2

public async search(request: Request, response: Response) {
  const { q, page } = request.query;
  
  const results = await DB.selectFrom("posts")
    .selectAll()
    .where("title", "like", `%${q}%`)
    .limit(10)
    .offset((page - 1) * 10)
    .execute();
  
  return response.json({ results });
}
```

## Route Middleware

Apply middleware to specific routes:

```typescript
import Auth from "../app/middlewares/auth";
import { authRateLimit } from "../app/middlewares/rateLimit";

// Public routes
Route.get("/", HomeController.index);

// Protected routes
Route.get("/dashboard", [Auth], DashboardController.index);

// Multiple middleware
Route.post("/upload", [Auth, uploadRateLimit], UploadController.store);
```

## RESTful Routes

```typescript
// routes/web.ts
import PostController from "../app/controllers/PostController";

Route.get("/posts", PostController.index);           // List
Route.get("/posts/create", PostController.create);   // Create form
Route.post("/posts", PostController.store);          // Store
Route.get("/posts/:id", PostController.show);        // Show
Route.get("/posts/:id/edit", PostController.edit);   // Edit form
Route.put("/posts/:id", PostController.update);      // Update
Route.delete("/posts/:id", PostController.destroy);  // Delete
```

## Next Steps

- [Controllers](/guide/controllers) - Handle HTTP requests
- [Middleware](/guide/middleware) - Learn about middleware
