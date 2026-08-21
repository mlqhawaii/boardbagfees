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

  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  try {
    if (req.method === 'GET') {
      const allowed = new Set(['new', 'archived', 'all']);
      const status = allowed.has(String(req.query?.status || 'new')) ? String(req.query?.status || 'new') : 'new';
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit) || 50));
      let endpoint = `${url}/rest/v1/boardbagfees_contact_messages?select=id,name,email,subject,message,status,created_at&order=created_at.desc&limit=${limit}`;
      if (status === 'new') endpoint += '&or=(status.is.null,status.eq.new,status.eq.pending)';
      if (status === 'archived') endpoint += '&status=eq.archived';
      const r = await fetch(endpoint, { headers });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'Unable to load contact messages', detail: text });
      return res.status(200).json(JSON.parse(text || '[]'));
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = clean(body.id, 30);
      const status = clean(body.status, 20);
      if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid message id.' });
      if (!['new', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
      const r = await fetch(`${url}/rest/v1/boardbagfees_contact_messages?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ status })
      });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'Unable to update contact message', detail: text });
      return res.status(200).json({ ok: true, message: JSON.parse(text || '[]')[0] || null });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Contact moderation service is temporarily unavailable.' });
  }
}
