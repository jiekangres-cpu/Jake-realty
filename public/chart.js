// Price index chart with numbered policy markers. Data comes from data.js (window.PPI, window.MEASURES, window.PPI_STATS).
(function(){
const host=document.getElementById('ppiChart'); if(!host||!window.PPI) return;
const tip=document.getElementById('ppiTip');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T0=2005, T1=2027, YMIN=60, YMAX=240, ml=38, mr=12, mb=26, BR=8; // BR = badge radius
const P=window.PPI.map(([q,v])=>{const [y,n]=q.split('-Q');return {q,v,t:+y+(+n-1)/4+0.125}}).filter(p=>p.t>=T0-0.2);
const yearFrac=d=>{const a=new Date(d+'T00:00:00');return a.getFullYear()+(a-new Date(a.getFullYear(),0,1))/(365.25*864e5)};
const SHORT={ // short label per measure, keyed by date + direction
 '2009-09-14|Cooling':'Interest-only loans scrapped','2010-02-20|Cooling':'SSD introduced, LTV cut','2010-08-30|Cooling':'SSD 3 years, 2nd-loan LTV 70%',
 '2011-01-14|Cooling':'SSD 4 years, 2nd-loan LTV 60%','2011-12-08|Cooling':'ABSD introduced','2012-10-06|Cooling':'LTV cut for long tenures',
 '2013-01-12|Cooling':'ABSD raised, LTV cut','2013-06-29|Cooling':'TDSR introduced (60%)','2013-12-09|Cooling':'MSR extended to ECs',
 '2016-09-01|Warming':'TDSR eased for refinancing','2017-03-11|Warming':'SSD cut to 3 years','2017-03-11|Cooling':'Entity conveyance duties',
 '2018-02-20|Cooling':'BSD 4% top tier','2018-07-06|Cooling':'ABSD raised, LTV cut','2018-12-07|Warming':'Land supply moderated',
 '2021-12-16|Cooling':'ABSD raised, TDSR 55%','2022-05-09|Cooling':'ABSD on trust transfers','2022-09-30|Cooling':'Higher rate floors, HDB wait-out',
 '2023-02-15|Cooling':'BSD raised (high value)','2023-04-27|Cooling':'ABSD raised to current levels','2025-07-04|Cooling':'SSD back to 4 years'};
const M=window.MEASURES.map(m=>({...m,t:yearFrac(m.date)})).filter(m=>m.t>=T0).sort((a,b)=>a.t-b.t)
  .map((m,i)=>({...m,n:i+1,short:SHORT[m.date+'|'+m.dir]||m.title}));
const fmtDate=d=>new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const cls=m=>m.dir==='Cooling'?'c':'w';

const st=window.PPI_STATS;
if(st){
  document.getElementById('st1').textContent='+'+st.since2009+'%';
  document.getElementById('st2').textContent=st.drop.toFixed(1)+'%';
  document.getElementById('st3').textContent=st.latest.toFixed(1);
}
document.getElementById('measureList').innerHTML=M.map(m=>
  `<li><span class="num ${cls(m)}">${m.n}</span><time>${fmtDate(m.date)}</time><div><b>${esc(m.short)}</b><p>${esc(m.title)}${m.detail?'. '+esc(m.detail):''}</p></div></li>`).join('');

let W=0,H=0,sx,sy,mt=14;
const valAt=t=>{
  if(t<=P[0].t) return P[0].v; if(t>=P[P.length-1].t) return P[P.length-1].v;
  for(let i=1;i<P.length;i++) if(P[i].t>=t){const a=P[i-1],b=P[i];return a.v+(b.v-a.v)*(t-a.t)/(b.t-a.t)}
};

function draw(){
  W=host.clientWidth||320; H=W<520?300:380;
  sx=t=>ml+(t-T0)/(T1-T0)*(W-ml-mr);
  // stagger badges into lanes so numbers never overlap
  const gap=BR*2+2, lastX=[];
  M.forEach(m=>{m.x=sx(m.t); let l=0; while(lastX[l]!==undefined && m.x-lastX[l]<gap) l++; lastX[l]=m.x; m.lane=l;});
  const lanes=Math.max(...M.map(m=>m.lane))+1;
  mt=10+lanes*(BR*2+3);
  sy=v=>H-mb-((v-YMIN)/(YMAX-YMIN))*(H-mb-mt);
  const grid=[100,150,200].map(v=>`<line x1="${ml}" x2="${W-mr}" y1="${sy(v)}" y2="${sy(v)}" class="gl"/><text x="${ml-6}" y="${sy(v)+4}" class="ax" text-anchor="end">${v}</text>`).join('');
  const years=[]; for(let y=2005;y<=2025;y+=5) years.push(y);
  const xl=years.map(y=>`<text x="${sx(y)}" y="${H-8}" class="ax" text-anchor="middle">${y}</text>`).join('');
  const path=P.map((p,i)=>(i?'L':'M')+sx(p.t).toFixed(1)+' '+sy(p.v).toFixed(1)).join(' ');
  const by=m=>10+BR+m.lane*(BR*2+3);
  const ms=M.map(m=>`<line x1="${m.x}" x2="${m.x}" y1="${by(m)}" y2="${H-mb}" class="ml ${cls(m)}"/>`).join('');
  const badges=M.map(m=>`<g class="bd ${cls(m)}"><circle cx="${m.x}" cy="${by(m)}" r="${BR}"/><text x="${m.x}" y="${by(m)+3.5}" text-anchor="middle">${m.n}</text></g>`).join('');
  const last=P[P.length-1], pk=st&&P.find(p=>p.q===st.peak[1]);
  const marks=(pk?`<text x="${sx(pk.t)}" y="${sy(pk.v)-8}" class="an" text-anchor="middle">Peak ${pk.v}</text>`:'')+
    `<text x="${sx(last.t)-2}" y="${sy(last.v)-8}" class="an" text-anchor="end">${last.v}</text>`;
  host.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Private residential price index 2005 to 2026 with numbered cooling and easing measures">${grid}${xl}${ms}<path d="${path}" class="pl"/>${badges}${marks}<line id="xh" y1="${mt}" y2="${H-mb}" class="xh" style="display:none"/><rect x="${ml}" y="0" width="${W-ml-mr}" height="${H}" fill="transparent" id="hit"/></svg>`;
  const svg=host.firstChild, xh=svg.querySelector('#xh'), hit=svg.querySelector('#hit');
  function move(e){
    const r=svg.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top, t=T0+(x-ml)/(W-ml-mr)*(T1-T0);
    let near=null,best=BR+4;
    M.forEach(m=>{const d=Math.abs(m.x-x); if(d<best){best=d;near=m}});
    const same=near?M.filter(m=>Math.abs(m.x-near.x)<BR+4):[];
    const q=P.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a);
    xh.setAttribute('x1',sx(q.t)); xh.setAttribute('x2',sx(q.t)); xh.style.display='';
    tip.innerHTML=`<div class="tq">${q.q} · index ${q.v}</div>`+same.map(m=>`<div class="tm ${cls(m)}"><span>${m.n}. ${fmtDate(m.date)}</span><b>${esc(m.short)}</b></div>`).join('');
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
