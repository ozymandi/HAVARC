-- The project was created with "Automatically expose new tables" OFF, so the Data API roles
-- get no privileges on new tables by default. RLS policies alone are not enough — the role
-- also needs table-level GRANTs. Only `authenticated` gets them: the app always has a
-- session, the anonymous role stays locked out. service_role bypasses RLS anyway.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
