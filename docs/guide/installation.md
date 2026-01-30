# Installation

Get started with Laju Framework in minutes.

## Quick Start — 30 Seconds Setup

```bash
npx create-laju-app my-project && cd my-project
npm run migrate && npm run dev
```

Visit `http://localhost:5555` — your app is running!

## Manual Installation

If you prefer to set up manually:

### Step 1: Create Project

```bash
npx create-laju-app my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

### Step 2: Environment Setup

Edit `.env` file:

```env
# Database & Server
DB_CONNECTION=development
NODE_ENV=development
PORT=5555

# Application
APP_URL=http://localhost:5555
TITLE="My Laju App"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5555/google/callback

# S3/Wasabi Storage (optional)
WASABI_ACCESS_KEY=
WASABI_SECRET_KEY=
WASABI_BUCKET=
WASABI_REGION=
WASABI_ENDPOINT=

# Email (optional)
USER_MAILER=
PASS_MAILER=
RESEND_API_KEY=
```

## System Requirements

- **Node.js** 20+ (recommended: 22+)
- **npm** or **bun**
- **Git**

## What's Included

Laju comes with everything you need:

- ✅ **HyperExpress** - Ultra-fast HTTP server
- ✅ **Svelte 5** - Modern reactive UI framework
- ✅ **Inertia.js** - Seamless client-server communication
- ✅ **BetterSQLite3** - High-performance embedded database
- ✅ **TypeScript** - Type-safe development
- ✅ **TailwindCSS** - Utility-first CSS framework
- ✅ **Vite** - Lightning-fast build tool
- ✅ **Authentication** - Complete auth system with OAuth
- ✅ **Email** - SMTP and Resend support
- ✅ **Storage** - Local and S3 file storage

## Project Structure

```
my-app/
├── app/
│   ├── controllers/     # HTTP request handlers
│   ├── middlewares/     # Request/response middleware
│   ├── services/        # Business logic & utilities
│   └── validators/      # Validation schemas
├── routes/              # Route definitions
├── migrations/          # Database migrations
├── resources/
│   └── js/
│       ├── Pages/       # Svelte 5 Inertia pages
│       └── Components/  # Reusable Svelte components
├── public/              # Static assets
├── storage/             # File storage
└── tests/               # Test files
```

## Available Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run migrate       # Run database migrations
npm run refresh       # Refresh database
npm run test:run      # Run tests
npm run test:e2e      # Run E2E tests
```

## Next Steps

- [Routing](/guide/routing) - Define application routes
- [Controllers](/guide/controllers) - Handle HTTP requests
- [Database](/guide/database) - Work with the database
- [Svelte](/guide/svelte) - Build the frontend
