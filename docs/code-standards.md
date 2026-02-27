# ReviewWeb.site - Code Standards & Guidelines

## Overview

This document establishes coding standards, patterns, and conventions used throughout the ReviewWeb.site codebase. All contributors should follow these guidelines to maintain consistency, readability, and maintainability.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Project Structure](#project-structure)
3. [TypeScript Standards](#typescript-standards)
4. [Code Organization](#code-organization)
5. [Validation Patterns](#validation-patterns)
6. [Error Handling](#error-handling)
7. [Database Patterns](#database-patterns)
8. [API Design](#api-design)
9. [Security Practices](#security-practices)
10. [Testing Guidelines](#testing-guidelines)
11. [Naming Conventions](#naming-conventions)
12. [Formatting & Linting](#formatting--linting)
13. [Documentation](#documentation)

---

## General Principles

### SOLID Principles
- **Single Responsibility:** Each module has one reason to change
- **Open/Closed:** Open for extension, closed for modification
- **Liskov Substitution:** Subtypes must be substitutable for base types
- **Interface Segregation:** Clients depend only on methods they use
- **Dependency Inversion:** Depend on abstractions, not concrete types

### YAGNI (You Aren't Gonna Need It)
- Don't add features "just in case"
- Implement only what's currently needed
- Defer design decisions until necessary

### DRY (Don't Repeat Yourself)
- Extract common patterns into reusable utilities
- Use shared types and schemas
- Leverage type.ts for Prisma selections

### KISS (Keep It Simple, Stupid)
- Prefer simple solutions over complex ones
- Write code for readability, not cleverness
- Avoid premature optimization

---

## Project Structure

### Module Directory Pattern

```typescript
src/modules/[moduleName]/
├── [moduleName]-crud.ts      // Database CRUD operations
├── [moduleName]-schemas.ts   // Zod validation schemas
├── [moduleName]-service.ts   // Optional: Business logic
└── index.ts                  // Exports
```

### CRUD Module Template

```typescript
// [moduleName]-crud.ts
import { db } from "@/lib/db";
import type { [Model] } from "@prisma/client";
import { z } from "zod";

export const [functionName] = async (
  input: [InputType]
): Promise<[Model]> => {
  // Implementation
  return db.[model].create({ data: input });
};
```

### Schema Module Template

```typescript
// [moduleName]-schemas.ts
import { z } from "zod";

export const Create[Model]Schema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  optional?: z.boolean().optional(),
});

export type Create[Model]Input = z.infer<typeof Create[Model]Schema>;
```

### Index Export Pattern

```typescript
// index.ts
export * from "./[moduleName]-crud";
export * from "./[moduleName]-schemas";
export * from "./[moduleName]-service";
```

---

## TypeScript Standards

### Strict Mode

All TypeScript files must use strict mode (enforced in `tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Type Imports

Always use `import type` for types:

```typescript
// Good
import type { User, Review } from "@prisma/client";
import { db } from "@/lib/db";

// Bad
import { User, Review, db } from "@prisma/client";
```

### Avoid `any` Type

Never use `any` unless absolutely necessary. Use `unknown` and narrow:

```typescript
// Bad
const processData = (data: any) => {
  return data.id;
};

// Good
const processData = (data: unknown) => {
  if (typeof data === "object" && data !== null && "id" in data) {
    return (data as Record<string, unknown>).id;
  }
  throw new Error("Invalid data structure");
};
```

### Type Safety in Functions

Always specify return types:

```typescript
// Bad
export const getValue = (id: string) => {
  return db.user.findUnique({ where: { id } });
};

// Good
export const getValue = async (id: string): Promise<User | null> => {
  return db.user.findUnique({ where: { id } });
};
```

### Generic Types

Use generics for reusable utilities:

```typescript
export const paginate = async <T>(
  items: T[],
  page: number,
  pageSize: number
): Promise<PaginatedResult<T>> => {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  };
};
```

---

## Code Organization

### File Naming

- **Modules:** `[moduleName]-crud.ts`, `[moduleName]-schemas.ts`
- **Services:** `[feature]-service.ts`
- **Routes:** `[route].ts`
- **Utilities:** `[utility]-helper.ts` or `[utility]-utils.ts`
- **Types:** `[feature].types.ts`
- **Config:** `[feature].config.ts`

**Kebab-case for all filenames.**

### Import Organization

Group imports in this order:

```typescript
// 1. External packages (alphabetical)
import express from "express";
import { z } from "zod";

// 2. Internal aliases (alphabetical)
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { User, Review } from "@/modules/user";
import type { ApiResponse } from "@/modules/response";

// 3. Blank line, then code
```

### Function Organization

Within a file, organize in this order:

```typescript
// 1. Type definitions
export type MyType = {
  id: string;
};

// 2. Constants
const DEFAULT_TIMEOUT = 5000;

// 3. Exported functions
export const publicFunction = async (input: string) => {
  // Implementation
};

// 4. Private helper functions
const helperFunction = (input: string) => {
  // Implementation
};
```

---

## Validation Patterns

### Zod for Input Validation

All API inputs must be validated with Zod:

```typescript
// Schema definition
const CreateReviewSchema = z.object({
  url: z.string().url("Invalid URL"),
  instructions: z.string().min(10).max(1000).optional(),
  skipImages: z.boolean().default(false),
  maxImages: z.number().min(1).max(100).default(50),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// Usage in route
export const createReview = async (req: Request, res: Response) => {
  const input = CreateReviewSchema.parse(req.body);

  if (!input) {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Safe to use input with full type safety
  const review = await startReview(input);
  res.json(review);
};
```

### Custom Zod Refinements

Use refinements for complex validation:

```typescript
const PasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    "Password must contain uppercase letter"
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    "Password must contain number"
  );
```

### Safe Parsing

Use `safeParse` for error handling:

```typescript
const result = CreateReviewSchema.safeParse(req.body);

if (!result.success) {
  const errors = result.error.flatten();
  return res.status(400).json({
    status: 400,
    messages: Object.values(errors.fieldErrors).flat(),
  });
}

// result.data is guaranteed to be valid
const review = await startReview(result.data);
```

---

## Error Handling

### Standard Error Pattern

```typescript
export const riskyOperation = async (id: string) => {
  try {
    const data = await db.record.findUnique({ where: { id } });

    if (!data) {
      throw new Error("Record not found");
    }

    return data;
  } catch (error) {
    console.error("Failed to get record:", {
      error: error instanceof Error ? error.message : String(error),
      id,
      timestamp: new Date().toISOString(),
    });

    // Re-throw with context or return null/default
    throw error;
  }
};
```

### Custom Error Classes

Create domain-specific error classes:

```typescript
// lib/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

// Usage
const user = await db.user.findUnique({ where: { id } });
if (!user) {
  throw new NotFoundError("User");
}
```

### Express Error Handler

```typescript
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: error.statusCode,
      messages: [error.message],
      code: error.code,
    });
  }

  console.error("Unhandled error:", error);

  res.status(500).json({
    status: 500,
    messages: ["Internal server error"],
  });
});
```

### Async Error Wrapping

Always wrap async route handlers:

```typescript
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/review", asyncHandler(async (req, res) => {
  const input = ReviewSchema.parse(req.body);
  const review = await startReview(input);
  res.json(review);
}));
```

---

## Database Patterns

### Prisma Usage

Always use Prisma ORM for database access:

```typescript
// Bad: Raw SQL (avoid)
const result = await db.$queryRaw`SELECT * FROM user WHERE id = ${id}`;

// Good: Prisma queries
const user = await db.user.findUnique({
  where: { id },
  include: {
    reviews: { take: 10 },
  },
});
```

### Query Optimization

Use `select` and `include` to fetch only needed fields:

```typescript
// Bad: Fetch all fields
const user = await db.user.findUnique({ where: { id } });

// Good: Select specific fields
const user = await db.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    // Avoid fetching large fields unnecessarily
  },
});

// Good: Use pre-defined type patterns
const user = await db.user.findUnique({
  where: { id },
  select: profileType,
});
```

### Transactions for Multi-Step Operations

```typescript
export const transferBalance = async (
  fromUserId: string,
  toUserId: string,
  amount: number
) => {
  return db.$transaction(async (tx) => {
    // Deduct from source
    await tx.userBalance.update({
      where: { userId: fromUserId },
      data: { balance: { decrement: amount } },
    });

    // Add to destination
    await tx.userBalance.update({
      where: { userId: toUserId },
      data: { balance: { increment: amount } },
    });

    // Log transaction
    return tx.cashTransaction.create({
      data: {
        userId: fromUserId,
        amount,
        type: "TRANSFER",
      },
    });
  });
};
```

### Connection Pooling Awareness

Always use connection pooling:

```typescript
// Configured in prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")  // Bypass pool for migrations
}
```

---

## API Design

### Response Format

All API responses follow this format:

```typescript
export interface ApiResponse<T = unknown> {
  status: number;
  data?: T;
  messages?: string[];
}
```

### Usage in Routes

```typescript
import { respond } from "@/modules/response";

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return respond(res, {
        status: 404,
        messages: ["User not found"],
      });
    }

    return respond(res, {
      status: 200,
      data: user,
    });
  } catch (error) {
    return respond(res, {
      status: 500,
      messages: [
        error instanceof Error ? error.message : "Internal server error",
      ],
    });
  }
};
```

### HTTP Status Codes

Use appropriate status codes:

```typescript
200 OK                  // Successful GET, PUT, PATCH
201 Created             // Successful POST
204 No Content          // Successful DELETE, no response body
400 Bad Request         // Invalid input, validation error
401 Unauthorized        // Missing/invalid authentication
403 Forbidden           // Authenticated but no permission
404 Not Found           // Resource doesn't exist
409 Conflict            // State conflict (e.g., duplicate)
429 Too Many Requests   // Rate limit exceeded
500 Internal Error      // Server error
502 Bad Gateway         // Service unavailable
503 Service Unavailable // Maintenance
```

### Request Validation

Always validate before processing:

```typescript
export const createReview = async (req: Request, res: Response) => {
  // 1. Validate input
  const result = CreateReviewSchema.safeParse(req.body);
  if (!result.success) {
    return respond(res, {
      status: 400,
      messages: Object.values(result.error.flatten().fieldErrors).flat(),
    });
  }

  // 2. Validate authorization
  if (!req.user) {
    return respond(res, {
      status: 401,
      messages: ["Unauthorized"],
    });
  }

  // 3. Process
  const review = await startReview({
    ...result.data,
    userId: req.user.id,
  });

  return respond(res, {
    status: 201,
    data: review,
  });
};
```

---

## Security Practices

### Never Trust User Input

```typescript
// Always validate and sanitize
const input = CreateReviewSchema.parse(req.body);

// Don't construct queries from user input
// Bad: await db.$queryRaw(`SELECT * FROM user WHERE id = ${req.query.id}`);

// Good: Use parameterized queries (Prisma does this)
const user = await db.user.findUnique({
  where: { id: req.query.id as string },
});
```

### API Key Management

```typescript
// In middleware
const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-api-key"];

  if (!key) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const apiKey = await db.apiKey.findUnique({
    where: { key: key as string },
    include: { user: true },
  });

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  res.locals.user = apiKey.user;
  next();
};
```

### CSRF Protection

```typescript
// Configured in middleware
import { doubleCsrfProtection } from "@/middlewares/csrf";

router.post("/create", doubleCsrfProtection, async (req, res) => {
  // Protected from CSRF attacks
});
```

### Rate Limiting

```typescript
// Per-plan, per-minute and per-month limits
import { checkPlanLimits } from "@/middlewares/check-plan-limits";

router.post("/review", checkPlanLimits, async (req, res) => {
  // Rate limited based on user's plan
});
```

### Environment Variables

Never commit secrets:

```typescript
// .env.example - share this
OPENROUTER_KEY=
DATABASE_URL=postgresql://user:password@localhost/db

// .env - never commit this
OPENROUTER_KEY=sk-1234567890abcdef
DATABASE_URL=postgresql://user:actual_password@prod.db/db
```

### Data Sanitization

```typescript
// Mask sensitive data before sending to client
export const maskUser = (user: User) => {
  const { password, ...rest } = user;
  return rest;
};

// Or use Prisma select
const user = await db.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // password field not included
  },
});
```

---

## Testing Guidelines

### Unit Testing Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("User CRUD", () => {
  let testUserId: string;

  beforeEach(async () => {
    // Setup
    const user = await createUser({ email: "test@example.com" });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup
    await db.user.delete({ where: { id: testUserId } });
  });

  it("should create user with valid email", async () => {
    const user = await getUser(testUserId);
    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
  });

  it("should return null for non-existent user", async () => {
    const user = await getUser("non-existent-id");
    expect(user).toBeNull();
  });
});
```

### Integration Testing

```typescript
describe("API: POST /api/v1/review", () => {
  it("should return 400 for invalid URL", async () => {
    const response = await fetch("/api/v1/review", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-url" }),
    });

    expect(response.status).toBe(400);
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await fetch("/api/v1/review", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
    });

    expect(response.status).toBe(401);
  });

  it("should create review for valid request", async () => {
    const response = await fetch("/api/v1/review", {
      method: "POST",
      headers: {
        "x-api-key": testApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: "https://example.com" }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.id).toBeDefined();
  });
});
```

---

## Naming Conventions

### Variables & Functions

Use camelCase, descriptive names:

```typescript
// Good
const userCount = await db.user.count();
const getActiveUsers = async () => { ... };
const isValidEmail = (email: string) => { ... };

// Bad
const c = await db.user.count();  // Too short
const get_active_users = async () => { ... };  // Snake case
const valid = (email: string) => { ... };  // Not descriptive
```

### Constants

Use UPPER_SNAKE_CASE:

```typescript
const DEFAULT_TIMEOUT = 5000;
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "https://api.openrouter.ai";
```

### Types & Interfaces

Use PascalCase:

```typescript
interface UserProfile {
  id: string;
  name: string;
}

type ApiResponse<T> = {
  status: number;
  data: T;
};

enum ReviewStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
```

### Classes

Use PascalCase:

```typescript
class ApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class UserService {
  async getUser(id: string) { ... }
}
```

### Routes

Use kebab-case in URLs:

```typescript
// Good
router.get("/api/v1/user-balance");
router.post("/api/v1/api-key");

// Bad
router.get("/api/v1/userBalance");
router.post("/api/v1/apiKey");
```

---

## Formatting & Linting

### ESLint & Prettier

Configuration is in `eslint.config.js` and applied automatically:

```bash
# Format code
npm run lint:fix
bun run lint:fix

# Check formatting
npm run lint
bun run lint
```

### Indentation & Spacing

- **Indent:** 2 spaces
- **Line endings:** LF (Unix)
- **Max line length:** 100 characters (soft limit)
- **Trailing commas:** Enabled

### Import Sorting

Imports are automatically sorted by ESLint plugin:

```typescript
// Order:
// 1. External packages
// 2. Internal aliases
// 3. Blank line
// 4. Code
```

### Console Usage

```typescript
// Only for debugging, remove before commit
console.log("Debug info:", data);  // OK during development
console.error("Error occurred:", error);  // Use for errors

// For production logging, use structured logging
logger.error("Failed to process review", {
  error: error instanceof Error ? error.message : String(error),
  userId: req.user.id,
  timestamp: new Date().toISOString(),
});
```

---

## Documentation

### Code Comments

Use comments sparingly for "why", not "what":

```typescript
// Bad: Obvious from code
const count = items.length;  // Get count of items

// Good: Explains intent
// Limit to 50 to prevent memory overflow in batch processing
const maxItems = Math.min(items.length, 50);

// Good: Explains non-obvious behavior
// We use sliding window for per-minute limits to ensure fair rate limiting
// across different request times (vs calendar-minute based)
const currentMinute = Math.floor(Date.now() / 60000);
```

### Function Documentation

Use JSDoc for public functions:

```typescript
/**
 * Analyze a website and generate comprehensive review
 *
 * @param url - Website URL to analyze
 * @param userId - User performing the review
 * @param options - Configuration options
 * @returns Promise resolving to the created Review record
 * @throws {AppError} If URL is invalid or analysis fails
 *
 * @example
 * const review = await startReview(
 *   "https://example.com",
 *   "user-123",
 *   { skipImages: true }
 * );
 */
export const startReview = async (
  url: string,
  userId: string,
  options?: ReviewOptions
): Promise<Review> => {
  // Implementation
};
```

### README Files

Each module directory should have clear exports in `index.ts`:

```typescript
// modules/review/index.ts
/**
 * Website analysis orchestration module
 *
 * Implements 10-step analysis workflow for comprehensive website review:
 * 1. Screenshot capture
 * 2. HTML scraping
 * 3. Metadata extraction
 * 4-10. AI analysis steps
 */

export * from "./review-crud";
export * from "./review-schemas";
```

---

## Git & Commit Messages

### Conventional Commits

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (no logic change)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test addition/changes
- `chore:` Build, deps, tooling
- `ci:` CI/CD changes

### Examples

```bash
git commit -m "feat(review): add image analysis to review workflow"

git commit -m "fix(scrape): handle blocked websites in Playwright method

Previously blocked websites would timeout. Now they're detected
and fallback chain continues to next method."

git commit -m "docs: update API documentation for new endpoints"

git commit -m "refactor(utils): extract string utilities to separate module"
```

---

## Performance Considerations

### Query Performance

```typescript
// Bad: N+1 query
const reviews = await db.review.findMany();
for (const review of reviews) {
  // This queries for each review
  const screenshots = await db.screenshot.findMany({
    where: { reviewId: review.id },
  });
}

// Good: Single query with join
const reviews = await db.review.findMany({
  include: {
    screenshots: true,
  },
});
```

### Caching Strategy

```typescript
// Use Redis for expensive operations
const getCachedUser = async (id: string) => {
  // Check cache first
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch if not cached
  const user = await db.user.findUnique({ where: { id } });

  // Cache for 1 hour
  if (user) {
    await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  }

  return user;
};
```

### Async Operations

```typescript
// Use Promise.all for parallel operations
const results = await Promise.all([
  analyzeHtml(content),
  analyzeImages(images),
  extractMetadata(html),
]);

// Use controlled concurrency for large batches
const batchSize = 5;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await Promise.all(batch.map(processItem));
}
```

---

## Accessibility & Internationalization

### i18n Strings

Use translation keys in views:

```typescript
// Good: Use translation key
<h1><%= t('review.title') %></h1>

// Bad: Hard-coded string
<h1>Website Review</h1>
```

### Accessibility (a11y)

```html
<!-- Good: Proper labels and ARIA -->
<label for="url-input">Website URL:</label>
<input id="url-input" type="url" required />

<button aria-label="Analyze website">
  <i class="icon-analyze"></i>
</button>

<!-- Bad: Missing labels, inaccessible -->
<input type="text" placeholder="URL" />
<button><i class="icon"></i></button>
```

---

## Review Checklist

Before submitting code for review:

- [ ] TypeScript strict mode passes
- [ ] No `any` types (use `unknown` instead)
- [ ] All functions have return type annotations
- [ ] All inputs validated with Zod
- [ ] Error handling implemented
- [ ] No console.log statements (except logging)
- [ ] Code formatted with ESLint/Prettier
- [ ] Commit messages follow conventional format
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated if needed
- [ ] No hardcoded secrets or credentials
- [ ] Performance considerations addressed

---

## Additional Resources

- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Zod Documentation:** https://zod.dev
- **Prisma Guide:** https://www.prisma.io/docs/
- **Express Best Practices:** https://expressjs.com/en/advanced/best-practice-security.html
- **ESLint Rules:** https://eslint.org/docs/rules/

---

**Last Updated:** 2025-12-10
**Version:** 1.0
**Maintained By:** Development Team
