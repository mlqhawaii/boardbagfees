-- BoardBagFees: separate traveler-reported board/bag handling rating
-- Safe to run after the v1 baggage-damage migration. Existing rows remain unchanged.

alter table public.airline_traveler_reviews
  add column if not exists handling_rating integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'airline_traveler_reviews_handling_rating_check'
  ) then
    alter table public.airline_traveler_reviews
      add constraint airline_traveler_reviews_handling_rating_check
      check (handling_rating is null or handling_rating between 1 and 5);
  end if;
end $$;

create index if not exists airline_traveler_reviews_approved_handling_rating_idx
  on public.airline_traveler_reviews (airline_slug, handling_rating)
  where status = 'approved' and handling_rating is not null;

comment on column public.airline_traveler_reviews.handling_rating is
  'Traveler-selected 1-5 rating specifically for how the airline handled the board/bag.';
