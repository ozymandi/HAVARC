# Production Checklist

## Must-have before technicians use it live

- [ ] Secure authentication and password reset
- [ ] Role restriction: technician-only screens
- [ ] HTTPS everywhere
- [ ] Server-side validation
- [ ] Cloud database with backups
- [ ] Photo/object storage
- [ ] Signature storage
- [ ] Draft autosave API
- [ ] Offline submission queue and sync conflict handling
- [ ] Work-order assignment list
- [ ] Completed-report retrieval
- [ ] PDF generation matching HAV'ARC branding
- [ ] Email or share completed PDF
- [ ] Audit history and timestamps
- [ ] Error monitoring/logging
- [ ] Device/browser testing on iPhone, Android, tablet
- [ ] User acceptance testing with a real technician

## Recommended shortly after V1

- [ ] Multiple equipment records on one work order
- [ ] Repeatable RTU/asset workflow
- [ ] Equipment history
- [ ] Configurable required fields
- [ ] Dynamic sections by equipment type
- [ ] Photo categories and captions
- [ ] Customer unavailable / refused signature option
- [ ] Return visit / parts required workflow

## Security / privacy notes

Do not keep production service reports, customer signatures, or customer contact information only in browser localStorage. Use authenticated server storage, least-privilege access, encryption in transit, and appropriate data-retention controls.
