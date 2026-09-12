# HAV'ARC Field Service App — task

Client: **tholloway91** (HAV'ARC Heating and Air, Stockbridge GA, US) via Fiverr.
Product: mobile-first PWA for HVAC technicians — create a work order in 4 steps on the phone, capture photos and signatures, generate a Service Report PDF and an Invoice PDF, share them. Two users, no roles, works offline in the field.

## Estimate (agreed)

| Block | Hours |
|---|---|
| Design | 10 |
| Frontend | 11 |
| Backend | 24 |
| Testing & deploy | 6 |
| **Total** | **51** (2–3 weeks) |

Details: `estimate.md`.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind, PWA via Workbox.
- Backend: Supabase (Postgres + Auth + Storage + RLS), edge functions for PDF generation and invoice numbering.
- Hosting: Vercel, project `ohrakazokus-projects/havarc`, auto-deploy from `main` on GitHub `ozymandi/HAVARC`. Frontend only; Supabase stays separate.
- PDF: server-side from HTML templates via headless Chrome. Page size **US Letter 612×792 pt**, margins 36, running header + footer with "Page n of N".

## Design source

Figma file `dp3yEGxjciw7s94vRfCKt3` — fully styled and approved (2026-09-05).
- App screens: page "Screens · Mobile Design" (100:2909). Wireframe page 8:9 is obsolete, ignore it.
- PDF templates: page "PDF Templates Design" (213:3678).
- Tokens: variable collections Primitives / Color (Light, Dark) / Spacing / Typography, code syntax `var(--…)`.
- Node-ID ledger with all component/screen/PDF IDs and layout rules: `docs/figma-ledger.json`.
- Reference prototype (field list, flow) and client docs: `reference/HAVARC_Field_Service_Developer_Handoff/`.

## Screens (design page)

Onboarding: Login, Wrong password, Reset password, Check your email, Set new password, Install on iPhone.
Jobs / List: Jobs, Search, Empty, No results, Syncing, Sync error, Conflict.
Jobs / Item: Job Detail, Share sheet (PDF report + PDF invoice + images, all on by default), Menu (edit / delete), Delete confirm, Generating PDFs.
Jobs / Creation steps: Step 1 Service Call & Equipment (multi-unit, equipment type picker, customer suggestions, validation errors, discard dialog), Step 2 Inspection & Readings (+ Readings skipped), Step 3 Findings & Repairs, Step 4 Complete (photos, customer signature full-screen, no photos, Job saved).
Jobs / Invoice: Invoice editor, Add item sheet, Edit item.
Settings: Settings, Change password.

## Client decisions (do not re-ask)

- **Customer notes**: per-customer "Additional Notes" (gate/access codes etc.) saved on the customer and auto-filled into every work order. Shown in Step 1, Job Detail and the **Service Report PDF**. **Not** in the Invoice PDF. The word "internal" must not appear anywhere in the app.
- **Readings are optional**: Step 2 readings section collapsed by default with "Add readings"; maintenance calls use it, service calls may skip. Readings block in the PDF and the Readings line in Job Detail render only when values exist. All readings columns nullable.
- Save exists only on the final step; Step 4 "Complete" shows a "Job saved" dialog.
- Custom bottom-sheet pickers instead of native selects (cross-platform look).
- Signature is captured on a separate portrait full-screen page; "clear" is an icon, not a big button.
- Tax rate is configurable; default from client (30% in brief — confirm).
- Invoice numbering server-side, sequential.

## Phase 1 scope

Auth (email + password, reset), shared data for both users, job list + search + history, 4-step work order with drafts/autosave, multiple equipment units per job, photos (client-side compression), signatures, offline queue (IndexedDB, sync while app is open), Service Report PDF + Invoice PDF, share sheet, company settings & branding.

## Phase 2 (not now)

Equipment history, configurable required fields, dynamic sections by equipment type, photo categories/captions, "customer declined to sign", repeat visits / parts orders, email PDFs from the app, integrations (QuickBooks, HubSpot).

## Known constraints

- iOS PWA: no install prompt (manual hint screen), storage may be evicted, no background sync — sync only with app open. Server is the source of truth, local storage is a buffer.
- Header uses safe-area padding (44 pt) instead of a fake status bar.

## Working rules

See `team.md`. Propose before implementing; estimates in hours only; the designer verifies every result.

## Status (2026-09-12)

Frontend and desktop breakpoint are on prod (`2c6b5c8`, https://havarc.vercel.app). Backend in progress per `docs/backend-plan.md`:

- Step 1 done: schema, RLS, grants, buckets, seed applied to Supabase project `ldpxlkhppyzomejrjarf` (commit `daee86c`).
- Step 2 done: supabase-js client (`src/lib/supabase.ts`), session provider + `RequireAuth` route guard (`src/auth/`), real Login (01b wrong-password state from the Supabase error), Reset password → recovery email → Set new password, Change password (current password re-checked by signing in), Sign out. Jobs, Job Detail, PDF preview, Invoice editor, Step 1 customer suggestions / next WO number and Settings (debounced autosave, logo to Storage) read from the DB; `mockJobs.ts` is gone. Delete job removes the row and its Storage files.
- Verified in the browser without a session: `/jobs` bounces to Login, wrong credentials show the 01b error. Signed-in screens (Jobs list from seed, Job Detail, Settings autosave) still need a manual pass with a real account (`secrets/accounts.txt`).

Next: step 3 — writing a job (Complete on Step 4, draft autosave, photos and signatures to Storage, Edit job, invoice save).

### Open items before step 3 / deploy

1. Supabase Auth → URL Configuration: set Site URL to `https://havarc.vercel.app` and add Redirect URLs `https://havarc.vercel.app/reset-password` and `http://localhost:5173/reset-password`. Without this the recovery link lands on the default Site URL.
2. Vercel project env: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (values in `.env.local`). The app throws at startup without them, so this must precede the next push to `main`.
3. Supabase built-in SMTP is limited to a few emails per hour and only to project members' addresses — fine for testing, but a custom SMTP / Resend sender is needed before the client uses Reset password (also the plan's step 8).
4. Type generation (`supabase gen types`) could not reach the DB from this machine (direct host is IPv6-only, pooler connection also failed via the CLI); row types are hand-written in `src/data/*.ts` and must be kept in step with migrations.
