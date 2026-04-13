# justfile — project commands
# Run with: just <command>

# ── Dev ──────────────────────────────────────────────────────
# Start both frontend and backend dev servers
dev:
    npx concurrently "just dev-client" "just dev-server"

dev-client:
    cd client && npm run dev

dev-server:
    cd server && npm run dev

# ── Install ───────────────────────────────────────────────────
install:
    cd client && npm install
    cd server && npm install

# ── Build ─────────────────────────────────────────────────────
build:
    cd client && npm run build
    cd server && npm run build

# ── Quality ───────────────────────────────────────────────────
lint:
    cd client && npm run lint
    cd server && npm run lint

typecheck:
    cd client && npm run typecheck
    cd server && npm run typecheck

# Run lint + typecheck (run after every set of changes)
check: lint typecheck

# ── Tests ─────────────────────────────────────────────────────
test:
    cd server && npm run test

test-client:
    cd client && npm run test

# Run a single test file: just test-file server/services/ai.test.ts
test-file file:
    cd server && npx vitest run {{file}}

# ── Security ──────────────────────────────────────────────────
audit:
    cd client && npm audit
    cd server && npm audit

# ── Quality (managed by nexus) ───────────────────────────────
doctor:
    nexus doctor

doctor-fix:
    nexus doctor --fix
