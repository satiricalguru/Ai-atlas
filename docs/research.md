# Product research · 30 October 2026

Repository reconnaissance: the workspace was empty, with no Git repository, existing dependencies or uncommitted work. A fresh application was created in `ai-atlas/`.

## Comparables
- [RescueTime](https://www.rescuetime.com/) and its [tracking explanation](https://help.rescuetime.com/article/245-how-rescuetime-works): desktop/site time and categories. Time on a website is not an interaction count; Atlas should not equate them.
- [DX AI cost management](https://getdx.com/blog/meet-the-new-ai-cost-management-report/): organization reporting across tools and custom cost ingestion. Atlas focuses on an individual, with transparent provenance rather than employee performance scoring.
- [Langfuse cost and token tracking](https://langfuse.com/docs/observability/features/token-and-cost-tracking): instrumented application observability, model-based inferred pricing and ingested costs. Consumer chat activity is a different dataset.
- Provider-native dashboards cover their own API organizations, rather than a complete personal AI footprint.

## Opportunity and MVP
A personal, privacy-first activity ledger with imports, honest missing data, corrections, provider/category comparisons and a shareable aggregate fingerprint. Distinguish consumer products from API providers and observations from estimates. No productivity-savings claims. Demo exploration must require no account, keep its own fixture, and never fill empty real accounts with sample data.

MVP: cinematic public introduction; explorable demo; Supabase authentication; onboarding; validated CSV/JSON and selected export import; activity filters, classification corrections, computed insights and fingerprint; settings, export/deletion; eligible organization API connectors. External credentials are deployment configuration, not invented in source.

## Roadmap
See roadmap.md. Import-first is an engineering decision based on the integration matrix, not a claim that no provider offers an API.
