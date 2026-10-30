# AI Atlas

**Your entire AI universe. One place.**

A working, extensible AI activity intelligence application: procedural WebGL landing experience, explorable analytics, privacy-preserving imports, and an authenticated Supabase backend. All sample information is explicitly labelled. External services are optional for the demo and local workspace; live account functionality requires configuration.

## Run locally

```bash
cd "/Users/jatin/Projects/AI Atlas/ai-atlas"
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Use `/dashboard?mode=demo` for a complete sample workspace or `/dashboard?mode=local` for your own browser-local imports. No account or API key is needed for either. The local workspace persists in this browser profile, not in a server database.

For the standard Next.js runtime:

```bash
npm run dev:next
npm run build:next
npx next start
```

`npm run dev` / `npm run build` use the supplied Sites-compatible Vinext runtime and produce a Cloudflare Worker. `npm run start` previews that built Worker locally. Vinext is a beta compatibility layer; both its production build and stock Next.js 16 production build have been verified. The standard Next runtime does not depend on the Sites private access gate.

## What is built

- Original atlas/orbit logo, wordmark, favicon, self-hosted licensed DM Sans / DM Mono, coherent dark/lime design system.
- Procedural Three.js/R3F/drei point sphere, wire geometry and orbital lines; GLSL point material; provider interactions; dynamic scene loading; mobile DPR/particle reductions; visibility pause; reduced-motion and SVG fallback.
- Full landing narrative, interactive dashboard preview, ecosystem, onboarding explanation, fingerprint, privacy, FAQ and final CTA.
- Email sign-up/sign-in, GitHub OAuth, PKCE callback, email recovery, password reset, server-protected account pages, session refresh proxy and local/global sign-out using Supabase Auth. These are real implementations, not simulated logins. Without service configuration, the UI states that accounts are unavailable.
- Four-step onboarding with provider choices, explicit connection/import methods and local classification consent.
- Overview with period/custom-range filtering, previous-period comparison, provider ranking, category distribution, trends, recent activity and separately labelled API snapshots.
- Applications with actual status, import methods, verified OpenAI/Anthropic organization API credential workflows, encrypted credential storage, queue/retry and disconnect.
- Activity explorer with search, date/provider/model/category filters, sorting, pagination, metadata details and correction history.
- Derived insights, AI Fingerprint and aggregate JSON export, interactive provider/category network, cost coverage and spending views.
- Profile, metadata classification preference, data export, activity/connection purge, session controls and account deletion.
- Bounded, schema-validated CSV/JSON imports; ChatGPT and Claude conversation-export metadata adapters; stable IDs and deduplication. Prompts and conversation bodies are not stored.
- Supabase PostgreSQL migration with tenant RLS, ownership constraints, atomic rate limits and inaccessible integration secrets. Inngest durable sync plus a daily 03:00 UTC sweep.

## Technology

Next.js App Router conventions, React 19, strict TypeScript, Tailwind CSS 4, customized UI components and native accessible dialogs; Lucide; Three.js, React Three Fiber 9 and drei 10; Motion; modular ECharts; TanStack Table; React Hook Form and Zod; Supabase Auth/PostgreSQL; WebCrypto AES-GCM; Inngest 4; Vitest/PGlite and Playwright. The starter retains shadcn primitives for future extension. GSAP was deliberately unnecessary for the implemented motion. WebGL 2 is the baseline; WebGPU is not required.

Use package-lock.json for the exact, tested versions. Library compatibility was checked against official documentation and npm peer dependency metadata. The inherited Inngest/OpenTelemetry dependency tree emits peer warnings around OpenTelemetry API versions. Security updates pin Next.js 16.4.3, Zod 4.6.7, Sharp 0.35.5 and patched transitive parsers; Zod’s v3 compatibility export keeps Inngest compatible. Re-run dependency auditing before each production release.

## Configure authentication and durable storage

1. Create a Supabase project. Run `supabase/migrations/202610300001_atlas.sql` once in the SQL editor or through your Supabase migration pipeline. It creates no demo records.
2. Copy `.env.example` to `.env.local` for local development. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Both are intended for the browser; neither is a privileged key.
3. In Supabase Auth, enable email/password. Configure your Site URL and allow exact application callback URLs, including `http://127.0.0.1:5173/auth/callback` and your deployed origin. Password recovery uses `/auth/callback?type=recovery` and then `/reset-password`. Keep email confirmation enabled and configure production SMTP.
4. Optionally configure GitHub OAuth in Supabase. The GitHub OAuth app callback points to Supabase’s provided auth callback URL; Supabase redirects back to the application. This grants sign-in to Atlas, not Copilot analytics permissions.
5. Generate fresh database types from **your deployed project** using Supabase CLI before expanding backend queries. Live-generated types are not included because no Supabase project was supplied. The import and provider boundaries already use runtime schemas.
6. For key storage, sync and account deletion, set server-only `SUPABASE_SERVICE_ROLE_KEY`. Generate `INTEGRATION_ENCRYPTION_KEY` as 32 random bytes encoded in 64 hexadecimal characters. Keep the encryption key stable while encrypted credentials exist; rotation needs a migration/re-encryption plan.
7. Configure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`, then register `/api/inngest` with Inngest. Production handlers fail closed without a signing key. The API endpoint must be reachable by Inngest: a Sites owner-private access gate can block external callbacks. For a live sync deployment, use a properly reachable, signature-verified endpoint (for example stock Next.js on Vercel), or explicitly configure a supported hosting access solution. No bypass token is created by this project.
8. On hosted Sites, set runtime secrets through Sites environment-variable controls; local `.env.local` is not uploaded. Public `NEXT_PUBLIC_*` values are inlined at build time: build with the same public configuration used by the hosted runtime. Never prefix a secret with `NEXT_PUBLIC_`.

| Variable | Exposure | Required for |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Public | Account auth and database |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public | Account auth and database |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Encrypted keys, sync, account deletion |
| INTEGRATION_ENCRYPTION_KEY | Server only | Encrypt/decrypt provider credentials |
| INNGEST_EVENT_KEY | Server only | Queue and schedule sync |
| INNGEST_SIGNING_KEY | Server only | Verify durable workflow requests |
| NEXT_PUBLIC_APP_URL | Public, optional | Deployment tooling/documentation origin |

## Integrations and honest limits

**Implemented import adapters:** normalized CSV/JSON, selected ChatGPT conversations.json and Claude conversation JSON formats. ZIP archives and arbitrary provider report shapes are rejected; extract the supported JSON yourself or transform a report to the normalized schema. A conversation export contributes one record per conversation, not a fabricated count of every message.

**Implemented official API adapter code:** OpenAI organization completion usage and Anthropic’s documented legacy organization messages usage report. The connection check requires genuine eligible admin access. API snapshots record bucketed token/request metadata separately from the event ledger. Anthropic input tokens in this version are **uncached** input tokens; cache reads/writes are not included. Provider cost APIs and subscription billing are not implemented. Cost fields remain null unless explicitly imported. No live provider account was available to verify these adapters end to end.

**Unavailable live adapters:** consumer chat-history OAuth, Gemini project/IAM reporting, Cursor Enterprise analytics, Copilot enterprise reports and Perplexity Analytics. Those require additional permissions, verified response fixtures or provider-specific implementation. See [integration matrix](docs/integration-matrix.md).

Signed-in imports are saved server-side with repeated validation and per-user authorization. Anonymous imports stay separate from demo data. Same-provider/source IDs deduplicate; cross-source reconciliation is not implemented, so importing the same underlying activity from different formats can double-count it. Source labels remain visible.

Imports are limited to 5 MB and 2,000 rows per operation. Account overview loads at most 20,000 recent events and 2,000 snapshots, with a visible truncation warning; explorer search/pagination currently operates on that bounded loaded set. Before large-scale deployment, move period aggregation and search/pagination fully into SQL, and add a durable large-file ingestion path. Existing timestamp/provider/category indexes support that extension. Model versions in demo fixtures are illustrative examples, not claims about the latest provider offerings.

## Validation

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run build:next
```

Verified on 30 October 2026:

- **37 unit/integration/security tests passed.** Includes parsing and format errors, missing/zero data, local classification, metadata minimization, stable deduplication, formula-safe CSV, analytics, mocked official adapter requests and 429 handling, encryption/tampering, same-origin checks and streamed body bounds.
- **Executable PostgreSQL migration and two-tenant tests passed** using PGlite: RLS read isolation, forged owner rejection, update/delete exclusion, composite foreign keys, secret/RPC permission denial, correction history, atomic rate limits and tenant-limited purge.
- **18 Playwright checks passed** across desktop Chromium and mobile Chromium emulation: navigation, all app screens, provider scopes, filters, pagination, corrections, validation, demo/local separation, persistent imports, exports, deletion, onboarding, route protection, responsive overflow checks and reduced motion. Tests wait for network readiness to avoid interacting with pre-hydration server markup. Standard document links avoid a production-only client prefetch defect in the Sites compatibility runtime and re-evaluate account/mode boundaries on each page.
- Production dependency audit (`npm audit --omit=dev`): **0 known advisories** after patching the inherited dependency pins.
- TypeScript strict check passed. Both Sites/Vinext and stock Next.js production builds passed.
- Desktop/mobile screenshots inspected; no browser page errors in screenshot runs. Artifacts are generated locally under ignored `outputs/`.

Not yet verified: live Supabase email delivery/OAuth/recovery, hosted two-account sessions, actual provider credential permissions, signed Inngest delivery, real mobile GPU performance, Safari/Firefox behavior, Core Web Vitals on a real deployment, backup/restore and a production security audit. No compliance certification or guaranteed performance score is claimed.

## Research and architecture

The required references were accessed: [Refero Styles](https://styles.refero.design/), its DESIGN.md examples, [Godly](https://godly.design/) and its Agentwork case page, and [MotionSites](https://motionsites.ai/) plus its 3D gallery. Research access was text/link-based; inaccessible or sparse materials are explicitly documented. Competitor research covered RescueTime, DX, Langfuse and official provider dashboards.

- [Product research](docs/research.md)
- [Integration matrix](docs/integration-matrix.md)
- [Design references and decisions](docs/design-research.md)
- [Architecture](docs/architecture.md)
- [Threat model and security](docs/security.md)
- [Roadmap and deployment-dependent work](docs/roadmap.md)

This is a tested product foundation with a functional demo/local experience and deployable service implementation. It should not be represented as a fully audited, credential-configured production SaaS until the deployment-dependent acceptance work above has been completed.
