---
title: Todo App Example
---

# Todo App Example

A complete todo application with CRUD operations, filtering, and real-time updates. This example demonstrates the fundamentals of building interactive applications with Laju.

## Features

- ✅ **Task Management** - Create, read, update, and delete todos
- ✅ **Filtering** - Filter by status (all/active/completed)
- ✅ **Bulk Actions** - Mark all as complete/incomplete
- ✅ **Persistent Storage** - SQLite with Kysely ORM
- ✅ **Real-time UI** - Instant updates with Svelte 5 reactivity
- ✅ **Form Validation** - Client and server-side validation
- ✅ **Dark Mode** - Full dark mode support

## Database Schema

### Migration

Create `migrations/20250130000001_create_todos_table.ts`:

```typescript
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("todos")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("completed", "integer", (col) => col.defaultTo(0))
    .addColumn("priority", "text", (col) => col.defaultTo("medium"))
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("due_date", "integer")
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();

  // Index for filtering
  await db.schema
    .createIndex("todos_user_completed_idx")
    .on("todos")
    .columns(["user_id", "completed"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("todos").execute();
}
```

### Type Definitions

Add to `type/db-types.ts`:

```typescript
export interface TodoTable {
  id: string;
  title: string;
  description: string | null;
  completed: number; // 0 or 1
  priority: "low" | "medium" | "high";
  user_id: string | null;
  due_date: number | null;
  created_at: number;
  updated_at: number;
}

// Update DB interface
export interface DB {
  users: UserTable;
  sessions: SessionTable;
  todos: TodoTable;
  // ... other tables
}
```

## Controllers

### TodoController

Create `app/controllers/TodoController.ts`:

```typescript
import { Request, Response } from "../../type";
import DB from "../services/DB";
import Validator from "../services/Validator";
import { z } from "zod";
import { randomUUID } from "crypto";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional()
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.string().optional()
});

class TodoController {
  // List all todos with filtering
  public async index(request: Request, response: Response) {
    const filter = request.query.filter || "all"; // all, active, completed
    const userId = request.user?.id;

    let query = DB.selectFrom("todos")
      .selectAll()
      .where("user_id", "=", userId);

    if (filter === "active") {
      query = query.where("completed", "=", 0);
    } else if (filter === "completed") {
      query = query.where("completed", "=", 1);
    }

    const todos = await query
      .orderBy("completed", "asc")
      .orderBy("created_at", "desc")
      .execute();

    // Get stats
    const stats = await DB.selectFrom("todos")
      .select((eb) => [
        eb.fn.countAll().as("total"),
        eb.fn.count(eb.case().when("completed", "=", 0).then(1).end()).as("active"),
        eb.fn.count(eb.case().when("completed", "=", 1).then(1).end()).as("completed")
      ])
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return response.inertia("todos/index", {
      todos,
      filter,
      stats: {
        total: Number(stats?.total || 0),
        active: Number(stats?.active || 0),
        completed: Number(stats?.completed || 0)
      }
    });
  }

  // Store new todo
  public async store(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const body = await request.json();
    const validation = Validator.validate(todoSchema, body);

    if (!validation.success) {
      return response.status(422).json({
        errors: validation.errors
      });
    }

    const data = validation.data!;

    const todo = await DB.insertInto("todos")
      .values({
        id: randomUUID(),
        title: data.title,
        description: data.description || null,
        completed: 0,
        priority: data.priority,
        user_id: request.user.id,
        due_date: data.due_date ? new Date(data.due_date).getTime() : null,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .returningAll()
      .executeTakeFirst();

    return response.json({ success: true, todo });
  }

  // Update todo
  public async update(request: Request, response: Response) {
    const { id } = request.params;
    const body = await request.json();

    const todo = await DB.selectFrom("todos")
      .select("user_id")
      .where("id", "=", id)
      .executeTakeFirst();

    if (!todo) {
      return response.status(404).json({ error: "Todo not found" });
    }

    if (todo.user_id !== request.user?.id) {
      return response.status(403).json({ error: "Forbidden" });
    }

    const validation = Validator.validate(updateSchema, body);

    if (!validation.success) {
      return response.status(422).json({
        errors: validation.errors
      });
    }

    const data = validation.data!;

    const updateData: any = {
      updated_at: Date.now()
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.completed !== undefined) updateData.completed = data.completed ? 1 : 0;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date ? new Date(data.due_date).getTime() : null;
    }

    const updated = await DB.updateTable("todos")
      .set(updateData)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    return response.json({ success: true, todo: updated });
  }

  // Delete todo
  public async destroy(request: Request, response: Response) {
    const { id } = request.params;

    const todo = await DB.selectFrom("todos")
      .select("user_id")
      .where("id", "=", id)
      .executeTakeFirst();

    if (!todo) {
      return response.status(404).json({ error: "Todo not found" });
    }

    if (todo.user_id !== request.user?.id) {
      return response.status(403).json({ error: "Forbidden" });
    }

    await DB.deleteFrom("todos")
      .where("id", "=", id)
      .execute();

    return response.json({ success: true });
  }

  // Toggle all todos
  public async toggleAll(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const body = await request.json();
    const completed = body.completed ? 1 : 0;

    await DB.updateTable("todos")
      .set({ completed, updated_at: Date.now() })
      .where("user_id", "=", request.user.id)
      .execute();

    return response.json({ success: true });
  }

  // Clear completed
  public async clearCompleted(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    await DB.deleteFrom("todos")
      .where("user_id", "=", request.user.id)
      .where("completed", "=", 1)
      .execute();

    return response.json({ success: true });
  }
}

export default new TodoController();
```

## Svelte Pages

### Todo Index Page

Create `resources/js/Pages/todos/index.svelte`:

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  import Header from '../../Components/Header.svelte';
  
  let { todos, filter, stats, user, flash } = $props();
  
  let newTodoTitle = $state('');
  let newTodoPriority = $state('medium');
  let editingId = $state(null);
  let editTitle = $state('');
  
  function addTodo(e) {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    
    router.post('/todos', {
      title: newTodoTitle,
      priority: newTodoPriority
    }, {
      onSuccess: () => {
        newTodoTitle = '';
        newTodoPriority = 'medium';
      }
    });
  }
  
  function toggleTodo(todo) {
    router.put(`/todos/${todo.id}`, {
      completed: !todo.completed
    }, { preserveScroll: true });
  }
  
  function startEdit(todo) {
    editingId = todo.id;
    editTitle = todo.title;
  }
  
  function saveEdit(todo) {
    if (editTitle.trim()) {
      router.put(`/todos/${todo.id}`, {
        title: editTitle
      }, { preserveScroll: true });
    }
    editingId = null;
  }
  
  function deleteTodo(id) {
    if (confirm('Delete this todo?')) {
      router.delete(`/todos/${id}`, { preserveScroll: true });
    }
  }
  
  function toggleAll() {
    const allCompleted = stats.active === 0;
    router.post('/todos/toggle-all', {
      completed: !allCompleted
    }, { preserveScroll: true });
  }
  
  function clearCompleted() {
    router.post('/todos/clear-completed', {}, { preserveScroll: true });
  }
  
  function setFilter(newFilter) {
    router.get('/todos', { filter: newFilter }, { preserveScroll: true });
  }
  
  function getPriorityColor(priority) {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100';
    }
  }
</script>

<Header />

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-8">My Todos</h1>
    
    <!-- Add Todo Form -->
    <form onsubmit={addTodo} class="mb-6">
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={newTodoTitle}
          placeholder="What needs to be done?"
          class="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
        <select
          bind:value={newTodoPriority}
          class="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          class="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition"
        >
          Add
        </button>
      </div>
    </form>
    
    <!-- Stats & Filters -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <span class="text-slate-600 dark:text-slate-400">
        <strong>{stats.active}</strong> item{stats.active !== 1 ? 's' : ''} left
      </span>
      
      <div class="flex gap-2">
        {#each ['all', 'active', 'completed'] as f}
          <button
            onclick={() => setFilter(f)}
            class="px-3 py-1 rounded-lg text-sm capitalize transition"
            class:bg-brand-600={filter === f}
            class:text-white={filter === f}
            class:bg-slate-200={filter !== f}
            class:dark:bg-slate-800={filter !== f}
            class:text-slate-700={filter !== f}
            class:dark:text-slate-300={filter !== f}
          >
            {f}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Todo List -->
    {#if todos.length > 0}
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <!-- Toggle All -->
        <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <input
            type="checkbox"
            checked={stats.active === 0 && stats.total > 0}
            onchange={toggleAll}
            class="w-5 h-5 rounded border-slate-300"
          />
          <span class="text-slate-600 dark:text-slate-400 text-sm">
            Mark all as {stats.active === 0 ? 'incomplete' : 'complete'}
          </span>
        </div>
        
        <!-- Todos -->
        <ul class="divide-y divide-slate-200 dark:divide-slate-800">
          {#each todos as todo (todo.id)}
            <li class="px-4 py-4 flex items-center gap-3 group">
              <input
                type="checkbox"
                checked={todo.completed}
                onchange={() => toggleTodo(todo)}
                class="w-5 h-5 rounded border-slate-300"
              />
              
              {#if editingId === todo.id}
                <input
                  type="text"
                  bind:value={editTitle}
                  onblur={() => saveEdit(todo)}
                  onkeydown={(e) => e.key === 'Enter' && saveEdit(todo)}
                  class="flex-1 px-2 py-1 border rounded"
                  autofocus
                />
              {:else}
                <div class="flex-1">
                  <span
                    class="cursor-pointer"
                    class:line-through={todo.completed}
                    class:text-slate-400={todo.completed}
                    class:text-slate-900={!todo.completed}
                    class:dark:text-white={!todo.completed}
                    ondblclick={() => startEdit(todo)}
                  >
                    {todo.title}
                  </span>
                  <span class="ml-2 text-xs px-2 py-0.5 rounded {getPriorityColor(todo.priority)}">
                    {todo.priority}
                  </span>
                </div>
              {/if}
              
              <button
                onclick={() => deleteTodo(todo.id)}
                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
              >
                ✕
              </button>
            </li>
          {/each}
        </ul>
        
        <!-- Clear Completed -->
        {#if stats.completed > 0}
          <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onclick={clearCompleted}
              class="text-sm text-slate-500 hover:text-red-600 transition"
            >
              Clear completed ({stats.completed})
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-12 text-slate-500">
        <p>No todos yet. Add one above!</p>
      </div>
    {/if}
  </div>
</div>
```

## Routes Configuration

Add to `routes/web.ts`:

```typescript
import TodoController from "../app/controllers/TodoController";
import Auth from "../app/middlewares/auth";

// Todo routes (require authentication)
Route.get("/todos", [Auth], TodoController.index);
Route.post("/todos", [Auth], TodoController.store);
Route.put("/todos/:id", [Auth], TodoController.update);
Route.delete("/todos/:id", [Auth], TodoController.destroy);
Route.post("/todos/toggle-all", [Auth], TodoController.toggleAll);
Route.post("/todos/clear-completed", [Auth], TodoController.clearCompleted);
```

## AI Prompt Example

To build this todo app using AI:

```
@workflow/INIT_AGENT.md

Create a todo app with these features:
- Add, edit, delete todos
- Mark todos as complete/incomplete
- Filter by status (all/active/completed)
- Priority levels (low/medium/high)
- Bulk actions (toggle all, clear completed)
- Real-time updates
- Dark mode support
- Clean, modern design
```

Then continue with:

```
@workflow/TASK_AGENT.md

Create the todo list page with:
- Input form to add new todos
- List of todos with checkboxes
- Edit on double-click
- Delete button on hover
- Filter buttons (all/active/completed)
- Stats counter
- Bulk actions
```

## Next Steps

- Add due dates with calendar picker
- Implement drag-and-drop reordering
- Add categories/tags
- Set up reminders/notifications
- Add subtasks
- Implement sharing between users
- Export to CSV/JSON

## Related

- [Blog Example](./blog) - Full CMS with rich content
- [E-commerce Example](./ecommerce) - Shopping cart & checkout
- [API Example](./api) - REST API patterns
