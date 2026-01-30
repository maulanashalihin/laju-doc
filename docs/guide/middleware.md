# Middleware

Complete guide to understanding and creating middleware in Laju Framework.

## Introduction

Middleware functions have access to the request and response objects. They can execute code, modify request/response objects, and control the flow of the request-response cycle.

### What Middleware Can Do

- Execute any code
- Modify request and response objects
- End the request-response cycle
- Validate input data
- Check authentication/authorization
- Log requests
- Rate limiting
- Transform data

## HyperExpress vs Express.js

### CRITICAL DIFFERENCE

**HyperExpress supports TWO middleware patterns:**

```typescript
// ❌ Express.js style (DON'T USE)
app.use((req, res, next) => {
  console.log('Middleware');
  next(); // ❌ This doesn't exist in HyperExpress
});

// ✅ HyperExpress Style 1: Async (RECOMMENDED)
app.use(async (request, response) => {
  console.log('Middleware');
  // Automatically continues after resolve
});

// ✅ HyperExpress Style 2: Callback with next
app.use((request, response, next) => {
  console.log('Middleware');
  next(); // Must call next() to continue
});
```

### Execution Rules

| Pattern | Action | Result |
|---------|--------|--------|
| `async (req, res)` | No return | Continue to next middleware/handler |
| `async (req, res)` | `return response.xxx()` | Stop execution, send response |
| `(req, res, next)` | `next()` | Continue to next middleware/handler |
| `(req, res, next)` | `return response.xxx()` | Stop execution, send response |

### Examples

```typescript
// ✅ Continue to next handler (async pattern - RECOMMENDED)
export default async (request: Request, response: Response) => {
  request.startTime = Date.now();
  // No return = continues automatically
}

// ✅ Stop execution and redirect (async pattern)
export default async (request: Request, response: Response) => {
  if (!request.user) {
    return response.redirect("/login"); // Stops here
  }
  // Continues if user exists
}

// ✅ Stop execution and send JSON (async pattern)
export default async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  // Continues if authorized
}
```

### IMPORTANT

**ALWAYS use `async` for middleware in Laju Framework:**

```typescript
// ✅ CORRECT - Async middleware
export function securityHeaders() {
  return async (request: Request, response: Response) => {
    response.header('X-Frame-Options', 'DENY');
    // Automatically continues
  };
}

// ❌ WRONG - Non-async without next
export function securityHeaders() {
  return (request: Request, response: Response) => {
    response.header('X-Frame-Options', 'DENY');
    // Request will hang - no way to continue!
  };
}
```

## Built-in Middleware

### 1. Auth Middleware

Protects routes requiring authentication.

```typescript
import Auth from "app/middlewares/auth";

// Protect single route
Route.get("/dashboard", [Auth], DashboardController.index);

// Protect multiple routes
Route.get("/profile", [Auth], ProfileController.show);
Route.post("/profile", [Auth], ProfileController.update);
```

**Features:**
- ✅ Session caching (60 days) for performance
- ✅ Session expiration check
- ✅ Error handling with fallback to login

### 2. CSRF Middleware

Protects against Cross-Site Request Forgery attacks.

```typescript
import { csrf } from "app/middlewares/csrf";

// Apply globally in server.ts
webserver.use(csrf({
  excludeAPIs: true,  // Exclude /api/* routes (default: true)
  excludePaths: ['/webhooks/*']  // Additional paths to exclude
}));
```

### 3. Rate Limit Middleware

Prevents abuse by limiting requests per time window.

```typescript
import {
  authRateLimit,           // 5 requests per 15 min
  apiRateLimit,            // 100 requests per 15 min
  generalRateLimit,        // 1000 requests per 15 min
  passwordResetRateLimit,  // 3 requests per hour
  emailRateLimit,          // 10 requests per hour
  uploadRateLimit,         // 50 requests per hour
  createAccountRateLimit   // 3 requests per hour
} from "app/middlewares/rateLimit";

// Usage
Route.post("/login", [authRateLimit], AuthController.processLogin);
Route.post("/register", [createAccountRateLimit], AuthController.processRegister);
Route.post("/api/upload", [Auth, uploadRateLimit], UploadController.store);
```

### 4. Security Headers Middleware

Adds security-related HTTP headers to all responses.

```typescript
import { securityHeaders } from "app/middlewares/securityHeaders";

// Applied globally in server.ts
webserver.use(securityHeaders());
```

**Features:**
- ✅ XSS protection
- ✅ Clickjacking protection
- ✅ MIME type sniffing protection
- ✅ Configurable CSP (Content Security Policy)

### 5. Inertia Middleware

Handles Inertia.js responses for SPA-like experience.

```typescript
import inertia from "app/middlewares/inertia";

// Apply globally in server.ts
webserver.use(inertia());

// Now you can use response.inertia() in controllers
public async index(request: Request, response: Response) => {
  const posts = await DB.from("posts");
  return response.inertia("posts/index", { posts });
}
```

## Creating Custom Middleware

### Basic Middleware Template

```typescript
// app/middlewares/myMiddleware.ts
import { Request, Response } from "../../type";

export default async (request: Request, response: Response) => {
  // Your logic here
  
  // Option 1: Continue to next handler (no return)
  request.customData = "some value";
  
  // Option 2: Stop and send response
  // return response.status(400).json({ error: "Bad request" });
}
```

### Example 1: Request Logger

```typescript
// app/middlewares/requestLogger.ts
import { Request, Response } from "../../type";
import { logInfo } from "../services/Logger";

export default async (request: Request, response: Response) => {
  const startTime = Date.now();
  
  logInfo("Request received", {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
  
  // Continue to next handler
  request.startTime = startTime;
}
```

### Example 2: API Key Validation

```typescript
// app/middlewares/apiKey.ts
import { Request, Response } from "../../type";

export default async (request: Request, response: Response) => {
  const apiKey = request.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return response.status(401).json({
      error: "API key is required",
      code: "MISSING_API_KEY"
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return response.status(403).json({
      error: "Invalid API key",
      code: "INVALID_API_KEY"
    });
  }
  
  // Valid API key, continue
}
```

### Example 3: Role-Based Access Control

```typescript
// app/middlewares/requireAdmin.ts
import { Request, Response } from "../../type";

export default async (request: Request, response: Response) => {
  // Assumes Auth middleware ran first
  if (!request.user) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  
  if (!request.user.is_admin) {
    return response.status(403).json({ 
      error: "Admin access required" 
    });
  }
  
  // User is admin, continue
}
```

### Example 4: CORS Middleware

```typescript
// app/middlewares/cors.ts
import { Request, Response } from "../../type";

export default async (request: Request, response: Response) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = request.headers.origin as string;
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return response.status(204).send('');
  }
  
  // Continue for other methods
}
```

## Using Middleware in Routes

```typescript
// Single middleware
Route.get("/profile", [Auth], ProfileController.show);

// Multiple middleware (executed in order)
Route.post("/upload", [Auth, uploadRateLimit, validateFile], UploadController.store);

// Global middleware (applies to all routes)
webserver.use(securityHeaders());
```

## Best Practices

1. **Always use async pattern** - Prevents request hanging
2. **Use early returns** - For stopping execution
3. **Keep middleware focused** - One responsibility per middleware
4. **Order matters** - Middleware executes left to right
5. **Document behavior** - Explain what the middleware does

## Next Steps

- [Controllers](/guide/controllers) - Handle requests after middleware
- [Authentication](/guide/authentication) - Learn more about auth
