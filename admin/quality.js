(()=>{
 const loginCard=document.getElementById('loginCard'),queue=document.getElementById('queue'),cards=document.getElementById('cards'),loginStatus=document.getElementById('loginStatus'),queueStatus=document.getElementById('queueStatus');
 let password=sessionStorage.getItem('bbfAdminPassword')||'',currentStatus='pending';
 const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
 const api=async(path='',opts={})=>{const r=await fetch('/api/admin-quality'+path,{...opts,headers:{'Content-Type':'application/json',Authorization:`Bearer ${password}`,...(opts.headers||{})},cache:'no-store'});const out=await r.json().catch(()=>({}));if(!r.ok)throw new Error(out.error||'Request failed');return out};
 const val=(v)=>v===null||v===undefined||v===''?'—':String(v);
 function diffRow(label,oldV,newV){const changed=String(oldV??'')!==String(newV??'');return `<div class="qc-diff-row ${changed?'changed':''}"><strong>${esc(label)}</strong><span>${esc(val(oldV))}</span><span>${esc(val(newV))}</span></div>`}
 function fieldEditor(key,label,current,proposed){
   const replacement=typeof proposed==='string' ? proposed : '';
   return `<label class="qc-field">${esc(label)}
     <textarea data-policy-field="${key}" maxlength="2000" rows="2">${esc(current??'')}</textarea>
     ${replacement&&replacement!==current?`<button type="button" class="secondary qc-use-proposed" data-proposed="${esc(replacement)}">Use proposed ${esc(label.toLowerCase())}</button>`:''}
   </label>`;
 }
 function treatmentEditor(current){
   const choices={
     '':'Unspecified',
     conditional:'Conditional',
     normal_checked_bag:'Standard checked bag',
     special_fee:'Dedicated sports fee',
     free_additional_allowance:'Free additional allowance',
     not_accepted:'Not accepted'
   };
   const selected=current??'';
   const options=Object.hasOwn(choices,selected)?choices:{...choices,[selected]:selected};
   return `<label class="qc-field">Treatment<select data-policy-field="treatment">
     ${Object.entries(options).map(([key,label])=>`<option value="${esc(key)}"${key===selected?' selected':''}>${esc(label)}</option>`).join('')}
   </select></label>`;
 }
 function reviewFields(old,p){
   return `<fieldset class="qc-fields"><legend>Review live policy fields</legend>
     <p>Fields start with the current values. Edit them or choose a proposed value.</p>
     ${fieldEditor('fee','Fee',old.policy_facts?.fee_text,p.p_facts?.fee_text)}
     ${treatmentEditor(old.policy_facts?.baggage_treatment)}
     ${fieldEditor('summary','Surfboard summary',old.surfboard_treatment,p.p_surfboard_treatment)}
     ${fieldEditor('size','Size rule',old.size_rule,p.p_size_rule)}
   </fieldset>`;
 }
 function card(x){const p=x.proposed_payload||{}, old=x.old_snapshot||{}, facts=p.p_facts||{}, oldFacts=old.policy_facts||{};const reasons=Array.isArray(x.reasons)?x.reasons:[];const when=x.created_at?new Date(x.created_at).toLocaleString():'';const conf=Number(x.confidence);const confText=Number.isFinite(conf)?`${Math.round(conf*100)}%`:'—';const pending=x.status==='pending';return `<article class="review-card qc-card" data-id="${esc(x.id)}"><div class="review-top"><div><strong>${esc(x.airline||p.p_airline||'Unknown airline')}</strong><div class="meta">${esc(when)} · confidence ${esc(confText)}</div></div><span class="badge qc-badge ${esc(x.severity||'green')}"><i class="qc-dot ${esc(x.severity||'green')}"></i>${esc(x.status)}</span></div>${reasons.length?`<div class="qc-reasons"><strong>Why it was flagged</strong><ul>${reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:''}<div class="qc-diff"><div class="qc-diff-head"><strong>Field</strong><strong>Current</strong><strong>Proposed</strong></div>${diffRow('Fee',oldFacts.fee_text,facts.fee_text)}${diffRow('Treatment',oldFacts.baggage_treatment,facts.baggage_treatment)}${diffRow('Surfboard summary',old.surfboard_treatment,p.p_surfboard_treatment)}${diffRow('Size rule',old.size_rule,p.p_size_rule)}${diffRow('Surf rating',`${val(old.surf_rating)} (${val(old.surf_rating_score)})`,`${val(p.p_surf_rating)} (${val(p.p_surf_rating_score)})`)}</div><div class="meta"><a href="${esc(x.policy_url)}" target="_blank" rel="noopener">Open official policy ↗</a></div>${pending?`${reviewFields(old,p)}<div class="actions"><label>Optional review note<textarea class="review-note" placeholder="Why you accepted or kept the current value"></textarea></label><button class="approve qc-approve">Apply reviewed fields</button><button class="reject qc-keep">Keep current</button></div>`:''}</article>`}
 async function load(){queueStatus.textContent='Loading…';try{const rows=await api(`?status=${encodeURIComponent(currentStatus)}&limit=150`);cards.innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">Nothing in this quality-control queue.</div>';queueStatus.textContent=`${rows.length} item${rows.length===1?'':'s'}`;loginCard.hidden=true;queue.hidden=false}catch(e){queueStatus.textContent='';loginStatus.textContent=e.message;loginCard.hidden=false;queue.hidden=true;sessionStorage.removeItem('bbfAdminPassword')}}
 async function update(c,action){c.querySelectorAll('button').forEach(b=>b.disabled=true);queueStatus.textContent='Saving…';try{await api('',{method:'PATCH',body:JSON.stringify({id:c.dataset.id,action,fields:Object.fromEntries([...c.querySelectorAll('[data-policy-field]')].map(input=>[input.dataset.policyField,input.value])),notes:c.querySelector('.review-note')?.value||''})});await load()}catch(e){queueStatus.textContent=e.message;c.querySelectorAll('button').forEach(b=>b.disabled=false)}}
 document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();password=document.getElementById('password').value;sessionStorage.setItem('bbfAdminPassword',password);loginStatus.textContent='';load()});
 document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;document.querySelectorAll('.tabs [data-status]').forEach(x=>x.classList.toggle('active',x===b));currentStatus=b.dataset.status;load()});
 cards.addEventListener('click',e=>{const c=e.target.closest('.qc-card');if(!c)return;const proposed=e.target.closest('.qc-use-proposed');if(proposed){proposed.closest('.qc-field').querySelector('textarea').value=proposed.dataset.proposed;return}if(e.target.closest('.qc-approve'))update(c,'approve');if(e.target.closest('.qc-keep'))update(c,'keep_current')});
 document.getElementById('logout').addEventListener('click',()=>{sessionStorage.removeItem('bbfAdminPassword');password='';queue.hidden=true;loginCard.hidden=false;document.getElementById('password').value=''});if(password)load();
})();