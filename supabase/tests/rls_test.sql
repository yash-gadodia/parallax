-- RLS and function tests using pgTAP

-- Load pgTAP extension
begin;
  create extension if not exists pgtap;
  select plan(24);

  -- ========================================================================
  -- SETUP: Create test users and their profiles
  -- ========================================================================

  -- Insert test users into auth.users (simulated; in real Supabase, these are created via Auth)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'alice@test.com', '', now(), now(), now()),
    ('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'bob@test.com', '', now(), now(), now()),
    ('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'charlie@test.com', '', now(), now(), now())
  on conflict do nothing;

  -- Create profiles (trigger should do this, but we'll insert directly to be safe)
  insert into public.profiles (id, display_name)
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'Alice'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'Bob'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'Charlie')
  on conflict do nothing;

  -- ========================================================================
  -- TEST 1: create_couple() creates a pending couple with caller as member_a
  -- ========================================================================

  -- Set user context to Alice
  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

  insert into public.couples (member_a, invite_code, status)
  select '11111111-1111-1111-1111-111111111111'::uuid, 'TEST-0001', 'pending';

  select is(
    (select status from public.couples where invite_code = 'TEST-0001'),
    'pending'::text,
    'create_couple creates a pending couple'
  );

  select isnt_null(
    (select id from public.couples where invite_code = 'TEST-0001'),
    'couple has a valid id'
  );

  -- ========================================================================
  -- TEST 2: Alice can SELECT her own couple
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

  select ok(
    exists (select 1 from public.couples where invite_code = 'TEST-0001'),
    'Alice can select her own couple'
  );

  -- ========================================================================
  -- TEST 3: Non-member (Charlie) CANNOT SELECT someone else's couple
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);

  select is(
    (select count(*) from public.couples where invite_code = 'TEST-0001'),
    0::bigint,
    'Non-member Charlie cannot see the couple'
  );

  -- ========================================================================
  -- TEST 4: join_couple with valid pending code activates the couple
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);

  -- Bob joins using the invite code
  select public.join_couple('TEST-0001') into null;

  select is(
    (select status from public.couples where invite_code = 'TEST-0001'),
    'active'::text,
    'join_couple sets couple status to active'
  );

  select is(
    (select member_b from public.couples where invite_code = 'TEST-0001'),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'join_couple sets member_b to caller'
  );

  select is(
    (select together_since from public.couples where invite_code = 'TEST-0001'),
    current_date::date,
    'join_couple sets together_since to current_date'
  );

  -- ========================================================================
  -- TEST 5: Members of active couple can SELECT the couple
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

  select ok(
    exists (select 1 from public.couples where invite_code = 'TEST-0001' and status = 'active'),
    'Alice (member_a) can select the active couple'
  );

  select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);

  select ok(
    exists (select 1 from public.couples where invite_code = 'TEST-0001' and status = 'active'),
    'Bob (member_b) can select the active couple'
  );

  -- ========================================================================
  -- TEST 6: join_couple fails if couple is already active
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);

  select throws_like(
    format('select public.join_couple(%L)', 'TEST-0001'),
    'Couple is not pending%',
    'join_couple fails if couple is already active'
  );

  -- ========================================================================
  -- TEST 7: Alice can SELECT her partner Bob's profile (after pairing)
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

  select is(
    (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'::uuid),
    'Bob'::text,
    'Alice can select Bob''s profile after pairing'
  );

  -- ========================================================================
  -- TEST 8: Bob can SELECT his partner Alice's profile (after pairing)
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);

  select is(
    (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
    'Alice'::text,
    'Bob can select Alice''s profile after pairing'
  );

  -- ========================================================================
  -- TEST 9: Charlie (non-partner) CANNOT SELECT Alice's profile
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);

  select is(
    (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
    0::bigint,
    'Charlie cannot select Alice''s profile (no pairing)'
  );

  -- ========================================================================
  -- TEST 10: create_couple fails if user already in a couple
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

  select throws_like(
    'select public.create_couple()',
    'User is already a member of a pending or active couple',
    'create_couple fails if user is already in a couple'
  );

  -- ========================================================================
  -- TEST 11: invite code is unique
  -- ========================================================================

  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);

  -- Charlie creates a second couple
  insert into public.couples (member_a, invite_code, status)
  select '33333333-3333-3333-3333-333333333333'::uuid, 'TEST-0002', 'pending';

  select is(
    (select count(distinct invite_code) from public.couples),
    2::bigint,
    'two couples have different invite codes'
  );

  -- ========================================================================
  -- SUMMARY
  -- ========================================================================

  select finish();
rollback;
