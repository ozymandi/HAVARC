-- Seed: the sample data the frontend has been using (src/data/mockJobs.ts) so the app is
-- populated from the first sign-in. Photos and PDFs are not seeded — those need real files
-- in Storage, which arrive with steps 3 and 6.

insert into public.settings (id, company_name, tagline, phone, email, address, default_tax_rate, labor_rate, next_invoice_number, invoice_prefix, invoice_footer, notify_email)
values (true, 'Hav'' Arc Heating and Air', 'Getting the job done right the first time.', '678-750-0411', 'hav.arcservices@gmail.com',
        '202 Spring Cir, Stockbridge, GA 30281', 0, 80, 649, '',
        'We appreciate your business! If you have any questions, please contact us at 678-750-0411.', 'ozymandiuz@gmail.com')
on conflict (id) do nothing;

insert into public.customers (name, address, phone, notes) values
  ('Brenda Johnson',        '1997 Ashley Pl, Riverdale GA',           '770-994-8768', 'Gate code 4471#. Key box by the side door. Dog in the backyard — call before entering.'),
  ('Trillium Urban Remedy', '202 Spring Cir, Stockbridge GA',         null, null),
  ('Piedmont Dental Group', '450 Mt Zion Rd, Jonesboro GA 30236',     '770-994-8768', 'Gate code 4471#. Key box by the side door. Dog in the backyard — call before entering.'),
  ('Marcus Reed',           '88 Lakeview Dr, McDonough GA',           null, null),
  ('Sunrise Daycare',       '15 Eagles Landing Pkwy, Stockbridge GA', null, null);

insert into public.jobs (work_order, customer_id, customer_name, address, technician, job_date, service_type, complaints, complaint_details, customer_notes, status, step, final_status, customer_rep_name, completed_at)
select v.work_order, c.id, v.customer_name, v.address, 'T. Holloway', v.job_date, v.service_type, v.complaints, v.complaint_details, c.notes, v.status::public.job_status, v.step, v.final_status::public.final_status, v.rep, v.completed_at
from (values
  ('WO-10031', 'Brenda Johnson',        '1997 Ashley Pl, Riverdale GA',           date '2026-09-02', 'Diagnostic / Repair Call', array['No Cooling'], 'No cooling on the rooftop unit since Monday. Thermostat reads 82°F, fan runs but no cold air.', 'draft',     2, null,     null,                     null::timestamptz),
  ('WO-10030', 'Trillium Urban Remedy', '202 Spring Cir, Stockbridge GA',         date '2026-09-02', 'Preventive Maintenance',   array[]::text[],    null,                                                                                             'pending',   4, 'green',  'Trillium Urban Remedy',  timestamptz '2026-09-02 15:10-04'),
  ('WO-10029', 'Piedmont Dental Group', '450 Mt Zion Rd, Jonesboro GA 30236',     date '2026-08-29', 'Preventive Maintenance',   array[]::text[],    null,                                                                                             'completed', 4, 'green',  'Piedmont Dental Group',  timestamptz '2026-08-29 14:40-04'),
  ('WO-10028', 'Marcus Reed',           '88 Lakeview Dr, McDonough GA',           date '2026-08-27', 'Diagnostic / Repair Call', array['No Heating'], null,                                                                                            'completed', 4, 'yellow', 'Marcus Reed',            timestamptz '2026-08-27 11:05-04'),
  ('WO-10027', 'Sunrise Daycare',       '15 Eagles Landing Pkwy, Stockbridge GA', date '2026-08-26', 'Preventive Maintenance',   array[]::text[],    null,                                                                                             'completed', 4, 'green',  'Sunrise Daycare',        timestamptz '2026-08-26 15:20-04')
) as v(work_order, customer_name, address, job_date, service_type, complaints, complaint_details, status, step, final_status, rep, completed_at)
join public.customers c on lower(c.name) = lower(v.customer_name);

-- WO-10029 · the fully worked example (matches the Job Detail summary in the app)
insert into public.equipment (job_id, position, equipment_id, location, type, manufacturer, model, serial, tonnage, refrigerant, voltage, filter_size)
select id, 1, 'RTU-2', 'Roof', 'RTU', 'Carrier', '48TC', '2419C44521', '3', 'R-410A', '208/230V · 1Ø', '20 × 25 × 1' from public.jobs where work_order = 'WO-10029';

insert into public.readings (job_id, return_air, supply_air, temp_split, suction_psig, head_psig, superheat, subcooling, filter_check, drain_check, ductwork_check, heating_check)
select id, '76', '57', '19', '118', '330', '12', '9', 'good', 'good', 'good', 'good' from public.jobs where work_order = 'WO-10029';

insert into public.job_findings (job_id, findings, repairs, recommendations, service_notes, parts, recommended_work)
select id, array['No Defects Found'], array['Coil Cleaning', 'Part Replaced'], array['No Further Action'],
       'Routine maintenance. Condenser coil cleaned, filter changed, all readings within range.', '1 × 20×25×1 filter', null
from public.jobs where work_order = 'WO-10029';

insert into public.invoices (job_id, number, tax_rate, discount, description)
select id, '646', 0, 0, 'Preventive maintenance visit: condenser coil cleaning and filter replacement. System operating normally.'
from public.jobs where work_order = 'WO-10029';

insert into public.invoice_items (job_id, position, description, qty, unit_price, customer_paid)
select id, v.position, v.description, v.qty, v.unit_price, false
from public.jobs, (values (1, 'Service call', 1, 89.00), (2, 'Labor', 1.25, 80.00)) as v(position, description, qty, unit_price)
where work_order = 'WO-10029';

-- WO-10031 · the draft in progress (Steps 1–2 filled)
insert into public.equipment (job_id, position, equipment_id, location, type, manufacturer, model, serial, tonnage, refrigerant, voltage, filter_size)
select id, 1, 'RTU-1', 'Roof', 'RTU', 'RUUD', 'UAKA-037JAZ', '5429-M109609450', '3', 'R-410A', '208/230V · 1Ø', '20 × 25 × 1' from public.jobs where work_order = 'WO-10031';

-- WO-10028 / WO-10027 · completed with minimal detail
insert into public.job_findings (job_id, findings, repairs, recommendations)
select id, array['Failed / Weak Capacitor'], array['Part Replaced'], array['Repair Recommended'] from public.jobs where work_order = 'WO-10028';
insert into public.job_findings (job_id, findings, repairs, recommendations)
select id, array['No Defects Found'], array['Coil Cleaning'], array['No Further Action'] from public.jobs where work_order = 'WO-10027';
insert into public.invoices (job_id, number, tax_rate, discount) select id, '645', 0, 0 from public.jobs where work_order = 'WO-10028';
insert into public.invoices (job_id, number, tax_rate, discount) select id, '644', 0, 0 from public.jobs where work_order = 'WO-10027';
