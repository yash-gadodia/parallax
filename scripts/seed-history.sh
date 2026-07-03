#!/usr/bin/env bash
# Backfills played history for a LOCAL couple so the history-rich features
# (streak surface, Wrapped, On This Day, share-card week dots, drop detail,
# catch-up/streak-repair) are testable without waiting real days.
#
# LOCAL ONLY — writes straight to the local Supabase DB. Idempotent: dates
# that already have a couple_drop are skipped. Answers are deterministic
# (seeded from day-of-year + prompt position) so waves vary day to day.
#
# Usage: ./scripts/seed-history.sh [email] [days] [--lapsed]
#   email     a member of the couple (default test@parallax.app)
#   days      past days to backfill, ending yesterday (default 14)
#   --lapsed  end the chain at the day BEFORE yesterday and mark the streak
#             lapsed (freezes exhausted), so the catch-up + streak-repair
#             flow is testable right now via yesterday's drop.
#
# Prereq: a PAIRED couple (both members real users). Pair with:
#   ./scripts/seed-test-user.sh                 # test@parallax.app
#   ./scripts/seed-test-user.sh dani@parallax.app parallax123 "Dani"
#   then create + redeem the invite code in the app.
set -euo pipefail
cd "$(dirname "$0")/.."

EMAIL="test@parallax.app"
DAYS=14
LAPSED=0
for a in "$@"; do
  if [ "$a" = "--lapsed" ]; then LAPSED=1
  elif [[ "$a" =~ ^[0-9]+$ ]]; then DAYS="$a"
  elif [[ "$a" =~ ^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+$ ]]; then EMAIL="$a"
  else echo "❌ Unrecognized argument: $a"; exit 1; fi
done

eval "$(supabase status -o env 2>/dev/null | sed 's/^/export /')" || true
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

run_sql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DB_URL" -v ON_ERROR_STOP=1 -q
  else
    docker exec -i "$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1)" \
      psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q
  fi
}

echo "🌱 Backfilling $DAYS day(s) of history for $EMAIL (lapsed=$LAPSED)…"

run_sql <<SQL
do \$seed\$
declare
  v_user uuid;
  v_couple uuid;
  v_a uuid;
  v_b uuid;
  v_tz text;
  v_yesterday date;
  v_end date;
  v_start date;
  v_drops uuid[];
  v_n int;
  v_i int := 0;
  v_seeded int := 0;
  v_chain int;
  d date;
  v_cd uuid;
  v_drop uuid;
  v_doy int;
  v_pick_a int;
  v_pick_b int;
  v_hunch_a int;
  v_hunch_b int;
  p record;
begin
  select id into v_user from auth.users where email = '$EMAIL';
  if v_user is null then
    raise exception 'no local user with email $EMAIL — run ./scripts/seed-test-user.sh first';
  end if;

  select c.id, c.member_a, c.member_b, coalesce(c.tz, 'Asia/Singapore')
    into v_couple, v_a, v_b, v_tz
  from public.couples c
  where (c.member_a = v_user or c.member_b = v_user)
    and c.member_a is not null and c.member_b is not null
  order by c.created_at desc
  limit 1;
  if v_couple is null then
    raise exception 'user has no paired couple — create + redeem an invite code in the app first';
  end if;

  v_yesterday := (now() at time zone v_tz)::date - 1;
  v_end := case when $LAPSED = 1 then v_yesterday - 1 else v_yesterday end;
  v_start := v_end - ($DAYS - 1);

  if $LAPSED = 1 and exists (
    select 1 from public.couple_drops
    where couple_id = v_couple and date = v_yesterday and state = 'revealed'
  ) then
    raise exception 'yesterday is already revealed for this couple — a lapsed state would be incoherent. Reset first: supabase db reset && ./scripts/seed-test-user.sh';
  end if;

  select array_agg(id order by position) into v_drops
  from public.drops
  where position is not null
    and id not in (select drop_id from public.couple_drops where couple_id = v_couple);
  if coalesce(array_length(v_drops, 1), 0) = 0 then
    select array_agg(id order by position) into v_drops
    from public.drops where position is not null;
  end if;
  v_n := array_length(v_drops, 1);
  if v_n is null then
    raise exception 'drops catalog is empty — run supabase db reset';
  end if;

  d := v_start;
  while d <= v_end loop
    if not exists (select 1 from public.couple_drops where couple_id = v_couple and date = d) then
      v_drop := v_drops[1 + (v_i % v_n)];
      v_i := v_i + 1;

      insert into public.couple_drops (couple_id, drop_id, date, state, created_at)
      values (v_couple, v_drop, d, 'revealed', d::timestamptz + interval '9 hours')
      returning id into v_cd;

      v_doy := extract(doy from d)::int;
      for p in
        select dp.id, coalesce(dp.position, 0) as pos,
               greatest(coalesce(array_length(dp.options, 1), 2), 2) as n
        from public.drop_prompts dp
        where dp.drop_id = v_drop
      loop
        v_pick_a := (v_doy + p.pos) % p.n;
        v_pick_b := (v_doy * 2 + p.pos) % p.n;
        v_hunch_a := case when (v_doy + p.pos) % 3 = 0 then (v_pick_b + 1) % p.n else v_pick_b end;
        v_hunch_b := case when (v_doy + p.pos) % 4 = 0 then (v_pick_a + 1) % p.n else v_pick_a end;

        insert into public.answers (couple_drop_id, prompt_id, author, pick, hunch, created_at)
        values
          (v_cd, p.id, v_a, v_pick_a, v_hunch_a, d::timestamptz + interval '20 hours'),
          (v_cd, p.id, v_b, v_pick_b, v_hunch_b, d::timestamptz + interval '21 hours')
        on conflict (couple_drop_id, prompt_id, author) do nothing;
      end loop;

      update public.couple_drops set wave_pct = public._wave_pct(v_cd) where id = v_cd;

      insert into public.activity (couple_id, kind, actor, payload, created_at)
      values (v_couple, 'played', v_a, '{}', d::timestamptz + interval '21 hours');

      v_seeded := v_seeded + 1;
    end if;
    d := d + 1;
  end loop;

  -- Length of the consecutive revealed chain ending at v_end (first gap stops it).
  select coalesce(min(g.offs), 366) into v_chain
  from generate_series(0, 365) as g(offs)
  where not exists (
    select 1 from public.couple_drops cd
    where cd.couple_id = v_couple and cd.date = v_end - g.offs and cd.state = 'revealed'
  );

  if $LAPSED = 1 then
    update public.couples
    set streak = 0,
        longest_streak = greatest(coalesce(longest_streak, 0), v_chain),
        lapsed_streak = v_chain,
        lapsed_on = v_yesterday + 1,
        last_played_on = v_end,
        freezes_remaining = 0,
        status = 'active'
    where id = v_couple;
    raise notice 'Seeded % day(s). Chain of % ended %; streak LAPSED — open the app to catch up on yesterday.', v_seeded, v_chain, v_end;
  else
    update public.couples
    set streak = v_chain,
        longest_streak = greatest(coalesce(longest_streak, 0), v_chain),
        lapsed_streak = null,
        lapsed_on = null,
        last_played_on = v_end,
        status = 'active'
    where id = v_couple;
    raise notice 'Seeded % day(s). Streak = % ending % — play today to extend it.', v_seeded, v_chain, v_end;
  end if;
end
\$seed\$;
SQL

echo "✅ Done."
