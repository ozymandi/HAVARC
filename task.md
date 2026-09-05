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

## Next steps

1. Export Figma variables to `src/styles/tokens.css` + Tailwind config.
2. Scaffold Vite app, PWA shell, routing per screen groups above.
3. Supabase schema + RLS, then screens in the order: Login → Jobs → Steps 1–4 → Job Detail → Invoice → Settings.
4. PDF templates (Letter) in edge function.
