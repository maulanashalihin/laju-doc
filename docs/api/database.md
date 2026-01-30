---
title: Database API
---

# Database API

Laju uses [Kysely](https://kysely.dev/) - a type-safe SQL query builder for TypeScript. It provides unparalleled autocompletion and compile-time type safety for your database queries.

## Overview

```typescript
import DB from "app/services/DB";

// Type-safe queries with full autocomplete
const users = await DB.selectFrom("users")
  .selectAll()
  .where("is_active", "=", true)
  .execute();
```

## Basic Queries

### SELECT - Retrieve Data

#### Select All Columns

```typescript
// Get all users
const users = await DB.selectFrom("users")
  .selectAll()
  .execute();
// Returns: User[]
```

#### Select Specific Columns

```typescript
// Get only specific fields
const users = await DB.selectFrom("users")
  .select(["id", "name", "email"])
  .execute();
// Returns: { id: string, name: string, email: string }[]
```

#### Select Single Record

```typescript
// Get one user by ID
const user = await DB.selectFrom("users")
  .selectAll()
  .where("id", "=", userId)
  .executeTakeFirst();
// Returns: User | undefined

// With error handling
if (!user) {
  return response.status(404).json({ error: "User not found" });
}
```

#### Select with WHERE

```typescript
// Simple equality
const activeUsers = await DB.selectFrom("users")
  .selectAll()
  .where("is_active", "=", true)
  .execute();

// Multiple conditions (AND)
const admins = await DB.selectFrom("users")
  .selectAll()
  .where("role", "=", "admin")
  .where("is_verified", "=", true)
  .execute();

// Comparison operators
const recentUsers = await DB.selectFrom("users")
  .selectAll()
  .where("created_at", ">", Date.now() - 86400000) // Last 24 hours
  .execute();
```

### INSERT - Create Data

#### Insert Single Record

```typescript
import { randomUUID } from "crypto";

const result = await DB.insertInto("posts")
  .values({
    id: randomUUID(),
    title: "Hello World",
    content: "My first post",
    user_id: request.user!.id,
    created_at: Date.now(),
    updated_at: Date.now()
  })
  .execute();
```

#### Insert and Return ID

```typescript
const result = await DB.insertInto("users")
  .values({
    id: randomUUID(),
    name: "John Doe",
    email: "john@example.com",
    created_at: Date.now()
  })
  .executeTakeFirst();

console.log("Inserted ID:", result.insertId);
```

#### Batch Insert

```typescript
// Insert multiple records at once
await DB.insertInto("logs").values([
  { message: "User logged in", created_at: Date.now() },
  { message: "Profile updated", created_at: Date.now() },
  { message: "Settings changed", created_at: Date.now() }
]).execute();
```

### UPDATE - Modify Data

#### Update Single Record

```typescript
await DB.updateTable("users")
  .set({
    name: "Jane Doe",
    updated_at: Date.now()
  })
  .where("id", "=", userId)
  .execute();
```

#### Update Multiple Records

```typescript
// Update all draft posts to published
await DB.updateTable("posts")
  .set({ 
    status: "published",
    published_at: Date.now()
  })
  .where("status", "=", "draft")
  .execute();
```

### DELETE - Remove Data

#### Delete Single Record

```typescript
await DB.deleteFrom("posts")
  .where("id", "=", postId)
  .execute();
```

#### Delete with Conditions

```typescript
// Delete expired sessions
await DB.deleteFrom("sessions")
  .where("expires_at", "<", new Date().toISOString())
  .execute();

// Delete all user's posts
await DB.deleteFrom("posts")
  .where("user_id", "=", userId)
  .execute();
```

## Advanced Queries

### JOINs

#### Inner Join

```typescript
// Get posts with author names
const posts = await DB.selectFrom("posts")
  .innerJoin("users", "posts.user_id", "users.id")
  .select([
    "posts.id",
    "posts.title",
    "posts.content",
    "users.name as author_name",
    "users.email as author_email"
  ])
  .where("posts.status", "=", "published")
  .execute();
```

#### Left Join

```typescript
// Get all users with their profiles (if exists)
const users = await DB.selectFrom("users")
  .leftJoin("profiles", "users.id", "profiles.user_id")
  .select([
    "users.id",
    "users.name",
    "users.email",
    "profiles.bio",
    "profiles.website"
  ])
  .execute();
```

### Ordering and Pagination

#### Order By

```typescript
// Single column
const posts = await DB.selectFrom("posts")
  .selectAll()
  .orderBy("created_at", "desc")
  .execute();

// Multiple columns
const users = await DB.selectFrom("users")
  .selectAll()
  .orderBy("role", "asc")
  .orderBy("created_at", "desc")
  .execute();
```

#### Limit and Offset (Pagination)

```typescript
public async paginate(request: Request, response: Response) {
  const page = parseInt(request.query.page || "1");
  const perPage = 20;
  const offset = (page - 1) * perPage;
  
  const posts = await DB.selectFrom("posts")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(perPage)
    .offset(offset)
    .execute();
  
  // Get total count for pagination
  const countResult = await DB.selectFrom("posts")
    .select((eb) => eb.fn.countAll().as("count"))
    .executeTakeFirst();
  
  const total = Number(countResult?.count || 0);
  const totalPages = Math.ceil(total / perPage);
  
  return response.inertia("posts/index", {
    posts,
    pagination: {
      page,
      perPage,
      total,
      totalPages
    }
  });
}
```

### WHERE Variations

#### OR Conditions

```typescript
const users = await DB.selectFrom("users")
  .selectAll()
  .where((eb) => eb.or([
    eb("role", "=", "admin"),
    eb("role", "=", "moderator")
  ]))
  .execute();
```

#### IN Operator

```typescript
const posts = await DB.selectFrom("posts")
  .selectAll()
  .where("category_id", "in", [1, 2, 3, 4, 5])
  .execute();
```

#### LIKE (Pattern Matching)

```typescript
// Search in title
const posts = await DB.selectFrom("posts")
  .selectAll()
  .where("title", "like", "%tutorial%")
  .execute();

// Search multiple columns
const users = await DB.selectFrom("users")
  .selectAll()
  .where((eb) => eb.or([
    eb("name", "like", "%john%"),
    eb("email", "like", "%john%")
  ]))
  .execute();
```

#### NULL Checks

```typescript
// Find users without phone
const users = await DB.selectFrom("users")
  .selectAll()
  .where("phone", "is", null)
  .execute();

// Find users with phone
const usersWithPhone = await DB.selectFrom("users")
  .selectAll()
  .where("phone", "is not", null)
  .execute();
```

#### BETWEEN

```typescript
const posts = await DB.selectFrom("posts")
  .selectAll()
  .where("created_at", ">=", startDate)
  .where("created_at", "<=", endDate)
  .execute();
```

### Aggregates

```typescript
// COUNT
const countResult = await DB.selectFrom("users")
  .select((eb) => eb.fn.countAll().as("count"))
  .where("is_active", "=", true)
  .executeTakeFirst();

console.log("Active users:", countResult?.count);

// SUM
const revenueResult = await DB.selectFrom("orders")
  .select((eb) => eb.fn.sum("amount").as("total"))
  .where("status", "=", "completed")
  .executeTakeFirst();

// AVG
const avgPriceResult = await DB.selectFrom("products")
  .select((eb) => eb.fn.avg("price").as("average"))
  .executeTakeFirst();

// MIN / MAX
const priceRange = await DB.selectFrom("products")
  .select([
    (eb) => eb.fn.min("price").as("min_price"),
    (eb) => eb.fn.max("price").as("max_price")
  ])
  .executeTakeFirst();
```

## Transactions

Transactions ensure that multiple database operations succeed or fail together.

### Basic Transaction

```typescript
await DB.transaction().execute(async (trx) => {
  // Insert user
  const userResult = await trx.insertInto("users")
    .values({
      id: randomUUID(),
      name: "John Doe",
      email: "john@example.com"
    })
    .executeTakeFirst();
  
  const userId = userResult.insertId?.toString();
  
  // Insert profile
  await trx.insertInto("profiles")
    .values({
      user_id: userId,
      bio: "Hello world!"
    })
    .execute();
  
  // Insert settings
  await trx.insertInto("settings")
    .values({
      user_id: userId,
      theme: "dark"
    })
    .execute();
});
// If any operation fails, all are rolled back
```

### Transaction with Error Handling

```typescript
try {
  await DB.transaction().execute(async (trx) => {
    // Deduct from sender
    await trx.updateTable("accounts")
      .set((eb) => ({
        balance: eb("balance", "-", amount)
      }))
      .where("id", "=", senderId)
      .execute();
    
    // Add to receiver
    await trx.updateTable("accounts")
      .set((eb) => ({
        balance: eb("balance", "+", amount)
      }))
      .where("id", "=", receiverId)
      .execute();
    
    // Record transaction
    await trx.insertInto("transactions")
      .values({
        sender_id: senderId,
        receiver_id: receiverId,
        amount,
        created_at: Date.now()
      })
      .execute();
  });
  
  return response.json({ success: true, message: "Transfer completed" });
} catch (error) {
  console.error("Transaction failed:", error);
  return response.status(500).json({ 
    success: false, 
    error: "Transfer failed" 
  });
}
```

## Raw Queries

For complex queries not supported by the query builder:

### Raw SQL

```typescript
import { sql } from "kysely";

// Raw SELECT
const results = await sql<{
  id: string;
  name: string;
  post_count: number;
}>`
  SELECT u.id, u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  GROUP BY u.id
`.execute(DB);

// With parameters (safe from SQL injection)
const email = "user@example.com";
const user = await sql<{
  id: string;
  name: string;
}>`
  SELECT id, name FROM users WHERE email = ${email}
`.executeTakeFirst(DB);
```

### Raw in Select

```typescript
const users = await DB.selectFrom("users")
  .select([
    "id",
    "name",
    sql<number>`COUNT(*) OVER()`.as("total_count")
  ])
  .limit(10)
  .execute();
```

## Database Connections

### Multiple Connections

```typescript
// Connect to different databases
const stagingDB = DB.getConnection("staging");
const productionDB = DB.getConnection("production");

// Use different connections
const stagingUsers = await stagingDB
  .selectFrom("users")
  .selectAll()
  .execute();

const productionUsers = await productionDB
  .selectFrom("users")
  .selectAll()
  .execute();
```

### Native SQLite Access

For maximum performance on simple queries:

```typescript
import SQLite from "app/services/SQLite";

// Get single row (2-4x faster than Kysely)
const user = SQLite.get(
  "SELECT * FROM users WHERE id = ?",
  [userId]
);

// Get all rows
const users = SQLite.all(
  "SELECT * FROM users WHERE is_active = ?",
  [true]
);

// Execute INSERT/UPDATE/DELETE
const result = SQLite.run(
  "INSERT INTO logs (message, created_at) VALUES (?, ?)",
  ["User logged in", Date.now()]
);

console.log("Inserted ID:", result.lastInsertRowid);
```

## Type Definitions

### Database Types

Define your table schemas in `type/db-types.ts`:

```typescript
import type { Generated, Selectable, Insertable, Updateable } from "kysely";

// Table interface
export interface UserTable {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  is_verified: number;
  is_admin: number;
  created_at: number;
  updated_at: number;
}

// Database interface
export interface DB {
  users: UserTable;
  posts: PostTable;
  comments: CommentTable;
}

// Helper types
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
```

### Using Types

```typescript
import { User, NewUser } from "../../type/db-types";

// Type-safe user object
const user: User = await DB.selectFrom("users")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirst();

// Type-safe insert
const newUser: NewUser = {
  id: randomUUID(),
  name: "John",
  email: "john@example.com",
  created_at: Date.now()
};

await DB.insertInto("users").values(newUser).execute();
```

## Complete CRUD Example

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";
import { randomUUID } from "crypto";

class PostController {
  // LIST with pagination
  public async index(request: Request, response: Response) {
    const page = parseInt(request.query.page || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const posts = await DB.selectFrom("posts")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();
    
    return response.inertia("posts/index", { posts, page });
  }

  // CREATE
  public async store(request: Request, response: Response) {
    const body = await request.json();
    
    const result = await DB.insertInto("posts")
      .values({
        id: randomUUID(),
        title: body.title,
        content: body.content,
        user_id: request.user!.id,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .executeTakeFirst();
    
    return response
      .flash("success", "Post created!")
      .redirect("/posts", 303);
  }

  // READ
  public async show(request: Request, response: Response) {
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", request.params.id)
      .executeTakeFirst();
    
    if (!post) {
      return response.status(404).json({ error: "Not found" });
    }
    
    return response.inertia("posts/show", { post });
  }

  // UPDATE
  public async update(request: Request, response: Response) {
    const body = await request.json();
    
    await DB.updateTable("posts")
      .set({
        title: body.title,
        content: body.content,
        updated_at: Date.now()
      })
      .where("id", "=", request.params.id)
      .execute();
    
    return response
      .flash("success", "Post updated!")
      .redirect("/posts", 303);
  }

  // DELETE
  public async destroy(request: Request, response: Response) {
    await DB.deleteFrom("posts")
      .where("id", "=", request.params.id)
      .execute();
    
    return response
      .flash("success", "Post deleted!")
      .redirect("/posts", 303);
  }
}

export default new PostController();
```

## Best Practices

1. **Use type-safe queries** - Define interfaces for your tables
2. **Use `executeTakeFirst()`** for single records instead of `limit(1).execute()`
3. **Use transactions** for multi-step operations
4. **Select only needed columns** - Don't use `selectAll()` if you don't need all data
5. **Use prepared statements** - Kysely automatically parameterizes queries
6. **Handle undefined** - Always check if `executeTakeFirst()` returns undefined
7. **Use Native SQLite** for simple reads (2-4x faster)

## Related

- [Services API](./services) - Other built-in services
- [Request API](./request) - Request handling
- [Response API](./response) - Response methods
