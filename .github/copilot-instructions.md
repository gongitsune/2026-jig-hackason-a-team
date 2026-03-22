# Copilot Instructions - ichibun-grand-prix

This is a hackathon party game app where players receive random words and compete to write the funniest/most fitting sentence based on a topic. Built with Cloudflare Workers + Durable Objects backend and vanilla HTML/JS frontend.

## Project Overview

**Game Flow**: Players join a room → 3 rounds of (word input → sentence creation → voting) → results shown on start screen

**Tech Stack**:
- **Backend**: Cloudflare Workers (Hono), Durable Objects with SQLite, Drizzle ORM
- **Frontend**: Vanilla HTML/JS/CSS served from `apps/backend/public/`
- **Monorepo**: pnpm workspace with Turbo

## Build, Test, and Lint Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode with Turbo TUI
pnpm backend dev            # Start backend only (wrangler dev)

# Backend-specific (in apps/backend/)
pnpm dev                    # Start Cloudflare Workers dev server
pnpm deploy                 # Deploy to Cloudflare
pnpm drizzle-gen            # Generate DB migrations from schema
pnpm cf-typegen             # Generate TypeScript types for Worker bindings

# Testing
pnpm test                   # Run all tests across workspace
pnpm coverage               # Run tests with coverage
vitest src/path/to/file.spec.ts  # Run single test file

# Linting & Formatting
pnpm lint                   # Lint with oxlint (type-aware)
pnpm format                 # Format with oxfmt
pnpm check-types            # Type check + format check

# Build
pnpm build                  # Build all apps
```

## Architecture

### State Management Pattern

The backend uses **Event Sourcing-lite** with command/event pattern:

1. **Commands** (`domain/room/commands.ts`): Validate business rules, return events or errors
2. **Events**: Immutable facts about what happened (`UserJoined`, `WordSubmitted`, etc.)
3. **Decide** (`decide.ts`): Pure functions that validate commands and produce events
4. **Evolve** (`evolve.ts`): Pure functions that apply events to update room state

```typescript
// Pattern:
Room + Command → decide() → Events
Room + Events → evolve() → New Room State
```

This keeps business logic testable and state transitions explicit.

### Domain Model

- **Room**: Contains users, game phase, and round history
- **GamePhase**: Tagged union of `Waiting | WordInputting | SentenceInputting | Voting | Result`
- **Value Objects**: Immutable types for Topic, Word, Sentence, Vote, Round, etc.

All domain logic is in `apps/backend/src/domain/`, independent of infrastructure.

### Database (Durable Objects SQLite)

Schema is in `src/db/schema.ts`. Migration files auto-generated in `drizzle/` directory.

Tables: `users`, `words`, `sentences`, `votes`, `rounds`

**Important**: Drizzle kit generates migrations from schema. Don't edit migration files manually.

### State Synchronization

**No WebSockets** - uses REST polling:
- Frontend polls `GET /rooms/{passphrase}` every 2 seconds
- Backend auto-transitions phases when all players submit (e.g., WORD_INPUT → SENTENCE_INPUT when all words received)
- See `docs/状態遷移・同期 実装ガイド.md` for detailed state machine

### Frontend Structure

Lives in `apps/backend/public/`:
- Each game phase has its own HTML file (index.html, start.html, word.html, sentence.html, vote.html)
- Uses ES modules for JS
- Deployed together with backend (Cloudflare Workers Assets)

## Key Conventions

### Code Style

- **Tabs, not spaces** (configured in `.oxfmtrc.json`)
- **Semicolons required**
- **Import ordering**: builtin → external → internal/subpath → parent/sibling/index → style → unknown
- TypeScript: strict mode enabled

### Testing

- Test files use `.spec.ts` suffix (e.g., `decide.spec.ts`)
- Using Vitest as test runner
- Run tests before pushing: `pnpm test`

### Domain Design

- **Prefer immutable updates**: Use functions like `addUserToRoom()` that return new objects rather than mutating
- **Tagged unions for phases**: Use `{ tag: "WordInputting", ... }` pattern for type-safe phase handling
- **Value objects over primitives**: Wrap strings/numbers in types (`Topic`, `RoundId`, etc.) for type safety

### Drizzle ORM

- Schema changes: Edit `src/db/schema.ts` → run `pnpm drizzle-gen`
- Never edit generated migrations manually
- Use `text({ enum: [...] })` for enum columns
- Cascade deletes configured at schema level with `onDelete: "cascade"`

### Cloudflare Workers Specifics

- Entry point: `src/index.ts` exports Hono app and GameDO class
- Durable Object: `src/gameDO.ts` (GameDO class)
- Bindings typed in `types/worker-configuration.d.ts` (auto-generated)
- Hono app uses `Hono<{ Bindings: CloudflareBindings }>` typing

### Error Handling Pattern

Commands return `DecideResult` which is either:
- `success([...events])` - validation passed
- `failure(errorMessage)` - validation failed

This makes error handling explicit and testable.

## Project Context

This is a hackathon project (7-hour time limit) focused on speed over perfection. The spec (`docs/仕様.md`) is in Japanese and contains full game rules, API design, and DB schema.

Team roles:
- Frontend: keigo (C++ experience), shige (React experience)
- Backend: hata (Next.js → Java), jintan (repo manager)
