BOARDBAGFEES PROTECTION SETUP — 2026-08-12

Included in this build:
- Terms of Use: /terms
- Copyright & Data Use: /copyright
- Privacy Policy: /privacy
- Visible BoardBagFees original-research attribution
- Copyright/meta/source fingerprints on public pages
- Internal agent_notes removed from public /api/airlines output
- Browser-level cross-origin API reuse blocked
- API data notice / compilation ID response headers
- robots.txt keeps normal search indexing while opting GPTBot and Google-Extended out
- /api and /admin excluded from generic crawler access
- Security headers strengthened

VERCEL FIREWALL — RECOMMENDED MANUAL RULES
Vercel Dashboard > boardbagfees > Firewall > Configure/Custom Rules.
Keep Googlebot/Bingbot/search indexing allowed.

Rule 1: Protect public airline dataset
  Match: Path starts with /api/airlines
  Rate limit suggestion: 60 requests per minute per IP
  Action after limit: 429 (or Challenge if your UI offers it)

Rule 2: Protect traveler submissions
  Match: Path equals /api/reviews AND Method POST
  Rate limit suggestion: 5 requests per 10 minutes per IP
  Action after limit: 429

Rule 3: Protect moderation endpoint
  Match: Path starts with /api/admin-reviews
  Rate limit suggestion: 30 requests per minute per IP
  Action after limit: 429 or Challenge

Adjust limits if legitimate use triggers them. Vercel WAF limits/pricing depend on plan/current product terms.

LEGAL/IP NEXT STEPS
1) Search USPTO for confusingly similar marks before filing BoardBagFees.
2) Consider applying for federal registration of the word mark BOARD BAG FEES / BOARDBAGFEES and, separately if valuable, the logo.
3) Consider U.S. Copyright Office registration for eligible website content and qualifying non-photographic database compilation authorship.
4) Save dated source snapshots/ZIPs and database exports periodically. They help document authorship and changes.
5) If substantial copying occurs, preserve screenshots, URLs, timestamps, copied text/structure, and hosting/domain information before sending demands or takedowns.

Note: technical controls reduce casual scraping; no public website can make copying impossible. Terms and copyright notices are helpful signals but are not a substitute for legal advice or registration.
