# AccessKit — Remaining Phases

> Generated 2026-03-23. Work through one phase at a time.

---

## Phase A: UI Overhaul (partially done — crashed session)

The previous session started this work. Tailwind v4 migration, dark navy/purple theme, and landing page redesign are in uncommitted changes. Needs to be finished and committed.

**Already done (uncommitted):**
- [x] Tailwind v3 → v4 migration (globals.css, postcss.config.mjs, tailwind.config.ts)
- [x] Dark navy/purple color scheme (CSS variables)
- [x] Landing page redesign (gradient backgrounds, glow effects, gradient text)
- [x] Login page polish (dark theme, styled OAuth buttons)
- [x] Sidebar styling updates
- [x] Cookie consent banner restyle
- [x] Dashboard header/layout adjustments

**Still needs doing:**
- [ ] Verify the app actually builds and renders correctly with these changes
- [ ] Fix any broken components or visual issues from the Tailwind v4 migration
- [ ] Polish dashboard inner pages (website list, website detail, scan results, issues)
- [ ] Polish feature cards / pricing section on landing page
- [ ] Ensure all shadcn/ui components work with the new dark theme
- [ ] Responsive design check (mobile/tablet)
- [ ] Commit all UI overhaul work

---

## Phase B: Reporting & History (was Phase 4 in STATUS.md)

- [ ] Score-over-time line chart on website detail page (recharts — already partially done)
- [ ] PDF report generation (`@react-pdf/renderer`)
- [ ] CSV export of violations (endpoint exists, needs download button — may already be done)
- [ ] Shareable report links (unique URL, optional password, expiry)
- [ ] VPAT-style compliance evidence package (Agency plan)

---

## Phase C: Issue Workflow & Collaboration (was Phase 5)

- [ ] Issue detail page with HTML diff (current vs fixed)
- [ ] Comments thread on issues
- [ ] Assign issues to team members + email notification
- [ ] Status workflow: Open → In Progress → Fixed → Verified
- [ ] Bulk actions on issue list (assign, change status, mark won't fix)
- [ ] Priority matrix view (severity × effort grid)
- [ ] Cross-website issue dashboard

---

## Phase D: Billing & Subscriptions (was Phase 6)

- [ ] Stripe products/prices for all 4 plans
- [ ] Stripe Checkout for new subscriptions
- [ ] Stripe Customer Portal for self-service
- [ ] Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- [ ] Pricing page (public, with annual/monthly toggle)
- [ ] Billing settings page with live usage stats
- [ ] One-time audit purchase ($499)
- [ ] Free trial email reminders (day 7, 12, 14) via Resend

---

## Phase E: Agency Features (was Phase 7)

- [ ] White-label config: logo upload, brand colors, company name preview
- [ ] White-label PDF reports (zero AccessKit branding)
- [ ] Client portal: `/portal/[slug]` public route, optional password
- [ ] REST API: `/api/v1/` endpoints with API key auth + rate limiting
- [ ] OpenAPI/Swagger documentation
- [ ] Webhooks: configurable URLs, event types, retry logic, delivery log
- [ ] GitHub Action: `accesskit/scan-action@v1`

---

## Phase F: Automation & Monitoring (was Phase 8)

- [ ] Inngest cron jobs for scheduled scans (partially done — `scheduled-scans.ts` exists)
- [ ] Email notifications: scan complete, new critical, score drop, weekly digest
- [ ] In-app notification bell with unread count
- [ ] Competitive benchmarking: scan competitor URLs, side-by-side chart

---

## Phase G: Polish & Launch (was Phase 9)

- [ ] Landing page with live demo scan
- [ ] Performance: query optimization, Redis caching, virtualized lists
- [ ] Self-audit: run AccessKit against itself, fix all issues, score ≥ 95
- [ ] Security hardening review (rate limiting exists, CSP headers exist — verify completeness)
- [ ] API documentation
- [ ] Legal pages: Terms, Privacy, Cookie consent (Terms + Privacy + Cookie consent already exist)

---

## Phase 3 Remaining (minor, can slot in anywhere)

- [ ] Screenshots: implement `screenshot.ts` R2 upload (needs R2 credentials)
- [ ] pa11y secondary scanner: implement `pa11y-scanner.ts`, merge results with axe

---

## Suggested order

1. **Phase A** — UI Overhaul (finish + commit what's started)
2. **Phase D** — Billing (Stripe integration enables revenue)
3. **Phase B** — Reporting (high-value user feature)
4. **Phase C** — Issue Workflow (collaboration features)
5. **Phase E** — Agency Features (premium tier value)
6. **Phase F** — Automation & Monitoring
7. **Phase G** — Polish & Launch
