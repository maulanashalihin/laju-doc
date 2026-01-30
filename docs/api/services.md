---
title: Services API
---

# Services API

Laju provides a collection of built-in services for common application needs. These services handle authentication, database operations, validation, email, logging, and more.

## Overview

```typescript
// Import services as needed
import DB from "app/services/DB";
import Authenticate from "app/services/Authenticate";
import Validator from "app/services/Validator";
import { MailTo } from "app/services/Mailer";
import { logInfo, logError } from "app/services/Logger";
```

## DB Service

Type-safe database query builder using Kysely. See the [Database API](./database) for detailed query examples.

```typescript
import DB from "app/services/DB";

// Basic queries
const users = await DB.selectFrom("users").selectAll().execute();

const user = await DB.selectFrom("users")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirst();

await DB.insertInto("posts").values({ title, content }).execute();

await DB.updateTable("users")
  .set({ name: "New Name" })
  .where("id", "=", id)
  .execute();

await DB.deleteFrom("posts").where("id", "=", id).execute();
```

### Additional Methods

```typescript
// Multiple database connections
const stagingDB = DB.getConnection("staging");
const users = await stagingDB.selectFrom("users").selectAll().execute();

// Raw SQLite access
const nativeDb = DB.getNativeDb();
```

## Authenticate Service

Handles password hashing, comparison, and session management.

### Hash Password

```typescript
import Authenticate from "app/services/Authenticate";

// Hash a password
const hashedPassword = await Authenticate.hash("userPassword123");
// Returns: "salt:hash" format
```

::: tip Security
Passwords are hashed using PBKDF2 with:
- 100,000 iterations
- SHA-512 digest
- 64-byte key length
- 16-byte random salt
:::

### Compare Password

```typescript
// Verify a password against stored hash
const isValid = await Authenticate.compare(
  "userPassword123",      // Plain text password
  "salt:hash"             // Stored hash
);

if (isValid) {
  // Password matches
} else {
  // Password incorrect
}
```

### Process Login

Creates a session and sets the authentication cookie.

```typescript
public async login(request: Request, response: Response) {
  const user = await UserRepository.findByEmail(email);
  
  if (!user) {
    return response.flash("error", "Invalid credentials").redirect("/login");
  }
  
  const validPassword = await Authenticate.compare(password, user.password);
  
  if (!validPassword) {
    return response.flash("error", "Invalid credentials").redirect("/login");
  }
  
  // Login successful - create session
  return Authenticate.process(user, request, response, "/dashboard");
}
```

**Parameters:**
- `user` - User object from database
- `request` - Request object
- `response` - Response object
- `redirectPath` (optional) - Where to redirect after login (default: "/home")

### Logout

```typescript
public async logout(request: Request, response: Response) {
  await Authenticate.logout(request, response);
  // Clears session and redirects to /login
}
```

### Complete Authentication Example

```typescript
import { Request, Response } from "../../type";
import Authenticate from "../services/Authenticate";
import { UserRepository } from "../repositories/UserRepository";

class AuthController {
  public async loginPage(request: Request, response: Response) {
    if (request.cookies.auth_id) {
      return response.redirect("/home");
    }
    return response.inertia("auth/login");
  }

  public async processLogin(request: Request, response: Response) {
    try {
      const { email, password } = await request.json();
      
      const user = await UserRepository.findByEmail(email.toLowerCase());
      
      if (!user) {
        return response.flash("error", "Email not registered").redirect("/login");
      }
      
      const passwordMatch = await Authenticate.compare(password, user.password);
      
      if (!passwordMatch) {
        return response.flash("error", "Incorrect password").redirect("/login");
      }
      
      // Create session and redirect
      return Authenticate.process(user, request, response);
    } catch (error) {
      return response.flash("error", "Login failed").redirect("/login");
    }
  }

  public async logout(request: Request, response: Response) {
    if (request.cookies.auth_id) {
      await Authenticate.logout(request, response);
    }
  }
}

export default new AuthController();
```

## Validator Service

Zod-based validation with TypeScript type inference.

### Basic Validation

```typescript
import Validator from "app/services/Validator";
import { z } from "zod";

// Define schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be 18 or older").optional()
});

// Validate data
const result = Validator.validate(userSchema, {
  name: "John Doe",
  email: "john@example.com",
  age: 25
});

if (result.success) {
  // result.data is typed as { name: string, email: string, age?: number }
  console.log("Valid:", result.data);
} else {
  // result.errors contains validation errors
  console.log("Errors:", result.errors);
}
```

### Validation in Controllers

```typescript
public async store(request: Request, response: Response) {
  const body = await request.json();
  
  const result = Validator.validate(userSchema, body);
  
  if (!result.success) {
    // Get first error message
    const errors = result.errors || {};
    const firstError = Object.values(errors)[0]?.[0] || "Validation error";
    
    return response.flash("error", firstError).redirect("/register");
  }
  
  // Use validated data
  const { name, email, age } = result.data!;
  
  // Continue with business logic...
}
```

### Common Validation Schemas

Validator includes pre-defined schemas for common use cases:

```typescript
// Email
Validator.schemas.email;           // z.string().email()

// Password (min 8 chars, at least 1 number)
Validator.schemas.password;        // z.string().min(8).regex(/[0-9]/)

// Phone (Indonesian format)
Validator.schemas.phone;           // +62/62/0 prefix

// Required string
Validator.schemas.requiredString("Field Name");

// URL
Validator.schemas.url;             // z.string().url()

// UUID
Validator.schemas.uuid;            // z.string().uuid()

// Date (ISO format)
Validator.schemas.date;            // z.string().datetime()

// Positive number
Validator.schemas.positiveNumber;  // z.number().positive()
```

### Custom Schemas

```typescript
import { z } from "zod";

// Re-export z for custom schemas
export { z } from "app/services/Validator";

// Registration schema
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least 1 number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

// Post schema
export const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string()).optional()
});
```

### Validate or Throw

```typescript
// Use validateOrThrow when you want exceptions instead of result object
try {
  const data = Validator.validateOrThrow(userSchema, body);
  // data is typed and validated
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
  }
}
```

## Mailer Service

Send transactional emails via SMTP (Gmail) or Resend API.

### SMTP (Gmail)

```typescript
import { MailTo } from "app/services/Mailer";

await MailTo({
  to: "user@example.com",
  subject: "Welcome to Our App",
  text: `Hello John,

Welcome to our application! We're excited to have you on board.

Best regards,
The Team`
});
```

**Environment Variables:**
```
USER_MAILER=your.email@gmail.com
PASS_MAILER=your-16-digit-app-password
MAIL_FROM_NAME=Your App
MAIL_FROM_ADDRESS=noreply@example.com
```

::: tip Gmail App Password
To use Gmail SMTP:
1. Enable 2-Step Verification in Google Account
2. Generate App Password at: Security → 2-Step Verification → App passwords
3. Use the 16-character password (not your login password)
:::

### Resend API

```typescript
import { MailTo } from "app/services/Resend";

await MailTo({
  to: "user@example.com",
  subject: "Password Reset",
  text: `Click the link below to reset your password:

https://example.com/reset-password?token=abc123

This link expires in 1 hour.`
});
```

**Environment Variables:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
MAIL_FROM_NAME=Your App
MAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### Email with Templates

```typescript
import { view } from "app/services/View";
import { MailTo } from "app/services/Mailer";

const html = view("emails/welcome.html", {
  name: user.name,
  verificationUrl: `https://example.com/verify?token=${token}`
});

await MailTo({
  to: user.email,
  subject: "Welcome! Please verify your email",
  text: `Welcome ${user.name}! Please verify: https://example.com/verify?token=${token}`
});
```

### Complete Email Example

```typescript
import { Request, Response } from "../../type";
import { MailTo } from "app/services/Mailer";
import { randomBytes } from "crypto";
import DB from "../services/DB";

class PasswordController {
  public async forgotPassword(request: Request, response: Response) {
    const { email } = await request.json();
    
    const user = await DB.selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
    
    if (!user) {
      // Don't reveal if email exists
      return response.flash("success", "Check your email").redirect("/login");
    }
    
    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Save token
    await DB.insertInto("password_reset_tokens")
      .values({
        email: user.email,
        token,
        expires_at: expiresAt.toISOString()
      })
      .execute();
    
    // Send email
    try {
      await MailTo({
        to: user.email,
        subject: "Password Reset Request",
        text: `Hello ${user.name},

You requested a password reset. Click the link below:

${process.env.APP_URL}/reset-password?token=${token}

This link expires in 1 hour.

If you didn't request this, please ignore this email.`
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
    
    return response
      .flash("success", "Check your email for reset instructions")
      .redirect("/login");
  }
}

export default new PasswordController();
```

## Logger Service

Structured logging with Winston.

### Log Levels

```typescript
import { 
  logInfo, 
  logError, 
  logWarn, 
  logDebug,
  logHttp 
} from "app/services/Logger";

// Info - General information
logInfo("User registered", { userId: "123", email: "user@example.com" });

// Warning - Potential issues
logWarn("Rate limit approaching", { ip: "192.168.1.1", count: 95 });

// Error - Errors with optional Error object
logError("Database connection failed", error, { query: "SELECT..." });

// Debug - Development information
logDebug("Processing request", { requestId: "abc123" });

// HTTP - Request/response logging
logHttp("Request completed", { method: "GET", url: "/api/users", duration: 45 });
```

### Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  logError("Operation failed", error, {
    userId: request.user?.id,
    operation: "update_profile"
  });
  
  return response.status(500).json({ error: "Operation failed" });
}
```

### Request/Response Logging

```typescript
import { logRequest, logResponse } from "app/services/Logger";

public async handle(request: Request, response: Response) {
  const startTime = Date.now();
  
  logRequest({
    method: request.method,
    url: request.originalUrl,
    ip: request.ip,
    headers: request.headers
  });
  
  // ... handle request
  
  logResponse(
    { method: request.method, url: request.originalUrl },
    { statusCode: 200 },
    Date.now() - startTime
  );
}
```

### Log Files

Logs are written to the `logs/` directory:

- `error.log` - Error level messages only
- `combined.log` - All log levels
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

**Console output** is enabled in development mode only.

## Other Services

### View (Eta Templates)

Server-side rendering with Eta template engine.

```typescript
import { view } from "app/services/View";

// Render template
const html = view("emails/welcome.html", {
  name: "John Doe",
  url: "https://example.com"
});

return response.type("html").send(html);
```

### LocalStorage

File storage for local development.

```typescript
import { uploadBuffer, getPublicUrl, deleteFile } from "app/services/LocalStorage";

// Upload file
const storageKey = "uploads/image.webp";
await uploadBuffer(storageKey, buffer, "image/webp");

// Get public URL
const url = getPublicUrl(storageKey);
// Returns: /storage/uploads/image.webp

// Delete file
await deleteFile(storageKey);
```

### S3

AWS S3 integration for production.

```typescript
import { 
  uploadBuffer, 
  getPublicUrl, 
  getSignedUploadUrl,
  deleteObject 
} from "app/services/S3";

// Upload
await uploadBuffer("uploads/file.pdf", buffer, "application/pdf");

// Get signed URL for direct upload
const signedUrl = await getSignedUploadUrl(
  "uploads/image.jpg", 
  "image/jpeg", 
  3600 // 1 hour expiry
);

// Get public URL
const url = getPublicUrl("uploads/file.pdf");
```

### CacheService

Simple caching layer.

```typescript
import CacheService from "app/services/CacheService";

// Store value
CacheService.set("user:123", userData, 3600); // 1 hour TTL

// Retrieve value
const user = CacheService.get("user:123");

// Delete value
CacheService.delete("user:123");

// Clear all
CacheService.clear();
```

### RateLimiter

Request rate limiting.

```typescript
import RateLimiter from "app/services/RateLimiter";

// Check limit
const allowed = await RateLimiter.check(request.ip, {
  maxRequests: 100,
  windowMs: 60000 // 1 minute
});

if (!allowed) {
  return response.status(429).json({ error: "Too many requests" });
}
```

## Service Summary

| Service | Purpose | Import |
|---------|---------|--------|
| **DB** | Database queries | `import DB from "app/services/DB"` |
| **Authenticate** | Password hashing & sessions | `import Authenticate from "app/services/Authenticate"` |
| **Validator** | Input validation | `import Validator from "app/services/Validator"` |
| **Mailer** | SMTP email | `import { MailTo } from "app/services/Mailer"` |
| **Resend** | Resend API email | `import { MailTo } from "app/services/Resend"` |
| **Logger** | Structured logging | `import { logInfo, logError } from "app/services/Logger"` |
| **View** | SSR templates | `import { view } from "app/services/View"` |
| **LocalStorage** | Local file storage | `import { uploadBuffer } from "app/services/LocalStorage"` |
| **S3** | AWS S3 storage | `import { uploadBuffer } from "app/services/S3"` |
| **CacheService** | In-memory cache | `import CacheService from "app/services/CacheService"` |
| **RateLimiter** | Rate limiting | `import RateLimiter from "app/services/RateLimiter"` |

## Related

- [Database API](./database) - Detailed database operations
- [Request API](./request) - Request handling
- [Response API](./response) - Response methods
