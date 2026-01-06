# Stencil API Migration: Astro → Fastify

## Migration Overview

This document outlines the migration from Astro API routes to a pure Fastify backend for the Stencil Marketplace API.

## Current State Analysis

### Existing API Structure
```
src/pages/api/
├── auth/
│   ├── login.ts      # POST /api/auth/login
│   └── register.ts   # POST /api/auth/register  
├── listings/
│   ├── index.ts      # GET/POST /api/listings
│   ├── [id].ts       # GET/PUT/DELETE /api/listings/:id
│   └── variants/
│       ├── index.ts  # GET/POST /api/listings/variants
│       └── [id].ts   # GET/PUT/DELETE /api/listings/variants/:id
└── utils/
    ├── auth.ts       # Authentication middleware
    ├── error.ts      # Error handling utilities
    ├── index.ts      # Common utilities
    └── validation.ts # Zod schemas
```

### Dependencies to Remove
- `astro` (v5.14.5)
- `@astrojs/node` (v9.5.0)

### Dependencies to Add
- `fastify` (v4.x)
- `@fastify/cors` (CORS plugin)
- `@fastify/cookie` (Cookie support)
- `@fastify/jwt` (JWT plugin)
- `@fastify/autoload` (Auto route loading)

## New Fastify Architecture

### Directory Structure
```
src/
├── server.ts                 # Main Fastify server
├── plugins/
│   ├── cors.ts              # CORS configuration
│   ├── auth.ts              # JWT authentication plugin
│   └── database.ts          # Database connection plugin
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── listings.ts          # Listings CRUD routes  
│   └── variants.ts          # Variants CRUD routes
├── schemas/
│   ├── auth.ts              # Auth request/response schemas
│   ├── listings.ts          # Listing validation schemas
│   └── variants.ts          # Variant validation schemas
├── middleware/
│   └── auth.ts              # Authentication middleware
├── utils/
│   ├── error.ts             # Error handling utilities
│   └── validation.ts        # Schema validation helpers
├── db/ (unchanged)
│   ├── client.ts
│   └── schema.ts
└── lib/ (keep core logic)
    ├── auth.ts
    ├── cloudinary.js
    └── jwt.ts
```

### API Route Mapping

| Current Astro Route | New Fastify Route | Method | Handler |
|-------------------|------------------|---------|---------|
| `/api/auth/login` | `/auth/login` | POST | `routes/auth.ts` |
| `/api/auth/register` | `/auth/register` | POST | `routes/auth.ts` |
| `/api/listings` | `/listings` | GET/POST | `routes/listings.ts` |
| `/api/listings/:id` | `/listings/:id` | GET/PUT/DELETE | `routes/listings.ts` |
| `/api/listings/variants` | `/variants` | GET/POST | `routes/variants.ts` |
| `/api/listings/variants/:id` | `/variants/:id` | GET/PUT/DELETE | `routes/variants.ts` |

## Implementation Plan

### Phase 1: Core Setup (1-2 hours)
1. **Install Fastify dependencies**
   ```bash
   npm install fastify @fastify/cors @fastify/cookie @fastify/jwt @fastify/autoload
   npm uninstall astro @astrojs/node
   ```

2. **Create main server file** (`src/server.ts`)
   - Initialize Fastify instance
   - Register plugins (CORS, JWT, database)
   - Configure auto-loading of routes
   - Set up error handling

3. **Create plugin system**
   - `plugins/cors.ts` - Port existing CORS middleware
   - `plugins/auth.ts` - JWT configuration
   - `plugins/database.ts` - Database connection sharing

### Phase 2: Route Migration (2-3 hours)
1. **Authentication routes** (`routes/auth.ts`)
   - Port login/register endpoints from Astro
   - Implement Fastify request/reply patterns
   - Add JSON schema validation

2. **Listings routes** (`routes/listings.ts`)
   - Port GET/POST/PUT/DELETE endpoints
   - Implement route parameter handling
   - Add authentication hooks

3. **Variants routes** (`routes/variants.ts`)
   - Port variant CRUD operations
   - Maintain transaction support
   - Add proper error handling

### Phase 3: Middleware & Utilities (1 hour)
1. **Authentication middleware** (`middleware/auth.ts`)
   - Port `requireAuth` function to Fastify hook
   - Implement preHandler pattern
   - Maintain JWT token verification

2. **Schema migration** (`schemas/`)
   - Convert Zod schemas to Fastify JSON Schema
   - Add request/response type definitions
   - Implement validation helpers

### Phase 4: Configuration & Testing (1-2 hours)
1. **Update package.json scripts**
   ```json
   {
     "dev": "node --watch src/server.ts",
     "build": "tsc",
     "start": "node dist/server.js"
   }
   ```

2. **Update test script** (`test-api.sh`)
   - Change base URL endpoints (remove `/api` prefix)
   - Update expected response formats
   - Test all CRUD operations

3. **Update deployment config**
   - Modify `fly.toml` for new start command
   - Update `Dockerfile` if needed
   - Test production deployment

### Phase 5: Optimization (30 min)
1. **Performance tuning**
   - Configure Fastify logger
   - Add request/response logging
   - Optimize database connections

2. **Documentation updates**
   - Update README.md
   - Document new API endpoints
   - Add Fastify-specific setup instructions

## Migration Benefits

### Performance Improvements
- **4x faster request handling** (65k vs 15k req/s)
- **Lower memory footprint** (no SSR overhead)
- **Faster startup time** (no Astro build process)

### Developer Experience
- **Industry standard patterns** (Express-like API)
- **Better debugging tools** (Fastify DevTools)
- **Rich plugin ecosystem** (authentication, validation, etc.)
- **Native TypeScript support** (no configuration needed)

### Operational Benefits
- **Smaller bundle size** (remove frontend dependencies)
- **Better monitoring** (structured logging, metrics)
- **Easier deployment** (standard Node.js app)

## Risk Mitigation

### Backward Compatibility
- Maintain existing database schema
- Keep authentication token format
- Preserve API response structures

### Testing Strategy
- Run existing test suite against new endpoints
- Compare response times before/after
- Test authentication flows thoroughly

### Rollback Plan
- Keep current Astro implementation in separate branch
- Gradual migration with feature flags
- Database remains unchanged (easy rollback)

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Core Setup | 1-2 hours | Working Fastify server |
| 2. Route Migration | 2-3 hours | All endpoints functional |
| 3. Middleware/Utils | 1 hour | Authentication working |
| 4. Config/Testing | 1-2 hours | Test suite passing |
| 5. Optimization | 30 min | Performance tuned |
| **Total** | **5.5-8.5 hours** | **Production-ready API** |

## Success Criteria

- [ ] All existing API endpoints functional
- [ ] Test suite passes 100%
- [ ] Authentication flows work unchanged
- [ ] Database operations maintain transactions
- [ ] Performance improves measurably
- [ ] Production deployment successful
- [ ] No breaking changes for frontend clients

## Next Steps

1. Create feature branch: `git checkout -b migrate-to-fastify`
2. Begin Phase 1 implementation
3. Continuous testing throughout migration
4. Performance benchmarking before/after
5. Documentation updates
6. Production deployment planning