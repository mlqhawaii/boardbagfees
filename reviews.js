(() => {
  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money=(v,c='USD')=>{ if(v===null||v===undefined||v==='') return ''; const n=Number(v); if(!Number.isFinite(n)) return ''; try{return new Intl.NumberFormat('en-US',{style:'currency',currency:c||'USD',maximumFractionDigits:2}).format(n)}catch{return `${c||'USD'} ${n.toFixed(2)}`}};
  const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n)||0)));
  const outcomeLabel={no_issue:'No damage / no issue',minor_damage:'Minor damage',major_damage:'Significant damage',board_broken:'Board broken / unusable',delayed:'Bag delayed',lost:'Bag lost'};
  const claimLabel={pending:'Claim pending',paid_full:'Claim resolved in full',paid_partial:'Claim partially resolved',denied:'Claim denied',not_pursued:'Claim not pursued'};
  let airlineMap=new Map();

  async function getAirlines(){
    try{ const r=await fetch('/api/airlines',{cache:'no-store'}); if(!r.ok) throw 0; const list=await r.json(); airlineMap=new Map(list.map(a=>[a.slug,a.airline])); return list; }catch{return []}
  }

  async function getReviews(slug=''){
    try{ const q=slug?`?airline_slug=${encodeURIComponent(slug)}&limit=12`:'?limit=12'; const r=await fetch('/api/reviews'+q,{cache:'no-store'}); if(!r.ok) throw 0; return await r.json(); }catch{return []}
  }

  function reviewMarkup(r){
    const fee=money(r.fee_paid,r.currency);
    const bits=[airlineMap.get(r.airline_slug)||'',r.route||'',r.trip_date||'',fee?`Paid ${fee}`:''].filter(Boolean);
    const outcome=r.baggage_outcome&&outcomeLabel[r.baggage_outcome]?`<span class="traveler-outcome ${r.baggage_outcome==='no_issue'?'ok':'issue'}">${esc(outcomeLabel[r.baggage_outcome])}</span>`:'';
    const claim=r.claim_outcome&&claimLabel[r.claim_outcome]?`<span class="traveler-claim">${esc(claimLabel[r.claim_outcome])}</span>`:'';
    const damage=r.damage_details?`<p class="traveler-damage"><strong>Baggage details:</strong> ${esc(r.damage_details)}</p>`:'';
    return `<article class="traveler-review"><div class="traveler-review-top"><span class="traveler-name">${esc(r.display_name||'Anonymous surfer')}</span><span class="traveler-stars" aria-label="${Number(r.rating)||0} out of 5">${stars(r.rating)}</span></div><div class="traveler-meta">${esc(bits.join(' · '))}</div>${outcome||claim?`<div class="traveler-outcomes">${outcome}${claim}</div>`:''}<p class="traveler-comment">${esc(r.comment||'')}</p>${damage}</article>`;
  }

  function ratingSummaryMarkup(reviews){
    const rated=reviews.map(r=>Number(r.rating)).filter(n=>Number.isInteger(n)&&n>=1&&n<=5);
    if(!rated.length) return '<div class="traveler-rating-summary empty"><strong>No traveler rating yet</strong><span>Be the first to share an experience with this airline.</span></div>';
    const avg=rated.reduce((a,b)=>a+b,0)/rated.length;
    const rounded=Math.max(1,Math.min(5,Math.round(avg)));
    return `<div class="traveler-rating-summary"><div><span class="traveler-summary-stars" aria-label="${avg.toFixed(1)} out of 5">${stars(rounded)}</span><strong>${avg.toFixed(1)} / 5</strong></div><span>Based on ${rated.length} approved traveler review${rated.length===1?'':'s'}</span></div>`;
  }

  function fillAirlineSelect(form,list,selected=''){
    const sel=form.querySelector('[name="airline_slug"]'); if(!sel) return;
    const opts=list.slice().sort((a,b)=>String(a.airline).localeCompare(String(b.airline))).map(a=>`<option value="${esc(a.slug)}" ${a.slug===selected?'selected':''}>${esc(a.airline)}</option>`).join('');
    sel.innerHTML=`<option value="">Choose airline…</option>${opts}`;
    if(selected) sel.value=selected;
  }

  async function initBlock(block){
    const form=block.querySelector('.traveler-form'); const listHost=block.querySelector('.traveler-list'); const status=form?.querySelector('.traveler-status');
    const fixedSlug=block.dataset.airlineSlug||'';
    const airlines=await getAirlines();
    fillAirlineSelect(form,airlines,fixedSlug);
    if(fixedSlug){ const sel=form.querySelector('[name="airline_slug"]'); if(sel){sel.value=fixedSlug; sel.closest('.traveler-field').hidden=true;} }

    const reviews=await getReviews(fixedSlug);
    if(fixedSlug){
      let summary=block.querySelector('.traveler-rating-summary-host');
      if(!summary){ summary=document.createElement('div'); summary.className='traveler-rating-summary-host'; listHost.parentElement.insertBefore(summary,listHost); }
      summary.innerHTML=ratingSummaryMarkup(reviews);
    }
    listHost.innerHTML=reviews.length?reviews.map(reviewMarkup).join(''):`<div class="traveler-empty">No approved traveler reports here yet. If you’ve flown with a board, your report can help the next surfer avoid a surprise at check-in.</div>`;

    form?.addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=form.querySelector('button[type="submit"]'); btn.disabled=true; status.className='traveler-status'; status.textContent='Submitting…';
      const fd=new FormData(form); const payload=Object.fromEntries(fd.entries());
      try{
        const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const out=await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(out.error||'Submission failed');
        status.className='traveler-status ok'; status.textContent='Thanks — submitted for review before it appears publicly.';
        document.dispatchEvent(new CustomEvent('bbf:review-submitted',{detail:{airline_slug:payload.airline_slug,rating:payload.rating,fee_paid:payload.fee_paid}}));
        const keepAirline=fixedSlug||payload.airline_slug; form.reset(); fillAirlineSelect(form,airlines,keepAirline); if(fixedSlug) form.querySelector('[name="airline_slug"]').value=fixedSlug;
      }catch(err){status.className='traveler-status err';status.textContent=err.message||'Could not submit right now.'}finally{btn.disabled=false}
    });
  }

  function jumpToForm(slug){
    const block=document.querySelector('.traveler-reports'); if(!block) return;
    const sel=block.querySelector('[name="airline_slug"]'); if(sel && slug) sel.value=slug;
    block.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>block.querySelector('[name="fee_paid"]')?.focus(),450);
  }

  document.addEventListener('click',e=>{const a=e.target.closest('[data-share-airline]');if(!a)return;e.preventDefault();jumpToForm(a.dataset.shareAirline||'')});
  window.BoardBagFeesReviews={jumpToForm};
  document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('.traveler-reports').forEach(initBlock));
})();
