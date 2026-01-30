# Storage

Complete guide for file storage in Laju framework with support for Local filesystem and S3.

## Overview

Laju provides two separate storage services that can be used independently:
- **Local Storage** - Filesystem storage (free, no external dependencies)
- **S3 Storage** - Wasabi/S3 for production with presigned URLs

Both services are available and can be used simultaneously in your application.

## Choosing the Right Storage

### Comparison: LocalStorage vs S3 Storage

| Aspect | LocalStorage | S3 Storage |
|--------|-------------|------------|
| **Cost** | Free | Paid (Wasabi: ~$6/TB/month) |
| **Setup** | No configuration needed | Requires AWS/Wasabi credentials |
| **Performance** | Fast (local filesystem) | Fast (CDN integration) |
| **Scalability** | Limited by server disk | Unlimited |
| **Migration** | Difficult (files on server) | Easy (external storage) |
| **Security** | Server-level only | Encryption + IAM policies |
| **Backup** | Manual backup required | Built-in backup & versioning |
| **Multi-server** | Not supported | Supported (shared storage) |

### When to Use LocalStorage

**Best for:**
- Development and testing environments
- Small projects with limited budget
- Internal tools with sensitive data
- Applications with strict data residency requirements

### When to Use S3 Storage

**Best for:**
- Production applications
- High-traffic sites
- Multi-server deployments
- Applications requiring easy migration
- Projects with global users (CDN)

### Switching Between Storage

Both services have the same API, making it easy to switch:

```typescript
// For Local Storage (Development)
import { getPublicUrl, uploadBuffer } from "app/services/LocalStorage";

// For S3 Storage (Production)
import { getPublicUrl, uploadBuffer } from "app/services/S3";
```

## Local Storage

Local storage uses the filesystem for file storage.

### Configuration

```env
LOCAL_STORAGE_PATH=./storage
LOCAL_STORAGE_PUBLIC_URL=/storage
```

### Local Storage Service Methods

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

S3 storage uses Wasabi/S3 with presigned URLs for secure uploads.

### Configuration

```env
WASABI_ACCESS_KEY=your_access_key
WASABI_SECRET_KEY=your_secret_key
WASABI_BUCKET=laju-dev
WASABI_REGION=ap-southeast-1
WASABI_ENDPOINT=https://s3.ap-southeast-1.wasabisys.com
CDN_URL=https://cdn.example.com  # Optional
```

### S3 Service Methods

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
// Returns: https://cdn.example.com/laju-dev/assets/photo.jpg

// Download file
const response = await getObject('assets/photo.jpg');
const stream = response.Body;

// Delete file
await deleteObject('assets/photo.jpg');

// Check if file exists
const fileExists = await exists('assets/photo.jpg');
```

## UploadController

UploadController handles file uploads with two separate methods:

```typescript
// app/controllers/UploadController.ts
import { uuidv7 } from "uuidv7";
import { Response, Request } from "../../type";
import sharp from "sharp";
import DB from "../services/DB";
import { getPublicUrl, uploadBuffer } from "app/services/LocalStorage";

class UploadController {
  /**
   * Upload Image with Processing
   * - Validates image type (JPEG, PNG, GIF, WebP)
   * - Processes with Sharp (resize, convert to WebP)
   * - Uploads to storage
   * - Saves metadata to database
   */
  public async uploadImage(request: Request, response: Response) {
    try {
      if (!request.user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const userId = request.user.id;
      let uploadedAsset: any = null;
      let isValidFile = true;
      let errorMessage = '';

      await request.multipart(async (field: unknown) => {
        if (field && typeof field === 'object' && 'file' in field && field.file) {
          const multipartField = field as { 
            name: string; 
            mime_type: string;
            file: { stream: NodeJS.ReadableStream; name: string } 
          };

          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(multipartField.mime_type)) {
            isValidFile = false;
            errorMessage = `Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.`;
            return;
          }

          // Generate unique filename
          const id = uuidv7();
          const fileName = `${id}.webp`;

          // Convert stream to buffer
          const chunks: Buffer[] = [];
          const readable = multipartField.file.stream;

          readable.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          readable.on('end', async () => {
            const buffer = Buffer.concat(chunks);

            try {
              // Process image with Sharp
              const processedBuffer = await sharp(buffer)
                .webp({ quality: 80 })
                .resize(1200, 1200, {
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .toBuffer();

              // Upload to storage
              const storageKey = `assets/${fileName}`;
              await uploadBuffer(storageKey, processedBuffer, 'image/webp');
              const publicUrl = getPublicUrl(storageKey);

              // Save to database
              uploadedAsset = {
                id,
                type: 'image',
                url: publicUrl,
                mime_type: 'image/webp',
                name: fileName,
                size: processedBuffer.length,
                user_id: userId,
                storage_key: storageKey,
                created_at: Date.now(),
                updated_at: Date.now()
              };

              await DB.insertInto("assets").values(uploadedAsset).execute();
              response.json({ success: true, data: uploadedAsset });
            } catch (err) {
              response.status(500).json({ 
                success: false, 
                error: 'Error processing and uploading image' 
              });
            }
          });
        }
      });

      if (!isValidFile) {
        return response.status(400).json({ 
          success: false, 
          error: errorMessage 
        });
      }

    } catch (error) {
      return response.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Upload File (Non-Image)
   * - Validates file type (PDF, Word, Excel, Text, CSV)
   * - Uploads directly without processing
   * - Saves metadata to database
   */
  public async uploadFile(request: Request, response: Response) {
    try {
      if (!request.user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const userId = request.user.id;
      let uploadedAsset: any = null;
      let isValidFile = true;
      let errorMessage = '';

      await request.multipart(async (field: unknown) => {
        if (field && typeof field === 'object' && 'file' in field && field.file) {
          const file = field.file as { stream: NodeJS.ReadableStream; mime_type: string; name: string };
          
          // Validate file type
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
          ];
          
          if (!allowedTypes.includes(file.mime_type)) {
            isValidFile = false;
            errorMessage = 'Invalid file type. Allowed types: PDF, Word, Excel, Text, CSV';
            return;
          }

          // Generate unique filename
          const id = uuidv7();
          const ext = file.name.split('.').pop();
          const fileName = `${id}.${ext}`;

          // Convert stream to buffer
          const chunks: Buffer[] = [];
          const readable = file.stream;

          readable.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          readable.on('end', async () => {
            const buffer = Buffer.concat(chunks);

            try {
              // Upload directly without processing
              const storageKey = `files/${userId}/${fileName}`;
              await uploadBuffer(storageKey, buffer, file.mime_type);
              const publicUrl = getPublicUrl(storageKey);

              // Save to database
              uploadedAsset = {
                id,
                type: 'file',
                url: publicUrl,
                mime_type: file.mime_type,
                name: file.name,
                size: buffer.length,
                user_id: userId,
                storage_key: storageKey,
                created_at: Date.now(),
                updated_at: Date.now()
              };

              await DB.insertInto("assets").values(uploadedAsset).execute();
              response.json({ success: true, data: uploadedAsset });
            } catch (err) {
              response.status(500).json({ 
                success: false, 
                error: 'Error uploading file' 
              });
            }
          });
        }
      });

      if (!isValidFile) {
        return response.status(400).json({ 
          success: false, 
          error: errorMessage 
        });
      }

    } catch (error) {
      return response.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}

export default new UploadController();
```

### Routes

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

## Best Practices

### 1. Validate File Types

```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!allowedTypes.includes(contentType)) {
  return response.status(400).json({ error: 'Invalid file type' });
}
```

### 2. Validate File Size

```typescript
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  alert('File too large. Max 5MB');
  return;
}
```

### 3. Generate Unique Keys

```typescript
import { randomUUID } from "crypto";

const ext = filename.split('.').pop();
const key = `uploads/${userId}/${randomUUID()}.${ext}`;
```

### 4. Set Appropriate Expiry (S3 Only)

```typescript
// Short expiry for sensitive files
const signedUrl = await getSignedUploadUrl(key, contentType, 300); // 5 minutes

// Longer expiry for large files
const signedUrl = await getSignedUploadUrl(key, contentType, 3600); // 1 hour
```

## Next Steps

- [Email](/guide/email) - Send emails with attachments
- [Caching](/guide/caching) - Cache frequently accessed files
