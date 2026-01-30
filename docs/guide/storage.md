# Storage

Complete guide for file storage in Laju framework.

## Overview

Laju provides two separate storage services:
- **Local Storage** - Filesystem storage (free, no external dependencies)
- **S3 Storage** - Wasabi/S3 for production with presigned URLs

## Choosing the Right Storage

| Aspect | LocalStorage | S3 Storage |
|--------|-------------|------------|
| **Cost** | Free | Paid (Wasabi: ~$6/TB/month) |
| **Setup** | No configuration needed | Requires AWS/Wasabi credentials |
| **Performance** | Fast (local filesystem) | Fast (CDN integration) |
| **Scalability** | Limited by server disk | Unlimited |
| **Backup** | Manual backup required | Built-in backup & versioning |
| **Multi-server** | Not supported | Supported (shared storage) |

### When to Use LocalStorage

**Best for:**
- Development and testing environments
- Small projects with limited budget
- Internal tools with sensitive data
- Single-server deployment

### When to Use S3 Storage

**Best for:**
- Production applications
- High-traffic sites
- Multi-server deployments
- Applications requiring easy migration

### Switching Between Storage

Simply change the import in your controller:

```typescript
// For Local Storage (Development)
import { getPublicUrl, uploadBuffer } from "app/services/LocalStorage";

// For S3 Storage (Production)
import { getPublicUrl, uploadBuffer } from "app/services/S3";
```

## Local Storage

### Configuration

```env
LOCAL_STORAGE_PATH=./storage
LOCAL_STORAGE_PUBLIC_URL=/storage
```

### Service Methods

```typescript
import {
  uploadBuffer,
  getPublicUrl,
  getObject,
  deleteObject,
  exists
} from "app/services/LocalStorage";

// Upload buffer directly
await uploadBuffer(
  'assets/photo.jpg',           // key
  buffer,                       // file buffer
  'image/jpeg',                 // content type
  'public, max-age=31536000'    // cache control (optional)
);

// Get public URL
const publicUrl = getPublicUrl('assets/photo.jpg');
// Returns: /storage/assets/photo.jpg

// Download file
const response = await getObject('assets/photo.jpg');
const stream = response.Body;

// Delete file
await deleteObject('assets/photo.jpg');

// Check if file exists
const fileExists = await exists('assets/photo.jpg');
```

## S3 Storage

### Configuration

```env
WASABI_ACCESS_KEY=your_access_key
WASABI_SECRET_KEY=your_secret_key
WASABI_BUCKET=laju-dev
WASABI_REGION=ap-southeast-1
WASABI_ENDPOINT=https://s3.ap-southeast-1.wasabisys.com
CDN_URL=https://cdn.example.com  # Optional
```

### Service Methods

```typescript
import {
  uploadBuffer,
  getSignedUploadUrl,
  getPublicUrl,
  getObject,
  deleteObject,
  exists
} from "app/services/S3";

// Upload buffer directly
await uploadBuffer(
  'assets/photo.jpg',           // key
  buffer,                       // file buffer
  'image/jpeg',                 // content type
  'public, max-age=31536000'    // cache control (optional)
);

// Generate presigned upload URL
const signedUrl = await getSignedUploadUrl(
  'assets/photo.jpg',           // key
  'image/jpeg',                 // content type
  3600                          // expiration in seconds
);

// Get public URL
const publicUrl = getPublicUrl('assets/photo.jpg');

// Download file
const response = await getObject('assets/photo.jpg');

// Delete file
await deleteObject('assets/photo.jpg');

// Check if file exists
const fileExists = await exists('assets/photo.jpg');
```

## Upload Controller

```typescript
// app/controllers/UploadController.ts
import { uuidv7 } from "uuidv7";
import { getPublicUrl, uploadBuffer } from "app/services/LocalStorage";
import sharp from "sharp";

class UploadController {
  // Upload Image with Processing
  public async uploadImage(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    await request.multipart(async (field: unknown) => {
      if (field && typeof field === 'object' && 'file' in field && field.file) {
        const file = field.file as { stream: NodeJS.ReadableStream; mime_type: string };
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mime_type)) {
          return response.status(400).json({ 
            error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
          });
        }

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        file.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        await new Promise((resolve) => file.stream.on('end', resolve));
        const buffer = Buffer.concat(chunks);

        // Process image with Sharp
        const processedBuffer = await sharp(buffer)
          .webp({ quality: 80 })
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();

        // Upload to storage
        const id = uuidv7();
        const fileName = `${id}.webp`;
        const storageKey = `assets/${fileName}`;
        
        await uploadBuffer(storageKey, processedBuffer, 'image/webp');
        const publicUrl = getPublicUrl(storageKey);

        // Save to database
        const uploadedAsset = {
          id,
          type: 'image',
          url: publicUrl,
          mime_type: 'image/webp',
          name: fileName,
          size: processedBuffer.length,
          user_id: request.user.id,
          storage_key: storageKey,
          created_at: Date.now(),
          updated_at: Date.now()
        };

        await DB.insertInto("assets").values(uploadedAsset).execute();
        response.json({ success: true, data: uploadedAsset });
      }
    });
  }
}

export default new UploadController();
```

## Client Implementation

### Svelte Component (LocalStorage Upload)

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

### Svelte Component (S3 Presigned URLs)

```svelte
<script>
  let uploading = $state(false);
  let imageUrl = $state('');

  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    uploading = true;

    try {
      // 1. Get presigned URL from server
      const res = await fetch('/api/s3/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      });

      const { data } = await res.json();

      // 2. Upload directly to S3
      await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      // 3. Save public URL
      imageUrl = data.publicUrl;

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      uploading = false;
    }
  }
</script>

<input type="file" onchange={handleFileSelect} accept="image/*" disabled={uploading} />

{#if uploading}
  <p>Uploading...</p>
{/if}

{#if imageUrl}
  <img src={imageUrl} alt="Uploaded" class="w-32 h-32 object-cover" />
{/if}
```

## Routes

```typescript
// routes/web.ts
import UploadController from "../app/controllers/UploadController";
import StorageController from "../app/controllers/StorageController";
import Auth from "../app/middlewares/auth";
import { uploadRateLimit } from "../app/middlewares/rateLimit";

// Upload routes
Route.post("/api/upload/image", [Auth, uploadRateLimit], UploadController.uploadImage);
Route.post("/api/upload/file", [Auth, uploadRateLimit], UploadController.uploadFile);

// Local storage route
Route.get("/storage/*", StorageController.serveFile);
```

## Best Practices

1. **Validate File Types**
```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!allowedTypes.includes(contentType)) {
  return response.status(400).json({ error: 'Invalid file type' });
}
```

2. **Validate File Size**
```typescript
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  alert('File too large. Max 5MB');
  return;
}
```

3. **Generate Unique Keys**
```typescript
import { randomUUID } from "crypto";

const ext = filename.split('.').pop();
const key = `uploads/${userId}/${randomUUID()}.${ext}`;
```

4. **Set Appropriate Expiry (S3 Only)**
```typescript
// Short expiry for sensitive files
const signedUrl = await getSignedUploadUrl(key, contentType, 300); // 5 minutes

// Longer expiry for large files
const signedUrl = await getSignedUploadUrl(key, contentType, 3600); // 1 hour
```

## Next Steps

- [Forms](/guide/forms) - Handle form submissions with files
- [Controllers](/guide/controllers) - Build upload controllers
