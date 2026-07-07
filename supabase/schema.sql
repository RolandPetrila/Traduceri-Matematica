-- Supabase schema — Sistem Traduceri Matematica (v4)
-- Ruleaza acest SQL in Supabase Dashboard → SQL Editor.
-- Rol: DOAR log-uri diagnostic + coduri de eroare + contor Gemini. FARA autentificare.

-- ─────────────────────────────────────────────────────────────
-- 1. Tabela logs — log-uri diagnostic cross-device
-- ─────────────────────────────────────────────────────────────
create table if not exists public.logs (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  level       text        not null default 'info',   -- error | warn | info | action
  error_code  text,                                   -- ex. E-OCR-001
  message     text,
  source      text,
  page        text,
  device      jsonb,
  context     jsonb,
  stack       text
);

create index if not exists logs_created_at_idx on public.logs (created_at desc);
create index if not exists logs_level_idx      on public.logs (level);
create index if not exists logs_error_code_idx on public.logs (error_code);

-- Retentie: pastreaza doar ultimele 30 zile (ruleaza periodic sau via pg_cron).
-- delete from public.logs where created_at < now() - interval '30 days';

-- ─────────────────────────────────────────────────────────────
-- 2. Tabela gemini_counter — contor zilnic apeluri Gemini
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gemini_counter (
  date  date primary key,
  count integer not null default 0
);

-- Increment ATOMIC (upsert) — evita race intre invocari serverless concurente.
create or replace function public.increment_gemini(d date)
returns void
language sql
as $$
  insert into public.gemini_counter (date, count)
  values (d, 1)
  on conflict (date) do update set count = public.gemini_counter.count + 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS — fara auth. Accesul din browser NU exista direct:
--    frontend-ul scrie/citeste log-uri DOAR prin ruta Next server-side
--    (service-role key, ascunsa). Backend-ul Python foloseste service-role.
--    Activam RLS si NU adaugam policy pt anon → anon nu are acces.
--    Service-role bypass-uieaza RLS automat.
-- ─────────────────────────────────────────────────────────────
alter table public.logs           enable row level security;
alter table public.gemini_counter enable row level security;
-- (fara policy pt anon: doar service-role poate citi/scrie)
