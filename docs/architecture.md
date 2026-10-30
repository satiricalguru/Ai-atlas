# Architecture

## Decisions before implementation
Next.js App Router conventions, React 19, strict TypeScript, Tailwind 4 and customized shadcn/Radix primitives. The supplied Sites Vinext runtime compiles those conventions to Cloudflare Workers for private publication. This is an explicit deployment accommodation: it is a beta compatibility layer, not stock Next.js hosting. `dev:next`/`build:next` remain available for a conventional Next/Vercel deployment after excluding Sites-only worker files from deployment. Use the provided lockfile as the reproducible dependency contract.

R3F/drei/Three scene is an isolated dynamic client chunk. Motion controls nonessential reveal. ECharts is dynamically loaded and disposed. Activity explorer uses TanStack Table. React Hook Form + Zod validate auth/import data. Navigation uses standard document links to avoid a verified production-only Vinext client-prefetch defect and revalidate server auth/mode boundaries per navigation. No unnecessary global state library: a scoped React context separates demo, browser-local import sandbox, and authenticated account data.

## Data flow
Supabase Auth establishes secure sessions with @supabase/ssr. Every account API creates a request-scoped server client and calls getUser; no supplied user_id is trusted. PostgreSQL RLS restricts each user-owned table. Anonymous demo uses deterministic fixtures in memory. Anonymous imports are explicitly device-local and persisted separately, with preview, validation, size/row limits and deduplication. Signed-in imports are validated again server-side and inserted as bounded atomic batches.

Tables: profiles, integrations, provider_accounts, activity_events, usage_snapshots, work_categories, classifications, insights, sync_jobs, user_preferences; auth.users owns identity. Provider registry lives in code; nullable fields preserve unavailable model/token/cost metadata. Composite relationships bind user ownership; integration secrets are separate with no user SELECT policy. All aggregate snapshots carry source and measurement semantics.

## Server boundaries
/api/account: data, profile/preferences, export, delete data/account, sign out sessions.
/api/import: authenticated bounded normalized import, idempotent source IDs.
/api/activity/[id]: owned classification correction.
/api/integrations: list, verify/connect, disconnect, queue sync.
/api/inngest: durable provider sync with retries and per-integration concurrency. Requires configured event/signing keys; no long provider sync in user HTTP requests. Provider calls are limited and paginated with cursors.
/auth/callback: PKCE exchange and safe fixed redirect. Browser provider keys never enter localStorage or logs. Encrypted AES-GCM secrets require server-only INTEGRATION_ENCRYPTION_KEY and Supabase service role to access. OpenAI/Anthropic adapters return aggregates, not invented event-level conversations.

## Analytics
Pure functions derive period-filtered rankings, daily series, measured cost totals, categories and fingerprint from events. Unknown cost stays unavailable. Previous period comparison is shown only with a baseline. Category inference operates on explicitly imported title metadata in process and discards the title. No external classification API. User corrections carry confidence 1, source=user and timestamp.

## Deployment
Supabase migrations must be applied to a real project; local files cannot provision the user's account. Site runs in a fully usable demo/sandbox without credentials. Auth and durable data remain visibly unconfigured until environment variables are supplied. Inngest requires a registered endpoint and secrets. README records setup and validation outcomes.
