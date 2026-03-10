-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists public.game_results (
  id             uuid        primary key default gen_random_uuid(),
  game_type      text        not null,
  -- 'trivia' | 'rps' | 'memorymatch' | 'tictactoe' | 'connect4'
  -- 'wordscramble' | 'pictionary' | 'mathduel'
  player_email   text        not null,
  player_name    text        not null,   -- 'Ronit' | 'Radhika' | 'Shizz'
  result         text        not null,   -- 'win' | 'loss' | 'draw'
  score          integer     default 0,
  opponent_email text,
  opponent_name  text,
  mode           text        default 'solo',  -- 'solo' | 'vs-partner' | 'vs-ai'
  created_at     timestamptz default now()
);

-- ── Indexes for fast leaderboard queries ─────────────────────
create index if not exists idx_gr_player  on public.game_results(player_email);
create index if not exists idx_gr_game    on public.game_results(game_type);
create index if not exists idx_gr_created on public.game_results(created_at desc);
create index if not exists idx_gr_result  on public.game_results(result);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.game_results enable row level security;

-- Leaderboard is readable by everyone inside the app (anon key)
create policy "allow_read"
  on public.game_results for select using (true);

-- Any authenticated insert is allowed (player_email is set by client)
create policy "allow_insert"
  on public.game_results for insert with check (true);

-- ── Helper view: per-player per-game summary ─────────────────
create or replace view public.leaderboard_summary as
select
  player_email,
  player_name,
  game_type,
  count(*)                                        as games_played,
  count(*) filter (where result = 'win')          as wins,
  count(*) filter (where result = 'loss')         as losses,
  count(*) filter (where result = 'draw')         as draws,
  coalesce(sum(score), 0)                         as total_score,
  round(
    count(*) filter (where result = 'win')::numeric
    / nullif(count(*), 0) * 100, 1
  )                                               as win_rate
from public.game_results
group by player_email, player_name, game_type;
