// Builds the questionnaire inside <div id="qform"> from window.QUESTIONS and submits it.
(function(){
const S=window.SITE, Q=window.QUESTIONS, root=document.getElementById('qform');
if(!root) return;
const embedded=root.hasAttribute('data-embedded');
const ans={}; let i=0;
const track=(e,p)=>{try{window.fbq&&fbq('trackCustom',e,p||{})}catch(_){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

root.innerHTML=
 '<div class="progress"><i id="bar"></i></div>'+
 Q.map((q,n)=>`<div class="step${n===0?' on':''}" data-step="${q.key}"><h2>${esc(q.title)}</h2><p class="sub">${esc(q.sub||'')}</p>
   <div class="opts" data-key="${q.key}">${q.options.map(o=>`<button type="button" class="opt" data-v="${esc(o.v)}">${esc(o.v)}${o.sub?`<small>${esc(o.sub)}</small>`:''}</button>`).join('')}</div></div>`).join('')+
 `<div class="step" data-step="contact"><h2>Where should I send my view?</h2><p class="sub">I reply personally on WhatsApp, usually within a few hours.</p>
   <label class="f">Name<input type="text" id="name" autocomplete="name"></label>
   <label class="f">WhatsApp number<input type="tel" id="phone" inputmode="tel" placeholder="+65 ..." autocomplete="tel"></label>
   <label class="f">Best time to reach you<select id="when"><option>Weekday daytime</option><option>Weekday evening</option><option>Weekend</option><option>Anytime</option></select></label>
   <label class="chk"><input type="checkbox" id="consent"><span>I agree to be contacted by ${esc(S.name)} about my enquiry. My details are used for this only.</span></label>
   <div class="err" id="err"></div><button type="button" class="btn" id="submit" style="width:100%">Get my options</button></div>
  <div class="step" data-step="done"><div class="done"><div class="tick">✓</div><h2>Thanks, <span id="nm"></span>.</h2>
   <p class="sub" id="doneMsg">I'll review your answers and message you on WhatsApp.</p>
   <a class="btn" id="waBtn" href="#">Message me on WhatsApp now</a>
   <p class="fine">Tap the button to send your answers in one message and skip the wait.</p></div></div>
  <button type="button" class="back" id="back" style="display:none">← Back</button>`;

const order=[...Q.map(q=>q.key),'contact','done'];
const steps=[...root.querySelectorAll('.step')], bar=root.querySelector('#bar'), back=root.querySelector('#back');
let started=false;

function show(n,scroll){
  i=n; steps.forEach(s=>s.classList.toggle('on',s.dataset.step===order[n]));
  bar.style.width=(n/(order.length-2))*100+'%';
  back.style.display=(n>0&&order[n]!=='done')?'block':'none';
  if(scroll){ embedded ? root.scrollIntoView({behavior:'smooth',block:'start'}) : window.scrollTo({top:0}); }
}
root.addEventListener('click',e=>{
  const b=e.target.closest('.opt'); if(!b)return;
  const g=b.parentElement;
  if(!started){started=true;track('QualifyStart');}
  g.querySelectorAll('.opt').forEach(o=>o.classList.remove('sel')); b.classList.add('sel');
  ans[g.dataset.key]=b.dataset.v;
  setTimeout(()=>show(i+1,true),160);
});
back.onclick=()=>show(i-1,true);

root.querySelector('#submit').onclick=async(ev)=>{
  const btn=ev.currentTarget; if(btn.disabled) return;
  const name=root.querySelector('#name').value.trim(), phone=root.querySelector('#phone').value.trim(), err=root.querySelector('#err');
  if(!name||phone.replace(/\D/g,'').length<8||!root.querySelector('#consent').checked){
    err.style.display='block';err.textContent='Please add your name, a valid number and tick the consent box.';return;
  }
  err.style.display='none'; btn.disabled=true; btn.textContent='Sending…';
  Object.assign(ans,{name,phone,when:root.querySelector('#when').value,tier:window.scoreLead(ans),
    submittedAt:new Date().toISOString(),source:new URLSearchParams(location.search).toString()||'direct'});
  track('QualifyComplete',{tier:ans.tier});
  try{window.fbq&&fbq('track','Lead',{content_category:ans.goal,value:0,currency:'SGD'})}catch(_){}
  if(S.leadEndpoint){
    try{await Promise.race([fetch(S.leadEndpoint,{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(ans)}),new Promise(r=>setTimeout(r,4000))])}catch(_){}
  }
  const lines=Q.map(q=>`${q.title.replace(/\?$/,'')}: ${ans[q.key]||'-'}`).join('\n');
  root.querySelector('#waBtn').href='https://wa.me/'+S.whatsapp+'?text='+encodeURIComponent(`Hi ${S.name.split(' ')[0]}, I just filled in the form.\n${lines}\nName: ${name}`);
  root.querySelector('#nm').textContent=name.split(' ')[0];
  if(ans.tier==='C') root.querySelector('#doneMsg').textContent="Since you're still exploring, I'll send you a market update and relevant analysis first, and we can talk when you're ready.";
  show(order.length-1,true);
};
show(0,false);
})();
