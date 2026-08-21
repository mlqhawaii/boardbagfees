(() => {
  const loginCard=document.getElementById('loginCard'), queue=document.getElementById('queue'), cards=document.getElementById('cards');
  const loginStatus=document.getElementById('loginStatus'), queueStatus=document.getElementById('queueStatus');
  let password=sessionStorage.getItem('bbfAdminPassword')||'', currentStatus='new';
  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const api=async(path='',opts={})=>{const r=await fetch('/api/admin-messages'+path,{...opts,headers:{'Content-Type':'application/json',Authorization:`Bearer ${password}`,...(opts.headers||{})},cache:'no-store'});const out=await r.json().catch(()=>({}));if(!r.ok)throw new Error(out.error||'Request failed');return out};
  function card(m){
    const when=m.created_at?new Date(m.created_at).toLocaleString():'';
    const status=m.status||'new';
    const subject=m.subject||'No subject';
    return `<article class="review-card message-card" data-id="${esc(m.id)}"><div class="review-top"><strong>${esc(subject)}</strong><span class="badge">${esc(status)}</span></div><div class="meta">${esc(m.name||'Anonymous')} · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${when?` · ${esc(when)}`:''}</div><div class="comment">${esc(m.message||'')}</div><div class="actions">${status!=='archived'?'<button class="archive">Archive</button>':'<button class="restore">Mark new</button>'}<a class="reply-link" href="mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: '+subject)}">Reply by email</a></div></article>`;
  }
  async function load(){queueStatus.textContent='Loading…';try{const rows=await api(`?status=${encodeURIComponent(currentStatus)}&limit=100`);cards.innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">No contact messages in this queue.</div>';queueStatus.textContent=`${rows.length} message${rows.length===1?'':'s'}`;loginCard.hidden=true;queue.hidden=false}catch(e){queueStatus.textContent='';loginStatus.textContent=e.message;loginCard.hidden=false;queue.hidden=true;sessionStorage.removeItem('bbfAdminPassword')}}
  async function update(cardEl,status){const btns=cardEl.querySelectorAll('button');btns.forEach(b=>b.disabled=true);queueStatus.textContent='Saving…';try{await api('',{method:'PATCH',body:JSON.stringify({id:cardEl.dataset.id,status})});await load()}catch(e){queueStatus.textContent=e.message;btns.forEach(b=>b.disabled=false)}}
  document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();password=document.getElementById('password').value;sessionStorage.setItem('bbfAdminPassword',password);loginStatus.textContent='';load()});
  document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;document.querySelectorAll('.tabs [data-status]').forEach(x=>x.classList.toggle('active',x===b));currentStatus=b.dataset.status;load()});
  cards.addEventListener('click',e=>{const c=e.target.closest('.message-card');if(!c)return;if(e.target.closest('.archive'))update(c,'archived');if(e.target.closest('.restore'))update(c,'new')});
  document.getElementById('logout').addEventListener('click',()=>{sessionStorage.removeItem('bbfAdminPassword');password='';queue.hidden=true;loginCard.hidden=false;document.getElementById('password').value=''});
  if(password)load();
})();
