---
title: Request API
---

# Request API

The `Request` object in Laju extends HyperExpress Request with additional properties and methods for handling HTTP requests. It provides type-safe access to request data throughout your application.

## Overview

```typescript
import { Request } from "type";

class MyController {
  public async index(request: Request, response: Response) {
    // Access request properties
    const userId = request.user?.id;
    const page = request.query.page;
  }
}
```

## Request Properties

### `params`

URL path parameters extracted from route definitions.

```typescript
// Route: Route.get("/users/:id", UserController.show);

public async show(request: Request, response: Response) {
  const { id } = request.params; // string
  console.log(id); // "123"
}
```

### `query`

Query string parameters from the URL.

```typescript
// URL: /search?q=hello&page=2&limit=10

public async search(request: Request, response: Response) {
  const { q, page, limit } = request.query;
  
  console.log(q);     // "hello"
  console.log(page);  // "2"
  console.log(limit); // "10"
  
  // Always returns strings - convert as needed
  const pageNum = parseInt(page || "1");
  const limitNum = parseInt(limit || "10");
}
```

### `body`

Parsed request body (available after calling `request.json()`).

```typescript
public async store(request: Request, response: Response) {
  const body = await request.json();
  
  // body contains parsed JSON
  console.log(body.title);   // "My Post"
  console.log(body.content); // "Post content..."
}
```

### `headers`

Request headers as a key-value object.

```typescript
public async index(request: Request, response: Response) {
  // Access specific headers
  const contentType = request.headers["content-type"];
  const userAgent = request.headers["user-agent"];
  const authorization = request.headers["authorization"];
  
  // Case-insensitive access
  const auth = request.headers["Authorization"]; // Also works
}
```

### `cookies`

Parsed cookies from the request.

```typescript
public async dashboard(request: Request, response: Response) {
  // Access session cookie
  const sessionId = request.cookies.auth_id;
  
  // Check if user is logged in
  if (!request.cookies.auth_id) {
    return response.redirect("/login");
  }
}
```

### `user`

Authenticated user object (populated by Auth middleware).

```typescript
interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_admin: number;       // 0 or 1
  is_verified: number;    // 0 or 1
}

public async profile(request: Request, response: Response) {
  // Check if user is authenticated
  if (!request.user) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  
  // Access user properties
  const userId = request.user.id;
  const userEmail = request.user.email;
  const isAdmin = request.user.is_admin === 1;
  
  return response.json({ user: request.user });
}
```

### `session`

Session data (when using session middleware).

```typescript
public async someAction(request: Request, response: Response) {
  // Access session data
  const sessionData = request.session;
}
```

### `ip`

Client IP address.

```typescript
public async track(request: Request, response: Response) {
  const clientIp = request.ip;
  console.log(`Request from: ${clientIp}`);
}
```

### `method`

HTTP method of the request.

```typescript
public async handle(request: Request, response: Response) {
  if (request.method === "POST") {
    // Handle POST
  } else if (request.method === "GET") {
    // Handle GET
  }
}
```

### `originalUrl`

Full URL path of the request.

```typescript
public async log(request: Request, response: Response) {
  console.log(`Accessed: ${request.originalUrl}`);
  // Output: Accessed: /users/123?expand=true
}
```

## Request Methods

### `request.json()`

Parse JSON body asynchronously. Returns a Promise that resolves to the parsed body.

```typescript
public async store(request: Request, response: Response) {
  try {
    const body = await request.json();
    
    // body is now a parsed JavaScript object
    const { title, content, tags } = body;
    
    // Use the data
    await DB.insertInto("posts")
      .values({
        title,
        content,
        tags: JSON.stringify(tags),
        created_at: Date.now()
      })
      .execute();
    
    return response.redirect("/posts");
  } catch (error) {
    return response.status(400).json({ error: "Invalid JSON" });
  }
}
```

::: tip Type Safety
For better type safety, define interfaces for your request bodies:

```typescript
interface CreatePostRequest {
  title: string;
  content: string;
  tags?: string[];
}

const body = await request.json() as CreatePostRequest;
```
:::

### `request.text()`

Get raw text body.

```typescript
public async webhook(request: Request, response: Response) {
  const rawBody = await request.text();
  
  // Parse as needed
  const data = JSON.parse(rawBody);
  
  // Or verify signature
  const signature = request.headers["x-signature"];
  const isValid = verifySignature(rawBody, signature);
}
```

### `request.header(name)`

Get a specific header value.

```typescript
public async apiEndpoint(request: Request, response: Response) {
  const apiKey = request.header("x-api-key");
  const contentType = request.header("content-type");
  
  if (!apiKey) {
    return response.status(401).json({ error: "API key required" });
  }
}
```

### `request.multipart()`

Handle multipart form data (file uploads).

```typescript
import { uuidv7 } from "uuidv7";

public async upload(request: Request, response: Response) {
  await request.multipart(async (field) => {
    if (field && typeof field === "object" && "file" in field && field.file) {
      const file = field.file as { 
        stream: NodeJS.ReadableStream; 
        mime_type: string;
        name: string;
      };
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      file.stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      
      await new Promise((resolve) => {
        file.stream.on("end", resolve);
      });
      
      const buffer = Buffer.concat(chunks);
      
      // Process file...
      console.log(`Received: ${file.name} (${file.mime_type})`);
    }
  });
}
```

## Complete Example

Here's a comprehensive example showing various request properties and methods:

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";
import Validator from "../services/Validator";
import { postSchema } from "../validators/PostValidator";

class PostController {
  /**
   * List posts with pagination and filtering
   */
  public async index(request: Request, response: Response) {
    // Query parameters
    const page = parseInt(request.query.page || "1");
    const limit = parseInt(request.query.limit || "10");
    const search = request.query.search || "";
    
    // Build query
    let query = DB.selectFrom("posts").selectAll();
    
    if (search) {
      query = query.where("title", "like", `%${search}%`);
    }
    
    const posts = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();
    
    return response.inertia("posts/index", {
      posts,
      page,
      limit,
      search
    });
  }

  /**
   * Show single post
   */
  public async show(request: Request, response: Response) {
    // URL parameter
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

  /**
   * Create new post
   */
  public async store(request: Request, response: Response) {
    // Check authentication
    if (!request.user) {
      return response.status(401).json({ error: "Unauthorized" });
    }
    
    // Parse JSON body
    const body = await request.json();
    
    // Validate
    const validation = Validator.validate(postSchema, body);
    if (!validation.success) {
      return response.status(422).json({
        error: "Validation failed",
        errors: validation.errors
      });
    }
    
    // Create post
    const result = await DB.insertInto("posts")
      .values({
        id: crypto.randomUUID(),
        title: validation.data!.title,
        content: validation.data!.content,
        user_id: request.user.id, // From authenticated user
        created_at: Date.now()
      })
      .executeTakeFirst();
    
    return response.status(201).json({
      success: true,
      id: result.insertId
    });
  }

  /**
   * Update post
   */
  public async update(request: Request, response: Response) {
    const { id } = request.params;
    const body = await request.json();
    
    // Check ownership
    const post = await DB.selectFrom("posts")
      .select("user_id")
      .where("id", "=", id)
      .executeTakeFirst();
    
    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }
    
    if (post.user_id !== request.user?.id && request.user?.is_admin !== 1) {
      return response.status(403).json({ error: "Forbidden" });
    }
    
    await DB.updateTable("posts")
      .set({
        title: body.title,
        content: body.content,
        updated_at: Date.now()
      })
      .where("id", "=", id)
      .execute();
    
    return response.json({ success: true });
  }

  /**
   * Log request details
   */
  public async logRequest(request: Request, response: Response) {
    const logData = {
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      contentType: request.headers["content-type"],
      cookies: request.cookies,
      user: request.user ? {
        id: request.user.id,
        email: request.user.email
      } : null
    };
    
    console.log("Request log:", logData);
    
    return response.json({ logged: true });
  }
}

export default new PostController();
```

## TypeScript Types

### Importing Request Type

```typescript
// From type module (recommended)
import { Request } from "../../type";

// Or from hyper-express directly
import { Request } from "hyper-express";
```

### Extending Request

If you need to add custom properties to the request:

```typescript
// type/custom.d.ts
declare module "hyper-express" {
  interface Request {
    customData?: {
      requestId: string;
      startTime: number;
    };
  }
}
```

## Best Practices

1. **Always validate input** - Use `Validator` service for input validation
2. **Check authentication** - Verify `request.user` exists for protected routes
3. **Convert query params** - Parse strings to numbers/dates as needed
4. **Handle errors** - Wrap `request.json()` in try-catch blocks
5. **Use TypeScript** - Define interfaces for request bodies

## Related

- [Response API](./response) - Response object methods and properties
- [Database API](./database) - Database operations with Kysely
- [Services API](./services) - Built-in services overview
