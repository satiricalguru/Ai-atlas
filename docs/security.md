# Threat model and controls

Prepared before feature implementation. Assets: user activity metadata, identity sessions, provider organization keys, imports/exports. Boundaries: untrusted browser -> authenticated server -> tenant-isolated Supabase; server -> fixed official provider origins; signed Inngest -> privileged sync worker.

| Threat | Control |
|---|---|
| IDOR / cross-tenant access | getUser on every account handler, auth.uid RLS, server-selected owner, composite ownership constraints, owned update/delete queries |
| Credential disclosure | server-only AES-GCM key encryption with random nonce, separate inaccessible secret table, service role only on server, never echo/log keys |
| Forged mutation / CSRF | same-origin Origin validation on mutations, secure SameSite cookies from Supabase SSR; no credential from body used as identity |
| Malicious upload / memory abuse | JSON/CSV only, no ZIP/XML/archive execution, 5 MB byte limit, 2,000 rows, strict normalized schema, finite nonnegative numeric values, explicit timestamps, prevalidation before writes |
| XSS / spreadsheet formula injection | React escaping; no raw HTML rendering; CSV export formula prefixes neutralized; original prompts not stored |
| OAuth redirect theft | Supabase PKCE callback with fixed internal redirect; OAuth provider configured in Supabase |
| Replay / duplicate imports | owner + source + stable external_id unique, canonical SHA-256 for missing IDs; transactional upsert |
| Remote service abuse / SSRF | provider URLs fixed in adapters, no user-supplied endpoint, timeout, rate/cursor bounds |
| Queue spoofing | Inngest signature verification in production, per-integration concurrency, privileged sync only from signed events |
| Cost misrepresentation | nullable cost/tokens, sources and aggregate measures explicit; no inferred subscriptions or saved time |
| Accidental deletion | confirmation dialog and server authorization; activity data purge separate from account deletion |

Rate limit: database-backed atomic request counters keyed by authenticated user and operation. Production requires migration and rejects unavailable limits rather than claiming in-memory protection across isolates. Auth endpoints additionally depend on Supabase built-in limits. Secrets must be configured before real connections. All account responses use no-store. RLS tests and mock-provider tests are included; a live two-tenant audit still requires configured Supabase.

No certification/compliance claim. No conversation content sent to an external classifier. Imports intentionally retain minimal metadata; local sandbox is not encrypted at rest and is labelled device-local. Clear it in Settings on shared devices. Server logs must not include request bodies, credentials or prompts.
