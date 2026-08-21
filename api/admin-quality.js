import crypto from 'crypto';

const clean = (v, max = 2000) => String(v ?? '').trim().slice(0, max);
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));if(aa.length!==bb.length)return false;return crypto.timingSafeEqual(aa,bb)}
function authorized(req){const expected=process.env.BOARDBAGFEES_ADMIN_PASSWORD;if(!expected)return false;const auth=String(req.headers.authorization||'');const supplied=auth.startsWith('Bearer ')?auth.slice(7):String(req.headers['x-admin-password']||'');return safeEqual(supplied,expected)}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(!authorized(req)) return res.status(401).json({error:'Unauthorized'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)return res.status(500).json({error:'Missing server-side Supabase admin environment variables.'});
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  try{
    if(req.method==='GET'){
      const allowed=new Set(['pending','auto_applied','approved','kept_current','apply_failed','all']);
      const status=allowed.has(String(req.query?.status||'pending'))?String(req.query?.status||'pending'):'pending';
      const limit=Math.max(1,Math.min(200,Number(req.query?.limit)||100));
      let endpoint=`${url}/rest/v1/airline_policy_qc_log?select=id,airline,policy_url,confidence,severity,status,reasons,old_snapshot,proposed_payload,created_at,reviewed_at,review_action,review_notes&order=created_at.desc&limit=${limit}`;
      if(status!=='all')endpoint+=`&status=eq.${encodeURIComponent(status)}`;
      const r=await fetch(endpoint,{headers});const text=await r.text();
      if(!r.ok)return res.status(r.status).json({error:'Unable to load quality-control queue',detail:text});
      return res.status(200).json(JSON.parse(text||'[]'));
    }
    if(req.method==='PATCH'){
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      const id=clean(body.id,30),action=clean(body.action,30),notes=clean(body.notes,1500)||null;
      if(!/^\d+$/.test(id))return res.status(400).json({error:'Invalid QC item id.'});
      if(!['approve','keep_current'].includes(action))return res.status(400).json({error:'Invalid action.'});
      const rr=await fetch(`${url}/rest/v1/airline_policy_qc_log?id=eq.${encodeURIComponent(id)}&select=*`,{headers});
      const raw=await rr.text();if(!rr.ok)return res.status(rr.status).json({error:'Unable to load QC item',detail:raw});
      const row=JSON.parse(raw||'[]')[0];if(!row)return res.status(404).json({error:'QC item not found.'});
      if(row.status!=='pending')return res.status(409).json({error:'This QC item is no longer pending.'});
      if(action==='approve'){
        const payload=row.proposed_payload||{};
        const apply=await fetch(`${url}/rest/v1/rpc/process_airline_policy_extraction_unchecked`,{method:'POST',headers,body:JSON.stringify(payload)});
        const applyText=await apply.text();
        if(!apply.ok)return res.status(apply.status).json({error:'Unable to apply proposed policy update',detail:applyText});
      }
      const status=action==='approve'?'approved':'kept_current';
      const patch={status,reviewed_at:new Date().toISOString(),review_action:action,review_notes:notes};
      const pr=await fetch(`${url}/rest/v1/airline_policy_qc_log?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(patch)});
      const pt=await pr.text();if(!pr.ok)return res.status(pr.status).json({error:'Unable to update QC item',detail:pt});
      return res.status(200).json({ok:true,item:JSON.parse(pt||'[]')[0]||null});
    }
    res.setHeader('Allow','GET, PATCH');return res.status(405).json({error:'Method not allowed'});
  }catch(e){console.error(e);return res.status(500).json({error:'Quality-control service is temporarily unavailable.'})}
}
