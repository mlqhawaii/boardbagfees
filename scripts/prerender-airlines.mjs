import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !key) throw new Error('Cannot prerender airline pages without SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const routeDependent = new Set(['hawaiian-airlines','philippine-airlines','american-airlines']);
function fee(a) {
  if (routeDependent.has(a.slug)) return 'Varies by route / fare';
  const given = String(a.policy_facts?.fee_text || '').trim();
  if (given && !/^(unknown|not stated|not specified|n\/a|null)$/i.test(given)) return given;
  const text = [a.surfboard_treatment, a.size_rule].filter(Boolean).join(' · ');
  const match = text.match(/(?:USD\s*)?\$?\s?\d+(?:\.\d{1,2})?/i);
  if (match && /\$|USD/i.test(match[0])) return match[0].replace(/\s+/g,' ').trim();
  if (/included|free|standard checked|normal checked|no special item fee/i.test(text)) return 'Included / standard baggage';
  if (/varies|route|depends|contact|check/i.test(text)) return 'Varies by route/fare';
  return 'See official policy';
}
function fill(html, id, text) {
  const pattern = new RegExp('(<div\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</div>)','i');
  if (!pattern.test(html)) throw new Error('Missing #' + id + ' placeholder');
  return html.replace(pattern, (_,open,_old,close) => open + escapeHtml(text || 'Not currently listed') + close);
}
const url = new URL(supabaseUrl.replace(/\/$/,'') + '/rest/v1/airline_surf_policies');
url.searchParams.set('select','airline,slug,surfboard_treatment,size_rule,surf_rating,surf_rating_score,baggage_handling,policy_url,policy_facts,last_checked');
url.searchParams.set('active','eq.true');
url.searchParams.set('limit','1000');
const response = await fetch(url, { headers: {apikey:key, Authorization:'Bearer ' + key}, signal:AbortSignal.timeout(20000)});
if (!response.ok) throw new Error('Supabase policy fetch returned HTTP ' + response.status);
const rows = await response.json();
if (!Array.isArray(rows) || rows.length < 50) throw new Error('Unusually few airline policies; refusing to deploy placeholders');
const bySlug = new Map(rows.filter(a=>a.slug).map(a=>[a.slug,a]));
const folder = path.resolve('airlines');
const filenames = (await readdir(folder)).filter(name=>name.endsWith('.html'));
let rendered=0;
let missing=[];
for (const name of filenames) {
  const slug=name.slice(0,-5);
  const a=bySlug.get(slug);
  if (!a) {missing.push(slug); continue;}
  const file=path.join(folder,name);
  let html=await readFile(file,'utf8');
  html=fill(html,'fee',fee(a));
  html=fill(html,'treatment',a.surfboard_treatment);
  html=fill(html,'size',a.size_rule);
  html=fill(html,'rating',a.surf_rating||'Not rated');
  html=fill(html,'handling',a.baggage_handling);
  if (a.last_checked) html=fill(html,'checked','Policy record checked ' + String(a.last_checked).slice(0,10));
  if (a.policy_url && /^https?:\/\//i.test(a.policy_url)) {
    // Use callback replacement so literal dollar signs in URLs are not interpreted as captures.
    html=html.replace(/(<a\b[^>]*\bid="official"[^>]*\bhref=")[^"]*(")/i,(_m,before,after)=>before+escapeHtml(a.policy_url)+after);
  }
  await writeFile(file,html);
  rendered++;
}
if (rendered < 50) throw new Error('Too few HTML pages rendered: ' + rendered);
console.log('Pre-rendered ' + rendered + ' airline detail pages with current policy facts.');
if (missing.length) console.warn('No active policy records for static pages:', missing.join(', '));
