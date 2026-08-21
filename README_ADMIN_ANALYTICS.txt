BoardBagFees admin moderation + analytics

Google Analytics 4
- Measurement ID installed: G-KRH8HW63SE
- Installed on homepage and all 80 airline pages.
- Includes custom GA4 events: search, view_airline_policy, view_official_policy, share_experience_click, traveler_report_submit.

Vercel Web Analytics
- Static HTML tracking script installed on homepage and all airline pages.
- Web Analytics must be enabled for the BoardBagFees project in the Vercel dashboard.

Admin moderation
- URL: /admin/reviews
- Add these SERVER-SIDE Vercel environment variables for both Preview and Production:
  SUPABASE_SECRET_KEY = your Supabase secret key (never publish this in browser code)
  BOARDBAGFEES_ADMIN_PASSWORD = a strong password you choose
- Existing SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY remain required for the public review flow.
- The admin password is sent only to your own /api/admin-reviews serverless function and stored only in browser sessionStorage for the current tab/session.
