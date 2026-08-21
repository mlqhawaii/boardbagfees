(() => {
  const send = (name, params = {}) => {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (_) {}
  };

  const clean = (v, max = 100) => String(v || '').trim().slice(0, max);
  let searchTimer;

  document.addEventListener('DOMContentLoaded', () => {
    const slug = document.body?.dataset?.slug;
    if (slug) send('view_airline_policy', { airline_slug: clean(slug) });

    document.querySelectorAll('input[type="search"], #search').forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          const term = clean(input.value, 80);
          if (term.length >= 2) send('search', { search_term: term });
        }, 900);
      });
    });
  });

  document.addEventListener('click', e => {
    const share = e.target.closest('[data-share-airline]');
    if (share) send('share_experience_click', { airline_slug: clean(share.dataset.shareAirline) });

    const affiliate = e.target.closest('[data-affiliate-partner]');
    if (affiliate) send('affiliate_click', {
      partner: clean(affiliate.dataset.affiliatePartner),
      placement: clean(affiliate.dataset.affiliatePlacement),
      link_url: clean(affiliate.href, 200)
    });

    const link = e.target.closest('a');
    if (link && /view\s+(?:.*\s+)?policy/i.test(link.textContent || '')) {
      send('view_official_policy', {
        airline_slug: clean(document.body?.dataset?.slug || link.closest('[data-slug]')?.dataset?.slug || ''),
        link_url: clean(link.href, 200)
      });
    }
  });

  document.addEventListener('bbf:review-submitted', e => {
    send('traveler_report_submit', {
      airline_slug: clean(e.detail?.airline_slug),
      rating: Number(e.detail?.rating) || undefined,
      fee_paid: e.detail?.fee_paid === '' ? undefined : Number(e.detail?.fee_paid)
    });
  });
})();
