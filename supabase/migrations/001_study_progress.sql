create table if not exists public.study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{"attempts": {}, "wrong": {}, "game": {}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_progress enable row level security;

drop policy if exists "Users can read their own progress" on public.study_progress;
create policy "Users can read their own progress"
on public.study_progress for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own progress" on public.study_progress;
create policy "Users can create their own progress"
on public.study_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.study_progress;
create policy "Users can update their own progress"
on public.study_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own progress" on public.study_progress;
create policy "Users can delete their own progress"
on public.study_progress for delete
using (auth.uid() = user_id);

create or replace function public.set_study_progress_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists study_progress_updated_at on public.study_progress;
create trigger study_progress_updated_at
before update on public.study_progress
for each row execute function public.set_study_progress_updated_at();
