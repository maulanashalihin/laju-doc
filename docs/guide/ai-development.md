# AI Development

Build complete applications using AI — no coding experience required!

## Overview

Laju is designed from the ground up for AI-assisted development. The standardized structure allows LLMs to understand, navigate, and build features automatically.

## The 3-Agent Workflow

```mermaid
graph TD
    A[INIT_AGENT] -->|Setup| B[PROJECT READY]
    B -->|Build| C[TASK_AGENT]
    C -->|Review| D[MANAGER_AGENT]
    D -->|Deploy| E[PRODUCTION]
    E -->|Feedback| C
```

### 1. INIT_AGENT — Project Setup

**When to use:** Starting a new project

**How to activate:**
```
@workflow/INIT_AGENT.md

"I want to build [your app description]"
```

**What it does:**
- Creates README.md with project overview
- Creates PRD.md (Product Requirements Document)
- Creates TDD.md (Technical Design Document)
- Creates PROGRESS.md (Development tracking)
- Creates ui-kit.html (Design system)
- Sets up Tailwind config with branding colors
- Creates database migrations
- Runs migrations
- Initializes git repository

**Example:**
```
@workflow/INIT_AGENT.md

I want to build a task management app where:
- Users can create projects with name and description
- Each project has tasks with status (todo, doing, done)
- Tasks can be assigned to team members
- Users can add comments to tasks
- Dashboard shows all tasks grouped by status
- Clean, modern design with purple accents
```

### 2. TASK_AGENT — Feature Implementation

**When to use:** Building features, fixing bugs, modifying code

**How to activate:**
```
@workflow/TASK_AGENT.md

"Create [feature description]"
```

**What it does:**
- Creates/modifies controllers
- Creates/modifies Svelte pages
- Adds routes
- Creates database queries
- Implements business logic

**Example:**
```
@workflow/TASK_AGENT.md

Create the project dashboard page showing:
- List of all projects with progress bars
- "New Project" button
- Quick stats (total tasks, completed, pending)
- Filter by status dropdown
```

### 3. MANAGER_AGENT — Review & Deployment

**When to use:** Code review, deployment approval, release notes

**How to activate:**
```
@workflow/MANAGER_AGENT.md

"Review code quality and create release notes"
```

**What it does:**
- Reviews code quality
- Checks test coverage
- Approves deployment
- Creates release notes
- Updates changelog

## Best Practices

### Be Specific

❌ **Vague:**
```
"Make a blog"
```

✅ **Specific:**
```
"Create a blog system with:
- Posts with title, content, tags, and featured image
- Categories for organizing posts  
- Comments (requires login)
- Pagination on index page
- Search functionality
- Clean design with blue accents"
```

### Describe Business Logic

❌ **Technical:**
```
"Create posts table with foreign key to users"
```

✅ **Business:**
```
"When a user creates a post, it should show up on the homepage. 
Only the author can edit or delete their own posts."
```

### Step-by-Step Workflow

1. **Start with INIT_AGENT** — Don't skip project setup
2. **Review documentation** — Check PRD.md, TDD.md before building
3. **Build one feature at a time** — Easier to review and fix
4. **Test before continuing** — Open browser, try the feature
5. **Update PROGRESS.md** — Mark completed tasks

### Use Clear Language

```
"Show a form asking for project name and description"
"After saving, redirect to the project detail page"
"Display an error message if name is empty"
```

## Common Patterns

### Creating a CRUD Feature

**Step 1:** Describe the feature
```
@workflow/TASK_AGENT.md

"Create a complete CRUD for Projects with:
- List all projects (index page)
- Create new project form
- Edit project form
- Delete project with confirmation
- All pages use the DashboardLayout"
```

**Step 2:** Review the generated files
- Check `app/controllers/ProjectController.ts`
- Check `resources/js/Pages/projects/index.svelte`
- Check `resources/js/Pages/projects/form.svelte`
- Check `routes/web.ts`

**Step 3:** Test and give feedback
```
"The create form works, but please add:
- Validation for empty name
- Max length 100 characters for description"
```

### Adding Authentication

```
@workflow/INIT_AGENT.md

"Setup authentication with:
- Email/password login
- Google OAuth
- Password reset via email
- Email verification for new accounts
- Protected routes middleware"
```

### File Upload

```
@workflow/TASK_AGENT.md

"Add avatar upload to user profile:
- Upload to S3 with presigned URL
- Show preview before upload
- Validate image type (jpg, png, webp)
- Max size 2MB
- Store URL in users table"
```

## Tips for Better Results

### 1. Always Mention Workflows

```
❌ "Create a login page"

✅ "@workflow/TASK_AGENT.md
Create a login page"
```

The `@mention` loads context and conventions.

### 2. Reference Existing Code

```
"Create a blog controller similar to the existing PostController,
but with categories and tags"
```

### 3. Specify File Locations

```
"Create the controller in app/controllers/BlogController.ts
Create the page in resources/js/Pages/blog/index.svelte"
```

### 4. Describe Expected Behavior

```
"When user clicks 'Save', show loading spinner.
If successful, redirect to posts list with success message.
If error, show error message on the form."
```

### 5. Include Design Details

```
"Use purple-600 as primary color
Cards should have rounded-xl corners
Show skeleton loading state while data loads"
```

## Workflow Files Reference

| File | Purpose |
|------|---------|
| `workflow/INIT_AGENT.md` | Project initialization |
| `workflow/TASK_AGENT.md` | Feature implementation |
| `workflow/MANAGER_AGENT.md` | Review & deployment |
| `workflow/PROGRESS.md` | Development tracking |
| `workflow/PRD.md` | Product requirements |
| `workflow/TDD.md` | Technical design |
| `workflow/ui-kit.html` | Design system |

## GitHub Actions Integration

The AI workflow integrates seamlessly with GitHub Actions:

1. **Push to GitHub** — Triggers automated testing
2. **Tests Pass** — Auto-deploys to production
3. **Tests Fail** — Deployment blocked, AI fixes issues
4. **Smoke Tests** — Post-deployment verification
5. **Auto-Rollback** — If smoke tests fail

## Troubleshooting AI Issues

### AI Not Following Conventions

**Solution:** Always start with `@workflow/INIT_AGENT.md` or `@workflow/TASK_AGENT.md`

### AI Creates Wrong File Structure

**Solution:** Be specific about file paths:
```
"Create in app/controllers/BlogController.ts"
```

### AI Uses Wrong Syntax

**Solution:** Remind AI:
```
"Remember: Laju controllers don't use 'this'.
Use: export default new ControllerName()"
```

### AI Hallucinates Features

**Solution:** Check `workflow/PROGRESS.md` to see what's actually built

## Real-World Examples

### Example 1: E-commerce App

```
@workflow/INIT_AGENT.md

"Build an e-commerce app with:
- Product catalog with categories
- Shopping cart
- Checkout with Stripe
- Order history
- Admin dashboard for products"
```

### Example 2: SaaS Dashboard

```
@workflow/INIT_AGENT.md

"Create a SaaS analytics dashboard:
- User authentication with teams
- Connect data sources (Stripe, Google Analytics)
- Show charts and metrics
- Export reports as PDF
- Billing with subscription plans"
```

### Example 3: Social Platform

```
@workflow/INIT_AGENT.md

"Build a community platform:
- User profiles with avatars
- Posts with likes and comments
- Real-time notifications
- Follow/unfollow users
- Feed algorithm (chronological + trending)"
```

## Next Steps

- [Project Structure](./project-structure) — Understand the layout
- [Controllers](./controllers) — Learn controller patterns
- [Database](./database) — Master Kysely queries
- [Authentication](./authentication) — Add user management