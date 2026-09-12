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

- Step 4 done (2026-09-12): offline queue. `src/data/idb.ts` (two IndexedDB stores), `outbox.ts` (one pending write per job, latest snapshot wins, `complete` sticky, `baseUpdatedAt` for conflicts), `cache.ts` (read-through cache for the jobs list, job details, work-order numbers), `sync.ts` (engine: drains the outbox oldest-first on sign-in, on `online`, on foreground and after every new entry; conflict check against the server's `updated_at`; feeds Storage paths / status / updated_at back into the on-screen draft without re-queuing). The draft store persists itself to IndexedDB and is restored when the steps mount (reload mid-job resumes). Jobs: 02e "Syncing N jobs…", 02f "Couldn't sync N jobs. Tap to retry.", Pending sync badge for queued jobs, offline-created jobs at the top, 02g conflict dialog ("Keep my version" forces our write, "Use the other version" drops it). Job Detail flips Pending sync → Completed in place. Settings "Last sync" is real. Complete on Step 4 resolves once the entry is on the device; the engine writes it.
- Verified in the browser 2026-09-12 (Yaroslav signed the Browser pane in, the agent drove it, mobile emulation for touch signatures): New job → Steps 1–4 with drawn signatures → Complete → Job Detail Completed with summary; reload mid-Step 2 restores the draft; failed sync shows 02f and Tap to retry → 02e → Completed; edit from "another device" (REST PATCH) → 02g dialog with the Figma copy → Keep my version wrote our snapshot; network failure → offline-created draft at the top as Pending sync, list served from cache; Edit job on a queued job; Keep draft & exit → Draft synced. Two bugs found and fixed during the pass (job id minted at first queued write; Edit job on an unsynced job reads the outbox). Not covered here: photo upload (file dialog) and real airplane mode — Yaroslav on a phone.

- Step 9 item done early (2026-09-12): "Add photo" opens the app's bottom-sheet picker with Take photo / Choose from gallery (two hidden inputs, with and without `capture`) — Android's chooser offers only one of the two depending on `capture`, iOS offers both either way (found by Yaroslav on Android). Phone pass: a job with a photo completed and synced.

- Step 5 done (2026-09-12): invoice numbers are assigned on the server. Migration `20260912000004_invoice_numbers.sql`: `assign_invoice_number(job_id)` takes `settings.next_invoice_number` (with `invoice_prefix`) under a row lock, skips numbers that already exist, writes it to the job's invoice and advances the counter; triggers on `jobs` (status → completed) and on `invoices` (insert/update while number is null) so the order of the app's writes doesn't matter. Verified via REST: draft → no number, complete → 649, counter → 650, re-saving the invoice keeps 649. Counter reset to 649 after the test. The app already shows "Draft" until a number exists (editor header, PDF). Also: the sync engine recovers from a work-order collision (unique violation → next free number → retry), closing open item 6. `npm run db:push` applies migrations (linked project, password prompt); run `npm run gen:types` after.

- Step 6 done (2026-09-12): server-side PDFs. `api/pdf.ts` (Vercel function, `@sparticuz/chromium` + `puppeteer-core`, maxDuration 60) renders the app's own `/print/report` and `/print/invoice` routes — all data travels in the URL hash, built by the function from the stored job with the service key, so the print page needs no session. `src/pdf/query.ts` + `data.ts` are the one query and mapping shared with the in-app preview; the company block comes from Settings (`src/pdf/company.ts`). Files land in the private `documents` bucket (`<job>/<kind>.pdf`, ~600 KB each) with `documents` rows `pending → ready | error`. Job Detail: 08e "Generating… usually a few seconds" with spinner and polling, error rows retry on tap, ready rows open the stored file, Share disabled until both are ready. PDFs are requested by the sync engine after a completed job is written and after saving an invoice of a completed job. Inter is self-hosted. Migration 0005 grants `service_role` table access (auto-expose off). `npx tsx scripts/pdf-local.ts WO-10029 <outDir>` renders with the desktop Chrome against the dev server.
- Verified locally: WO-10029 report (3 pages) and invoice (2 pages) rendered as exact 612×792 pt Letter pages from real data; Job Detail Documents rows and the generating state exercised in the browser. Verified on Vercel 2026-09-12: `SUPABASE_SECRET_KEY` set (Secret), function needed explicit `.js` imports across its module graph (Vercel compiles it as node16 ESM) and a React-free company module; Yaroslav re-completed WO-10029 on prod with a photo and drawn signatures → report 1.1 MB and invoice 506 KB generated by the function within seconds. Vercel CLI is linked (`npx vercel logs havarc.vercel.app --follow`, `npx vercel inspect <url> --logs`).

- Step 9 item done early (2026-09-12): auto-reload on a new version. `registerSW` is called from `main.tsx` (registerType `autoUpdate` reloads once the new worker takes over) and the app checks for a new worker whenever it returns to the foreground and once an hour — found during the prod test, where an open tab kept running the previous bundle. Reloads are safe: draft and outbox live in IndexedDB.

- Step 7 done (2026-09-12): Share sheet shares the real files. Rows = ready PDFs (from the `documents` bucket via signed URLs) + the job's photos, all on by default; Share fetches the selected files as `File`s (`WO-10029-service-report.pdf`, `WO-10029-invoice-646.pdf`, `WO-10029-photo-1.jpg`) and hands them to the system share sheet (Web Share API with files: Messages, Mail, WhatsApp, AirDrop); a browser without file sharing (desktop) downloads them instead. "Preparing…" while fetching, error line on failure, closing the system sheet is not an error. Verified on desktop (downloads); the phone path is Yaroslav's to try: Job Detail → Share PDFs → Share 3 files.

- Step 8 part 2 done (2026-09-12): after a generation run the function emails both PDFs (`WO-…-service-report.pdf`, `WO-…-invoice-…pdf`) to Settings → notify email through the Brevo SMTP relay (`api/_email.ts`, nodemailer; SMTP_USER / SMTP_PASS / SMTP_SENDER added to Vercel for Production + Preview via `vercel env add`, password sensitive). Branded HTML with a summary table (customer, address, date, technician, final status, invoice number and total); `documents.emailed_at` stamped. Mail failures are logged in Vercel, never fail the PDFs. Verified locally end to end (WO-10029 → email to ozymandiuz@gmail.com, emailed_at set). notify_email is still the test address — switch to the client's in Settings row (`settings.notify_email`) at handover.

- Step 9 done (2026-09-12): the invoice's WORK PERFORMED checklist (the client's paper form) is derived from step data in `workPerformedFor` (`src/pdf/data.ts`): Preventive Maintenance ticks the routine checks (coils, air filter, motors, electrical connections, safety controls, thermostat); repairs map to their checks (Coil Cleaning → Cleaned O/D Coil + Checked Coils, Refrigerant Added → Adjusted/Checked Refrigerant, Leak Search → Checked for Ref. Leaks, Electrical Repair → Checked Electrical Connections); findings tick what was inspected (dirty coils, low refrigerant, leak suspected, motor issues, capacitor/contactor → electrical + amp check); readings tick Volt/Amp Check, Outdoor/Indoor/RA/SA temp, Head/Suction PSIG, Subcool, Superheat; condition checks tick air filter / heat exchange; "filter" in Parts ticks Changed air filter, "thermocouple" ticks Replace Thermocouple. Never ticked (no in-app source): Checked Belts, Cleaned I.D. Coil, Checked Pulleys, Lubricated Motor/Bearings, Vacuum Burners, Checked pilot. Together with the earlier photo-input and auto-reload items, step 9 is complete.

- Step 10, desktop/emulated pass (2026-09-12, agent): Jobs search + No matches + Draft/Completed filters; Settings autosave (tagline changed → reload → persisted → restored); invoice editor on a completed job (add item via 07b sheet → Save → rows in DB, invoice PDF row back to "Generating…" → item removed and saved again); Step 1 validation banner ("2 required fields are missing") and Required marks, Add second unit → Unit 2 / "Add another unit"; Keep draft & exit on an untouched draft leaves no row; desktop layouts (1280 px) for Jobs, Job Detail, Settings render in their two-column form. Earlier in the day: auth flows, offline queue, conflict, PDFs, share, email — all on prod. `docs/client-guide.md` written for the client (install, sign in, jobs, 4 steps, PDFs/email, share, offline, settings).
- Step 10, Yaroslav's phone + tablet pass (to do, on https://havarc.vercel.app after a fresh open so the new bundle is in): (1) iPhone: Add to Home Screen, open from the icon, Install sheet hint shows once; (2) full job with 2–3 photos from camera and gallery, both signatures drawn, Complete → Documents appear → tap each PDF opens it → Share PDFs → system sheet with 3–4 files → send to yourself; (3) airplane mode: create + complete a job, back online → Completed + PDFs + email; (4) tablet (iPad): steps 1–4 layout, signature on the full-screen page, Job Detail two-column; (5) Settings on the phone: change tax rate → new job's invoice starts with it; (6) Forgot password from the installed app → email → link opens in Safari → new password → sign in from the app.
- Found in Yaroslav's phone pass (2026-09-12 evening): a cold PDF run on Vercel took ~3 min, longer than Job Detail's 2-minute staleness rule, so rows showed "Couldn't generate" while the function was still working and a per-row retry sent a one-attachment email. Fixed in `af40712`: the function touches the `documents` rows at every stage (heartbeat), logs stage timings (`pdf <job> <stage> +ms` in Vercel logs), has a 300 s budget and skips WebGL extraction; Job Detail keeps polling presumed-stale rows. To watch on the next real completion: `npx vercel logs havarc.vercel.app --follow` and read the stage lines — if "browser launched" is still tens of seconds, consider keeping the function warm (a cron ping) or `@sparticuz/chromium-min` with the binary in Storage.
- Found in Yaroslav's pass (2026-09-12 evening): the reset-password link stopped working once mail went through Brevo — Brevo wraps links in a click tracker (`sendibt2.com/tr/cl/…`) and the one-time Supabase link was already consumed by the time the user clicked, so the app landed on Sign in. Fix: the recovery email now links straight to the app (`{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`), `/reset-password` is public, and the token is exchanged (`verifyOtp`) only when "Save password" is pressed — scanners and trackers can open the link without burning it. Login shows a notice when it receives `#error_code=otp_expired` from an old-style link. Pushed and verified 2026-09-12 (Yaroslav reset his password through the new link on prod). Optional: Brevo → Transactional → Settings → turn off click tracking, so links in emails are plain.
- Yaroslav's phone + tablet pass (2026-09-12 evening): photos from camera and gallery, offline job, PDFs, email, password reset, and the new native date/time pickers — all confirmed OK on the phone and the tablet. Date / Arrival / Departure are native `date` / `time` inputs with the app's calendar and clock icons (system indicators hidden), values stored as `YYYY-MM-DD` / `HH:MM`.
- Handover checklist (in addition to the Handover section): ~~delete test jobs~~ done 2026-09-12 (test jobs, test customers and their Storage files removed; WO-10029 restored to its seed content; invoice counter back at 649 — the DB is the seed again: 5 jobs, 5 customers, Storage empty); set `settings.next_invoice_number` to the client's real next number and the invoice prefix; set `settings.notify_email` to the office address; switch Brevo to the client's domain/sender; move Supabase, GitHub, Vercel to the client's accounts; then re-run (2) once on the client's phone.

### Handover (when the client is ready)

Each service has a built-in transfer, no code changes: Supabase → Project Settings → Transfer to the client's organisation (ref, keys, data and Storage stay); GitHub → Transfer ownership (or keep the repo and grant access); Vercel → Project Settings → Transfer (deploys, env, `havarc.vercel.app` move along; a custom domain is a 5-minute add); Brevo is not transferable — the client creates their own account, verifies a domain/sender, we swap `SMTP_*` in `.env.local` and `npm run config:push`. Needed from the client: an email for the three accounts, DNS access for the mail domain, and a decision on Free vs paid plans (Vercel Hobby forbids commercial use → Pro $20/mo or the client's own account; Supabase Free pauses after 7 idle days → Pro $25/mo if that matters). Do the last migrations and config push before the transfer, or have the client add us to their org as Developer.

### Open items before step 7 / deploy

1. ~~Supabase Auth URL configuration~~ Done 2026-09-12: `supabase/config.toml` declares Site URL `https://havarc.vercel.app`, redirect URLs for the app and localhost, password rule 8+ chars with a digit, public signups off; pushed and verified (`npm run config:diff` reports no pending changes). Rule: change auth settings in the file, then `npm run config:push` from a terminal (the agent sandbox blocks the push itself).
2. ~~Vercel env~~ Done 2026-09-12: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as Config vars for Production + Preview; `main` pushed and deployed. `vercel.json` adds the SPA rewrite (deep links such as `/reset-password` used to 404).
3. ~~Own sender~~ Done 2026-09-12 (plan step 8, part 1): Brevo SMTP relay (`[auth.email.smtp]`, credentials via `env(SMTP_USER|SMTP_PASS|SMTP_SENDER)` from `.env.local`, loaded by `dotenv-cli` in the config scripts) and the branded recovery email (`supabase/templates/recovery.html`) are pushed and verified. Brevo account is Yaroslav's (Free, 300/day), sender `HAV'ARC Heating and Air <ozymandiuz@gmail.com>`, verified. Before handover: authenticate a domain in Brevo (client's, or okhra.space) and switch `SMTP_SENDER` to it — a gmail sender fails DKIM/DMARC alignment and risks spam. Remaining part of step 8: auto-emailing the generated PDFs (after step 6).
4. ~~Type generation~~ Done 2026-09-12: the CLI is logged in (`npx.cmd supabase login`), `npm run gen:types` regenerates `src/lib/database.types.ts` from the project and the client is `createClient<Database>`. Re-run it after every migration.
5. ~~Reload loses the draft~~ Done in step 4: the draft is persisted to IndexedDB and restored when the steps mount.
6. ~~Work-order collision~~ Handled in step 5: on a unique violation the sync engine takes the next free number and retries; the draft on screen updates.
