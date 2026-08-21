-- BoardBagFees: traveler baggage outcome / damage reporting migration
-- Run once in Supabase SQL Editor before deploying the matching site build.

alter table public.airline_traveler_reviews
  add column if not exists baggage_outcome text,
  add column if not exists claim_filed boolean,
  add column if not exists claim_outcome text,
  add column if not exists damage_details text;

-- Keep accepted values predictable for community statistics.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'airline_traveler_reviews_baggage_outcome_check'
  ) then
    alter table public.airline_traveler_reviews
      add constraint airline_traveler_reviews_baggage_outcome_check
      check (baggage_outcome is null or baggage_outcome in (
        'no_issue','minor_damage','major_damage','board_broken','delayed','lost'
      ));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'airline_traveler_reviews_claim_outcome_check'
  ) then
    alter table public.airline_traveler_reviews
      add constraint airline_traveler_reviews_claim_outcome_check
      check (claim_outcome is null or claim_outcome in (
        'pending','paid_full','paid_partial','denied','not_pursued'
      ));
  end if;
end $$;

create index if not exists airline_traveler_reviews_approved_outcome_idx
  on public.airline_traveler_reviews (airline_slug, baggage_outcome)
  where status = 'approved';

comment on column public.airline_traveler_reviews.baggage_outcome is
  'Traveler-reported board/bag outcome: no_issue, minor_damage, major_damage, board_broken, delayed, or lost.';
comment on column public.airline_traveler_reviews.claim_filed is
  'Whether the traveler says they filed a baggage damage/delay/loss claim.';
comment on column public.airline_traveler_reviews.claim_outcome is
  'Optional traveler-reported claim outcome.';
comment on column public.airline_traveler_reviews.damage_details is
  'Optional details about damage, delay/loss, and claim handling.';
