-- CampusFind database setup
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('lost', 'found')),
  category text not null,
  location text not null,
  date date not null,
  description text not null,
  image_url text,
  contact_email text not null,
  status text not null default 'open' check (status in ('open', 'returned')),
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (item_id, claimant_id)
);

alter table public.items enable row level security;
alter table public.claims enable row level security;

-- Anyone can browse item reports; only signed-in users can create reports.
create policy "Anyone can view items" on public.items
for select using (true);

create policy "Signed-in users can create their own items" on public.items
for insert to authenticated
with check (auth.uid() = user_id);

create policy "Owners can update their own items" on public.items
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete their own items" on public.items
for delete to authenticated
using (auth.uid() = user_id);

-- Claimants can submit and view their own claims. Item owners can view claims on their posts.
create policy "Users can submit claims as themselves" on public.claims
for insert to authenticated
with check (auth.uid() = claimant_id);

create policy "Claimants and item owners can view claims" on public.claims
for select to authenticated
using (
  auth.uid() = claimant_id
  or exists (
    select 1 from public.items
    where items.id = claims.item_id and items.user_id = auth.uid()
  )
);