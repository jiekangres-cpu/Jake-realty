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
const DIR={T:'Tightens',E:'Eases',R:'Rule change'};
const P=window.PPI.map(([q,v])=>{const [y,n]=q.split('-Q');return {q,v,t:+y+(+n-1)/4+0.125}}).filter(p=>p.t>=T0-0.2);
const yearFrac=d=>{const a=new Date(d+'T00:00:00');return a.getFullYear()+(a-new Date(a.getFullYear(),0,1))/(365.25*864e5)};
const fmtDate=m=>m.label||new Date(m.date+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const M=window.MEASURES.map(m=>({...m,t:yearFrac(m.date)})).filter(m=>m.t>=T0).sort((a,b)=>a.t-b.t).map((m,i)=>({...m,n:i+1}));
let active=null; // family filter

const st=window.PPI_STATS;
if(st){
  document.getElementById('st1').textContent='+'+st.since2009+'%';
  document.getElementById('st2').textContent=st.drop.toFixed(1)+'%';
  document.getElementById('st3').textContent=st.latest.toFixed(1);
}
// legend (also a filter)
const lg=document.getElementById('famLegend');
lg.innerHTML=Object.entries(FAM).filter(([k])=>M.some(m=>m.fam===k)).map(([k,f])=>`<button type="button" class="chip" data-f="${k}"><i style="background:${f.color}"></i>${f.name}</button>`).join('');
lg.addEventListener('click',e=>{const b=e.target.closest('.chip'); if(!b) return; active=active===b.dataset.f?null:b.dataset.f;
  lg.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c.dataset.f===active)); lg.classList.toggle('filtered',!!active); list(); draw();});
function badgeShape(m,x,y,color){
  if(m.dir==='R') return `<polygon points="${x},${y-BR-1.5} ${x+BR+1.5},${y} ${x},${y+BR+1.5} ${x-BR-1.5},${y}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
  if(m.dir==='E') return `<circle cx="${x}" cy="${y}" r="${BR}" fill="#fff" stroke="${color}" stroke-width="2.5"/>`;
  return `<circle cx="${x}" cy="${y}" r="${BR}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
}
function list(){
  document.getElementById('measureList').innerHTML=M.filter(m=>!active||m.fam===active).map(m=>{const f=FAM[m.fam];
    const ring=m.dir==='E', dia=m.dir==='R';
    return `<li><span class="num${ring?' ring':''}${dia?' dia':''}" style="${ring?`border-color:${f.color};color:${f.color}`:`background:${f.color}`}"><b>${m.n}</b></span><time>${fmtDate(m)}</time><div><b>${esc(m.short)}</b><span class="fam" style="color:${f.color}">${f.name} · ${DIR[m.dir]}</span><p>${esc(m.detail)}</p></div></li>`}).join('');
}
list();

let W=0,H=0,sx,sy,mt=14;
const valAt=t=>{ if(t<=P[0].t) return P[0].v; if(t>=P[P.length-1].t) return P[P.length-1].v;
  for(let i=1;i<P.length;i++) if(P[i].t>=t){const a=P[i-1],b=P[i];return a.v+(b.v-a.v)*(t-a.t)/(b.t-a.t)} };

function draw(){
  W=host.clientWidth||320; H=W<520?420:390;
  sx=t=>ml+(t-T0)/(T1-T0)*(W-ml-mr);
  const vis=M.filter(m=>!active||m.fam===active), gap=BR*2+3, lastX=[];
  vis.forEach(m=>{m.x=sx(m.t); let l=0; while(lastX[l]!==undefined && m.x-lastX[l]<gap) l++; lastX[l]=m.x; m.lane=l;});
  const lanes=Math.max(1,...vis.map(m=>m.lane+1));
  mt=10+lanes*(BR*2+4);
  sy=v=>H-mb-((v-YMIN)/(YMAX-YMIN))*(H-mb-mt);
  const grid=[100,150,200].map(v=>`<line x1="${ml}" x2="${W-mr}" y1="${sy(v)}" y2="${sy(v)}" class="gl"/><text x="${ml-6}" y="${sy(v)+4}" class="ax" text-anchor="end">${v}</text>`).join('');
  const years=[]; for(let y=2005;y<=2025;y+=5) years.push(y);
  const xl=years.map(y=>`<text x="${sx(y)}" y="${H-8}" class="ax" text-anchor="middle">${y}</text>`).join('');
  const path=P.map((p,i)=>(i?'L':'M')+sx(p.t).toFixed(1)+' '+sy(p.v).toFixed(1)).join(' ');
  const by=m=>10+BR+m.lane*(BR*2+4);
  const lines=vis.map(m=>`<line x1="${m.x}" x2="${m.x}" y1="${by(m)}" y2="${H-mb}" stroke="${FAM[m.fam].color}" stroke-width="2" opacity=".75"/>`).join('');
  const badges=vis.map(m=>`<g>${badgeShape(m,m.x,by(m),FAM[m.fam].color)}<text x="${m.x}" y="${by(m)+3.5}" text-anchor="middle" class="bn" fill="${m.dir==='E'?FAM[m.fam].color:'#fff'}">${m.n}</text></g>`).join('');
  const last=P[P.length-1], pk=st&&P.find(p=>p.q===st.peak[1]);
  const marks=(pk?`<text x="${sx(pk.t)}" y="${sy(pk.v)-8}" class="an" text-anchor="middle">Peak ${pk.v}</text>`:'')+
    `<text x="${sx(last.t)-2}" y="${sy(last.v)-8}" class="an" text-anchor="end">${last.v}</text>`;
  host.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Private residential price index 2005 to 2026 with numbered policy measures coloured by type">${grid}${xl}${lines}<path d="${path}" class="pl"/>${badges}${marks}<line id="xh" y1="${mt}" y2="${H-mb}" class="xh" style="display:none"/><rect x="${ml}" y="0" width="${W-ml-mr}" height="${H}" fill="transparent" id="hit"/></svg>`;
  const svg=host.firstChild, xh=svg.querySelector('#xh'), hit=svg.querySelector('#hit');
  function move(e){
    const r=svg.getBoundingClientRect(), x=e.clientX-r.left, t=T0+(x-ml)/(W-ml-mr)*(T1-T0);
    let near=null,best=BR+4; vis.forEach(m=>{const d=Math.abs(m.x-x); if(d<best){best=d;near=m}});
    const same=near?vis.filter(m=>Math.abs(m.x-near.x)<BR+4):[];
    const q=P.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a);
    xh.setAttribute('x1',sx(q.t)); xh.setAttribute('x2',sx(q.t)); xh.style.display='';
    tip.innerHTML=`<div class="tq">${q.q} · index ${q.v}</div>`+same.map(m=>`<div class="tm" style="border-color:${FAM[m.fam].color}"><span>${m.n}. ${fmtDate(m)} · ${FAM[m.fam].name} · ${DIR[m.dir]}</span><b>${esc(m.short)}</b></div>`).join('');
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
