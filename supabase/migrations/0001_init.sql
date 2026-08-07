-- Keren Amar | ניהול תורים ותזרים
-- Initial schema: treatments, clients, appointments, treatment_log,
-- product_sales, expense_categories, expenses, weekly_goals.
-- All tables are protected by RLS scoped to auth.uid() (single user app,
-- but modeled correctly for future multi-user use).

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- treatments (מחירון)
-- ---------------------------------------------------------------------
create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  name text not null,
  price numeric(10,2),
  price_note text,
  duration_minutes integer,
  is_series boolean not null default false,
  series_size integer,
  series_price numeric(10,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.treatments enable row level security;

create policy "treatments_select_own" on public.treatments
  for select using (auth.uid() = user_id);
create policy "treatments_insert_own" on public.treatments
  for insert with check (auth.uid() = user_id);
create policy "treatments_update_own" on public.treatments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "treatments_delete_own" on public.treatments
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- clients (לקוחות)
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients_select_own" on public.clients
  for select using (auth.uid() = user_id);
create policy "clients_insert_own" on public.clients
  for insert with check (auth.uid() = user_id);
create policy "clients_update_own" on public.clients
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "clients_delete_own" on public.clients
  for delete using (auth.uid() = user_id);

create index if not exists clients_user_name_idx on public.clients (user_id, name);

-- ---------------------------------------------------------------------
-- appointments (יומן תורים)
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  treatment_id uuid references public.treatments(id) on delete set null,
  treatment_name_freetext text,
  expected_price numeric(10,2),
  starts_at timestamptz not null,
  duration_minutes integer not null default 30,
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'cancelled', 'no_show')),
  notes text,
  -- set when this appointment was booked as a follow-up/series appointment
  -- suggested at the completion of another appointment (face-to-face moment)
  follow_up_of_appointment_id uuid references public.appointments(id) on delete set null,
  time_range tstzrange generated always as (
    tstzrange(starts_at, starts_at + make_interval(mins => duration_minutes), '[)')
  ) stored,
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "appointments_select_own" on public.appointments
  for select using (auth.uid() = user_id);
create policy "appointments_insert_own" on public.appointments
  for insert with check (auth.uid() = user_id);
create policy "appointments_update_own" on public.appointments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "appointments_delete_own" on public.appointments
  for delete using (auth.uid() = user_id);

-- Hard block on double-booking the exact same overlapping slot (typo
-- protection). Only "planned"/"completed" appointments occupy the calendar;
-- cancelled / no-show appointments free up the slot.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    user_id with =,
    time_range with &&
  )
  where (status in ('planned', 'completed'));

create index if not exists appointments_user_starts_idx on public.appointments (user_id, starts_at);
create index if not exists appointments_client_idx on public.appointments (client_id);

-- ---------------------------------------------------------------------
-- treatment_log (הכנסות בפועל - נוצר אך ורק מתוך תור)
-- ---------------------------------------------------------------------
create table if not exists public.treatment_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  treatment_id uuid references public.treatments(id) on delete set null,
  treatment_name text not null,
  amount numeric(10,2) not null,
  duration_minutes integer not null,
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'card', 'bit', 'transfer')),
  is_paid boolean not null default true,
  performed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.treatment_log enable row level security;

create policy "treatment_log_select_own" on public.treatment_log
  for select using (auth.uid() = user_id);
create policy "treatment_log_insert_own" on public.treatment_log
  for insert with check (auth.uid() = user_id);
create policy "treatment_log_update_own" on public.treatment_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "treatment_log_delete_own" on public.treatment_log
  for delete using (auth.uid() = user_id);

create index if not exists treatment_log_user_performed_idx on public.treatment_log (user_id, performed_at);

-- ---------------------------------------------------------------------
-- product_sales (מכירת מוצרים - קטגוריית הכנסה נפרדת)
-- ---------------------------------------------------------------------
create table if not exists public.product_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  treatment_log_id uuid references public.treatment_log(id) on delete set null,
  product_name text not null,
  amount numeric(10,2) not null,
  is_paid boolean not null default true,
  notes text,
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.product_sales enable row level security;

create policy "product_sales_select_own" on public.product_sales
  for select using (auth.uid() = user_id);
create policy "product_sales_insert_own" on public.product_sales
  for insert with check (auth.uid() = user_id);
create policy "product_sales_update_own" on public.product_sales
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "product_sales_delete_own" on public.product_sales
  for delete using (auth.uid() = user_id);

create index if not exists product_sales_user_sold_idx on public.product_sales (user_id, sold_at);

-- ---------------------------------------------------------------------
-- expense_categories
-- ---------------------------------------------------------------------
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  default_amount numeric(10,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.expense_categories enable row level security;

create policy "expense_categories_select_own" on public.expense_categories
  for select using (auth.uid() = user_id);
create policy "expense_categories_insert_own" on public.expense_categories
  for insert with check (auth.uid() = user_id);
create policy "expense_categories_update_own" on public.expense_categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expense_categories_delete_own" on public.expense_categories
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  description text,
  amount numeric(10,2) not null,
  notes text,
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses
  for delete using (auth.uid() = user_id);

create index if not exists expenses_user_spent_idx on public.expenses (user_id, spent_at);

-- ---------------------------------------------------------------------
-- weekly_goals (יעדים שבועיים - טיפולי פנים)
-- ---------------------------------------------------------------------
create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_start date not null,
  target_count integer not null,
  target_revenue numeric(10,2) not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_goals enable row level security;

create policy "weekly_goals_select_own" on public.weekly_goals
  for select using (auth.uid() = user_id);
create policy "weekly_goals_insert_own" on public.weekly_goals
  for insert with check (auth.uid() = user_id);
create policy "weekly_goals_update_own" on public.weekly_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_goals_delete_own" on public.weekly_goals
  for delete using (auth.uid() = user_id);
