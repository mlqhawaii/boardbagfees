export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Missing Supabase environment variables' });

  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  try {
    // Preferred source: a marker written only after the entire n8n updater finishes successfully.
    const markerUrl = `${url}/rest/v1/site_update_status?status_key=eq.policy_updater&select=last_success_at&limit=1`;
    const marker = await fetch(markerUrl, { headers });
    if (marker.ok) {
      const rows = await marker.json();
      if (rows?.[0]?.last_success_at) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return res.status(200).json({ last_success_at: rows[0].last_success_at, source: 'n8n-success-marker' });
      }
    }

    // Safe fallback for older installs: choose the most common non-future last_checked date,
    // rather than the maximum date (which allowed a bad/future row to move the whole site ahead).
    const policiesUrl = `${url}/rest/v1/airline_surf_policies?select=last_checked&active=eq.true`;
    const policies = await fetch(policiesUrl, { headers });
    if (!policies.ok) throw new Error('Unable to read policy dates');
    const rows = await policies.json();

    const honoluluToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const counts = new Map();
    for (const row of rows || []) {
      const d = String(row?.last_checked || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > honoluluToday) continue;
      counts.set(d, (counts.get(d) || 0) + 1);
    }
    const best = [...counts.entries()].sort((a,b) => b[1]-a[1] || b[0].localeCompare(a[0]))[0]?.[0] || null;
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ last_success_at: best ? `${best}T12:00:00-10:00` : null, source: 'policy-date-fallback' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load updater status' });
  }
}
