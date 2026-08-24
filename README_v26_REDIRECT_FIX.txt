BoardBagFees v26 redirect fix

Cause:
- vercel.json had "cleanUrls": true
- AND 9 explicit .html -> extensionless redirects for airline pages
- Vercel cleanUrls already performs that normalization, making the explicit
  redirects redundant and capable of producing redirect errors in Google.

Fix:
- Removed 9 explicit airline redirects.
- Kept "cleanUrls": true.
- Kept extensionless canonical URLs.
- Kept extensionless sitemap URLs.
- Preserved the v25 wave favicon across the site.

Affected old URLs included Qatar Airways, Korean Air, ANA, Delta, JAL,
Alaska, American, Hawaiian and United.
