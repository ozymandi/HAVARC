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
- Step 3 done (2026-09-12): the draft store is written to the DB. `src/data/jobDraft.ts` maps the `step1..4.*` keys onto jobs / customers / equipment / readings / job_findings / invoices / invoice_items / photos in both directions; `src/data/draftSync.ts` + `components/DraftSync.tsx` autosave 1.5 s after typing stops while any step is mounted, flush on exit, and serialise Complete behind autosave. A row is created once the draft names a customer or carries a file (an untouched "New job" leaves nothing). Photos are compressed on device (JPEG ≤ 1600 px, q 0.8) and uploaded to `photos/<job>/<uuid>.jpg` as they are added; signatures go to `signatures/<job>/<customer|technician>.png` when drawn; Complete retries anything still local, then writes the job as `completed` with final status, rep name and signature paths. Customer notes are saved back to the customer; new customers are created on first save. Edit job (Job Detail menu) loads the stored job into the draft and opens Step 1; autosave then updates the same row and keeps its status. Invoice editor on `/jobs/:id/invoice` starts from the stored invoice and Save writes it; Step 4's draft invoice starts at the Settings default tax rate.
- Verified: `tsc`, lint and `npm run build` clean. Nothing in step 3 was exercised in a browser — every step screen sits behind sign-in, and this environment cannot sign in (see step 2). Manual pass needed with a real account: New job → Steps 1–4 → Complete → Job Detail shows the data; Keep draft & exit → draft in the list → Edit job resumes it; photo add/remove, both signatures, invoice save on an existing job.

Next: step 4 — offline queue (IndexedDB, sync when online, Syncing / Sync error banners, Pending sync badge, conflict dialog 02g).

### Open items before step 4 / deploy

1. ~~Supabase Auth URL configuration~~ Done 2026-09-12: `supabase/config.toml` declares Site URL `https://havarc.vercel.app`, redirect URLs for the app and localhost, password rule 8+ chars with a digit, public signups off; pushed and verified (`npm run config:diff` reports no pending changes). Rule: change auth settings in the file, then `npm run config:push` from a terminal (the agent sandbox blocks the push itself).
2. ~~Vercel env~~ Done 2026-09-12: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as Config vars for Production + Preview; `main` pushed and deployed. `vercel.json` adds the SPA rewrite (deep links such as `/reset-password` used to 404).
3. ~~Own sender~~ Done 2026-09-12 (plan step 8, part 1): Brevo SMTP relay (`[auth.email.smtp]`, credentials via `env(SMTP_USER|SMTP_PASS|SMTP_SENDER)` from `.env.local`, loaded by `dotenv-cli` in the config scripts) and the branded recovery email (`supabase/templates/recovery.html`) are pushed and verified. Brevo account is Yaroslav's (Free, 300/day), sender `HAV'ARC Heating and Air <ozymandiuz@gmail.com>`, verified. Before handover: authenticate a domain in Brevo (client's, or okhra.space) and switch `SMTP_SENDER` to it — a gmail sender fails DKIM/DMARC alignment and risks spam. Remaining part of step 8: auto-emailing the generated PDFs (after step 6).
4. ~~Type generation~~ Done 2026-09-12: the CLI is logged in (`npx.cmd supabase login`), `npm run gen:types` regenerates `src/lib/database.types.ts` from the project and the client is `createClient<Database>`. Re-run it after every migration.
5. A page reload mid-draft loses the in-memory draft (the DB copy stays and can be resumed via Edit job); keeping the draft in IndexedDB is part of step 4.
6. Work-order numbers are `max + 1` on the client; two technicians starting a job at the same moment could collide on the unique `work_order` (autosave then fails silently until Complete). A server-side sequence can come with step 5's invoice numbering.
