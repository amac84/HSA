# End in Mind HSA Portal (MVP)

Internal web portal for End in Mind Inc. to manage HSA claims with secure Clerk authentication, role-based access control, claim submission/review workflows, annual balance tracking, and audit logging.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Clerk authentication (Microsoft login configured in Clerk dashboard)
- Prisma + PostgreSQL
- Server-side authorization checks for all sensitive operations

## Core capabilities implemented

- Microsoft-based sign-in via Clerk
- Strict approved-user allowlist gate
- Bootstrap admin via environment variable (`BOOTSTRAP_ADMIN_EMAILS`)
- Employee/executive dashboard with allocation, approved total, and remaining balance
- Claim submission with multi-document upload (pluggable local or S3-compatible storage)
- Claim history and claim detail with denial reason visibility
- Employee-accessible in-app HSA policy page with process and claim template
- Admin claims queue with filters and sorting
- Admin claim review (approve/deny + denial reason + internal notes)
- Admin user management:
  - manage approved-user allowlist
  - role/class/allocation updates
  - activate/deactivate users
- CSV export endpoint for claim records
- Audit logs for key actions
- Pluggable document storage (local disk or S3-compatible object storage)
- API rate limiting on claim submission, admin mutations, and CSV export

## Environment variables

Copy `.env.example` to `.env.local` and populate:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hsa_portal"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
BOOTSTRAP_ADMIN_EMAILS="admin@your-company.com"
PLAN_YEAR="2026"

# File storage (defaults to local disk)
STORAGE_PROVIDER="local"

# API rate limiting (enabled by default; in-memory unless Redis configured)
RATE_LIMIT_ENABLED="true"
```

See `.env.example` for the full set of storage and rate-limit variables.

## File storage configuration

Claim documents are handled through a pluggable storage layer selected by `STORAGE_PROVIDER`:

- `local` (default): files are written under `storage/claim-documents` and streamed
  back through an authorized API route.
- `s3`: files are written to an S3-compatible bucket and served via short-lived
  signed download URLs after authorization checks.

To use S3-compatible storage, set `STORAGE_PROVIDER="s3"` and provide:

```bash
S3_BUCKET="your-bucket"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
# Optional: for MinIO / Cloudflare R2 / other S3-compatible endpoints
S3_ENDPOINT="https://..."
S3_SIGNED_URL_TTL_SECONDS="300"
```

Existing legacy documents that were stored with only a local file path remain
downloadable regardless of the active provider.

## Rate limiting

Rate limiting protects sensitive endpoints and is enabled by default:

- Claim submission (`POST /api/claims`)
- Admin mutations (claim decisions, approved-user create/revoke, user updates)
- CSV export

By default an in-memory limiter is used, which is suitable for a single instance
or local development. For multi-instance production deployments, configure an
Upstash Redis backend:

```bash
RATE_LIMIT_REDIS_URL="https://..."
RATE_LIMIT_REDIS_TOKEN="..."
```

Limits are configurable via env (see `.env.example`). Set
`RATE_LIMIT_ENABLED="false"` to disable limiting entirely. Exceeding a limit
returns `429 Too Many Requests` with a `Retry-After` header.

## Clerk configuration notes

1. In Clerk dashboard, enable **Microsoft** as the sign-in provider.
2. Disable other sign-in providers for production.
3. Configure redirect URLs to include:
   - `http://localhost:3000/sign-in`
   - your production domain equivalent.

## Local setup

```bash
npm install
cp .env.example .env.local
```

### Database setup

```bash
# generate Prisma client
npm run prisma:generate

# create and apply migrations (requires PostgreSQL running)
npm run db:migrate

# seed sample data
npm run db:seed
```

### Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run lint` – ESLint
- `npm run typecheck` – TypeScript type-check
- `npm run test` – Vitest tests
- `npm run prisma:generate` – generate Prisma client
- `npm run db:migrate` – apply migrations
- `npm run db:seed` – seed development data

## Security & privacy notes

- Application routes are auth-protected.
- Role and data access checks are enforced server-side.
- Claim documents are stored outside public assets and fetched through authorized API route checks.
- With S3 storage, downloads use short-lived signed URLs issued only after authorization checks.
- Upload validation enforces allowed document types and max 10MB per file.
- Sensitive endpoints are rate-limited to mitigate abuse.
- CSV export intentionally excludes sensitive free-text medical/internal notes by default.

## Data model highlights

- `User`: role, benefit class, annual allocation, active flag
- `ApprovedUser`: strict allowlist for access provisioning
- `Claim`: status lifecycle and decision metadata
- `ClaimDocument`: uploaded file metadata + storage provider/key (with legacy path support)
- `AuditLog`: key mutation events for governance/audit trail
