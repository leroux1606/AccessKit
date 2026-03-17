# AccessKit — Build Status

## What's done

### Phase 1: Foundation ✅ (commit `67e4ed1`)
- Next.js 15 + TypeScript strict + Tailwind + shadcn/ui base components
- Full Prisma schema (all 13 entities from the plan)
- NextAuth.js v5: Google OAuth, GitHub OAuth, Resend magic link (JWT sessions)
- Auto-creates org + OWNER membership on first sign-up, 14-day trial
- Dashboard layout: sidebar, org switcher, user menu
- Auth middleware protecting all dashboard routes
- Seed file with demo data (3 websites, 3 violations, 1 completed scan)

### Phase 2: Website Management ✅ (commit `c3c59f0`)
- Add website form (Server Action, URL validation, plan limit check)
- Website list page with score cards
- Website detail page: score/issues/scan stats, top issues preview, sub-nav tabs
- Ownership verification: 3-method panel (meta tag / DNS TXT / file), live API check
- Website settings: name, scan frequency (plan-gated), standards selection
- Delete website with typed-name confirmation, cascade deletes all data
- Website issues page: filterable by severity and status
- Scan history page: full table with all past scans

---

## What still needs to be built

### Phase 3: Scanning Engine 🔴 (most critical)
**Start here.** This is the core product value.

Files to create under `src/scanner/`:
- `crawler.ts` — sitemap.xml parser + link crawler, respects robots.txt
- `axe-scanner.ts` — Playwright + axe-core integration
- `pa11y-scanner.ts` — pa11y secondary engine
- `deduplicator.ts` — fingerprint = hash(ruleId + cssSelector + websiteUrl)
- `scorer.ts` — weighted formula: critical×10, serious×5, moderate×2, minor×1
- `screenshot.ts` — element-level screenshots → Cloudflare R2
- `fix-generator.ts` — template fixes for 50+ common rules + Claude API for AI fixes
- `standards-mapper.ts` — map axe/pa11y rules → WCAG/508/EN criteria

Files to create under `src/inngest/`:
- `client.ts`
- `scan-website.ts` — main job: crawl → scan → score → save → notify

Pages/API to add:
- Activate the "Scan now" button (currently disabled) → triggers Inngest job
- Real-time scan progress via polling or SSE
- Scan result detail view (full violation list with HTML element, fix suggestion, screenshot)
- `worker/` directory: Dockerfile + server.ts for the Playwright container

### Phase 4: Reporting & History
- Score-over-time line chart on website detail
- PDF report generation (@react-pdf/renderer)
- CSV export of violations
- Shareable report links (unique URL, optional password, expiry)
- VPAT-style compliance evidence package (Agency plan)

### Phase 5: Issue Workflow & Collaboration
- Issue detail page with HTML diff (current vs fixed)
- Comments thread on issues
- Assign issues to team members + email notification
- Status workflow: Open → In Progress → Fixed → Verified
- Bulk actions on issue list (assign, change status, mark won't fix)
- Priority matrix view (severity × effort grid)
- Cross-website issue dashboard

### Phase 6: Billing & Subscriptions
- Stripe products/prices for all 4 plans
- Stripe Checkout for new subscriptions
- Stripe Customer Portal for self-service
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Pricing page (public, with annual/monthly toggle)
- Billing settings page with live usage stats
- One-time audit purchase ($499)
- Free trial email reminders (day 7, 12, 14) via Resend

### Phase 7: Agency Features
- White-label config: logo upload, brand colors, company name preview
- White-label PDF reports (zero AccessKit branding)
- Client portal: `/portal/[slug]` public route, optional password
- REST API: `/api/v1/` endpoints with API key auth + rate limiting
- OpenAPI/Swagger documentation
- Webhooks: configurable URLs, event types, retry logic, delivery log
- GitHub Action: `accesskit/scan-action@v1`

### Phase 8: Automation & Monitoring
- Inngest cron jobs for scheduled scans (per website frequency)
- Email notifications: scan complete, new critical, score drop, weekly digest
- In-app notification bell with unread count
- Competitive benchmarking: scan competitor URLs, side-by-side chart

### Phase 9: Polish & Launch
- Landing page with live demo scan
- Performance: query optimization, Redis caching, virtualized lists
- Self-audit: run AccessKit against itself, fix all issues, score ≥ 95
- Security hardening: rate limiting, CSP headers, input sanitization audit
- API documentation
- Legal pages: Terms, Privacy, Cookie consent

---

## Where to resume next session

**Start with Phase 3, Step 1: the Inngest client + scan job skeleton.**

Exact entry point:
1. Install: `npm install inngest`
2. Create `src/inngest/client.ts`
3. Create `src/inngest/scan-website.ts` (stub that saves QUEUED → RUNNING → COMPLETED)
4. Create `src/app/api/inngest/route.ts` (Inngest handler)
5. Wire the "Scan now" button to send an Inngest event
6. Then build the actual scanner (`src/scanner/`) piece by piece

The scan worker (`worker/Dockerfile`) can be stubbed for now — the scanner can run
in-process during development and be extracted to a container later.

---

## Environment variables needed before Phase 3 can run end-to-end

```
DATABASE_URL=          # PostgreSQL (Supabase or Neon recommended)
AUTH_SECRET=           # generate with: openssl rand -base64 32
INNGEST_EVENT_KEY=     # from inngest.com dashboard
INNGEST_SIGNING_KEY=   # from inngest.com dashboard
ANTHROPIC_API_KEY=     # for AI fix suggestions (Phase 3, step 8)
R2_ACCOUNT_ID=         # for screenshots (can skip for early Phase 3)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```
