const esc=(s='')=>String(s).replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const ROUTE_DEPENDENT_SLUGS=new Set(['hawaiian-airlines','philippine-airlines','american-airlines']);
let travelerStats={};

const travelerRating=(slug)=>{
  const st=travelerStats[String(slug||'')];
  if(!st || !Number(st.rated_total) || !Number.isFinite(Number(st.traveler_rating_avg))) return '<span class="traveler-rating-empty">—</span>';
  const avg=Number(st.traveler_rating_avg);
  const count=Number(st.rated_total)||0;
  const rounded=Math.max(1,Math.min(5,Math.round(avg)));
  const stars='★'.repeat(rounded)+'☆'.repeat(5-rounded);
  return `<a class="traveler-rating-origin" href="/airlines/${encodeURIComponent(slug||'')}#traveler-reports" title="See ${count} approved traveler review${count===1?'':'s'}"><span class="stars" aria-label="${avg} out of 5">${stars}</span><strong>${avg.toFixed(1)} / 5</strong><small>${count} review${count===1?'':'s'}</small></a>`;
};

const feeText=a=>ROUTE_DEPENDENT_SLUGS.has(a?.slug)?'Varies by route / fare':String(a?.policy_facts?.fee_text||a?.surfboard_treatment||'See policy').trim();

const ratingLights=(label,score)=>{
  const name=String(label||'').trim().toLowerCase();
  const n=Number(score);
  const scoreLabel={5:'Excellent',4:'Very good',3:'Good',2:'Okay',1:'Bad',0:'Terrible'};
  const displayLabel=String(label||'').trim() || (Number.isFinite(n)?scoreLabel[Math.max(0,Math.min(5,Math.round(n)))]:'Not rated');
  let dots;
  if(/outstanding/.test(name)) dots=['green','green','green','green'];
  else if(/excellent/.test(name)) dots=['green','green','green'];
  else if(/very good/.test(name)) dots=['green','green'];
  else if(/\bgood\b|shortboard/.test(name)) dots=['green'];
  else if(/okay|mixed/.test(name)) dots=['yellow'];
  else if(/mediocre/.test(name)) dots=['red'];
  else if(/\bpoor\b/.test(name)) dots=['red','red'];
  else if(/\bbad\b/.test(name)) dots=['red','red','red'];
  else if(/terrible/.test(name)) dots=['red','red','red','red'];
  else {
    const byScore={5:['green','green','green'],4:['green','green'],3:['green'],2:['yellow'],1:['red','red','red'],0:['red','red','red','red']};
    dots=Number.isFinite(n)?byScore[Math.max(0,Math.min(5,Math.round(n)))]:['gray'];
  }
  return `<span class="rating-lights" aria-label="${esc(displayLabel||'Surf rating')}">${dots.map(c=>`<span class="rating-dot ${c}"></span>`).join('')}</span><span class="rating-label">${esc(displayLabel)}</span>`;
};

const ORIGINS={
  hawaii:{
    label:'Hawaii',gateway:'Honolulu (HNL)',
    direct:['air-canada','air-new-zealand','air-premia','alaska-airlines','american-airlines','ana','asiana','delta','fiji-airways','hawaiian-airlines','japan-airlines-jal','korean-air','mokulele','philippine-airlines','qantas','southwest','united','westjet'],
    connect:[
      ['singapore-airlines','Mainland U.S. or Japan / Asia hub'],['qatar-airways','Mainland U.S. gateway'],['emirates','Mainland U.S. gateway'],['turkish-airlines','Mainland U.S. gateway'],['air-france','Mainland U.S. gateway'],['klm','Mainland U.S. gateway'],['lufthansa','Mainland U.S. gateway'],['latam-airlines','Mainland U.S. gateway'],['tap-air-portugal','Mainland U.S. gateway']
    ],
    note:'HNL is used as the Hawaii reference airport. Neighbor-island travelers may need an inter-island segment first.'
  },
  brazil:{
    label:'Brazil',gateway:'São Paulo (GRU)',
    direct:['aeromexico','air-canada','air-france','american-airlines','azul-brazilian-airlines','british-airways','copa-airlines','delta','emirates','iberia','klm','latam-airlines','lufthansa','qatar-airways','south-african-airways','swiss','tap-air-portugal','turkish-airlines','united','aerolineas-argentinas','air-europa','avianca','jetsmart','gol','sky-airline'],
    connect:[
      ['singapore-airlines','Europe / Middle East / North America connection'],['etihad-airways','International connection'],['japan-airlines-jal','North America / Europe connection'],['ana','North America / Europe connection'],['korean-air','North America / Europe connection']
    ],
    note:'GRU is used as the main international reference gateway. Travelers from other Brazilian cities often feed into GRU on LATAM, GOL or Azul.'
  },
  australia:{
    label:'Australia',gateway:'Sydney (SYD)',
    direct:['air-canada','air-india','air-new-zealand','aircalin','ana','american-airlines','asiana','cathay-pacific','cebu-pacific','china-airlines','china-eastern-airlines','china-southern-airlines','delta','emirates','etihad-airways','fiji-airways','garuda-indonesia','hawaiian-airlines','japan-airlines-jal','jetstar','korean-air','latam-airlines','malaysia-airlines','philippine-airlines','qantas','qatar-airways','scoot','singapore-airlines','srilankan-airlines','thai-airways','turkish-airlines','united','vietnam-airlines','virgin-australia'],
    connect:[
      ['klm','Asia / Middle East / Europe connection'],['air-france','Asia / Middle East connection'],['lufthansa','Asia / Middle East connection'],['swiss','Asia / Middle East connection'],['tap-air-portugal','Europe connection']
    ],
    note:'SYD is used as the reference gateway. Melbourne, Brisbane, Perth and other Australian airports have different nonstop carrier mixes.'
  },
  france:{
    label:'France',gateway:'Paris (CDG / ORY)',
    direct:['air-france','air-canada','american-airlines','british-airways','delta','easyjet','emirates','etihad-airways','iberia','klm','lufthansa','qatar-airways','royal-air-maroc','swiss','tap-air-portugal','transavia','turkish-airlines','united','vueling'],
    connect:[
      ['singapore-airlines','European / Asian hub connection'],['cathay-pacific','European / Asian hub connection'],['japan-airlines-jal','European / Asian hub connection'],['ana','European / Asian hub connection'],['latam-airlines','Madrid / Lisbon / other long-haul gateway'],['azores-airlines','Portugal connection']
    ],
    note:'Paris is used as the reference gateway. Nice, Lyon, Bordeaux and other French airports may require a short European connection first.'
  }
};

function row(a,access,gateway){
  const fee=feeText(a);
  return `<tr><td><a class="airline-name" href="/airlines/${encodeURIComponent(a.slug||'')}">${esc(a.airline)}</a></td><td class="surf-rating-cell">${ratingLights(a.surf_rating ?? a.surfRating,a.surf_rating_score ?? a.surfRatingScore)}</td><td>${travelerRating(a.slug)}</td><td><span class="access ${access==='Serves origin'?'direct':'connect'}">${esc(access)}</span></td><td>${esc(gateway)}</td><td class="fee-cell">${esc(fee)}${ROUTE_DEPENDENT_SLUGS.has(a.slug)?'<br><span class="route-badge">Route-dependent</span>':''}</td><td><a class="matrix-link" href="/airlines/${encodeURIComponent(a.slug||'')}">Policy + reviews →</a></td></tr>`;
}

async function loadOrigin(){
  const key=document.body.dataset.origin; const cfg=ORIGINS[key]; if(!cfg)return;
  try{
    const [r,rr]=await Promise.all([fetch('/api/airlines',{cache:'no-store'}),fetch('/api/reviews?stats=1',{cache:'no-store'})]); if(!r.ok)throw new Error(); const all=await r.json(); travelerStats=rr.ok?await rr.json():{};
    const bySlug=Object.fromEntries(all.map(a=>[a.slug,a]));
    try{const ur=await fetch('/api/update-status',{cache:'no-store'});if(ur.ok){const us=await ur.json();if(us.last_success_at){const d=new Date(us.last_success_at);const p=Number.isNaN(d.getTime())?String(us.last_success_at).slice(0,10):d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'Pacific/Honolulu'});document.querySelectorAll('[data-last-checked]').forEach(x=>x.textContent=p)}}}catch{}
    const direct=cfg.direct.map(s=>bySlug[s]).filter(Boolean);
    const conn=cfg.connect.map(([s,g])=>[bySlug[s],g]).filter(([a])=>a);
    const body=document.querySelector('#originMatrixBody');
    body.innerHTML=direct.map(a=>row(a,'Serves origin',cfg.gateway)).join('')+conn.map(([a,g])=>row(a,'Connection option',g)).join('');
    document.querySelector('[data-origin-count]').textContent=direct.length;
    document.querySelector('[data-origin-gateway]').textContent=cfg.gateway;
    document.querySelector('[data-origin-note]').textContent=cfg.note;
  }catch(e){document.querySelector('#originMatrixBody').innerHTML='<tr><td colspan="7" class="matrix-empty">Live airline data is temporarily unavailable. Please try again shortly.</td></tr>'}
}
loadOrigin();
