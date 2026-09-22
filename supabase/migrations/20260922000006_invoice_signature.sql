-- Client request (2026-09-22): a separate customer signature under the invoice, given
-- after the invoice total is known, so the customer explicitly agrees to the charges.
-- Stored next to the other two signatures: signatures/<job>/invoice.png.
alter table public.jobs
  add column invoice_signature_path text,
  add column invoice_signed_at timestamptz;
