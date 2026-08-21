BoardBagFees 80-airline expansion

This package contains 60 individual airline SEO pages (32 existing + 28 new), a sitemap with 61 URLs including the homepage, the Supabase SQL to add the new airlines, and n8n v16 with the Apify batch cap raised from 32 to 60.

When ready:
1) Supabase SQL Editor: run BoardBagFees_60_Airline_Expansion_SQL.sql. The final count should say 60 active airlines.
2) Deploy this folder to the existing Vercel boardbagfees project with npx vercel@latest link then npx vercel@latest --prod.
3) For weekly automation, either import the included v16 workflow and copy the same three CONFIG keys from v15, or edit the existing v15 Apify Start node URL and change maxItems=32 to maxItems=60. Do not publish both v15 and v16 simultaneously.
4) Manually run the 80-airline updater once when convenient to establish structured extraction baselines for the new airlines.

Important: Several new airline rows intentionally use conservative initial summaries or no numeric score where the public official page is dynamic/ambiguous. The existing confidence-gated Gemini/Supabase process should refine those after a successful high-confidence extraction.
