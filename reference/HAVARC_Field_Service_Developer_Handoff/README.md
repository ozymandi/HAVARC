# HAV'ARC HVAC Field Service — Developer Handoff

This package contains a working technician-only, four-step HVAC field-service prototype and the documentation needed to continue it into a production application.

## What works now

- Mobile-first four-step service-call flow
- Work order, customer, equipment, readings, findings, repairs, recommendations, and final status
- Tap-to-select checkboxes
- Camera/photo selection and on-screen previews
- Customer and technician signature pads
- Local auto-save and resume in the same browser
- Required-field validation
- Final review summary
- Print / Save PDF through the browser
- Export completed form data as JSON
- Progressive Web App manifest and basic service-worker cache

## Run locally

Because the app uses a service worker, serve the `app` folder over HTTP rather than opening it only as a local file.

Example with Python:

```bash
cd app
python3 -m http.server 8080
```

Open `http://localhost:8080` on a computer or phone on the same network.

## Production note

This is a handoff-ready prototype, not a finished production system. It intentionally has no real user authentication, server database, encrypted cloud storage, photo upload service, role management, audit log, or live PDF/email delivery. Those items are documented in `docs/PRODUCTION_CHECKLIST.md`.

## Recommended next implementation

Keep the same front-end workflow, but connect it to a secure backend. A developer can use React/Next.js, Vue/Nuxt, Flutter, or keep the current vanilla PWA. The data contract in `docs/API_SPEC.md` is framework-neutral.
