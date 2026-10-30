-- AI Atlas · Supabase PostgreSQL 15+
-- Run once using Supabase migrations or SQL editor. No demo rows are inserted.
begin;
create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade,name text not null default 'Explorer' check(char_length(name) between 1 and 80),created_at timestamptz not null default now());
create table public.user_preferences(user_id uuid primary key references auth.users(id) on delete cascade,preferences jsonb not null default '{}'::jsonb check(jsonb_typeof(preferences)='object'),updated_at timestamptz not null default now());
create table public.integrations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,provider text not null check(provider in ('chatgpt','claude')),status text not null check(status in ('connected','pending','attention')),verified_at timestamptz,last_sync timestamptz,error text,cursor text,unique(user_id,provider),unique(id,user_id));
create table public.integration_secrets(integration_id uuid primary key references public.integrations(id) on delete cascade,encrypted_key jsonb not null,created_at timestamptz not null default now());
create table public.provider_accounts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,integration_id uuid not null,external_account_id text,foreign key(integration_id,user_id) references public.integrations(id,user_id) on delete cascade,unique(id,user_id));
create table public.work_categories(id text primary key,name text not null);
insert into public.work_categories(id,name) values ('Coding','Coding'),('Debugging','Debugging'),('Research','Research'),('Studying','Studying'),('Writing','Writing'),('Brainstorming','Brainstorming'),('Content Creation','Content Creation'),('Data Analysis','Data Analysis'),('Business Planning','Business Planning'),('General Assistance','General Assistance');
create table public.activity_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,external_id text not null check(char_length(external_id) between 1 and 160),provider text not null check(provider in ('chatgpt','claude','gemini','cursor','copilot','perplexity','other')),timestamp timestamptz not null,model text check(char_length(model)<=100),category text not null default 'General Assistance' references public.work_categories(id),tokens bigint check(tokens>=0 and tokens<=1000000000000),cost numeric(16,8) check(cost>=0 and cost<=1000000),source text not null check(source in ('csv','json','chatgpt-export','claude-export')),confidence real not null default 0 check(confidence between 0 and 1),classification_source text not null default 'unclassified' check(classification_source in ('metadata','user','unclassified')),classified_at timestamptz not null default now(),created_at timestamptz not null default now(),unique(user_id,provider,source,external_id),unique(id,user_id));
create index activity_user_timestamp on public.activity_events(user_id,timestamp desc);
create index activity_user_provider_category on public.activity_events(user_id,provider,category,timestamp desc);
create table public.classifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,activity_id uuid not null,category text not null references public.work_categories(id),confidence real not null check(confidence between 0 and 1),source text not null,classified_at timestamptz not null default now(),foreign key(activity_id,user_id) references public.activity_events(id,user_id) on delete cascade);
create table public.usage_snapshots(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,integration_id uuid not null,provider text not null,timestamp timestamptz not null,model text,requests bigint check(requests>=0),input_tokens bigint check(input_tokens>=0),output_tokens bigint check(output_tokens>=0),cost numeric(16,8) check(cost>=0),source text not null default 'official-api',measurement text not null default 'aggregate' check(measurement='aggregate'),metadata jsonb not null default '{}'::jsonb,foreign key(integration_id,user_id) references public.integrations(id,user_id) on delete cascade,unique nulls not distinct(user_id,provider,timestamp,model,source));
create index snapshots_user_date on public.usage_snapshots(user_id,timestamp desc);
create table public.insights(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,kind text not null,summary jsonb not null,generated_at timestamptz not null default now());
create table public.sync_jobs(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,integration_id uuid not null,status text not null default 'pending' check(status in ('pending','running','complete','failed')),cursor text,started_at timestamptz not null default now(),completed_at timestamptz,error text,foreign key(integration_id,user_id) references public.integrations(id,user_id) on delete cascade);
create table public.request_limits(user_id uuid not null references auth.users(id) on delete cascade,action text not null,window_start timestamptz not null,hits integer not null default 1,primary key(user_id,action));

-- Every user-owned table is RLS protected; privileged write surfaces stay service-only.
do $$ declare t text; begin
 foreach t in array array['profiles','user_preferences','integrations','integration_secrets','provider_accounts','activity_events','classifications','usage_snapshots','insights','sync_jobs','request_limits','work_categories'] loop execute format('alter table public.%I enable row level security',t);end loop;
 foreach t in array array['profiles','user_preferences','activity_events','classifications'] loop
 execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);end loop;
 foreach t in array array['integrations','provider_accounts','usage_snapshots','insights','sync_jobs'] loop
 execute format('create policy read_own on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('grant select on public.%I to authenticated',t);end loop;
end $$;
create policy disconnect_own on public.integrations for delete to authenticated using((select auth.uid())=user_id);
grant delete on public.integrations to authenticated;
create policy category_read on public.work_categories for select to authenticated using(true);
grant select on public.work_categories to authenticated;
-- Explicitly deny browser access to provider secrets and rate-counter tables.
revoke all on public.integration_secrets,public.request_limits from anon,authenticated;
grant all on all tables in schema public to service_role;

create function public.consume_rate_limit(p_action text,p_limit integer default 30) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;v_user uuid:=auth.uid();begin
 if v_user is null or p_action not in ('import','account','classification','delete-account','delete-data','connect','sync','disconnect') then return false;end if;
 -- Caller cannot raise the server maximum, even through direct PostgREST RPC.
 p_limit:=least(greatest(p_limit,1),case when p_action in ('connect','delete-account','delete-data') then 5 when p_action='import' then 10 else 60 end);
 insert into request_limits(user_id,action,window_start,hits) values(v_user,p_action,date_trunc('minute',now()),1)
 on conflict(user_id,action) do update set hits=case when request_limits.window_start=date_trunc('minute',now()) then request_limits.hits+1 else 1 end,window_start=date_trunc('minute',now()) returning hits into n;
 return n<=p_limit;end $$;
revoke all on function public.consume_rate_limit(text,integer) from public,anon;
grant execute on function public.consume_rate_limit(text,integer) to authenticated;

-- Atomic key persistence: only the trusted server may mark access as verified.
create function public.save_verified_integration(p_user uuid,p_provider text,p_secret jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;begin
 insert into integrations(user_id,provider,status,verified_at,error) values(p_user,p_provider,'connected',now(),null)
 on conflict(user_id,provider) do update set status='connected',verified_at=now(),error=null returning id into v_id;
 insert into integration_secrets(integration_id,encrypted_key) values(v_id,p_secret) on conflict(integration_id) do update set encrypted_key=excluded.encrypted_key;
 return v_id;end $$;
revoke all on function public.save_verified_integration(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_verified_integration(uuid,text,jsonb) to service_role;

create function public.purge_activity_data() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();begin
 if v_user is null then raise exception 'unauthorized';end if;
 delete from activity_events where user_id=v_user;
 delete from integrations where user_id=v_user;
 delete from insights where user_id=v_user;
end $$;
revoke all on function public.purge_activity_data() from public,anon;
grant execute on function public.purge_activity_data() to authenticated;

-- Auditable category correction history, ownership carried from the event row.
create function public.record_classification() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin insert into classifications(user_id,activity_id,category,confidence,source,classified_at) values(new.user_id,new.id,new.category,new.confidence,new.classification_source,new.classified_at);return new;end $$;
create trigger classification_audit after insert or update of category,confidence,classification_source on public.activity_events for each row execute function public.record_classification();
commit;
