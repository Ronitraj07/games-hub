-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.game_results (
  id          uuid primary key default gen_random_uuid(),
  game_type   text not null,           -- 'trivia' | 'rps' | 'memorymatch' | 'tictactoe' | 'connect4' | 'wordguess'
  player_email text not null,          -- raw email
  player_name  text not null,          -- 'Ronit' | 'Radhika' | 'Shizz'
  result       text not null,          -- 'win' | 'loss' | 'draw'
  score        integer default 0,
  opponent_email text,
  opponent_name  text,
  mode         text default 'solo',    -- 'solo' | 'vs-partner' | 'vs-ai'
  created_at   timestamptz default now()
);

-- index for fast per-player queries
create index if not exists idx_game_results_player on public.game_results(player_email);
create index if not exists idx_game_results_game   on public.game_results(game_type);
create index if not exists idx_game_results_created on public.game_results(created_at desc);

-- RLS: allow anon reads (leaderboard is public within the app), allow inserts from anyone
alter table public.game_results enable row level security;

create policy "allow_read"   on public.game_results for select using (true);
create policy "allow_insert" on public.game_results for insert with check (true);
