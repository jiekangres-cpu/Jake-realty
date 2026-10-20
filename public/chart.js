// Price index chart with numbered policy markers coloured by type. Data: data.js (PPI, MEASURES, PPI_STATS).
(function(){
const host=document.getElementById('ppiChart'); if(!host||!window.PPI) return;
const tip=document.getElementById('ppiTip');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T0=2005, T1=2027, YMIN=60, YMAX=240, ml=38, mr=12, mb=26, BR=8;
const FAM={
  ABSD:  {name:'ABSD',                     color:'#c0392b'},
  SSD:   {name:'SSD',                      color:'#e08a1e'},
  BSD:   {name:'BSD',                      color:'#7b4fb0'},
  TDSR:  {name:'TDSR / MSR',               color:'#1f6fb2'},
  LTV:   {name:'Loan limits (LTV)',        color:'#1b998b'},
  UNITS: {name:'En bloc unit cap',         color:'#4f8a24'},
  SUPPLY:{name:'Land supply and en bloc',  color:'#9aa51d'},
  AREA:  {name:'Floor-area rules',         color:'#8c5a2b'},
  OTHER: {name:'Other',                    color:'#6d6d6d'}
};
const DIR={T:'Tightens',E:'Eases',R:'Rule change'}, GREEN='#2f8f5b';
const col=m=>m.dir==='E'?GREEN:FAM[m.fam].color;
const P=window.PPI.map(([q,v])=>{const [y,n]=q.split('-Q');return {q,v,t:+y+(+n-1)/4+0.125}}).filter(p=>p.t>=T0-0.2);
const yearFrac=d=>{const a=new Date(d+'T00:00:00');return a.getFullYear()+(a-new Date(a.getFullYear(),0,1))/(365.25*864e5)};
const fmtDate=m=>m.label||new Date(m.date+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const M=window.MEASURES.map(m=>({...m,t:yearFrac(m.date)})).filter(m=>m.t>=T0).sort((a,b)=>a.t-b.t).map((m,i)=>({...m,n:i+1}));
let active=null, onlyIn=false; // filters: family, in-force only
const show=m=>(!active||m.fam===active)&&(!onlyIn||m.status==='in');

const st=window.PPI_STATS;
if(st){
  document.getElementById('st1').textContent='+'+st.since2009+'%';
  document.getElementById('st2').textContent=st.drop.toFixed(1)+'%';
}

// ---- bull run analysis, all computed from the index data
const Q=window.PPI, qi=Object.fromEntries(Q.map((x,i)=>[x[0],i])), val=q=>Q[qi[q]][1];
const lastQ=Q[Q.length-1][0];
const mq=m=>{const d=new Date(m.date+'T00:00:00');return d.getFullYear()*4+Math.floor(d.getMonth()/3)};
const qn=q=>{const [y,n]=q.split('-Q');return +y*4+(+n-1)};
const tight=(a,b)=>window.MEASURES.filter(m=>m.dir==='T'&&mq(m)>qn(a)&&mq(m)<=qn(b)).length;
const trough1=Q.filter(x=>x[0]>='2008-Q1'&&x[0]<='2009-Q4').reduce((a,b)=>b[1]<a[1]?b:a)[0];
const peak=st.peak[1], trough2=st.trough[1], START='2020-Q1'; // latest bull run starts when the 2013 peak was finally recovered
function phase(name,a,b){const ch=val(b)/val(a)-1, yrs=(qi[b]-qi[a])/4, pa=(Math.pow(val(b)/val(a),1/yrs)-1);
  return {name,a,b,from:val(a),to:val(b),ch,yrs,pa,tight:tight(a,b)};}
const R1=phase('Bull run 1',trough1,peak), DN=phase('Downturn',peak,trough2), RC=phase('Recovery',trough2,START), R2=phase('Latest bull run',START,lastQ);
const pct=(x,d=1)=>(x>=0?'+':'')+(x*100).toFixed(d)+'%';
document.getElementById('st3').textContent=pct(R2.ch,0);
document.getElementById('st3t').textContent=`Latest bull run: ${R2.a} low (${R2.from}) to ${R2.b} (${R2.to}), about ${(R2.pa*100).toFixed(1)}% a year`;
document.getElementById('runsTbl').innerHTML='<thead><tr><th>Phase</th><th>Period</th><th>Index</th><th>Change</th><th>Per year</th><th>Tightening moves</th></tr></thead><tbody>'+
  [R1,DN,RC,R2].map((r,i)=>`<tr class="${i===3?'cur':''}"><td>${r.name}</td><td>${r.a} to ${r.b}<br><small>${r.yrs.toFixed(1)} years</small></td><td>${r.from} to ${r.to}</td><td class="${r.ch<0?'neg':'pos'}">${pct(r.ch)}</td><td class="${r.pa<0?'neg':'pos'}">${pct(r.pa)}</td><td>${r.tight}</td></tr>`).join('')+'</tbody>';
// insights
const after=Q.filter(x=>qi[x[0]]>qi[START]);
let fell=0,worst=0; after.forEach(x=>{const prev=Q[qi[x[0]]-1][1], c=x[1]/prev-1; if(c<0){fell++; if(c<worst) worst=c;}});
const yoy=i=>Q[i][1]/Q[i-4][1]-1;
let best={v:-9,i:0}; for(let i=qi[START]+4;i<Q.length;i++){const y=yoy(i); if(y>best.v) best={v:y,i}}
const cur=yoy(Q.length-1); let since=null; for(let i=Q.length-2;i>=qi[START]+4;i--){ if(yoy(i)<=cur){since=Q[i][0];break} }
const regained=Q.find(x=>qi[x[0]]>qi[peak]&&x[1]>val(peak))[0];
const ins=[
  `The index first passed its ${peak} peak again in ${regained}, ${(((qi[regained]-qi[peak])/4)).toFixed(1)} years later.`,
  `Since ${START}, ${fell} of ${after.length} quarters fell, and the largest fall was ${(worst*100).toFixed(1)}%.`,
  `Fastest 12 months: ${pct(best.v)} from ${Q[best.i-4][0]} to ${Q[best.i][0]}.`,
  `Latest 12 months: ${pct(cur)}${since?`, the slowest rise since ${since}`:', the slowest 12-month rise of the run'}.`,
  `Bull run 1 averaged ${pct(R1.pa)} a year over ${R1.yrs.toFixed(1)} years, with ${R1.tight} tightening moves along the way. The latest run averages ${pct(R2.pa)} a year over ${R2.yrs.toFixed(1)} years, with ${R2.tight} tightening moves.`
];
document.getElementById('insights').innerHTML=ins.map(t=>`<li>${t}</li>`).join('');

// legend (also a filter)
const lg=document.getElementById('famLegend');
lg.innerHTML=Object.entries(FAM).filter(([k])=>M.some(m=>m.fam===k)).map(([k,f])=>`<button type="button" class="chip" data-f="${k}"><i style="background:${f.color}"></i>${f.name}</button>`).join('');
const sw=document.getElementById('inForceSwitch');
document.getElementById('inCount').textContent=M.filter(m=>m.status==='in').length+' of '+M.length+' measures';
sw.addEventListener('change',()=>{onlyIn=sw.checked; list(); draw();});
lg.addEventListener('click',e=>{const b=e.target.closest('.chip'); if(!b) return;
  active=active===b.dataset.f?null:b.dataset.f; lg.querySelectorAll('.chip[data-f]').forEach(c=>c.classList.toggle('on',c.dataset.f===active));
  lg.classList.toggle('filtered',!!active); list(); draw();});
function badgeShape(m,x,y,color){
  if(m.dir==='R') return `<polygon points="${x},${y-BR-1.5} ${x+BR+1.5},${y} ${x},${y+BR+1.5} ${x-BR-1.5},${y}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
  return `<circle cx="${x}" cy="${y}" r="${BR}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
}
function list(){
  document.getElementById('measureList').innerHTML=M.filter(show).reverse().map(m=>{const f=FAM[m.fam];
    const dia=m.dir==='R', c=col(m);
    const stLabel=m.status==='in'?'In force today':m.status==='repl'?`Replaced by #${m.by}`:m.status==='oneoff'?'One-off, no longer applies':'Status to confirm';
    return `<li class="st-${m.status} d-${m.dir}"><span class="num${dia?' dia':''}" style="background:${c}"><b>${m.n}</b></span><time>${fmtDate(m)}</time><div><b class="mt">${esc(m.short)}</b><span class="fam" style="color:${c}">${f.name} · ${DIR[m.dir]}</span><dl class="ba"><dt>Before</dt><dd>${esc(m.before)}</dd><dt>After</dt><dd>${esc(m.after)}</dd></dl>${m.example?`<p class="ex">${esc(m.example)}</p>`:''}${m.why?`<p class="why">${esc(m.why)}</p>`:''}<span class="stat ${m.status}">${stLabel}</span>${m.note?`<p class="note">${esc(m.note)}</p>`:''}</div></li>`}).join('');
}
list();

let W=0,H=0,sx,sy,mt=14;
const valAt=t=>{ if(t<=P[0].t) return P[0].v; if(t>=P[P.length-1].t) return P[P.length-1].v;
  for(let i=1;i<P.length;i++) if(P[i].t>=t){const a=P[i-1],b=P[i];return a.v+(b.v-a.v)*(t-a.t)/(b.t-a.t)} };

function draw(){
  W=host.clientWidth||320; H=W<520?420:390;
  sx=t=>ml+(t-T0)/(T1-T0)*(W-ml-mr);
  const vis=M.filter(show), gap=BR*2+3, lastX=[];
  vis.forEach(m=>{m.x=sx(m.t); let l=0; while(lastX[l]!==undefined && m.x-lastX[l]<gap) l++; lastX[l]=m.x; m.lane=l;});
  const lanes=Math.max(1,...vis.map(m=>m.lane+1));
  mt=10+lanes*(BR*2+4);
  sy=v=>H-mb-((v-YMIN)/(YMAX-YMIN))*(H-mb-mt);
  const grid=[100,150,200].map(v=>`<line x1="${ml}" x2="${W-mr}" y1="${sy(v)}" y2="${sy(v)}" class="gl"/><text x="${ml-6}" y="${sy(v)+4}" class="ax" text-anchor="end">${v}</text>`).join('');
  const years=[]; for(let y=2005;y<=2025;y+=5) years.push(y);
  const xl=years.map(y=>`<text x="${sx(y)}" y="${H-8}" class="ax" text-anchor="middle">${y}</text>`).join('');
  const path=P.map((p,i)=>(i?'L':'M')+sx(p.t).toFixed(1)+' '+sy(p.v).toFixed(1)).join(' ');
  const by=m=>10+BR+m.lane*(BR*2+4);
  const lastP=P[P.length-1], tr=P.find(p=>p.q===START);
  const band=tr?`<rect x="${sx(tr.t)}" y="${mt}" width="${sx(lastP.t)-sx(tr.t)}" height="${H-mb-mt}" fill="#2f8f5b" opacity=".1"/><text x="${sx(tr.t)+6}" y="${H-mb-8}" class="an" style="fill:#2f8f5b">Latest bull run ${pct(R2.ch,0)}</text>`:'';
  const lines=vis.map(m=>`<line x1="${m.x}" x2="${m.x}" y1="${by(m)}" y2="${H-mb}" stroke="${col(m)}" stroke-width="2" opacity=".75"/>`).join('');
  const badges=vis.map(m=>`<g>${m.status==='in'?`<circle cx="${m.x}" cy="${by(m)}" r="${BR+4}" fill="none" stroke="#c9a227" stroke-width="2"/>`:''}${badgeShape(m,m.x,by(m),col(m))}<text x="${m.x}" y="${by(m)+3.5}" text-anchor="middle" class="bn" fill="#fff">${m.n}</text></g>`).join('');
  const last=P[P.length-1], pk=st&&P.find(p=>p.q===st.peak[1]);
  const marks=(pk?`<text x="${sx(pk.t)}" y="${sy(pk.v)-8}" class="an" text-anchor="middle">Peak ${pk.v}</text>`:'')+
    `<text x="${sx(last.t)-2}" y="${sy(last.v)-8}" class="an" text-anchor="end">${last.v}</text>`;
  host.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Private residential price index 2005 to 2026 with numbered policy measures coloured by type">${grid}${xl}${band}${lines}<path d="${path}" class="pl"/>${badges}${marks}<line id="xh" y1="${mt}" y2="${H-mb}" class="xh" style="display:none"/><rect x="${ml}" y="0" width="${W-ml-mr}" height="${H}" fill="transparent" id="hit"/></svg>`;
  const svg=host.firstChild, xh=svg.querySelector('#xh'), hit=svg.querySelector('#hit');
  function move(e){
    const r=svg.getBoundingClientRect(), x=e.clientX-r.left, t=T0+(x-ml)/(W-ml-mr)*(T1-T0);
    let near=null,best=BR+4; vis.forEach(m=>{const d=Math.abs(m.x-x); if(d<best){best=d;near=m}});
    const same=near?vis.filter(m=>Math.abs(m.x-near.x)<BR+4):[];
    const q=P.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a);
    xh.setAttribute('x1',sx(q.t)); xh.setAttribute('x2',sx(q.t)); xh.style.display='';
    tip.innerHTML=`<div class="tq">${q.q} · index ${q.v}</div>`+same.map(m=>`<div class="tm" style="border-color:${col(m)}"><span>${m.n}. ${fmtDate(m)} · ${FAM[m.fam].name} · ${DIR[m.dir]}${m.status==='in'?' · In force today':''}</span><b>${esc(m.short)}</b></div>`).join('');
    tip.hidden=false;
    const cw=tip.parentElement.clientWidth, tw=tip.offsetWidth, left=Math.min(Math.max(host.offsetLeft+x-tw/2,4),cw-tw-4);
    tip.style.left=left+'px'; tip.style.top=(Math.max(sy(q.v)-tip.offsetHeight-14,4)+host.offsetTop)+'px';
  }
  hit.addEventListener('pointermove',move); hit.addEventListener('pointerdown',move);
  hit.addEventListener('pointerleave',()=>{tip.hidden=true;xh.style.display='none'});
}
draw();
let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(draw,120)});
})();
