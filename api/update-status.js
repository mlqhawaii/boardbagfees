export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Missing Supabase environment variables' });

  try {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const query = new URLSearchParams({
      select: 'last_checked',
      active: 'eq.true',
      last_checked: `lte.${today}`,
      order: 'last_checked.desc',
      limit: '1'
    });
    const response = await fetch(`${url}/rest/v1/airline_surf_policies?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!response.ok) throw new Error('Unable to read policy dates');

    const [latest] = await response.json();
    const date = latest?.last_checked?.slice(0, 10);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      last_success_at: date ? `${date}T12:00:00-10:00` : null,
      source: 'latest-active-policy-check'
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load updater status' });
  }
}
