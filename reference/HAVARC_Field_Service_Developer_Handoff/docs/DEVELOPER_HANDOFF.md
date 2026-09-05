# HAV'ARC Technician Field App — Handoff Notes

## Product scope

Technician side only. The purpose is to replace the four-page HVAC paper field report with a guided mobile form.

### Four screens
1. Service Call & Equipment
2. Inspection & Readings
3. Findings & Repairs
4. Complete Service Call

## Primary user journey

Open assigned work order -> enter/confirm service and equipment data -> record HVAC readings -> select findings/repairs -> add notes/photos -> choose final system status -> obtain signatures -> submit.

## UX principles

- Large controls usable on a phone
- Minimal typing
- Numerical keyboard for readings
- Next / Back / Save always available
- Autosave frequently
- Technician can leave and resume a draft
- Do not expose office/accounting functions in the technician interface

## Current prototype architecture

- `index.html`: form structure
- `styles.css`: mobile-first UI and print layout
- `app.js`: navigation, autosave, validation, signatures, photo preview, print, JSON export
- `manifest.json`: PWA metadata
- `sw.js`: minimal offline static-asset cache

## Data persistence in prototype

Draft data is stored in browser `localStorage` under:

`havarc-field-service-draft-v1`

This is for prototyping only. Production should store completed and draft service calls on the server and optionally keep a local encrypted/offline queue.

## Required production behaviors

- Technician authentication
- Assigned work-order list
- Server-generated immutable IDs
- Draft and submitted statuses
- Photo uploads with file metadata
- Signature uploads
- Server timestamp on submission
- Completion lock or controlled amendment workflow
- PDF generation from submitted record
- Email/share completed report
- Audit history

## Suggested statuses

`scheduled`, `in_progress`, `draft`, `submitted`, `completed`, `return_visit_required`

## Definition of done for V1

A technician can sign in on a phone, open an assigned job, complete all four screens, attach photos, sign, submit, and later retrieve the completed service report without losing data when connectivity changes.
