BoardBagFees v24 — truthful policy update date

What changed
- The site no longer uses the newest airline row date as the site-wide "Policy data checked" date.
- It now reads /api/update-status, whose preferred source is a marker written ONLY after the n8n updater finishes successfully.
- The timestamp is displayed in Pacific/Honolulu time.
- A safe fallback ignores future dates and uses the most common policy date if the marker has not been set up yet.

One-time setup
1. In Supabase SQL Editor, run: BoardBagFees_Update_Status_SQL_v24.sql
   This seeds the last successful run as Aug 17, 2026 based on the n8n execution history screenshot.
2. In n8n, import/update to: BoardBagFees_Weekly_Updater_PRODUCTION_v24_SUCCESS_MARKER.json
   The new final node is "Mark Successful Policy Update" and runs only after the batch loop finishes.
3. Deploy the website normally.

Result
- A failed or not-yet-run workflow will NOT move the displayed date forward.
- A successful workflow automatically updates the timestamp.
