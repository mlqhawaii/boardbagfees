BoardBagFees Quality Control Layer v1

WHAT THIS DOES
- Keeps the existing n8n weekly workflow unchanged.
- Adds a database-side QC wrapper around the updater RPC.
- Safe/high-confidence updates continue automatically.
- Suspicious changes are held instead of overwriting the live airline record.
- Adds /admin/quality beside Traveler reports and Contact messages.
- Admin can Accept update or Keep current.
- QC log provides an audit history of automatic, held, approved, kept-current, and failed updates.

INSTALL ORDER
1. In Supabase SQL Editor, run BoardBagFees_QC_Layer_v1_SQL.sql.
2. Run the existing n8n workflow manually once as a test. NO n8n import/change is required.
3. Preview this website ZIP in Vercel.
4. Open /admin/quality. Any suspicious updates from the test will appear under Needs review.
5. When satisfied, publish the site and leave the existing weekly n8n workflow active.

IMPORTANT
- The SQL migration preserves the already-working updater function under the name process_airline_policy_extraction_unchecked and installs QC under the original function name.
- Existing public airline values are not erased when QC holds an update.
- Do not delete the _unchecked function; the admin approval action uses it to apply a held proposal.
