# AI Development Workflow

Multi-agent workflow dengan mandatory review points untuk membangun aplikasi dengan AI.

## Overview

Laju menggunakan sistem **5-Agent Workflow** dengan review point di setiap tahap. Setiap agent memiliki tanggung jawab spesifik dan tidak ada auto-skip antar agent.

## Workflow Diagram

```
@workflow/agents/product.md
    ↓
[🔍 CLIENT REVIEW: Approve PRD?]
    ↓ YES
@workflow/agents/tech-lead.md
    ↓
[🔍 CLIENT REVIEW: Approve Tech Design?]
    ↓ YES
@workflow/agents/developer.md
    ↓
[🔍 CLIENT REVIEW: Approve Implementation?]
    ↓ YES
@workflow/agents/qa.md
    ↓
[🔍 CLIENT REVIEW: Approve for Deploy?]
    ↓ YES
@workflow/agents/devops.md
    ↓
🎉 DEPLOYED
```

**Setiap tahap ada review point. Tidak ada auto-skip.**

---

## The 5 Agents

### 1. Product Agent (PA) — Requirements

**File:** `@workflow/agents/product.md`

**When to use:** Memulai project baru atau menambah fitur major

**What it does:**
- Interview client untuk clarifikasi kebutuhan
- Membuat PRD.md (Product Requirements Document)
- Membuat USER_STORIES.md
- Membuat ROADMAP.md dengan timeline
- Define Design Direction (color palette, typography, UI patterns)

**Output:**
```
workflow/outputs/01-product/
├── PRD.md
├── USER_STORIES.md
└── ROADMAP.md
```

**Usage:**
```
@workflow/agents/product.md

Saya mau bikin aplikasi inventory untuk UMKM:
- Kelola beberapa gudang
- Track stok real-time
- Purchase order ke supplier
- Laporan penjualan dan stok
- Multi-user dengan beda akses
```

**Review Required:** Client harus approve PRD sebelum lanjut ke Tech Lead.

---

### 2. Tech Lead Agent (TLA) — Technical Design

**File:** `@workflow/agents/tech-lead.md`

**When to use:** Setelah Product Agent selesai dan client approve PRD

**What it does:**
- Baca output Product Agent
- Check existing schema di `migrations/`
- Membuat TECH_SPEC.md
- Membuat ARCHITECTURE.md
- Membuat PAGE_ROUTES.md (Inertia pages, bukan REST API)
- Membuat DATABASE_SCHEMA.md
- Membuat TASKS.md

**Output:**
```
workflow/outputs/02-engineering/
├── TECH_SPEC.md
├── ARCHITECTURE.md
├── PAGE_ROUTES.md
├── DATABASE_SCHEMA.md
├── TASKS.md
└── DESIGN_SYSTEM.md (optional)
```

**Usage:**
```
@workflow/agents/tech-lead.md

Lanjutkan dari Product Agent.
Kebutuhan produk sudah di-approve client.
Baca di workflow/outputs/01-product/
```

**Review Required:** Client harus approve Technical Design sebelum lanjut ke Developer.

---

### 3. Developer Agent (DevA) — Implementation

**File:** `@workflow/agents/developer.md`

**When to use:** Setelah Tech Lead Agent selesai dan client approve design

**What it does:**
- Baca Tech Spec dan Tasks
- Implement controllers, repositories, validators
- Implement Svelte pages dengan Header component
- Update routes di `routes/web.ts`
- Create migrations dan update `type/db-types.ts`
- Git commit lokal setiap fitur selesai

**Development Modes:**
- **One-Shot (Default):** Implement semua fitur sekaligus
- **Per Feature:** Satu modul per waktu
- **Auto-Prioritize:** Kasih list prioritas jika client bingung

**Usage:**
```
@workflow/agents/developer.md

Implement semua fitur inventory system.
```

**Review Required:** Client harus approve implementation sebelum lanjut ke QA.

---

### 4. QA Agent (QAA) — Testing & Review

**File:** `@workflow/agents/qa.md`

**When to use:** Setelah Developer Agent selesai dan client approve implementation

**What it does:**
- Code review
- Buat dan jalankan unit tests (Vitest)
- Buat dan jalankan integration tests
- Buat dan jalankan E2E tests (Playwright)
- Functional testing dan edge case testing
- Buat test report

**Jika test GAGAL:** Handoff kembali ke Developer Agent dengan detail bug.

**Usage:**
```
@workflow/agents/qa.md

Test aplikasi inventory.
```

**Review Required:** Client harus approve test results sebelum lanjut ke DevOps.

---

### 5. DevOps Agent (DOA) — Deployment

**File:** `@workflow/agents/devops.md`

**When to use:** Setelah QA Agent selesai dan client approve untuk deploy

**What it does:**
- SSH ke server
- Setup environment (Node.js 22, PM2, Git)
- Clone/pull repository
- Install dependencies & build
- Setup PM2 ecosystem
- Konfigurasi Cloudflare Proxy (opsional)
- Buat DEPLOYMENT_CONFIG.md

**Usage:**
```
@workflow/agents/devops.md

Deploy ke production server.
```

---

## Project Structure

```
workflow/
├── README.md              # Workflow overview
├── examples.md            # Usage scenarios
├── quick-reference.md     # Cheat sheet
└── agents/
    ├── README.md          # Agent listing
    ├── product.md         # Product Agent instructions
    ├── tech-lead.md       # Tech Lead Agent instructions
    ├── developer.md       # Developer Agent instructions
    ├── qa.md              # QA Agent instructions
    └── devops.md          # DevOps Agent instructions

workflow/outputs/
├── 01-product/            # Product Agent output
│   ├── PRD.md
│   ├── USER_STORIES.md
│   └── ROADMAP.md
├── 02-engineering/        # Tech Lead Agent output
│   ├── TECH_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── PAGE_ROUTES.md
│   ├── DATABASE_SCHEMA.md
│   ├── TASKS.md
│   └── DESIGN_SYSTEM.md
├── 03-tasks/              # Task breakdowns
├── 04-reports/            # QA Agent output
└── 05-deployment/         # DevOps Agent output
    └── DEPLOYMENT_CONFIG.md
```

---

## Key Conventions

### 1. Inertia.js Architecture

**Project ini menggunakan Inertia.js:**
- **Backend:** HyperExpress render Svelte pages langsung
- **No REST API:** Data lewat page props
- **Routing:** URL-based (GET /items, POST /items)
- **Forms:** Inertia useForm, bukan fetch/axios

### 2. Header Component (Not AppLayout)

**Semua protected pages WAJIB menggunakan Header:**

```svelte
<script>
  import Header from '../Components/Header.svelte'
</script>

<Header group="items" />

<!-- Content dengan padding-top untuk menghindari overlap -->
<div class="pt-24">
  <!-- page content -->
</div>
```

**Prop `group`:** Menandai active menu (sesuai dengan `menuLinks` di Header.svelte)

**Exception:** Auth pages (login, register, forgot-password, reset-password) TIDAK pakai Header.

### 3. Type Safety dengan Kysely

**⚠️ CRITICAL: Setiap perubahan di `migrations/` WAJIB diikuti update di `type/db-types.ts`**

Kysely menggunakan type-safe queries. Jika schema database berubah tapi types tidak diupdate, TypeScript akan error.

**Migration Checklist:**
1. Buat migration file di `migrations/YYYYMMDDhhmmss_*.ts`
2. Update `type/db-types.ts`:
   - Add/update table interface
   - Add/update DB interface  
   - Add helper types (Selectable, Insertable, Updateable)
3. Jalankan `npm run migrate`

### 4. Controller Pattern

```typescript
// app/controllers/ItemController.ts
import { Response, Request } from "../../type";

export const ItemController = {
  async index(request: Request, response: Response) {
    const items = await ItemRepository.getAll();
    return response.inertia("items/Index", { items });
  },
  
  async store(request: Request, response: Response) {
    const body = await request.json();
    // ... validation & save
    return response.flash("success", "Item created").redirect("/items");
  }
};

export default ItemController;
```

### 5. Routing Pattern

```typescript
// routes/web.ts
import HyperExpress from 'hyper-express';
import ItemController from "../app/controllers/ItemController";
import Auth from "../app/middlewares/auth"

const Route = new HyperExpress.Router();

// Protected routes (with auth middleware)
Route.get("/items", [Auth], ItemController.index);
Route.post("/items", [Auth], ItemController.store);

export default Route;
```

---

## Usage Examples

### Example 1: New Project (Full Workflow)

**Step 1: Product Agent**
```
@workflow/agents/product.md

Saya mau bikin aplikasi todolist.
Kebutuhan:
- Create todo dengan deadline
- Mark as complete/incomplete
- Filter by status
- Clean, modern design
```

**Step 2: Tech Lead Agent** (after client approve)
```
@workflow/agents/tech-lead.md

Lanjutkan dari Product Agent.
Kebutuhan produk sudah di-approve client.
```

**Step 3: Developer Agent** (after client approve)
```
@workflow/agents/developer.md

Implement semua fitur todolist.
```

**Step 4: QA Agent** (after client approve)
```
@workflow/agents/qa.md

Test aplikasi todolist.
```

**Step 5: DevOps Agent** (after client approve)
```
@workflow/agents/devops.md

Deploy ke production.
```

### Example 2: Bug Fix

```
@workflow/agents/developer.md

Fix bug: todo tidak bisa di-save.
Input $100, tersimpan $0.
```

Then QA:
```
@workflow/agents/qa.md

Verify bug fix.
```

### Example 3: Feature Enhancement

```
@workflow/agents/product.md

Saya punya aplikasi invoice, mau tambah fitur kategori.
Invoice bisa dikategorikan dan filter by kategori.
```

(Continue with Tech Lead → Developer → QA → DevOps)

---

## Best Practices

### 1. Be Specific

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

### 2. Always Use Full Path

❌ **Wrong:**
```
@agents/product.md
```

✅ **Correct:**
```
@workflow/agents/product.md
```

### 3. Reference Existing Code

```
"Create a blog controller similar to the existing PostController,
but with categories and tags"
```

### 4. Describe Expected Behavior

```
"When user clicks 'Save', show loading spinner.
If successful, redirect to posts list with success message.
If error, show error message on the form."
```

---

## Quick Reference

| Agent | File | Purpose | When to Use |
|-------|------|---------|-------------|
| Product | `@workflow/agents/product.md` | Define requirements | Starting new projects |
| Tech Lead | `@workflow/agents/tech-lead.md` | Technical design | After PRD approved |
| Developer | `@workflow/agents/developer.md` | Implement code | After tech design approved |
| QA | `@workflow/agents/qa.md` | Test & review | After implementation approved |
| DevOps | `@workflow/agents/devops.md` | Deploy | After QA approved |

---

## Troubleshooting

### AI Not Following Conventions

**Solution:** Always start with `@workflow/agents/[agent].md`

### AI Creates Wrong File Structure

**Solution:** Be specific about file paths:
```
"Create in app/controllers/BlogController.ts"
```

### Kysely Type Errors

**Solution:** Pastikan `type/db-types.ts` sudah diupdate sesuai migration

### Missing Header Component

**Solution:** Ingatkan untuk gunakan Header di protected pages:
```
"Jangan lupa pakai Header component dengan prop group"
```

---

## Next Steps

- [Project Structure](./project-structure) — Understand the layout
- [Controllers](./controllers) — Learn controller patterns
- [Database](./database) — Master Kysely queries dengan type safety
- [Authentication](./authentication) — Add user management
