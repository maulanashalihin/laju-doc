---
title: API Server Example
---

# REST API Server Example

A complete REST API implementation demonstrating authentication, CRUD operations, validation, rate limiting, and API versioning with Laju Framework.

## Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **API Versioning** - Versioned API endpoints
- ✅ **Rate Limiting** - Prevent abuse with rate limits
- ✅ **CRUD Operations** - Full Create, Read, Update, Delete
- ✅ **Input Validation** - Request validation with Zod
- ✅ **Error Handling** - Consistent error responses
- ✅ **Pagination** - Cursor and offset pagination
- ✅ **Filtering & Sorting** - Query parameter support
- ✅ **API Documentation** - OpenAPI/Swagger integration
- ✅ **Testing** - Example requests with curl

## Project Structure

```
app/
├── controllers/
│   └── Api/
│       ├── v1/
│       │   ├── AuthController.ts
│       │   ├── UserController.ts
│       │   └── PostController.ts
│       └── BaseController.ts
├── middlewares/
│   ├── apiAuth.ts          # JWT verification
│   └── apiRateLimit.ts     # Rate limiting
├── services/
│   └── JWTService.ts       # JWT operations
└── validators/
    └── ApiValidator.ts

routes/
├── api.ts                  # API routes
└── web.ts
```

## Installation

Install required dependencies:

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

## JWT Service

Create `app/services/JWTService.ts`:

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h";

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

class JWTService {
  generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}

export default new JWTService();
```

## API Authentication Middleware

Create `app/middlewares/apiAuth.ts`:

```typescript
import { Request, Response } from "../../type";
import JWTService from "../services/JWTService";

export default async (request: Request, response: Response) => {
  const authHeader = request.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Access token required"
      }
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = JWTService.verifyToken(token);
    
    // Attach user info to request
    (request as any).authUser = {
      userId: payload.userId,
      email: payload.email
    };
  } catch (error) {
    return response.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token"
      }
    });
  }
};
```

## API Rate Limit Middleware

Create `app/middlewares/apiRateLimit.ts`:

```typescript
import { Request, Response } from "../../type";

// Simple in-memory rate limiter
const requests = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests
const WINDOW_MS = 60 * 1000; // 1 minute

export default async (request: Request, response: Response) => {
  const identifier = request.ip || "unknown";
  const now = Date.now();
  
  const record = requests.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window
    requests.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    return;
  }
  
  if (record.count >= RATE_LIMIT) {
    return response.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      }
    });
  }
  
  record.count++;
};
```

## API Controllers

### Auth Controller

Create `app/controllers/Api/v1/AuthController.ts`:

```typescript
import { Request, Response } from "../../../../type";
import DB from "../../../services/DB";
import Authenticate from "../../../services/Authenticate";
import JWTService from "../../../services/JWTService";
import Validator from "../../../services/Validator";
import { z } from "zod";
import { randomUUID } from "crypto";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required")
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

class AuthController {
  // POST /api/v1/auth/login
  public async login(request: Request, response: Response) {
    try {
      const body = await request.json();
      const validation = Validator.validate(loginSchema, body);

      if (!validation.success) {
        return response.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.errors
          }
        });
      }

      const { email, password } = validation.data!;

      // Find user
      const user = await DB.selectFrom("users")
        .selectAll()
        .where("email", "=", email.toLowerCase())
        .executeTakeFirst();

      if (!user) {
        return response.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
          }
        });
      }

      // Verify password
      const isValid = await Authenticate.compare(password, user.password);

      if (!isValid) {
        return response.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
          }
        });
      }

      // Generate JWT
      const token = JWTService.generateToken({
        userId: user.id,
        email: user.email
      });

      return response.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred"
        }
      });
    }
  }

  // POST /api/v1/auth/register
  public async register(request: Request, response: Response) {
    try {
      const body = await request.json();
      const validation = Validator.validate(registerSchema, body);

      if (!validation.success) {
        return response.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.errors
          }
        });
      }

      const { name, email, password } = validation.data!;

      // Check if email exists
      const existing = await DB.selectFrom("users")
        .select("id")
        .where("email", "=", email.toLowerCase())
        .executeTakeFirst();

      if (existing) {
        return response.status(409).json({
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "Email already registered"
          }
        });
      }

      // Hash password
      const hashedPassword = await Authenticate.hash(password);

      // Create user
      const userId = randomUUID();
      await DB.insertInto("users")
        .values({
          id: userId,
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          created_at: Date.now(),
          updated_at: Date.now()
        })
        .execute();

      // Generate token
      const token = JWTService.generateToken({
        userId,
        email: email.toLowerCase()
      });

      return response.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            name,
            email: email.toLowerCase()
          }
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred"
        }
      });
    }
  }

  // GET /api/v1/auth/me
  public async me(request: Request, response: Response) {
    const authUser = (request as any).authUser;

    const user = await DB.selectFrom("users")
      .select(["id", "name", "email", "created_at"])
      .where("id", "=", authUser.userId)
      .executeTakeFirst();

    if (!user) {
      return response.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    return response.json({
      success: true,
      data: { user }
    });
  }
}

export default new AuthController();
```

### Posts Controller

Create `app/controllers/Api/v1/PostController.ts`:

```typescript
import { Request, Response } from "../../../../type";
import DB from "../../../services/DB";
import Validator from "../../../services/Validator";
import { z } from "zod";
import { randomUUID } from "crypto";

const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft")
});

class PostController {
  // GET /api/v1/posts
  public async index(request: Request, response: Response) {
    try {
      const page = parseInt(request.query.page || "1");
      const limit = Math.min(parseInt(request.query.limit || "20"), 100);
      const offset = (page - 1) * limit;
      const { search, status, sort = "created_at" } = request.query;

      let query = DB.selectFrom("posts")
        .innerJoin("users", "posts.user_id", "users.id")
        .select([
          "posts.id",
          "posts.title",
          "posts.content",
          "posts.status",
          "posts.created_at",
          "posts.updated_at",
          "users.id as author_id",
          "users.name as author_name"
        ]);

      // Apply filters
      if (status) {
        query = query.where("posts.status", "=", status);
      }

      if (search) {
        query = query.where((eb) => eb.or([
          eb("posts.title", "like", `%${search}%`),
          eb("posts.content", "like", `%${search}%`)
        ]));
      }

      // Apply sorting
      const sortDirection = sort.startsWith("-") ? "desc" : "asc";
      const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
      query = query.orderBy(`posts.${sortField}`, sortDirection);

      // Get total count
      const countResult = await DB.selectFrom("posts")
        .select((eb) => eb.fn.countAll().as("count"))
        .$if(!!status, qb => qb.where("status", "=", status!))
        .executeTakeFirst();

      const total = Number(countResult?.count || 0);

      // Get paginated results
      const posts = await query.limit(limit).offset(offset).execute();

      return response.json({
        success: true,
        data: posts,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("List posts error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch posts"
        }
      });
    }
  }

  // GET /api/v1/posts/:id
  public async show(request: Request, response: Response) {
    try {
      const { id } = request.params;

      const post = await DB.selectFrom("posts")
        .innerJoin("users", "posts.user_id", "users.id")
        .select([
          "posts.id",
          "posts.title",
          "posts.content",
          "posts.status",
          "posts.created_at",
          "posts.updated_at",
          "users.id as author_id",
          "users.name as author_name"
        ])
        .where("posts.id", "=", id)
        .executeTakeFirst();

      if (!post) {
        return response.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Post not found"
          }
        });
      }

      return response.json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error("Get post error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch post"
        }
      });
    }
  }

  // POST /api/v1/posts
  public async store(request: Request, response: Response) {
    try {
      const body = await request.json();
      const validation = Validator.validate(postSchema, body);

      if (!validation.success) {
        return response.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.errors
          }
        });
      }

      const authUser = (request as any).authUser;
      const data = validation.data!;
      const postId = randomUUID();

      await DB.insertInto("posts")
        .values({
          id: postId,
          title: data.title,
          content: data.content,
          status: data.status,
          user_id: authUser.userId,
          created_at: Date.now(),
          updated_at: Date.now()
        })
        .execute();

      const post = await DB.selectFrom("posts")
        .selectAll()
        .where("id", "=", postId)
        .executeTakeFirst();

      return response.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error("Create post error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create post"
        }
      });
    }
  }

  // PUT /api/v1/posts/:id
  public async update(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const body = await request.json();
      const validation = Validator.validate(postSchema, body);

      if (!validation.success) {
        return response.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.errors
          }
        });
      }

      const authUser = (request as any).authUser;
      const data = validation.data!;

      // Check ownership
      const existing = await DB.selectFrom("posts")
        .select("user_id")
        .where("id", "=", id)
        .executeTakeFirst();

      if (!existing) {
        return response.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Post not found"
          }
        });
      }

      if (existing.user_id !== authUser.userId) {
        return response.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only update your own posts"
          }
        });
      }

      await DB.updateTable("posts")
        .set({
          title: data.title,
          content: data.content,
          status: data.status,
          updated_at: Date.now()
        })
        .where("id", "=", id)
        .execute();

      const post = await DB.selectFrom("posts")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      return response.json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error("Update post error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update post"
        }
      });
    }
  }

  // DELETE /api/v1/posts/:id
  public async destroy(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const authUser = (request as any).authUser;

      // Check ownership
      const existing = await DB.selectFrom("posts")
        .select("user_id")
        .where("id", "=", id)
        .executeTakeFirst();

      if (!existing) {
        return response.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Post not found"
          }
        });
      }

      if (existing.user_id !== authUser.userId) {
        return response.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own posts"
          }
        });
      }

      await DB.deleteFrom("posts")
        .where("id", "=", id)
        .execute();

      return response.status(204).send();
    } catch (error) {
      console.error("Delete post error:", error);
      return response.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete post"
        }
      });
    }
  }
}

export default new PostController();
```

## API Routes

Create `routes/api.ts`:

```typescript
import Route from "./Route";

// Middleware
import apiRateLimit from "../app/middlewares/apiRateLimit";
import apiAuth from "../app/middlewares/apiAuth";

// Controllers
import AuthController from "../app/controllers/Api/v1/AuthController";
import PostController from "../app/controllers/Api/v1/PostController";

// Apply rate limiting to all API routes
Route.group("/api", [apiRateLimit], () => {
  
  // Health check
  Route.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Version 1
  Route.group("/v1", [], () => {
    
    // Auth routes (public)
    Route.post("/auth/register", AuthController.register);
    Route.post("/auth/login", AuthController.login);
    
    // Protected auth route
    Route.get("/auth/me", [apiAuth], AuthController.me);
    
    // Posts routes
    Route.get("/posts", PostController.index);
    Route.get("/posts/:id", PostController.show);
    Route.post("/posts", [apiAuth], PostController.store);
    Route.put("/posts/:id", [apiAuth], PostController.update);
    Route.delete("/posts/:id", [apiAuth], PostController.destroy);
  });
});
```

## Testing with curl

### Authentication

```bash
# Register
 curl -X POST http://localhost:5555/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5555/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Response: {"success":true,"data":{"token":"eyJ...","user":{"id":"..."}}}

# Get current user (use token from login)
curl http://localhost:5555/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Posts CRUD

```bash
# List posts (public)
curl "http://localhost:5555/api/v1/posts?page=1&limit=10&search=hello"

# Get single post (public)
curl http://localhost:5555/api/v1/posts/POST_ID

# Create post (authenticated)
curl -X POST http://localhost:5555/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my post.",
    "status": "published"
  }'

# Update post (authenticated, owner only)
curl -X PUT http://localhost:5555/api/v1/posts/POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content",
    "status": "published"
  }'

# Delete post (authenticated, owner only)
curl -X DELETE http://localhost:5555/api/v1/posts/POST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testing with Postman

Create a Postman collection with these endpoints:

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login and get token |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| GET | `/api/v1/posts` | No | List all posts |
| GET | `/api/v1/posts/:id` | No | Get single post |
| POST | `/api/v1/posts` | Yes | Create new post |
| PUT | `/api/v1/posts/:id` | Yes | Update post |
| DELETE | `/api/v1/posts/:id` | Yes | Delete post |

**Postman Environment Variables:**
```json
{
  "baseUrl": "http://localhost:5555",
  "token": ""
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "post-id",
    "title": "Post Title",
    "content": "Post content..."
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "title": ["Title is required"],
      "content": ["Content must be at least 10 characters"]
    }
  }
}
```

## Environment Variables

Add to `.env`:

```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h
```

## AI Prompt Example

```
@workflow/INIT_AGENT.md

Create a REST API with:
- JWT authentication (login/register)
- API versioning (v1 prefix)
- Rate limiting (100 requests per minute)
- CRUD endpoints for posts
- Input validation with Zod
- Consistent JSON response format
- Pagination for list endpoints
- Search and filter support
- Error handling with proper HTTP status codes
- Middleware for authentication
```

Then continue with:

```
@workflow/TASK_AGENT.md

Create the authentication system:
- JWT service for token generation/verification
- Auth controller with login and register
- API auth middleware to verify tokens
- Rate limiting middleware
- Auth routes (POST /api/v1/auth/login, POST /api/v1/auth/register, GET /api/v1/auth/me)
```

```
@workflow/TASK_AGENT.md

Create the posts API:
- Post controller with CRUD methods
- Input validation schemas
- Pagination and search
- Ownership check for update/delete
- Protected routes with auth middleware
- Routes: GET /posts, GET /posts/:id, POST /posts, PUT /posts/:id, DELETE /posts/:id
```

## Related

- [Blog Example](./blog) - Full-stack web application
- [Todo Example](./todo) - Simple CRUD patterns
- [E-commerce Example](./ecommerce) - Complex business logic
