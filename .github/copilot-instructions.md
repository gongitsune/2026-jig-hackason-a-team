# Copilot Instructions for Ichibun

## Project Overview

**Ichibun** is a 2026 JigjP Spring Hackathon project - a real-time multiplayer word game built with Cloudflare Workers infrastructure.

- **Package Manager:** pnpm (v10.31.0)
- **Node.js:** >=25.8.0
- **Workspace:** Monorepo with packages: `backend`, `shared`

## Architecture

### Core Structure
- **Backend** (`packages/backend`): Cloudflare Workers application using Durable Objects for real-time game state
- **Shared** (`packages/shared`): Type definitions, API interfaces, and validation schemas exported for use across packages

### Key Technology Stack
- **Cloudflare Workers**: Serverless compute using Durable Objects for persistent game room state
- **Web Framework**: Hono (lightweight web framework for REST API endpoints)
- **Database**: Drizzle ORM with SQLite (via Durable Object storage)
- **Communication**: 
  - REST API for game operations (all state mutations)
  - WebSocket for real-time updates (user join/leave, status changes)
- **Validation**: Valibot for schema validation
- **Testing**: Vitest with Cloudflare's vitest-pool-workers

### Game Flow Architecture
The game operates through a state machine with these phases:
1. **Waiting**: Players join the room; initial state
2. **WordInputing**: Each player submits one word
3. **SentenceInputing**: Each player writes a sentence using words from other players
4. **Voting**: Players vote on which sentence was best
5. Back to Waiting with results

Each game round is managed by a single Durable Object instance (GameDO) identified by a room passphrase.

### Data Layer Pattern
- **Domain models** (`src/domain/`): Business logic classes (Room, Round, User, Word, etc.)
- **Database schema** (`src/db/schema.ts`, `src/db/relations.ts`): Drizzle ORM table definitions
- **Repositories** (`src/repository/`): Data access layer with methods like `getWordsByRoundId()`, `insertVote()`, etc.
- **HTTP Routes** (`src/routes/`): Hono route handlers implementing REST API and error handling

### Shared Package Pattern
The `@ichibun/shared` package exports:
- **schemas**: Valibot validation schemas (`PassphraseSchema`, `UserNameSchema`, etc.)
- **api**: TypeScript interfaces and type definitions (RoomStatus enum, GameResult, etc.)
- **error**: Custom error types for the API

Imports from shared use path exports: `@ichibun/shared/schemas/*`, `@ichibun/shared/api`, `@ichibun/shared/error`

## Build & Development Commands

### Root Level (Workspace)
```bash
pnpm install              # Install all dependencies
pnpm backend <cmd>        # Run command in backend package
pnpm frontend <cmd>       # Run command in frontend package (if exists)
pnpm shared <cmd>         # Run command in shared package
```

### Backend Package
```bash
# Development
pnpm dev                  # Start local Wrangler development server
pnpm start                # Alias for 'pnpm dev'

# Deployment
pnpm deploy               # Deploy to Cloudflare Workers

# Code Quality
pnpm format               # Format code with oxfmt
pnpm lint                 # Lint and fix issues with oxlint
pnpm check                # TypeScript type check only (no emit)

# Database
pnpm drizzle:gen          # Generate Drizzle migrations (run after schema changes)
pnpm cf-typegen           # Generate Cloudflare Worker types (run after wrangler.jsonc changes)

# Testing
pnpm test                 # Run all unit tests with Vitest
pnpm test [file-pattern]  # Run specific test (e.g., pnpm test health)
pnpm test --ui            # Run tests with UI (requires extra setup)
```

### Shared Package
Currently has no scripts; it's a type/schema library consumed by backend.

## REST API Routes

All routes are prefixed with `/room/:passphrase/`. Error responses return JSON with an `error` field.

### User Management
- **POST** `/join` - Join a room
  - Body: `{ userId: string, userName: string }`
  - Response: `{ userId: string, userName: string }`
  - Status: 200 (success), 409 (user duplicate)

### Game Status
- **GET** `/status` - Get current round status
  - Response: `{ status: RoomStatus }`
  - Status: 200

- **GET** `/topic` - Get current round topic
  - Response: `{ topic: string }`
  - Status: 200

- **GET** `/users` - Get users in room (Waiting state only)
  - Response: `{ userId: string, name: string, point: number }[]`
  - Status: 200, 400 (wrong state)

### Game Actions
- **POST** `/game/start` - Start a new game round
  - Status: 200, 400 (wrong state)

- **POST** `/word` - Submit a word (WordInputing state)
  - Body: `{ userId: string, word: string }`
  - Status: 200, 400 (wrong state), 409 (already submitted)

- **POST** `/sentence` - Submit a sentence (SentenceInputing state)
  - Body: `{ userId: string, sentence: string }`
  - Status: 200, 400 (wrong state), 409 (already submitted)

- **POST** `/vote` - Submit a vote (Voting state)
  - Body: `{ userId: string, sentenceUserId: string }`
  - Status: 200, 400 (wrong state), 409 (already voted)

### Data Retrieval
- **GET** `/words` - Get distributed words (SentenceInputing/Voting state)
  - Response: `string[]`
  - Status: 200, 400 (wrong state)

- **GET** `/sentences-to-vote` - Get sentences to vote on (Voting state only)
  - Response: `{ userName: string, sentence: string }[]`
  - Status: 200, 400 (wrong state)

- **GET** `/result` - Get last game result (Waiting state only)
  - Response: `{ topic: string, results: { userName: string, sentence: string, voteCount: number }[] } | null`
  - Status: 200, 400 (wrong state)

## Key Conventions

### Error Handling
- Custom error types in `src/errors.ts` (backend) and `@ichibun/shared/error`
- Error mapping to HTTP status codes in `src/routes/room.ts`
- 409 Conflict: UserDuplicate, WordDuplicate, already submitted operations
- 400 Bad Request: Invalid state, format, or operation
- 500 Internal Server Error: Database/system errors

### Database Migrations
- Drizzle ORM manages schema via `drizzle/` directory
- Always run `pnpm drizzle:gen` after modifying `src/db/schema.ts`
- Migrations are applied automatically on GameDO initialization via `migrate(this.db, migrations)`

### REST API Pattern
- Routes use Hono framework
- All endpoints return JSON responses
- Status codes indicate operation result
- Domain errors are caught and converted to HTTP responses

### Validation
- Use Valibot schemas from `@ichibun/shared/schemas/` for input validation
- Example: `v.assert(PassphraseSchema, passphrase)` in domain constructors
- Schemas define constraints like string length, format, etc.

### Type Safety
- TypeScript strict mode enabled
- All files are ES modules (ESM)
- Path alias: `@backend/*` maps to `packages/backend/src/*`

### Testing
- Vitest with Cloudflare's vitest-pool-workers plugin
- Global setup: `test/global-setup.ts` builds the worker before tests
- Tests can access Durable Objects via miniflare service bindings
- Test files follow pattern: `*.unit.ts` or `*.test.ts`

### Code Formatting & Linting
- **oxfmt**: Rust-based formatter (faster than prettier)
- **oxlint**: Rust-based linter (faster than ESLint)
- Both configured in `.oxlintrc.json` and root `package.json`
- Max 1 class per file disabled (see rules)

### Domain-Driven Design Pattern
Business logic is split between:
- **Domain models**: Stateful objects representing game entities
- **Repositories**: Query/persist domain objects
- **Route handlers**: Orchestrate domain logic for API endpoints (replacing old class-based API implementations)

## Migration Notes (Capnweb → Hono)

This codebase was recently migrated from **capnweb** (Cap'n Proto RPC) to **Hono** (REST API). Key changes:

- ✅ **Public REST API**: All game operations now use standard HTTP methods
- ✅ **Vitest Integration**: REST endpoints are now easily testable with Vitest
- ⏳ **WebSocket Layer**: Real-time updates (user join/leave, status changes) planned for Phase 3
- ❌ **Capnweb**: No longer used; removed from dependencies

## Important Notes

### Cloudflare Workers Specifics
- See `packages/backend/AGENTS.md` for Cloudflare Worker APIs and limits
- Always check `/workers/platform/limits/` docs for quotas before optimizing
- Durable Objects provide durable storage and WebSocket support

### Wrangler Configuration
Located in `packages/backend/wrangler.jsonc`:
- GameDO is the only Durable Object defined
- Uses SQLite via Durable Object storage
- Compatibility date: 2026-03-10
- Node.js compatibility enabled
- One migration: GameDO sqlite class registration

### Schema Exports
The shared package uses `typesVersions` and `exports` for clean imports:
- TypeScript will resolve `@ichibun/shared/schemas/room` to `packages/shared/src/schemas/room.ts`
- Update both `typesVersions` and `exports` fields when adding new exports

