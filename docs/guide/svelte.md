# Svelte 5

Guide for using Svelte 5 with runes in Laju applications.

## Runes Overview

Svelte 5 introduces runes - a new reactive primitive system:

| Rune | Purpose |
|------|---------|
| `$state` | Reactive state |
| `$derived` | Computed values |
| `$effect` | Side effects |
| `$props` | Component props |
| `$bindable` | Two-way bindable props |

## State Management

### Basic State

```svelte
<script>
  // Reactive state
  let count = $state(0);
  let name = $state('');
  let items = $state([]);
  
  function increment() {
    count++;
  }
  
  function addItem(item) {
    items.push(item);  // Mutating arrays works!
  }
</script>

<button onclick={increment}>Count: {count}</button>
<input bind:value={name} />
```

### Object State

```svelte
<script>
  let user = $state({
    name: '',
    email: '',
    preferences: {
      theme: 'light',
      notifications: true
    }
  });
  
  function updateTheme(theme) {
    user.preferences.theme = theme;  // Deep reactivity
  }
</script>

<input bind:value={user.name} />
<select bind:value={user.preferences.theme}>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
```

### Array State

```svelte
<script>
  let todos = $state([
    { id: 1, text: 'Learn Svelte 5', done: false },
    { id: 2, text: 'Build app', done: false }
  ]);
  
  function addTodo(text) {
    todos.push({ id: Date.now(), text, done: false });
  }
  
  function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
  }
  
  function removeTodo(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index > -1) todos.splice(index, 1);
  }
</script>

{#each todos as todo}
  <div>
    <input type="checkbox" checked={todo.done} onchange={() => toggleTodo(todo.id)} />
    <span class:done={todo.done}>{todo.text}</span>
    <button onclick={() => removeTodo(todo.id)}>Delete</button>
  </div>
{/each}
```

## Props and Events

### Receiving Props

```svelte
<script>
  // Destructure props with $props()
  let { title, count = 0, items = [] } = $props();
</script>

<h1>{title}</h1>
<p>Count: {count}</p>
```

### Props with Types (TypeScript)

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
    onSubmit?: (data: FormData) => void;
  }
  
  let { title, count = 0, onSubmit }: Props = $props();
</script>
```

### Event Callbacks

```svelte
<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';
  
  function handleClick(message) {
    console.log('Child clicked:', message);
  }
</script>

<Child onClick={handleClick} />

<!-- Child.svelte -->
<script>
  let { onClick } = $props();
</script>

<button onclick={() => onClick?.('Hello from child')}>
  Click me
</button>
```

### Two-way Binding with $bindable

```svelte
<!-- TextInput.svelte -->
<script>
  let { value = $bindable('') } = $props();
</script>

<input bind:value class="border rounded px-3 py-2 focus:outline-none" />

<!-- Usage -->
<script>
  import TextInput from './TextInput.svelte';
  let name = $state('');
</script>

<TextInput bind:value={name} />
<p>Name: {name}</p>
```

## Effects and Derived

### Derived Values

```svelte
<script>
  let items = $state([
    { name: 'Apple', price: 1.5 },
    { name: 'Banana', price: 0.75 }
  ]);
  
  // Computed value - recalculates when items change
  let total = $derived(items.reduce((sum, item) => sum + item.price, 0));
  let count = $derived(items.length);
  let isEmpty = $derived(items.length === 0);
</script>

<p>Items: {count}</p>
<p>Total: ${total.toFixed(2)}</p>
```

### Effects

```svelte
<script>
  let searchQuery = $state('');
  let results = $state([]);
  
  // Run effect when searchQuery changes
  $effect(() => {
    if (searchQuery.length > 2) {
      fetchResults(searchQuery);
    }
  });
  
  async function fetchResults(query) {
    const res = await fetch(`/api/search?q=${query}`);
    results = await res.json();
  }
</script>

<input bind:value={searchQuery} placeholder="Search..." />
```

### Effect with Cleanup

```svelte
<script>
  let count = $state(0);
  
  $effect(() => {
    const interval = setInterval(() => {
      count++;
    }, 1000);
    
    // Cleanup function
    return () => clearInterval(interval);
  });
</script>

<p>Seconds: {count}</p>
```

### Debounced Effect

```svelte
<script>
  let searchQuery = $state('');
  let results = $state([]);
  
  $effect(() => {
    const query = searchQuery;
    
    if (query.length < 3) {
      results = [];
      return;
    }
    
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${query}`);
      results = await res.json();
    }, 300);
    
    return () => clearTimeout(timeout);
  });
</script>
```

## Common Patterns

### Modal Component

```svelte
<!-- Modal.svelte -->
<script>
  let { open = $bindable(false), title, children } = $props();
  
  function close() {
    open = false;
  }
  
  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={close}>
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" onclick={(e) => e.stopPropagation()}>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">{title}</h2>
        <button onclick={close} class="text-gray-500 hover:text-gray-700">X</button>
      </div>
      {@render children()}
    </div>
  </div>
{/if}

<!-- Usage -->
<script>
  import Modal from './Modal.svelte';
  let showModal = $state(false);
</script>

<button onclick={() => showModal = true}>Open Modal</button>

<Modal bind:open={showModal} title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <div class="mt-4 flex gap-2">
    <button onclick={() => showModal = false}>Cancel</button>
    <button class="bg-blue-500 text-white px-4 py-2 rounded">Confirm</button>
  </div>
</Modal>
```

### Toast Notifications

#### Quick Method (Recommended)

Use the `Toast` helper function for quick notifications:

```svelte
<script>
  import { Toast } from '@/Components/helper.js';
  
  function showSuccess() {
    Toast('Operation successful!', 'success', 3000);
  }
  
  function showError() {
    Toast('Something went wrong', 'error', 3000);
  }
  
  function showWarning() {
    Toast('Please check your input', 'warning', 3000);
  }
  
  function showInfo() {
    Toast('New message received', 'info', 3000);
  }
</script>

<button onclick={showSuccess}>Show Success</button>
<button onclick={showError}>Show Error</button>
<button onclick={showWarning}>Show Warning</button>
<button onclick={showInfo}>Show Info</button>
```

### Loading State

```svelte
<script>
  let loading = $state(false);
  let data = $state(null);
  
  async function fetchData() {
    loading = true;
    try {
      const res = await fetch('/api/data');
      data = await res.json();
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="flex justify-center p-4">
    <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
  </div>
{:else if data}
  <div>{JSON.stringify(data)}</div>
{:else}
  <button onclick={fetchData}>Load Data</button>
{/if}
```

## Next Steps

- [Inertia.js](/guide/inertia) - Learn about Inertia integration
- [Forms](/guide/forms) - Handle form submissions
- [Styling](/guide/styling) - Style with Tailwind CSS
