# replit.md

## Overview

3D FIBRA is a landing page for a Brazilian fiber optic internet service provider. The application showcases internet plans with pricing, features, and promotional content. It's a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence. The site is designed with a dark theme and modern UI aesthetics targeting Brazilian customers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Icons**: Lucide React
- **Fonts**: Inter (body text), Montserrat (headings) via Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Build**: esbuild for server, Vite for client
- **API Pattern**: RESTful endpoints with typed route definitions in shared/routes.ts
- **Development**: Vite dev server with HMR proxied through Express

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Migrations**: drizzle-kit with `db:push` command

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
    pages/        # Page components
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared types and schemas
  schema.ts       # Drizzle database schema
  routes.ts       # API route type definitions
```

### Key Design Decisions
1. **Shared Types**: The `shared/` directory contains schema and route definitions used by both client and server, ensuring type safety across the stack
2. **Component Library**: shadcn/ui provides accessible, customizable components without heavy dependencies
3. **Dark Theme First**: CSS variables in index.css define a dark color scheme optimized for the ISP branding
4. **Seed Data**: Plans are seeded on server startup if the database is empty

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Connection Pool**: pg (node-postgres) with Drizzle ORM wrapper

### Third-Party Services
- No external APIs currently integrated
- Ready for potential integrations: Stripe, OpenAI, Nodemailer (dependencies present in package.json)

### Key NPM Packages
- **drizzle-orm** + **drizzle-zod**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animations
- **zod**: Runtime type validation
- **wouter**: Client-side routing

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (required)

### Development Tools
- **Vite**: Frontend dev server and bundler
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database schema management