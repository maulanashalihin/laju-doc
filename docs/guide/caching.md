# Caching

Complete guide for caching strategies in Laju framework.

## Overview

Laju provides in-memory caching using JavaScript Map with TTL (Time To Live):

| Storage | Latency | Best For |
|---------|---------|----------|
| **In-Memory (Map)** | ~0.001ms | High-frequency cache, session data, config |
| **Redis** | ~0.1-1ms | Distributed cache, persistence needed |
| **SQLite** | ~1-5ms | ❌ Too slow for cache use case |

**Performance improvement: 1000x+ faster than SQLite-based cache**

## In-Memory Cache (Default) - Recommended

### Why In-Memory?

- **Fastest** option (~0.001ms per operation)
- **Zero configuration** - works out of the box
- **No additional server/service needed**
- **Perfect for small-medium traffic**

### Usage

```typescript
import Cache from "app/services/CacheService";

// Store value (5 minutes TTL)
await Cache.put('user:123', userData, 5);

// Retrieve value
const user = Cache.get('user:123');

// Check existence
if (Cache.has('user:123')) {
  // ...
}

// Remove value
Cache.forget('user:123');

// Remember pattern (cache or compute)
const data = await Cache.remember('expensive-query', 10, async () => {
  return await fetchExpensiveData();
});
```

### Methods

```typescript
// Basic operations
Cache.get<T>(key: string): T | null
Cache.put<T>(key: string, value: T, minutes: number): void
Cache.forget(key: string): void
Cache.has(key: string): boolean

// Remember patterns
Cache.remember<T>(key: string, minutes: number, callback: () => Promise<T>): Promise<T>
Cache.rememberSync<T>(key: string, minutes: number, callback: () => T): T

// Utilities
Cache.ttl(key: string): number  // Get remaining TTL in seconds
Cache.flush(): void             // Clear all cache
Cache.stats(): { size: number, keys: string[] }
Cache.cleanup(): number         // Remove expired entries
```

### Important Notes

⚠️ **In-Memory Cache Characteristics:**
- **Fastest** option (~0.001ms per operation)
- **Non-persistent** - cleared on server restart
- **Single-node** - not shared between multiple server instances
- **Memory limit** - depends on your server's RAM

✅ **Best Use Cases:**
- Session data (short-lived)
- Configuration values
- Database query results
- API response caching
- Rate limit tracking

❌ **Don't Use For:**
- Critical data that must survive restart
- Multi-server setups (use Redis instead)
- Very large datasets

### Example: Cache User Data

```typescript
// app/services/UserService.ts
import Cache from "./CacheService";
import DB from "./DB";

class UserService {
  async getUser(id: string) {
    return await Cache.remember(`user:${id}`, 60, async () => {
      return await DB.selectFrom("users")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();
    });
  }
  
  async updateUser(id: string, data: any) {
    await DB.updateTable("users")
      .set(data)
      .where("id", "=", id)
      .execute();
    await Cache.forget(`user:${id}`); // Invalidate cache
  }
}
```

## Redis Cache (Optional)

### Installation

```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server
```

### Configuration

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
```

### Usage

```typescript
import Redis from "app/services/Redis";

// Set cache (1 hour = 3600 seconds)
await Redis.set("user:123", JSON.stringify(user), 3600);

// Get cache
const cached = await Redis.get("user:123");
const user = cached ? JSON.parse(cached) : null;

// Delete cache
await Redis.del("user:123");

// Check exists
const exists = await Redis.exists("user:123");
if (exists === 1) {
  // key exists
}

// Increment counter
await Redis.incr("page:views");
```

### Cache-Aside Pattern with Redis

```typescript
async function getUser(id: string) {
  // 1. Check cache
  const cached = await Redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 2. Cache miss - fetch from DB
  const user = await DB.selectFrom("users")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  
  // 3. Store in cache (1 hour)
  if (user) {
    await Redis.set(`user:${id}`, JSON.stringify(user), 3600);
  }
  
  return user;
}
```

## When to Use Cache

### ✅ Good Use Cases

**1. Expensive Database Queries**
```typescript
// Cache complex aggregations
const stats = await Cache.remember("dashboard:stats", 5, async () => {
  return await DB.selectFrom("users")
    .leftJoin("orders", "users.id", "orders.user_id")
    .select((eb) => [
      eb.fn.countAll().as("total_users"),
      eb.fn.sum("orders.total").as("revenue")
    ])
    .executeTakeFirst();
});
```

**2. External API Calls**
```typescript
// Cache API responses
const weather = await Cache.remember("weather:jakarta", 30, async () => {
  const res = await fetch("https://api.weather.com/jakarta");
  return await res.json();
});
```

**3. Computed/Processed Data**
```typescript
// Cache processed results
const report = await Cache.remember("report:monthly", 1440, async () => {
  const data = await DB.selectFrom("transactions")
    .selectAll()
    .where("month", "=", currentMonth)
    .execute();
  return processReport(data); // Expensive computation
});
```

**4. Frequently Accessed Data**
```typescript
// Cache hot data
const popularPosts = await Cache.remember("posts:popular", 60, async () => {
  return await DB.selectFrom("posts")
    .selectAll()
    .where("views", ">", 1000)
    .orderBy("views", "desc")
    .limit(10)
    .execute();
});
```

### ❌ Don't Cache

**1. Real-time Data**
```typescript
// Don't cache - needs to be real-time
const liveScore = await DB.selectFrom("games")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirst();
```

**2. User-specific Sensitive Data**
```typescript
// Don't cache - security risk
const userPassword = await DB.selectFrom("users")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirst();
```

**3. Frequently Changing Data**
```typescript
// Don't cache - changes too often
const cartItems = await DB.selectFrom("cart_items")
  .selectAll()
  .where("user_id", "=", userId)
  .execute();
```

## Best Practices

### 1. Use Descriptive Keys

```typescript
// Good - clear namespace
await Cache.put("user:123:profile", user, 60);
await Cache.put("posts:popular:homepage", posts, 30);

// Bad - unclear
await Cache.put("u123", user, 60);
await Cache.put("data", posts, 30);
```

### 2. Set Appropriate TTL

```typescript
// Short TTL for frequently changing data
await Cache.put("cart:items", items, 5); // 5 minutes

// Medium TTL for semi-static data
await Cache.put("user:profile", user, 60); // 1 hour

// Long TTL for static data
await Cache.put("settings:app", settings, 1440); // 24 hours
```

### 3. Invalidate on Update

```typescript
async function updateUser(id: string, data: any) {
  await DB.updateTable("users")
    .set(data)
    .where("id", "=", id)
    .execute();
  await Cache.forget(`user:${id}`); // Clear cache
}
```

### 4. Use Remember Pattern

```typescript
// Good - automatic caching
const data = await Cache.remember("key", 60, async () => {
  return await expensiveOperation();
});

// Avoid - manual caching
let data = await Cache.get("key");
if (!data) {
  data = await expensiveOperation();
  await Cache.put("key", data, 60);
}
```

### 5. Handle Cache Failures Gracefully

```typescript
async function getUser(id: string) {
  try {
    return await Cache.remember(`user:${id}`, 60, async () => {
      return await DB.selectFrom("users")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();
    });
  } catch (error) {
    console.error("Cache error:", error);
    // Fallback to direct DB query
    return await DB.selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }
}
```

## Next Steps

- [Database](/guide/database) - Optimize database queries
- [Performance](/reference/performance) - More performance tips
