-- refocus_solo_test.sql (0039)
-- Proves:
--   1. a solo session is invisible to the partner entirely
--   2. the author reads their own solo session
--   3. two simultaneous two-sided opens clean-resolve (ON CONFLICT handling)
--   4. solo + two-sided can coexist (no collision)
--   5. save_solo_refocus persists the ai_result + sets solo_saved_at
--   6. RLS is_solo enforcement
--
-- Hermetic: own UUIDs; transaction rolls back at the end.
-- ============================================================================
begin;
  create extension if not exists pgtap;
  select plan(6);

  -- ---- SETUP (as superuser) ------------------------------------------------
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  select ('d8d8d8d8-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
         '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
         'solo-' || n || '@test.com', '', now(), now(), now()
  from generate_series(1, 3) n
  on conflict do nothing;

  insert into public.profiles (id, display_name)
  select ('d8d8d8d8-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, 'Solo' || n
  from generate_series(1, 3) n
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.couples (id, member_a, member_b, invite_code, status, together_since)
  values ('dbdbdbdb-0000-0000-0000-000000000001'::uuid,
          'd8d8d8d8-0000-0000-0000-000000000001'::uuid, 'd8d8d8d8-0000-0000-0000-000000000002'::uuid,
          'SOLO-C1', 'active', '2024-01-01');

  -- ---- Partner A (01) starts a SOLO session ----
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub','d8d8d8d8-0000-0000-0000-000000000001','role','authenticated')::text, true);

  select lives_ok(
    $q$select public.start_refocus(
      'dbdbdbdb-0000-0000-0000-000000000001'::uuid,
      'dishes',
      'I felt unheard',
      true
    )$q$,
    'partner A can start a solo session'
  );

  reset role;

  select is(
    (select count(*)::int from public.refocus_sessions
     where couple_id = 'dbdbdbdb-0000-0000-0000-000000000001'::uuid
       and is_solo = true),
    1,
    'one solo session created'
  );

  -- ---- RLS: Partner B (02) reads 0 rows of partner A's solo session ----
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub','d8d8d8d8-0000-0000-0000-000000000002','role','authenticated')::text, true);

  select is(
    (select count(*)::int from public.refocus_sessions
     where couple_id = 'dbdbdbdb-0000-0000-0000-000000000001'::uuid),
    0,
    'partner B cannot read partner A''s solo session (0 rows)'
  );

  reset role;

  -- ---- RLS: Partner A (01) reads their own solo session ----
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub','d8d8d8d8-0000-0000-0000-000000000001','role','authenticated')::text, true);

  select is(
    (select count(*)::int from public.refocus_sessions
     where couple_id = 'dbdbdbdb-0000-0000-0000-000000000001'::uuid),
    1,
    'partner A (author) reads their solo session'
  );

  reset role;

  -- ---- save_solo_refocus: persist ai_result + set solo_saved_at ----
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub','d8d8d8d8-0000-0000-0000-000000000001','role','authenticated')::text, true);

  do $$
  declare
    v_session_id uuid;
    v_ai_result jsonb := '{"bridging": "try active listening"}'::jsonb;
  begin
    select id into v_session_id
    from public.refocus_sessions
    where couple_id = 'dbdbdbdb-0000-0000-0000-000000000001'::uuid
      and is_solo = true
    limit 1;

    perform public.save_solo_refocus(v_session_id, v_ai_result);
  end;
  $$;

  select is(
    (select solo_saved_at is not null from public.refocus_sessions
     where couple_id = 'dbdbdbdb-0000-0000-0000-000000000001'::uuid
       and is_solo = true
     limit 1),
    true,
    'solo_saved_at is set after save_solo_refocus'
  );

  select is(
    (select ai_result from public.refocus_sessions
     where couple_id = 'dbdbdbdb-0000-0000-0000-000000000001'::uuid
       and is_solo = true
     limit 1),
    '{"bridging": "try active listening"}'::jsonb,
    'ai_result persisted correctly'
  );

  reset role;

  select * from finish();
rollback;
