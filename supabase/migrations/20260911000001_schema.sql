-- HAV'ARC Field Service — Phase 1 schema (step 1 of the backend plan, 2026-09-11).
-- Two technicians, no roles: every authenticated user has full access to every row.
-- Customer notes live on the customer and are copied onto the job; they print on the
-- Service Report only, never on the Invoice (client decision). Readings are optional,
-- so every readings column is nullable.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- enums
create type public.job_status as enum ('draft', 'pending', 'completed');
create type public.final_status as enum ('green', 'yellow', 'orange', 'red');
create type public.check_state as enum ('good', 'issue');
create type public.document_kind as enum ('report', 'invoice');
create type public.document_status as enum ('pending', 'ready', 'error');

-- ---------------------------------------------------------------- customers
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null default '',
  phone       text,
  notes       text,                      -- access codes etc.; report PDF only
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index customers_name_key on public.customers (lower(name));
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- jobs (work orders)
create table public.jobs (
  id                          uuid primary key default gen_random_uuid(),
  work_order                  text not null unique,                 -- "WO-10031"
  customer_id                 uuid references public.customers(id) on delete set null,
  customer_name               text not null,                        -- kept for history
  address                     text not null default '',
  unit_suite                  text,
  technician                  text not null default '',
  job_date                    date not null default current_date,
  arrival_time                text,
  departure_time              text,
  service_type                text,                                 -- one of the Step 1 chips
  complaints                  text[] not null default '{}',
  complaint_details           text,
  customer_notes              text,                                 -- snapshot of customers.notes
  status                      public.job_status not null default 'draft',
  step                        smallint not null default 1,          -- furthest step reached (draft resume)
  final_status                public.final_status,
  customer_rep_name           text,
  customer_signature_path     text,                                 -- storage: signatures/<job>/customer.png
  technician_signature_path   text,
  completed_at                timestamptz,
  created_by                  uuid references auth.users(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index jobs_status_idx on public.jobs (status);
create index jobs_created_at_idx on public.jobs (created_at desc);
create index jobs_customer_idx on public.jobs (customer_id);
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- equipment (1..n per job)
create table public.equipment (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  position      smallint not null default 1,
  equipment_id  text,
  location      text,
  type          text,
  manufacturer  text,
  model         text,
  serial        text,
  tonnage       text,
  refrigerant   text,
  voltage       text,
  filter_size   text
);
create index equipment_job_idx on public.equipment (job_id, position);

-- ---------------------------------------------------------------- readings + condition checks (Step 2)
create table public.readings (
  job_id            uuid primary key references public.jobs(id) on delete cascade,
  return_air        text,
  supply_air        text,
  temp_split        text,
  return_static     text,
  supply_static     text,
  total_static      text,
  incoming_v        text,
  compressor_a      text,
  cond_fan_a        text,
  blower_a          text,
  cap_rated_mfd     text,
  cap_actual_mfd    text,
  suction_psig      text,
  head_psig         text,
  outdoor_f         text,
  superheat         text,
  subcooling        text,
  refrigerant_added text,
  filter_check      public.check_state,
  drain_check       public.check_state,
  ductwork_check    public.check_state,
  heating_check     public.check_state
);

-- ---------------------------------------------------------------- findings / repairs / recommendations (Step 3)
create table public.job_findings (
  job_id            uuid primary key references public.jobs(id) on delete cascade,
  findings          text[] not null default '{}',
  repairs           text[] not null default '{}',
  recommendations   text[] not null default '{}',
  service_notes     text,
  parts             text,
  recommended_work  text
);

-- ---------------------------------------------------------------- photos (Step 4)
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  position      smallint not null default 1,
  storage_path  text not null,                                       -- storage: photos/<job>/<uuid>.jpg
  caption       text,
  created_at    timestamptz not null default now()
);
create index photos_job_idx on public.photos (job_id, position);

-- ---------------------------------------------------------------- invoices
create table public.invoices (
  job_id          uuid primary key references public.jobs(id) on delete cascade,
  number          text unique,                                       -- assigned server-side on completion (step 5)
  tax_rate        numeric(5,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  description     text,
  work_performed  text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.invoices(job_id) on delete cascade,
  position      smallint not null default 1,
  description   text not null,
  qty           numeric(10,2) not null default 1,
  unit_price    numeric(10,2) not null default 0,
  customer_paid boolean not null default false
);
create index invoice_items_job_idx on public.invoice_items (job_id, position);

-- ---------------------------------------------------------------- generated documents (PDFs)
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  kind          public.document_kind not null,
  status        public.document_status not null default 'pending',
  storage_path  text,                                                -- storage: documents/<job>/<kind>.pdf
  size_bytes    integer,
  error         text,
  emailed_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (job_id, kind)
);
create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- company settings (single row)
create table public.settings (
  id                    boolean primary key default true check (id),
  company_name          text not null default '',
  tagline               text,
  phone                 text,
  email                 text,
  address               text,
  logo_path             text,                                        -- storage: documents/branding/logo.png
  default_tax_rate      numeric(5,2) not null default 0,
  labor_rate            numeric(10,2) not null default 80,
  next_invoice_number   integer not null default 649,
  invoice_prefix        text not null default '',
  invoice_footer        text,
  notify_email          text,                                        -- auto-send completed work orders here
  updated_at            timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- RLS: authenticated users see and change everything
do $$
declare t text;
begin
  foreach t in array array['customers','jobs','equipment','readings','job_findings','photos','invoices','invoice_items','documents','settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: authenticated full access" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- storage buckets (private; served via signed URLs)
insert into storage.buckets (id, name, public) values
  ('photos', 'photos', false),
  ('signatures', 'signatures', false),
  ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "app buckets: authenticated read" on storage.objects
  for select to authenticated using (bucket_id in ('photos', 'signatures', 'documents'));
create policy "app buckets: authenticated insert" on storage.objects
  for insert to authenticated with check (bucket_id in ('photos', 'signatures', 'documents'));
create policy "app buckets: authenticated update" on storage.objects
  for update to authenticated using (bucket_id in ('photos', 'signatures', 'documents'));
create policy "app buckets: authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id in ('photos', 'signatures', 'documents'));
