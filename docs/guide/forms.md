# Forms

Learn how to handle form submissions in Laju applications.

## Simple Form with Flash Messages (Recommended)

For most forms, use flash messages for error handling. The backend handles validation and sends flash messages automatically.

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  
  let { user, flash } = $props();
  
  let form = $state({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  
  let isLoading = $state(false);
  
  function handleSubmit() {
    isLoading = true;
    
    router.post('/change-profile', form, {
      onFinish: () => isLoading = false
    });
  }
</script>

<!-- Display flash messages from backend -->
{#if flash?.error}
  <div class="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
    <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span class="text-red-400 text-sm">{flash.error}</span>
  </div>
{/if}

{#if flash?.success}
  <div class="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
    <svg class="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    <span class="text-green-400 text-sm">{flash.success}</span>
  </div>
{/if}

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Name</label>
    <input 
      bind:value={form.name}
      class="w-full border rounded px-3 py-2 focus:outline-none"
    />
  </div>
  
  <div>
    <label class="block text-sm font-medium mb-1">Email</label>
    <input 
      type="email"
      bind:value={form.email}
      class="w-full border rounded px-3 py-2 focus:outline-none"
    />
  </div>
  
  <div>
    <label class="block text-sm font-medium mb-1">Phone</label>
    <input 
      type="tel"
      bind:value={form.phone}
      class="w-full border rounded px-3 py-2 focus:outline-none"
    />
  </div>
  
  <button 
    type="submit"
    disabled={isLoading}
    class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
  >
    {isLoading ? 'Saving...' : 'Save Changes'}
  </button>
</form>
```

**Backend Controller:**

```typescript
public async changeProfile(request: Request, response: Response) {
  const body = await request.json();

  // Backend validates
  if (!body.name || body.name.length < 2) {
    return response.flash("error", "Name must be at least 2 characters").redirect("/profile", 303);
  }

  if (!body.email || !body.email.includes('@')) {
    return response.flash("error", "Invalid email address").redirect("/profile", 303);
  }

  // Update database
  await DB.from("users").where("id", request.user.id).update(body);

  // Send success message
  return response.flash("success", "Profile updated successfully!").redirect("/profile", 303);
}
```

## Form with Auto Toast (Simpler)

Use `$effect` to automatically display flash messages as toast notifications:

```svelte
<script>
  import { router } from '@inertiajs/svelte';
  import { Toast } from '@/Components/helper.js';

  let { user, flash } = $props();

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

  let form = $state({
    name: user?.name || '',
    email: user?.email || ''
  });

  let isLoading = $state(false);

  function handleSubmit() {
    isLoading = true;
    router.post('/change-profile', form, {
      onFinish: () => isLoading = false
    });
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Name</label>
    <input
      bind:value={form.name}
      class="w-full border rounded px-3 py-2 focus:outline-none"
    />
  </div>

  <div>
    <label class="block text-sm font-medium mb-1">Email</label>
    <input
      type="email"
      bind:value={form.email}
      class="w-full border rounded px-3 py-2 focus:outline-none"
    />
  </div>

  <button
    type="submit"
    disabled={isLoading}
    class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
  >
    {isLoading ? 'Saving...' : 'Save Changes'}
  </button>
</form>
```

## Error Handling Best Practices

### Show Loading States

Display loading indicators during async operations:

```svelte
<button 
  type="submit"
  disabled={isLoading}
  class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
>
  {isLoading ? 'Processing...' : 'Submit'}
</button>
```

### User-Friendly Error Messages

Backend controllers should send clear, actionable error messages:

```typescript
// Controller
return response
  .flash("error", "Email already registered. Please use a different email or login.")
  .redirect("/register");
```

## Form Validation

### Frontend Validation

Add client-side validation for better UX:

```svelte
<script>
  let form = $state({ email: '', password: '' });
  let errors = $state({});
  
  function validate() {
    errors = {};
    
    if (!form.email.includes('@')) {
      errors.email = 'Invalid email address';
    }
    
    if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  function handleSubmit() {
    if (!validate()) return;
    router.post('/login', form);
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div>
    <input type="email" bind:value={form.email} />
    {#if errors.email}
      <p class="text-red-500 text-sm">{errors.email}</p>
    {/if}
  </div>
  
  <div>
    <input type="password" bind:value={form.password} />
    {#if errors.password}
      <p class="text-red-500 text-sm">{errors.password}</p>
    {/if}
  </div>
  
  <button type="submit">Login</button>
</form>
```

### Backend Validation

Always validate on the backend as well:

```typescript
import Validator from "../services/Validator";
import { updateProfileSchema } from "../validators/ProfileValidator";

public async update(request: Request, response: Response) {
  const body = await request.json();

  // Validate input
  const validationResult = Validator.validate(updateProfileSchema, body);

  if (!validationResult.success) {
    const errors = validationResult.errors || {};
    const firstError = Object.values(errors)[0]?.[0] || 'Validation error';
    return response
      .flash("error", firstError)
      .redirect("/profile", 303);
  }

  const { name, email } = validationResult.data!;

  // Update profile
  await DB.from("users").where("id", request.user.id).update({ name, email });

  return response
    .flash("success", "Profile updated successfully")
    .redirect("/profile", 303);
}
```

## File Upload Forms

### Image Upload

```svelte
<script>
  let uploading = $state(false);
  let imageUrl = $state('');

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    uploading = true;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data) {
        imageUrl = data.data.url;
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      uploading = false;
    }
  }
</script>

<input type="file" onchange={handleImageUpload} accept="image/*" disabled={uploading} />

{#if uploading}
  <p>Uploading...</p>
{/if}

{#if imageUrl}
  <img src={imageUrl} alt="Uploaded" class="w-32 h-32 object-cover" />
{/if}
```

### File Upload

```svelte
<script>
  let uploading = $state(false);
  let fileUrl = $state('');

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    uploading = true;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data) {
        fileUrl = data.data.url;
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      uploading = false;
    }
  }
</script>

<input type="file" onchange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" disabled={uploading} />

{#if uploading}
  <p>Uploading...</p>
{/if}

{#if fileUrl}
  <a href={fileUrl} download>Download File</a>
{/if}
```

## Next Steps

- [Validation](/guide/validation) - Learn more about validation
- [Storage](/guide/storage) - Handle file uploads
