
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const slug=document.body.dataset.slug;
const ROUTE_DEPENDENT_SLUGS=new Set(['hawaiian-airlines','philippine-airlines','american-airlines']);
const ratingLights=(label,score)=>{
  const s=String(label||'').trim().toLowerCase(); let dots;
  if(/outstanding/.test(s)) dots=['green','green','green','green'];
  else if(/excellent/.test(s)) dots=['green','green','green'];
  else if(/very good/.test(s)) dots=['green','green'];
  else if(/\bgood\b|shortboard/.test(s)) dots=['green'];
  else if(/okay|mixed/.test(s)) dots=['yellow'];
  else if(/mediocre/.test(s)) dots=['red'];
  else if(/\bpoor\b/.test(s)) dots=['red','red'];
  else if(/\bbad\b/.test(s)) dots=['red','red','red'];
  else if(/terrible/.test(s)) dots=['red','red','red','red'];
  else { const n=Math.max(0,Math.min(5,Math.round(Number(score)))); dots=({5:['green','green','green'],4:['green','green'],3:['green'],2:['yellow'],1:['red','red','red'],0:['red','red','red','red']})[n]||['gray']; }
  return `<span class="rating-lights" aria-hidden="true">${dots.map(c=>`<span class="rating-dot ${c}"></span>`).join('')}</span>`;
};
const set=(id,v)=>{const el=document.getElementById(id); if(el) el.innerHTML=v||'<span class="skeleton">Not currently listed</span>';};


const addFareCta=()=>{
  const facts=document.getElementById('facts');
  if(!facts || document.querySelector('.airline-fare-fact')) return;
  const h1=document.querySelector('.hero-detail h1');
  const airline=(h1?.textContent||'this airline').replace(/\s+surfboard fees\s*&\s*policy\s*$/i,'').trim();
  facts.insertAdjacentHTML('beforeend', `
    <article class="fact airline-fare-fact" aria-label="Compare ${esc(airline)} flight fares">
      <div class="fact-label">Compare flight prices</div>
      <div class="airline-fare-fact-copy">Finished checking ${esc(airline)}’s board-bag policy?</div>
      <a class="airline-fare-link" href="/#compare-flights">Compare fares →</a>
    </article>`);
};
addFareCta();

const feeDisplay=(a)=>{
  if(ROUTE_DEPENDENT_SLUGS.has(a?.slug)) return 'Varies by route / fare';
  const trusted=String(a?.policy_facts?.fee_text||'').trim();
  if(trusted && !/^(unknown|not stated|not specified|n\/a|null)$/i.test(trusted)) return trusted;
  const text=[a?.surfboard_treatment,a?.size_rule].filter(Boolean).join(' · ');
  const money=text.match(/(?:USD\s*)?\$?\s?\d+(?:\.\d{1,2})?/i);
  if(money && /\$|USD/i.test(money[0])) return money[0].replace(/\s+/g,' ').trim();
  if(/included|free|standard checked|normal checked|no special item fee/i.test(text)) return 'Included / standard baggage';
  if(/varies|route|depends|contact|check/i.test(text)) return 'Varies by route/fare';
  return 'See official policy';
};
async function load(){
  try{
    const r=await fetch('/api/airlines',{cache:'no-store'}); if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const list=await r.json(); const a=list.find(x=>x.slug===slug);
    if(!a) throw new Error('Airline not found in current database');
    const hero=document.querySelector('.hero-detail');
    if(hero && window.airlineLogoMarkup && !hero.querySelector('.detail-airline-logo')){
      hero.insertAdjacentHTML('afterbegin', `<div class="detail-airline-logo">${window.airlineLogoMarkup(a.slug,a.airline,'detail-logo-frame')}</div>`);
    }
    set('fee',esc(feeDisplay(a))); set('treatment',esc(a.surfboard_treatment)); set('size',esc(a.size_rule));
    set('rating',`${ratingLights(a.surf_rating,a.surf_rating_score)}${esc(a.surf_rating||'Not rated')}`);
    set('handling',esc(a.baggage_handling));
    try{const ur=await fetch('/api/update-status',{cache:'no-store'});if(ur.ok){const us=await ur.json();if(us.last_success_at){const d=new Date(us.last_success_at);const pretty=Number.isNaN(d.getTime())?String(us.last_success_at).slice(0,10):d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'Pacific/Honolulu'});set('checked',`Policy data checked ${esc(pretty)}`)}else set('checked','Updated weekly');}else set('checked','Updated weekly');}catch{set('checked','Updated weekly');}
    const source=document.getElementById('official'); if(a.policy_url){source.href=a.policy_url; source.hidden=false;} else source.hidden=true;
    const notes=document.getElementById('notes-wrap'); if(a.agent_notes){document.getElementById('notes').textContent=a.agent_notes; notes.hidden=false;}
  }catch(e){console.error(e); document.getElementById('facts').classList.add('error'); set('treatment','Live policy data is temporarily unavailable. Use the official airline link below and try again shortly.');}
}
load();
