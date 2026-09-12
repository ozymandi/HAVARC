-- Backend step 5: invoice numbers are assigned on the server, sequentially, the moment a
-- job is completed. The counter is settings.next_invoice_number (editable in Settings,
-- with settings.invoice_prefix in front); the row is locked while a number is taken so
-- two technicians completing jobs at the same second cannot get the same number.
-- Until completion the invoice has no number and the app shows "Draft".

create or replace function public.assign_invoice_number(p_job_id uuid)
returns void language plpgsql as $$
declare
  v_status  public.job_status;
  v_next    integer;
  v_prefix  text;
  v_number  text;
begin
  select status into v_status from public.jobs where id = p_job_id;
  if v_status is distinct from 'completed' then return; end if;
  if not exists (select 1 from public.invoices where job_id = p_job_id and number is null) then return; end if;

  select next_invoice_number, coalesce(invoice_prefix, '')
    into v_next, v_prefix
    from public.settings where id = true
    for update;
  if not found then return; end if;

  -- Skip numbers that already exist (Settings lets the counter be set back by hand).
  loop
    v_number := v_prefix || v_next::text;
    exit when not exists (select 1 from public.invoices where number = v_number);
    v_next := v_next + 1;
  end loop;

  update public.invoices set number = v_number where job_id = p_job_id and number is null;
  update public.settings set next_invoice_number = v_next + 1 where id = true;
end $$;

-- The app writes the job row first and the invoice row right after, in either order on
-- edits — so both tables trigger the assignment; the function itself is a no-op unless
-- the job is completed and its invoice still has no number.
create or replace function public.jobs_assign_invoice_number()
returns trigger language plpgsql as $$
begin
  perform public.assign_invoice_number(new.id);
  return new;
end $$;

create trigger jobs_assign_invoice_number
  after insert or update of status on public.jobs
  for each row when (new.status = 'completed')
  execute function public.jobs_assign_invoice_number();

create or replace function public.invoices_assign_invoice_number()
returns trigger language plpgsql as $$
begin
  perform public.assign_invoice_number(new.job_id);
  return new;
end $$;

create trigger invoices_assign_invoice_number
  after insert or update on public.invoices
  for each row when (new.number is null)
  execute function public.invoices_assign_invoice_number();

-- Seeded, already-completed jobs keep the numbers the seed gave them (644–646); the
-- counter stays at 649 as seeded.
