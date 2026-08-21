(() => {
  const forms=[...document.querySelectorAll('.global-airline-search')];
  if(!forms.length) return;

  let airlineData=[];
  let loaded=false;
  const escapeHtml=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  async function loadAirlines(){
    if(loaded) return airlineData;
    loaded=true;
    try{
      const r=await fetch('/api/airlines',{cache:'no-store'});
      if(r.ok){
        const raw=await r.json();
        airlineData=raw.filter(a=>a.active!==false).map(a=>({
          airline:a.airline||'',
          slug:a.slug||''
        })).filter(a=>a.airline&&a.slug).sort((a,b)=>a.airline.localeCompare(b.airline));
      }
    }catch(e){ console.debug('Header airline search unavailable',e); }
    return airlineData;
  }

  function findMatches(q){
    q=q.trim().toLowerCase();
    if(!q) return [];
    const starts=[], contains=[];
    for(const a of airlineData){
      const n=a.airline.toLowerCase();
      if(n.startsWith(q)) starts.push(a);
      else if(n.includes(q)) contains.push(a);
    }
    return [...starts,...contains].slice(0,7);
  }

  function closeAll(except){
    forms.forEach(f=>{
      if(f===except) return;
      const box=f.querySelector('.global-airline-results');
      if(box) box.hidden=true;
    });
  }

  forms.forEach(form=>{
    const input=form.querySelector('.global-airline-search-input');
    const box=form.querySelector('.global-airline-results');
    if(!input||!box) return;

    const hero=document.querySelector('#search');

    async function update(){
      const q=input.value.trim();
      if(hero){
        hero.value=q;
        hero.dispatchEvent(new Event('input',{bubbles:true}));
      }
      await loadAirlines();
      const matches=findMatches(q);
      if(!q||!matches.length){ box.hidden=true; box.innerHTML=''; return; }
      box.innerHTML=matches.map(a=>`<a href="/airlines/${encodeURIComponent(a.slug)}"><strong>${escapeHtml(a.airline)}</strong><span>Open airline policy →</span></a>`).join('');
      box.hidden=false;
      closeAll(form);
    }

    input.addEventListener('focus',()=>{ if(input.value.trim()) update(); else loadAirlines(); });
    input.addEventListener('input',update);
    input.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ box.hidden=true; input.blur(); }
    });
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const q=input.value.trim();
      if(!q) return;
      await loadAirlines();
      const matches=findMatches(q);
      const exact=airlineData.find(a=>a.airline.toLowerCase()===q.toLowerCase());
      if(exact || matches.length===1){
        const a=exact||matches[0];
        window.location.href=`/airlines/${encodeURIComponent(a.slug)}`;
        return;
      }
      if(hero){
        hero.value=q;
        hero.dispatchEvent(new Event('input',{bubbles:true}));
        document.querySelector('#airline-comparison')?.scrollIntoView({behavior:'smooth',block:'start'});
        box.hidden=true;
      }else{
        window.location.href=`/?airline=${encodeURIComponent(q)}#airline-comparison`;
      }
    });
  });

  document.addEventListener('click',e=>{
    if(!e.target.closest('.global-airline-search')) closeAll();
  });
})();
