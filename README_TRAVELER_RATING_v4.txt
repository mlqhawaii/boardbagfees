BoardBagFees Traveler Rating v4

- One traveler rating only: overall experience with the airline (1–5).
- Removed the separate board/bag handling star rating from the form.
- Traveler Rating is a separate table column and averages approved overall traveler ratings.
- The column stays hidden until at least one approved traveler rating exists.
- Baggage outcome / damage / claim fields remain, so community damage data is still collected separately.
- Official Baggage Handling data remains its own column.
- Rank column remains removed.
- No new Supabase migration required. The prior handling_rating column can remain unused.
