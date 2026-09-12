-- The project was created with "Automatically expose new tables" OFF, so service_role
-- (used only by the PDF function on Vercel) has no table privileges either — RLS bypass
-- alone is not enough. Mirror the authenticated grants from 0003 for service_role.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
