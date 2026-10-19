// Price index chart with policy markers. Data comes from data.js (window.PPI, window.MEASURES, window.PPI_STATS).
(function(){
const host=document.getElementById('ppiChart'); if(!host||!window.PPI) return;
const tip=document.getElementById('ppiTip');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const P=window.PPI.map(([q,v])=>{const [y,n]=q.split('-Q');return {q,v,t:+y+(+n-1)/4+0.125}});
const yearFrac=d=>{const a=new Date(d+'T00:00:00');return a.getFullYear()+(a-new Date(a.getFullYear(),0,1))/(365.25*864e5)};
const M=window.MEASURES.map(m=>({...m,t:yearFrac(m.date)})).sort((a,b)=>a.t-b.t);
const fmtDate=d=>new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});

const st=window.PPI_STATS;
if(st){
  document.getElementById('st1').textContent='+'+st.since2009+'%';
  document.getElementById('st2').textContent=st.drop.toFixed(1)+'%';
  document.getElementById('st3').textContent=st.latest.toFixed(1);
}
document.getElementById('measureList').innerHTML=M.map(m=>
  `<li><span class="tag ${m.dir==='Cooling'?'c':'w'}">${m.dir==='Cooling'?'Cooling':'Easing'}</span><time>${fmtDate(m.date)}</time><div><b>${esc(m.title)}</b>${m.detail?`<p>${esc(m.detail)}</p>`:''}</div></li>`).join('');

const T0=1995, T1=2027, YMAX=240, ml=38, mr=12, mt=12, mb=26;
let W=0,H=0,sx,sy;
const valAt=t=>{ // linear interpolation along the index
  if(t<=P[0].t) return P[0].v; if(t>=P[P.length-1].t) return P[P.length-1].v;
  for(let i=1;i<P.length;i++) if(P[i].t>=t){const a=P[i-1],b=P[i];return a.v+(b.v-a.v)*(t-a.t)/(b.t-a.t)}
};

function draw(){
  W=host.clientWidth||320; H=W<520?260:340;
  sx=t=>ml+(t-T0)/(T1-T0)*(W-ml-mr); sy=v=>H-mb-(v/YMAX)*(H-mb-mt);
  const grid=[0,50,100,150,200].map(v=>`<line x1="${ml}" x2="${W-mr}" y1="${sy(v)}" y2="${sy(v)}" class="gl"/><text x="${ml-6}" y="${sy(v)+4}" class="ax" text-anchor="end">${v}</text>`).join('');
  const years=[]; for(let y=1995;y<=2025;y+=5) years.push(y);
  const xl=years.map(y=>`<text x="${sx(y)}" y="${H-8}" class="ax" text-anchor="middle">${y}</text>`).join('');
  const path=P.map((p,i)=>(i?'L':'M')+sx(p.t).toFixed(1)+' '+sy(p.v).toFixed(1)).join(' ');
  const ms=M.map(m=>`<line x1="${sx(m.t)}" x2="${sx(m.t)}" y1="${mt}" y2="${H-mb}" class="ml ${m.dir==='Cooling'?'c':'w'}"/><circle cx="${sx(m.t)}" cy="${sy(valAt(m.t))}" r="3.5" class="md ${m.dir==='Cooling'?'c':'w'}"/>`).join('');
  const last=P[P.length-1], pk=st&&P.find(p=>p.q===st.peak[1]);
  const marks=(pk?`<text x="${sx(pk.t)}" y="${sy(pk.v)-10}" class="an" text-anchor="middle">Peak ${pk.v} (${pk.q})</text>`:'')+
    `<text x="${sx(last.t)-4}" y="${sy(last.v)-10}" class="an" text-anchor="end">${last.v} (${last.q})</text>`;
  host.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Private residential price index 1995 to 2026 with cooling measures marked">${grid}${xl}${ms}<path d="${path}" class="pl"/>${marks}<line id="xh" y1="${mt}" y2="${H-mb}" class="xh" style="display:none"/><rect x="${ml}" y="0" width="${W-ml-mr}" height="${H}" fill="transparent" id="hit"/></svg>`;
  const svg=host.firstChild, xh=svg.querySelector('#xh'), hit=svg.querySelector('#hit');
  function move(e){
    const r=svg.getBoundingClientRect(), x=e.clientX-r.left, t=T0+(x-ml)/(W-ml-mr)*(T1-T0);
    let near=null,best=9;
    M.forEach(m=>{const d=Math.abs(sx(m.t)-x); if(d<best){best=d;near=m}});
    const same=near?M.filter(m=>Math.abs(m.t-near.t)<0.04):[];
    const q=P.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a);
    xh.setAttribute('x1',sx(q.t)); xh.setAttribute('x2',sx(q.t)); xh.style.display='';
    tip.innerHTML=`<div class="tq">${q.q} · index ${q.v}</div>`+same.map(m=>`<div class="tm ${m.dir==='Cooling'?'c':'w'}"><span>${fmtDate(m.date)}</span> ${esc(m.title)}</div>`).join('');
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
