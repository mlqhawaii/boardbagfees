const clean = (v, max = 1200) => String(v ?? '').trim().slice(0, max);

const allowedOutcomes = new Set(['no_issue','minor_damage','major_damage','board_broken','delayed','lost']);
const allowedClaimOutcomes = new Set(['pending','paid_full','paid_partial','denied','not_pursued']);

function aggregate(rows) {
  const by = {};
  for (const r of rows) {
    const slug = String(r.airline_slug || '');
    const outcome = String(r.baggage_outcome || '');
    const validOutcome = allowedOutcomes.has(outcome);
    const rr = Number(r.rating);
    const validRating = Number.isInteger(rr) && rr >= 1 && rr <= 5;
    if (!slug || (!validOutcome && !validRating)) continue;
    if (!by[slug]) by[slug] = { total:0, issues:0, no_issue:0, minor_damage:0, major_damage:0, board_broken:0, delayed:0, lost:0, rated_total:0, rating_sum:0 };
    if (validOutcome) {
      by[slug].total++;
      by[slug][outcome]++;
      if (outcome !== 'no_issue') by[slug].issues++;
    }
    if (validRating) { by[slug].rated_total++; by[slug].rating_sum += rr; }
  }
  return Object.fromEntries(Object.entries(by).map(([slug,v]) => [slug, {...v, issue_rate: v.total ? Math.round((v.issues/v.total)*100) : 0, traveler_rating_avg: v.rated_total ? Math.round((v.rating_sum/v.rated_total)*10)/10 : null} ]));
}

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Missing Supabase environment variables' });

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  try {
    if (req.method === 'GET') {
      const wantsStats = String(req.query?.stats || '') === '1';
      if (wantsStats) {
        const endpoint = `${url}/rest/v1/airline_traveler_reviews?select=airline_slug,baggage_outcome,rating&status=eq.approved&limit=5000`;
        const r = await fetch(endpoint, { headers });
        const text = await r.text();
        if (!r.ok) return res.status(r.status).json({ error: 'Unable to load traveler baggage statistics', detail: text });
        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
        return res.status(200).json(aggregate(JSON.parse(text || '[]')));
      }

      const slug = clean(req.query?.airline_slug || req.query?.slug || '', 120);
      const limit = Math.max(1, Math.min(50, Number(req.query?.limit) || 12));
      let endpoint = `${url}/rest/v1/airline_traveler_reviews?select=id,airline_slug,display_name,route,trip_date,fee_paid,currency,rating,comment,baggage_outcome,claim_filed,claim_outcome,damage_details,created_at&status=eq.approved&order=created_at.desc&limit=${limit}`;
      if (slug) endpoint += `&airline_slug=eq.${encodeURIComponent(slug)}`;
      const r = await fetch(endpoint, { headers });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'Unable to load traveler reports', detail: text });
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
      return res.status(200).json(JSON.parse(text || '[]'));
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const airline_slug = clean(body.airline_slug, 120);
      const display_name = clean(body.display_name, 80);
      const route = clean(body.route, 120) || null;
      const trip_date = clean(body.trip_date, 10) || null;
      const currency = clean(body.currency || 'USD', 3).toUpperCase() || 'USD';
      const comment = clean(body.comment, 1200);
      const damage_details = clean(body.damage_details, 1200) || null;
      const rating = Number(body.rating);
      const feeRaw = body.fee_paid === '' || body.fee_paid == null ? null : Number(body.fee_paid);
      const baggage_outcome_raw = clean(body.baggage_outcome, 30);
      const baggage_outcome = allowedOutcomes.has(baggage_outcome_raw) ? baggage_outcome_raw : null;
      const claim_outcome_raw = clean(body.claim_outcome, 30);
      const claim_outcome = allowedClaimOutcomes.has(claim_outcome_raw) ? claim_outcome_raw : null;
      const claim_filed = body.claim_filed === 'true' || body.claim_filed === true ? true : body.claim_filed === 'false' || body.claim_filed === false ? false : null;

      if (!airline_slug) return res.status(400).json({ error: 'Choose an airline.' });
      if (!display_name || display_name.length < 2) return res.status(400).json({ error: 'Please enter your name (first name or first name + last initial is fine).' });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5.' });
      if (comment.length < 20) return res.status(400).json({ error: 'Please add at least 20 characters about what happened.' });
      if (feeRaw !== null && (!Number.isFinite(feeRaw) || feeRaw < 0 || feeRaw > 10000)) return res.status(400).json({ error: 'Fee paid must be a valid non-negative amount.' });
      if (trip_date && !/^\d{4}-\d{2}-\d{2}$/.test(trip_date)) return res.status(400).json({ error: 'Trip date is invalid.' });
      if (baggage_outcome_raw && !baggage_outcome) return res.status(400).json({ error: 'Baggage outcome is invalid.' });
      if (claim_outcome_raw && !claim_outcome) return res.status(400).json({ error: 'Claim outcome is invalid.' });

      const payload = [{
        airline_slug, display_name, route, trip_date,
        fee_paid: feeRaw,
        currency,
        rating,
        comment,
        baggage_outcome,
        claim_filed,
        claim_outcome,
        damage_details,
        status: 'pending'
      }];

      const r = await fetch(`${url}/rest/v1/airline_traveler_reviews`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'Unable to submit traveler report', detail: text });
      return res.status(201).json({ ok: true, message: 'Thanks — your report was submitted for review.' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Traveler report service is temporarily unavailable.' });
  }
}
