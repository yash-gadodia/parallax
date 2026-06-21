-- RLS and function tests using pgTAP
-- Tests data integrity, RLS policies, and pairing functions

begin;
  create extension if not exists pgtap;
  select no_plan();

  -- ========================================================================
  -- SETUP: Create test users and their profiles
  -- ========================================================================

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'alice@test.com', '', now(), now(), now()),
    ('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'bob@test.com', '', now(), now(), now()),
    ('33333333-3333-3333-3333-333333333333'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'charlie@test.com', '', now(), now(), now())
  on conflict do nothing;

  insert into public.profiles (id, display_name)
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'Alice'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'Bob'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'Charlie')
  on conflict (id) do update set display_name = excluded.display_name;

  -- Clean up test couples from previous runs
  delete from public.couples where invite_code in ('TEST-0001', 'TEST-0002', 'TEST-X');

  -- ========================================================================
  -- TEST GROUP 1: Couple Creation (via direct insert, RLS policy prevents normal INSERT)
  -- ========================================================================

  insert into public.couples (member_a, invite_code, status)
  select '11111111-1111-1111-1111-111111111111'::uuid, 'TEST-0001', 'pending';

  select is(
    (select status from public.couples where invite_code = 'TEST-0001'),
    'pending'::text,
    'couple created with pending status'
  );

  select ok(
    (select id from public.couples where invite_code = 'TEST-0001') IS NOT NULL,
    'couple has a valid uuid id'
  );

  select is(
    (select member_a from public.couples where invite_code = 'TEST-0001'),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'couple member_a is creator'
  );

  select ok(
    (select member_b from public.couples where invite_code = 'TEST-0001') IS NULL,
    'couple member_b is null (pending)'
  );

  -- ========================================================================
  -- TEST GROUP 2: Manually Activate Couple (join_couple requires auth context)
  -- ========================================================================

  -- In production, join_couple(code) is called by authenticated users.
  -- Here we manually create an active couple to test RLS and data integrity
  update public.couples
  set member_b = '22222222-2222-2222-2222-222222222222'::uuid,
      status = 'active',
      together_since = current_date
  where invite_code = 'TEST-0001';

  select is(
    (select status from public.couples where invite_code = 'TEST-0001'),
    'active'::text,
    'couple can be activated (status = active)'
  );

  select is(
    (select member_b from public.couples where invite_code = 'TEST-0001'),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'couple has member_b set after activation'
  );

  select is(
    (select together_since from public.couples where invite_code = 'TEST-0001'),
    current_date::date,
    'couple has together_since set to today'
  );

  -- ========================================================================
  -- TEST GROUP 3: Couples Table Structure and Constraints
  -- ========================================================================

  select is(
    (select count(*) from public.couples)::int,
    1,
    'test couple exists in database'
  );

  select ok(
    (select invite_code from public.couples where invite_code = 'TEST-0001') is not null,
    'TEST-0001 couple has invite_code'
  );

  -- Verify status constraint
  select ok(
    not exists(select 1 from public.couples where status not in ('pending', 'active')),
    'all couples have valid status (pending or active)'
  );

  -- ========================================================================
  -- TEST GROUP 4: Profiles Table (RLS policy structure verification)
  -- ========================================================================

  select is(
    (select count(*) from public.profiles where display_name in ('Alice', 'Bob', 'Charlie'))::int,
    3,
    'all three test profiles exist'
  );

  select ok(
    exists(select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
    'Alice profile exists'
  );

  select ok(
    exists(select 1 from public.profiles where id = '22222222-2222-2222-2222-222222222222'::uuid),
    'Bob profile exists'
  );

  select ok(
    exists(select 1 from public.profiles where id = '33333333-3333-3333-3333-333333333333'::uuid),
    'Charlie profile exists'
  );

  -- ========================================================================
  -- TEST GROUP 5: RLS Policy Verification
  -- ========================================================================
  -- Note: RLS policies are verified via integration tests (REST API)
  -- Here we verify the policies are defined correctly

  select ok(
    exists(
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'couples'
        and policyname = 'select_own_couple'
    ),
    'select_own_couple RLS policy exists'
  );

  select ok(
    exists(
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
        and policyname = 'select_own_profile'
    ),
    'select_own_profile RLS policy exists'
  );

  select ok(
    exists(
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
        and policyname = 'select_partner_profile'
    ),
    'select_partner_profile RLS policy exists'
  );

  -- ========================================================================
  -- TEST GROUP 6: Data Integrity Across Pairing
  -- ========================================================================

  -- Verify the active couple connects exactly 2 people
  select is(
    (select count(*) from public.couples where status = 'active' and member_a is not null and member_b is not null)::int,
    1,
    'exactly 1 active couple with both members'
  );

  -- Verify profiles exist for both active couple members
  select ok(
    exists(
      select 1 from public.profiles p
      inner join public.couples c on c.member_a = p.id
      where c.status = 'active'
    ),
    'active couple member_a has profile'
  );

  select ok(
    exists(
      select 1 from public.profiles p
      inner join public.couples c on c.member_b = p.id
      where c.status = 'active'
    ),
    'active couple member_b has profile'
  );

  -- ========================================================================
  -- SUMMARY
  -- ========================================================================

  select finish();
rollback;
