# Testing

Complete guide for testing Laju applications with Vitest and Playwright.

## Setup

### Commands

```bash
# Unit & Integration Tests (Vitest)
npm run test:run              # Run all tests
npm run test:ui               # Run with UI mode
npm run test:coverage         # Run with coverage report
npx vitest                    # Watch mode

# E2E Tests (Playwright)
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run with UI mode (recommended)
npm run test:e2e:debug         # Run with debug mode
npm run test:e2e:install        # Install Playwright browsers
```

## Unit Tests

### Testing Services

```typescript
// tests/unit/services/Authenticate.test.ts
import { describe, it, expect } from 'vitest';
import Authenticate from '../../app/services/Authenticate';

describe('Authenticate', () => {
  describe('hash', () => {
    it('should hash password with salt', async () => {
      const password = 'mypassword123';
      const hashed = await Authenticate.hash(password);
      
      expect(hashed).toContain(':');
      expect(hashed.split(':').length).toBe(2);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'mypassword123';
      const hash1 = await Authenticate.hash(password);
      const hash2 = await Authenticate.hash(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'mypassword123';
      const hashed = await Authenticate.hash(password);
      
      const result = await Authenticate.compare(password, hashed);
      
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'mypassword123';
      const hashed = await Authenticate.hash(password);
      
      const result = await Authenticate.compare('wrongpassword', hashed);
      
      expect(result).toBe(false);
    });
  });
});
```

### Testing Utilities

```typescript
// tests/unit/utils/validation.test.ts
import { describe, it, expect } from 'vitest';

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.id')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });
});
```

## Integration Tests

### Testing Database Operations

```typescript
// tests/integration/posts.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import DB from '../../app/services/DB';

describe('Posts CRUD', () => {
  beforeEach(async () => {
    await DB.deleteFrom("posts").execute();
  });

  it('should create a post', async () => {
    const post = {
      id: '1',
      title: 'Test Post',
      content: 'Test content',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    await DB.insertInto("posts").values(post).execute();
    
    const saved = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", "1")
      .executeTakeFirst();
    
    expect(saved?.title).toBe('Test Post');
    expect(saved?.content).toBe('Test content');
  });

  it('should update a post', async () => {
    await DB.insertInto("posts").values({
      id: '1',
      title: 'Original',
      content: 'Content',
      created_at: Date.now(),
      updated_at: Date.now()
    }).execute();

    await DB.updateTable("posts")
      .set({ title: 'Updated' })
      .where("id", "=", "1")
      .execute();
    
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", "1")
      .executeTakeFirst();
    
    expect(post?.title).toBe('Updated');
  });

  it('should delete a post', async () => {
    await DB.insertInto("posts").values({
      id: '1',
      title: 'To Delete',
      content: 'Content',
      created_at: Date.now(),
      updated_at: Date.now()
    }).execute();

    await DB.deleteFrom("posts")
      .where("id", "=", "1")
      .execute();
    
    const post = await DB.selectFrom("posts")
      .selectAll()
      .where("id", "=", "1")
      .executeTakeFirst();
    
    expect(post).toBeUndefined();
  });
});
```

## E2E Tests

### Setup

Playwright is configured in `playwright.config.ts`.

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for debugging)
npm run test:e2e:ui

# Run with debug mode (step-by-step)
npm run test:e2e:debug

# Run specific test file
npx playwright test homepage.spec.ts
```

### Local Development

For local development, start the server manually before running tests:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run test:e2e:ui
```

### Testing Authentication Flows

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = passwordInput.locator('xpath=../button');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should disable submit button during submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // Fill form with credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });
});
```

### Testing Forms

```typescript
// tests/e2e/register.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should validate password mismatch', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // Fill with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm-password"]', 'different123');

    // Submit form
    await submitButton.click();

    // Check for password mismatch error
    const errorText = page.locator('.text-red-400');
    await expect(errorText.first()).toBeVisible();
    await expect(errorText.first()).toContainText('do not match');
  });
});
```

### Testing Inertia.js Applications

When testing Inertia.js applications, use text-based selectors for links:

```typescript
// ❌ Bad - href selector may not work with Inertia
const link = page.locator('a[href="/login"]');

// ✅ Good - text-based selector works with Inertia
const link = page.getByText('Sign in').or(page.locator('a[href="/login"]'));
await expect(link.first()).toBeVisible();
```

## Best Practices for E2E

1. **Test Critical User Flows**
   - Focus on important user journeys (login, registration, checkout)
   - Test success paths AND error paths
   - Verify form validation

2. **Use Selective Testing**
   - Don't test every single field
   - Test key interactions and edge cases
   - Prioritize critical functionality

3. **Wait Properly**
   - ❌ `await page.waitForTimeout(5000)` - flaky
   - ✅ `await page.waitForURL('**/dashboard')` - reliable
   - ✅ `await expect(element).toBeVisible()` - auto-waiting

4. **Use Descriptive Test Names**
   ```typescript
   // Good
   test('should redirect to dashboard after successful login', () => {});

   // Bad
   test('test login redirect', () => {});
   ```

5. **Test Real Scenarios**
   - Use realistic data
   - Test like a real user would interact
   - Include edge cases (empty fields, invalid data)

6. **Keep Tests Independent**
   - Each test should work alone
   - Don't rely on state from previous tests
   - Use `beforeEach` to set up fresh state

## Debugging E2E Tests

**Run with UI Mode:**
```bash
npm run test:e2e:ui
```

**Run with Debug Mode:**
```bash
npm run test:e2e:debug
```

**Run Specific Test:**
```bash
npx playwright test --grep "should display login form"
```

**View Test Reports:**
```bash
npx playwright show-report
```

**Screenshots and Videos:**
- Screenshots are captured automatically on test failure
- Videos are recorded for failed tests
- Check `test-results/` directory after test runs

## Test Utilities

### Factory Functions

```typescript
// tests/factories/user.ts
import { randomUUID } from 'crypto';
import Authenticate from '../../app/services/Authenticate';
import DB from '../../app/services/DB';

export async function createUser(overrides = {}) {
  const defaults = {
    id: randomUUID(),
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: await Authenticate.hash('password123'),
    is_admin: false,
    is_verified: false,
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const user = { ...defaults, ...overrides };
  await DB.insertInto("users").values(user).execute();
  
  return user;
}

export async function createPost(userId: string, overrides = {}) {
  const defaults = {
    id: randomUUID(),
    user_id: userId,
    title: 'Test Post',
    content: 'Test content',
    status: 'draft',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const post = { ...defaults, ...overrides };
  await DB.insertInto("posts").values(post).execute();
  
  return post;
}
```

### Using Factories

```typescript
import { createUser, createPost } from '../factories/user';

describe('Post with User', () => {
  it('should associate post with user', async () => {
    const user = await createUser({ name: 'Author' });
    const post = await createPost(user.id, { title: 'My Post' });
    
    const result = await DB.selectFrom("posts")
      .innerJoin("users", "posts.user_id", "users.id")
      .where("posts.id", "=", post.id)
      .select(["posts.*", "users.name as author_name"])
      .executeTakeFirst();
    
    expect(result?.author_name).toBe('Author');
    expect(result?.title).toBe('My Post');
  });
});
```

## Best Practices

### 1. Isolate Tests

```typescript
// Each test should be independent
beforeEach(async () => {
  await DB.deleteFrom("users").execute();
});
```

### 2. Use Descriptive Names

```typescript
// Good
it('should return 401 when password is incorrect', () => {});

// Bad
it('test login', () => {});
```

### 3. Test Edge Cases

```typescript
describe('validateEmail', () => {
  it('should handle empty string', () => {});
  it('should handle null', () => {});
  it('should handle very long email', () => {});
  it('should handle unicode characters', () => {});
});
```

### 4. Mock External Services

```typescript
import { vi } from 'vitest';

// Mock email service
vi.mock('../../app/services/Resend', () => ({
  MailTo: vi.fn().mockResolvedValue({ success: true })
}));
```

### 5. Use Arrange-Act-Assert

```typescript
it('should update user profile', async () => {
  // Arrange
  const user = await createUser({ name: 'Old Name' });
  
  // Act
  await DB.updateTable("users")
    .set({ name: 'New Name' })
    .where("id", "=", user.id)
    .execute();
  
  // Assert
  const updated = await DB.selectFrom("users")
    .selectAll()
    .where("id", "=", user.id)
    .executeTakeFirst();
  expect(updated?.name).toBe('New Name');
});
```

## Next Steps

- [CI/CD](/guide/cicd) - Run tests in CI/CD pipeline
- [Controllers](/guide/controllers) - Write testable code
