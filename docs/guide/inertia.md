# Inertia.js

Learn how Inertia.js enables seamless client-server communication in Laju applications.

## Page Component

```svelte
<!-- resources/js/Pages/posts/index.svelte -->
<script>
  import { router } from '@inertiajs/svelte';
  
  // Props from controller
  let { posts, user } = $props();
  
  function deletePost(id) {
    if (confirm('Delete this post?')) {
      router.delete(`/posts/${id}`);
    }
  }
</script>

<div class="max-w-4xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Posts</h1>
  
  {#if user}
    <a href="/posts/create" class="bg-blue-500 text-white px-4 py-2 rounded">
      Create Post
    </a>
  {/if}
  
  <div class="mt-4 space-y-4">
    {#each posts as post}
      <div class="border p-4 rounded">
        <h2 class="font-semibold">{post.title}</h2>
        <p class="text-gray-600">{post.content}</p>
        
        {#if user?.id === post.user_id}
          <div class="mt-2 flex gap-2">
            <a href={`/posts/${post.id}/edit`} class="text-blue-500">Edit</a>
            <button onclick={() => deletePost(post.id)} class="text-red-500">
              Delete
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
```

## Navigation

There are three ways to navigate in Inertia.js with Svelte:

### 1. Using Link Component

```svelte
<script>
  import { Link } from '@inertiajs/svelte';
</script>

<Link href="/posts">Posts</Link>
<Link href="/dashboard" method="post" as="button">Create</Link>
```

### 2. Using `use:inertia` Directive

```svelte
<script>
  import { inertia } from '@inertiajs/svelte';
</script>

<!-- With anchor tag -->
<a href="/posts" use:inertia>Posts</a>

<!-- With button -->
<button use:inertia href="/dashboard">Go to Dashboard</button>
```

### 3. Programmatic Navigation

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  
  function navigate(url) {
    router.visit(url);
  }
  
  function goBack() {
    history.back();
  }
  
  function visitWithMethod() {
    router.post('/posts', { title: 'New Post' });
  }
</script>

<button onclick={() => navigate('/dashboard')}>Go to Dashboard</button>
<button onclick={goBack}>Back</button>
<button onclick={visitWithMethod}>Create Post</button>
```

## Router Methods

```typescript
// Visit a URL
router.visit('/posts');

// POST request
router.post('/posts', { title: 'New Post' });

// PUT/PATCH request
router.put('/posts/1', { title: 'Updated' });
router.patch('/posts/1', { title: 'Updated' });

// DELETE request
router.delete('/posts/1');

// With options
router.post('/posts', data, {
  preserveScroll: true,
  preserveState: true,
  onSuccess: () => {
    console.log('Success!');
  },
  onError: (errors) => {
    console.log('Errors:', errors);
  }
});
```

## Flash Messages

Flash messages are automatically available as props in your Svelte components:

```svelte
<script>
  let { flash } = $props();
</script>

{#if flash?.error}
  <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
    <span class="text-red-400">{flash.error}</span>
  </div>
{/if}

{#if flash?.success}
  <div class="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
    <span class="text-green-400">{flash.success}</span>
  </div>
{/if}
```

### Auto Toast with Flash Messages

Use `$effect` to automatically display flash messages as toast notifications:

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  import { Toast } from '@/Components/helper.js';

  let { flash } = $props();

  // Auto-display flash messages as toasts
  $effect(() => {
    if (flash?.error) {
      Toast(flash.error, 'error', 3000);
    }
    if (flash?.success) {
      Toast(flash.success, 'success', 3000);
    }
    if (flash?.warning) {
      Toast(flash.warning, 'warning', 3000);
    }
    if (flash?.info) {
      Toast(flash.info, 'info', 3000);
    }
  });
</script>
```

## Shared Props

Shared props are available on all Inertia responses:

```typescript
// Controller
return response.inertia("dashboard", { posts }); // Includes shared props automatically
```

Access shared props in components:

```svelte
<script>
  let { user } = $props();
</script>

{#if user?.id}
  <p>Welcome, {user.name}!</p>
{/if}
```

## Next Steps

- [Forms](/guide/forms) - Handle form submissions with Inertia
- [Svelte](/guide/svelte) - Learn Svelte 5 patterns
