import { readFile } from 'node:fs/promises';
import path from 'node:path';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const routeDependent = new Set(['hawaiian-airlines', 'philippine-airlines', 'american-airlines']);

function feeDisplay(a) {
  if (routeDependent.has(a.slug)) return 'Varies by route / fare';
  const explicit = String(a.policy_facts?.fee_text || '').trim();
  if (explicit && !/^(unknown|not stated|not specified|n\/a|null)$/i.test(explicit)) return explicit;
  const text = [a.surfboard_treatment, a.size_rule].filter(Boolean).join(' · ');
  const money = text.match(/(?:USD\s*)?\$?\s?\d+(?:\.\d{1,2})?/i);
  if (money && /\$|USD/i.test(money[0])) return money[0].replace(/\s+/g, ' ').trim();
  if (/included|free|standard checked|normal checked|no special item fee/i.test(text)) return 'Included / standard baggage';
  if (/varies|route|depends|contact|check/i.test(text)) return 'Varies by route/fare';
  return 'See official policy';
}

function put(html, id, value) {
  const regex = new RegExp('(<div\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</div>)', 'i');
  return html.replace(regex, (_, opening, _old, closing) =>
    opening + escapeHtml(value || 'Not currently listed') + closing);
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(404).send('Not found');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(503).send('Policy data temporarily unavailable');

  try {
    // Read the existing airline page so navigation, styling, and reviews remain unchanged.
    // File tracing is explicit in vercel.json.
    const htmlPath = path.join(process.cwd(), 'airlines', slug + '.html');
    const template = await readFile(htmlPath, 'utf8').catch(() => null);
    if (!template) return res.status(404).send('Not found');

    const endpoint = new URL(url.replace(/\/$/, '') + '/rest/v1/airline_surf_policies');
    endpoint.searchParams.set('select', 'airline,slug,surfboard_treatment,size_rule,surf_rating,surf_rating_score,baggage_handling,policy_url,policy_facts,last_checked');
    endpoint.searchParams.set('slug', 'eq.' + slug);
    endpoint.searchParams.set('active', 'eq.true');
    endpoint.searchParams.set('limit', '1');
    const response = await fetch(endpoint, {headers: {apikey: key, Authorization: 'Bearer ' + key}, signal: AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Upstream policy service failed');
    const [airline] = await response.json();
    if (!airline) return res.status(404).send('Not found');

    let html = template;
    html = put(html, 'fee', feeDisplay(airline));
    html = put(html, 'treatment', airline.surfboard_treatment);
    html = put(html, 'size', airline.size_rule);
    html = put(html, 'rating', airline.surf_rating || 'Not rated');
    html = put(html, 'handling', airline.baggage_handling);
    if (airline.last_checked) html = put(html, 'checked', 'Policy record checked ' + String(airline.last_checked).slice(0, 10));

    if (airline.policy_url && /^https?:\/\//i.test(airline.policy_url)) {
      html = html.replace(/(<a\b[^>]*\bid="official"[^>]*\bhref=")[^"]*(")/i, '$1' + escapeHtml(airline.policy_url) + '$2');
    } else {
      html = html.replace(/(<a\b[^>]*\bid="official"[^>]*)(>)/i, '$1 hidden$2');
    }

    // The existing airline-page.js still refreshes the facts in the browser.
    // Search crawlers and no-JS visitors now receive the actual database fields.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Airline HTML rendering error:', error);
    // A 503 asks crawlers to retry rather than index misleading placeholder content.
    res.setHeader('Retry-After', '300');
    return res.status(503).send('Policy data temporarily unavailable');
  }
}
