BoardBagFees v9

Changes:
- Adds collapsed route-dependent pricing tables to Hawaiian Airlines, Philippine Airlines, and American Airlines detail pages.
- Main comparison and origin matrices label these airlines as Route-dependent / Varies by route/fare.
- Keeps cleanUrls=true, which Vercel documents as issuing a 308 redirect from .html to extensionless URLs.
- Adds explicit permanent redirects for the 9 legacy .html airline URLs currently shown as Redirect errors in Google Search Console.
- HTTP and www homepage entries shown as “Page with redirect” are expected canonical redirects and should not be indexed themselves; the canonical non-www HTTPS URL is the target.
