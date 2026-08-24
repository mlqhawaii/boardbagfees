BoardBagFees v28 internal linking / crawlability improvement

Changes:
- Added /airline-policies standalone crawlable directory linking to all 80 airline pages.
- Added popular-airline internal-link blocks to:
  index.html, best-airlines-for-surfboards.html, surfboard-bag-fees-comparison.html, airlines-surfboards-free.html, sporting-equipment.html, golf-bag-fees.html
- Added a link back to the full airline directory on 80 airline pages.
- Added the directory URL to sitemap.xml.
- Preserves v27 clear wave favicon and v26 redirect cleanup.

Purpose:
Google Search Console currently shows most airline URLs as 'Discovered - currently not indexed'
with Last crawled = N/A. These changes improve crawl paths and page importance signals without
requiring manual Request Indexing submissions.
