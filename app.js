let airlines=[];
let baggageStats={};

const escapeHtml=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

// Rating colors are driven by the numeric score, which is the single source of truth.
const ratingClass=(score)=>{
  const n=Number(score);
  if(!Number.isFinite(n)) return 'mid';
  if(n>=4) return 'good';
  if(n>=2) return 'mid';
  return 'bad';
};

// Simple graduated light scale, matching the original BoardBagFees look:
// Outstanding = 4 green
// Excellent   = 3 green
// Very good   = 2 green
// Good        = 1 green
// Okay        = 1 yellow
// Mediocre    = 1 red
// Poor        = 2 red
// Bad         = 3 red
// Terrible    = 4 red
const ratingLights=(label,score)=>{
  const s=String(label||'').trim().toLowerCase();

  let dots;
  if(/outstanding/.test(s)) dots=['green','green','green','green'];
  else if(/excellent/.test(s)) dots=['green','green','green'];
  else if(/very good/.test(s)) dots=['green','green'];
  else if(/\bgood\b|shortboard/.test(s)) dots=['green'];
  else if(/okay|mixed/.test(s)) dots=['yellow'];
  else if(/mediocre/.test(s)) dots=['red'];
  else if(/\bpoor\b/.test(s)) dots=['red','red'];
  else if(/\bbad\b/.test(s)) dots=['red','red','red'];
  else if(/terrible/.test(s)) dots=['red','red','red','red'];
  else {
    // Fallback for the current normalized 0–5 score system.
    const n=Number(score);
    const byScore={
      5:['green','green','green'],
      4:['green','green'],
      3:['green'],
      2:['yellow'],
      1:['red','red','red'],
      0:['red','red','red','red']
    };
    dots=Number.isFinite(n) ? byScore[Math.max(0,Math.min(5,Math.round(n)))] : ['gray'];
  }

  return `<span class="rating-lights" aria-label="${escapeHtml(label||'Surf rating')}">${dots.map(c=>`<span class="rating-dot ${c}"></span>`).join('')}</span>`;
};

function normalize(a){
  return {
    tieRank: a.sort_rank ?? a.rank ?? 9999,
    airline: a.airline,
    slug: a.slug,
    serviceType: a.service_type ?? a.serviceType,
    servesHNL: a.serves_hnl ?? a.servesHNL,
    surfboardTreatment: a.surfboard_treatment ?? a.surfboardTreatment,
    feeText: a.policy_facts?.fee_text ?? a.fee_text ?? '',
    sizeRule: a.size_rule ?? a.sizeRule,
    surfRating: a.surf_rating ?? a.surfRating,
    surfRatingScore: a.surf_rating_score ?? a.surfRatingScore,
    baggageHandling: a.baggage_handling ?? a.baggageHandling,
    policyUrl: a.policy_url ?? a.policyUrl,
    lastChecked: a.last_checked ?? a.lastChecked,
    active: a.active !== false
  };
}

function rankedAirlines(){
  // Primary ranking: surf rating score, highest first.
  // Existing sort_rank is only a tie-breaker between airlines with the same rating.
  return airlines
    .filter(a=>a.active)
    .slice()
    .sort((a,b)=>{
      const aScore=Number.isFinite(Number(a.surfRatingScore))?Number(a.surfRatingScore):-1;
      const bScore=Number.isFinite(Number(b.surfRatingScore))?Number(b.surfRatingScore):-1;
      return bScore-aScore || a.tieRank-b.tieRank || a.airline.localeCompare(b.airline);
    })
    .map(a=>({...a}));
}


function feeHighlight(text=''){
  const t=String(text||'');
  const money=t.match(/(?:USD\s*)?\$\s?\d+(?:\.\d{1,2})?|USD\s*\d+(?:\.\d{1,2})?/i);
  if(money) return money[0].replace(/\s+/g,' ').trim();
  if(/included|free|standard checked|normal checked/i.test(t)) return 'Included';
  if(/varies|route|depends|contact|check/i.test(t)) return 'Varies';
  return 'See policy';
}

const ROUTE_DEPENDENT_SLUGS=new Set(['hawaiian-airlines','philippine-airlines','american-airlines']);

function feeDisplay(a){
  if(ROUTE_DEPENDENT_SLUGS.has(a.slug)) return 'Varies by route / fare';
  const trusted=String(a.feeText||'').trim();
  if(trusted && !/^(unknown|not stated|not specified|n\/a|null)$/i.test(trusted)) return trusted;
  return feeHighlight([a.surfboardTreatment,a.sizeRule].filter(Boolean).join(' · '));
}


function travelerOverallRating(slug){
  const st=baggageStats[String(slug||'')];
  if(!st || !st.rated_total || !Number.isFinite(Number(st.traveler_rating_avg))) return '<span class="traveler-handling-empty">—</span>';
  const avg=Number(st.traveler_rating_avg);
  const rounded=Math.max(1,Math.min(5,Math.round(avg)));
  const stars='★'.repeat(rounded)+'☆'.repeat(5-rounded);
  const count=Number(st.rated_total)||0;
  return `<a class="traveler-handling-rating-cell" href="/airlines/${encodeURIComponent(slug||'')}#traveler-reports" title="See ${count} approved traveler review${count===1?'':'s'} for this airline"><span class="traveler-handling-stars" aria-label="${avg} out of 5">${stars}</span><strong>${avg.toFixed(1)}</strong><small>${count} review${count===1?'':'s'}</small></a>`;
}

function hasTravelerRatings(){
  return Object.values(baggageStats||{}).some(st=>Number(st?.rated_total)>0);
}

function render(){
  const showTravelerRating=hasTravelerRatings();
  const travelerHeader=document.querySelector('#travelerRatingHeader');
  if(travelerHeader) travelerHeader.hidden=!showTravelerRating;
  const q=document.querySelector('#search').value.trim().toLowerCase();
  const filtered=rankedAirlines()
    .filter(a=>!q||[a.airline,a.surfboardTreatment,a.sizeRule,a.surfRating,a.baggageHandling].join(' ').toLowerCase().includes(q));

  document.querySelector('#meta').textContent=`${filtered.length} airline${filtered.length===1?'':'s'}`;
  document.querySelector('#rows').innerHTML=filtered.map(a=>`<tr>
    <td class="airline"><a class="airline-link airline-with-logo" href="/airlines/${encodeURIComponent(a.slug||'')}">${window.airlineLogoMarkup?window.airlineLogoMarkup(a.slug,a.airline,'table-logo'):''}<span>${escapeHtml(a.airline)}</span></a></td>
    <td class="fee-treatment"><strong class="fee-primary">${escapeHtml(feeDisplay(a))}</strong><span class="treatment-secondary">${escapeHtml(a.surfboardTreatment)}</span>${ROUTE_DEPENDENT_SLUGS.has(a.slug)?'<span class="route-badge">Route-dependent</span>':''}</td>
    <td>${escapeHtml(a.sizeRule)}</td>
    <td class="rating ${ratingClass(a.surfRatingScore)}">${ratingLights(a.surfRating,a.surfRatingScore)}${escapeHtml(a.surfRating)}</td>
    <td class="handling"><span class="official-handling">${escapeHtml(a.baggageHandling)}</span></td>
    <td class="policy"><a href="${escapeHtml(a.policyUrl)}" target="_blank" rel="noopener">View policy ↗</a><small>Official airline page</small><a class="share-experience-btn share-experience-inline" href="#traveler-reports" data-share-airline="${escapeHtml(a.slug||'')}">Share experience</a></td>
    ${showTravelerRating?`<td class="traveler-handling-col">${travelerOverallRating(a.slug)}</td>`:''}
  </tr>`).join('');

  document.querySelector('#cards').innerHTML=filtered.map(a=>`<article class="card">
    <div class="card-top"><div class="mobile-airline-head">${window.airlineLogoMarkup?window.airlineLogoMarkup(a.slug,a.airline,'card-logo'):''}<div><h3><a class="airline-link" href="/airlines/${encodeURIComponent(a.slug||'')}">${escapeHtml(a.airline)}</a></h3></div></div></div>
    <div class="card-grid">
      <div><div class="field-label">Surfboard fee / treatment</div><div class="field-value"><strong>${escapeHtml(feeDisplay(a))}</strong><br>${escapeHtml(a.surfboardTreatment)}${ROUTE_DEPENDENT_SLUGS.has(a.slug)?'<br><span class="route-badge">Route-dependent</span>':''}</div></div>
      <div><div class="field-label">Size / rule</div><div class="field-value">${escapeHtml(a.sizeRule)}</div></div>
      <div><div class="field-label">Surf rating</div><div class="field-value rating-value">${ratingLights(a.surfRating,a.surfRatingScore)}${escapeHtml(a.surfRating)}</div></div>
      <div><div class="field-label">Baggage handling</div><div class="field-value"><span class="official-handling">${escapeHtml(a.baggageHandling)}</span></div></div>
      ${baggageStats[String(a.slug||'')]?.rated_total?`<div><div class="field-label">Traveler rating</div><div class="field-value">${travelerOverallRating(a.slug)}</div></div>`:''}
    </div>
    <a class="policy-link" href="${escapeHtml(a.policyUrl)}" target="_blank" rel="noopener">View official policy ↗</a><a class="share-experience-btn share-experience-inline" href="#traveler-reports" data-share-airline="${escapeHtml(a.slug||'')}">Share experience</a>
  </article>`).join('');
}

async function loadAirlines(){
  try{
    const r=await fetch('/api/airlines',{cache:'no-store'});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    airlines=(await r.json()).map(normalize);
    try{const sr=await fetch('/api/reviews?stats=1',{cache:'no-store'});if(sr.ok)baggageStats=await sr.json();}catch{}
    try{
      const ur=await fetch('/api/update-status',{cache:'no-store'});
      if(ur.ok){
        const us=await ur.json();
        if(us.last_success_at){
          const parsed=new Date(us.last_success_at);
          const pretty=Number.isNaN(parsed.getTime()) ? String(us.last_success_at).slice(0,10) : parsed.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'Pacific/Honolulu'});
          const footerChecked=document.querySelector('#checked');
          if(footerChecked) footerChecked.textContent=`Policy data last checked ${pretty}`;
          const topChecked=document.querySelector('#lastUpdatedLabel');
          if(topChecked) topChecked.textContent=`Last policy check: ${pretty}`;
          const heroChecked=document.querySelector('#heroLastUpdated');
          if(heroChecked) heroChecked.textContent=`Policy data checked ${pretty}`;
        }
      }
    }catch{}
    render();
  }catch(err){
    console.error(err);
    document.querySelector('#meta').textContent='Unable to load live policy data';
    document.querySelector('.table-shell').insertAdjacentHTML('beforebegin',
      '<div class="note"><strong>Temporary data error:</strong> Live airline data could not be loaded. Please try again shortly.</div>');
  }
}

const initialAirlineQuery=new URLSearchParams(window.location.search).get('airline');
if(initialAirlineQuery && document.querySelector('#search')){
  document.querySelector('#search').value=initialAirlineQuery;
}

document.querySelector('#search').addEventListener('input',render);


const heroSearchButton=document.querySelector('#heroSearchButton');
if(heroSearchButton) heroSearchButton.addEventListener('click',()=>{
  render();
  document.querySelector('#airline-comparison')?.scrollIntoView({behavior:'smooth',block:'start'});
});
document.querySelector('#search')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    render();
    document.querySelector('#airline-comparison')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
});
loadAirlines();
