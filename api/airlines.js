export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: 'Missing Supabase environment variables' });
  }

  // Soft browser-level anti-copying guard. This does not replace Vercel WAF rate limiting,
  // but prevents ordinary cross-origin browser apps from reusing the JSON endpoint directly.
  const origin = req.headers.origin;
  const allowedOrigin = (value) => {
    if (!value) return true;
    try {
      const u = new URL(value);
      return u.hostname === 'boardbagfees.com' ||
        u.hostname === 'www.boardbagfees.com' ||
        u.hostname.endsWith('.vercel.app');
    } catch {
      return false;
    }
  };

  if (!allowedOrigin(origin)) {
    return res.status(403).json({ error: 'Cross-origin reuse of this dataset is not permitted.' });
  }

  res.setHeader('X-BoardBagFees-Compilation-ID', 'BBF-2026-08-PROTECTED-v1');
  res.setHeader('X-BoardBagFees-Data-Notice', 'Original BoardBagFees research compilation; see /terms');
  res.setHeader('Link', '<https://www.boardbagfees.com/terms>; rel="terms-of-service"');

  const endpoint =
    `${url}/rest/v1/airline_surf_policies` +
    `?select=airline,slug,sort_rank,service_type,serves_hnl,surfboard_treatment,size_rule,surf_rating,surf_rating_score,baggage_handling,policy_url,last_checked,policy_facts,active` +
    `&active=eq.true&order=surf_rating_score.desc.nullslast,sort_rank.asc,airline.asc`;

  try {
    const r = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'Supabase request failed', detail: text });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(await r.json());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load airline data' });
  }
}