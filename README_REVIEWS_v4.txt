BoardBagFees traveler reviews add-on

This package is built on the verified Reference Theme v3 Fee Fix source that exactly matched the live homepage files on 2026-08-12.

Adds:
- /api/reviews GET approved traveler reports
- /api/reviews POST pending traveler reports
- Homepage traveler-report form and recent approved reports
- Traveler-report form + approved reports on all 80 airline detail pages
- Share experience links from the airline comparison table/cards

Uses existing Vercel env vars: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.
Requires the airline_traveler_reviews table/RLS SQL that was already installed.

Deploy to PREVIEW first. Do not promote until tested.
