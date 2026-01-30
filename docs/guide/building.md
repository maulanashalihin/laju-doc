# Building for Production

Learn how to build Laju applications for production.

## Build Command

```bash
npm run build
```

This command:
1. Compiles TypeScript to JavaScript
2. Bundles frontend assets with Vite
3. Outputs to `build/` directory

## Production Environment

### Environment Variables

```env
# Database & Server
DB_CONNECTION=production
NODE_ENV=production
PORT=5555

# Application
APP_URL=https://yourdomain.com
TITLE=Your App Name

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/google/callback

# S3/Wasabi Storage
WASABI_ACCESS_KEY=your_access_key
WASABI_SECRET_KEY=your_secret_key
WASABI_BUCKET=your-bucket
WASABI_REGION=ap-southeast-1
WASABI_ENDPOINT=https://s3.ap-southeast-1.wasabisys.com

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Secure permissions for `.env`:
```bash
chmod 600 .env
```

## Docker Deployment

Laju includes a production-ready `Dockerfile`.

### Build & Run

```bash
# Build image
docker build -t laju-app .

# Run container with environment file
docker run -d \
  -p 5555:5555 \
  -v $(pwd)/.env:/app/.env \
  -v $(pwd)/data:/app/data \
  --name laju \
  laju-app

# View logs
docker logs -f laju

# Stop container
docker stop laju

# Remove container
docker rm laju
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  laju:
    build: .
    ports:
      - "5555:5555"
    volumes:
      - ./.env:/app/.env
      - ./data:/app/data
    restart: unless-stopped
```

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

## What the Dockerfile Does

1. Uses `node:22-slim` base image
2. Installs build dependencies
3. Runs `npm ci` for deterministic installs
4. Builds application with `npm run build`
5. Runs migrations on container start
6. Starts app with PM2

## Build Optimization

### Reduce Bundle Size

1. **Tree shaking** - Remove unused code
2. **Code splitting** - Load code on demand
3. **Asset optimization** - Compress images and fonts

### Environment-Specific Builds

```bash
# Development (includes source maps)
NODE_ENV=development npm run build

# Production (minified, optimized)
NODE_ENV=production npm run build
```

## Troubleshooting Build Issues

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check TypeScript
npx tsc --noEmit
```

### Build Fails

```bash
# Clear build directory and rebuild
rm -rf build
npm run build
```

## Next Steps

- [Production](/guide/production) - Deploy to production
- [CI/CD](/guide/cicd) - Automate deployment
