import crypto from 'crypto';

const clean = (v, max = 1200) => String(v ?? '').trim().slice(0, max);

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function authorized(req) {
  const expected = process.env.BOARDBAGFEES_ADMIN_PASSWORD;
  if (!expected) return false;
  const auth = String(req.headers.authorization || '');
  const supplied = auth.startsWith('Bearer ') ? auth.slice(7) : String(req.headers['x-admin-password'] || '');
  return safeEqual(supplied, expected);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Missing server-side Supabase admin environment variables.' });

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  try {
    if (req.method === 'GET') {
      const allowed = new Set(['pending', 'approved', 'rejected', 'all']);
      const status = allowed.has(String(req.query?.status || 'pending')) ? String(req.query?.status || 'pending') : 'pending';
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit) || 50));
      let endpoint = `${url}/rest/v1/airline_traveler_reviews?select=id,airline_slug,display_name,route,trip_date,fee_paid,currency,rating,comment,baggage_outcome,claim_filed,claim_outcome,damage_details,status,moderation_notes,created_at,approved_at&order=created_at.desc&limit=${limit}`;
      if (status !== 'all') endpoint += `&status=eq.${encodeURIComponent(status)}`;
      const r = await fetch(endpoint, { headers });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'Unable to load moderation queue', detail: text });
      return res.status(200).json(JSON.parse(text || '[]'));
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = clean(body.id, 80);
      const status = clean(body.status, 20);
      const moderation_notes = clean(body.moderation_notes, 1000) || null;
      if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Invalid review id.' });
      if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });

      const payload = {
        status,
        moderation_notes,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      };
      const r = await fetch(`${url}/rest/v1/airline_traveler_reviews?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'Unable to update report', detail: text });
      return res.status(200).json({ ok: true, review: JSON.parse(text || '[]')[0] || null });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Moderation service is temporarily unavailable.' });
  }
}
