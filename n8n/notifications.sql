-- Apply once in the existing Supabase project. No study_progress data is changed.
create table if not exists public.study_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('daily', 'weekly')),
  period date not null,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (user_id, kind, period)
);
alter table public.study_notification_deliveries enable row level security;
revoke all on public.study_notification_deliveries from anon, authenticated;
grant select, insert, update, delete on public.study_notification_deliveries to service_role;
