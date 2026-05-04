-- OlivierPilot - Supabase schema (MVP, single farm)
-- Apply in Supabase SQL editor.

create table if not exists public.farm_settings (
  id uuid primary key default gen_random_uuid(),
  surface_ha numeric not null default 0,
  prix_kg_olives numeric not null default 0,
  pluviometrie_annuelle_mm numeric null default 300,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tree_types (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  rendement_max_kg_par_arbre numeric not null default 20,
  is_intensive boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type_id uuid not null references public.tree_types(id) on delete restrict,
  date_plantation date not null,
  nb_arbres int not null check (nb_arbres >= 0),
  irrigation text not null check (irrigation in ('non_irrigue','faible','normal','optimal')),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  montant numeric not null default 0,
  categorie text not null,
  lot_id uuid null references public.batches(id) on delete set null,
  note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  montant_mensuel numeric not null default 0,
  categorie text not null,
  debut date not null,
  fin date null,
  lot_id uuid null references public.batches(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- MVP: open access (no auth). For production, enable RLS and scope by user_id/farm_id.
alter table public.farm_settings disable row level security;
alter table public.tree_types disable row level security;
alter table public.batches disable row level security;
alter table public.expenses disable row level security;
alter table public.recurring_expenses disable row level security;
alter table public.scenarios disable row level security;

