-- Client request (2026-09-23): typed name and job title of the person signing the invoice,
-- printed on the invoice's PRINT NAME / JOB TITLE lines. Kept apart from customer_rep_name
-- (the Service Report acknowledgment) because it may be a different person.
alter table public.jobs
  add column invoice_signer_name text,
  add column invoice_signer_title text;
