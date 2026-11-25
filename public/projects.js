// Projects section: asking vs sold psf for large condos. Data: projects-data.js (built by build/projects_data.py).
(function(){
const D=window.PROJECTS; if(!D) return;
const $=id=>document.getElementById(id);
const sgn=v=>(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(1)+'%';
const num=v=>v.toLocaleString('en-SG');
const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};

// tiles
const tiles=[[D.projects.toLocaleString('en-SG'),'Large condos with 5+ resale sales in 2026'],
 [num(D.listings),'Current listings compared (duplicates removed)'],
 [sgn(D.median),'Median asking price vs 2026 resale psf'],
 [D.above+'%','Of projects asking above what sold this year']];
tiles.forEach(t=>{const d=mk('div','tile');d.append(mk('b','',t[0]),mk('span','',t[1]));$('pjTiles').append(d)});

// bar cards
const cards=[['By region',D.region,'Planning region'],['By tenure',D.tenure,''],['By age of the building',D.age,''],['By bedrooms',D.beds,'Same project and bedroom count']];
const max=Math.max.apply(null,cards.flatMap(c=>c[1].map(r=>r[2])));
cards.forEach(c=>{
  const card=mk('div','pjc');card.append(mk('h3','',c[0]));
  c[1].forEach(r=>{
    const row=mk('div','brow'),lab=mk('div','bl'),nm=mk('span','',r[0]),n=mk('em','',r[1]+' projects');
    lab.append(nm,n);
    const track=mk('div','bt'),fill=mk('i');fill.style.width=Math.max(4,r[2]/max*100)+'%';track.append(fill);
    row.append(lab,track,mk('b','',sgn(r[2])));card.append(row);
  });
  $('pjCards').append(card);
});

// table
const C={}; D.cols.forEach((k,i)=>C[k]=i);
let sortK='premium', dir=1, q='', reg='', shown=12;
const regs=[...new Set(D.rows.map(r=>r[C.region]).filter(Boolean))].sort();
regs.forEach(r=>{const o=mk('option','',r);o.value=r;$('pjRegion').append(o)});
function rows(){
  const t=q.trim().toLowerCase();
  let a=D.rows.filter(r=>(!reg||r[C.region]===reg)&&(!t||r[C.name].toLowerCase().includes(t)));
  a.sort((x,y)=>{const A=x[C[sortK]],B=y[C[sortK]];return (typeof A==='string'?A.localeCompare(B):A-B)*dir});
  return a;
}
function draw(){
  const a=rows(), body=$('pjBody'); body.textContent='';
  a.slice(0,shown).forEach(r=>{
    const tr=document.createElement('tr'),td=document.createElement('td');
    td.append(mk('span','pn',r[C.name]));
    const meta=[r[C.listings]+' listing'+(r[C.listings]>1?'s':''),r[C.txns]+' sales in 2026',r[C.region],r[C.tenure]==='Freehold'?'Freehold':'99-yr',r[C.age]!=null?r[C.age]+' yrs old':''].filter(Boolean).join(' · ');
    td.append(mk('small','',meta));
    const g=mk('td','n g '+(r[C.premium]<=0?'dn':''),sgn(r[C.premium]));
    const ta=mk('td','n','$'+num(r[C.askPsf])),tsd=mk('td','n','$'+num(r[C.soldPsf]));ta.dataset.l='Asking psf';tsd.dataset.l='Sold psf';g.dataset.l='Gap';
    tr.append(td,ta,tsd,g);body.append(tr);
  });
  $('pjMore').hidden=a.length<=shown;
  $('pjMore').textContent='Show more ('+Math.min(12,a.length-shown)+' of '+(a.length-shown)+' left)';
  $('pjCount').textContent=a.length?('Showing '+Math.min(shown,a.length)+' of '+a.length+' projects. Gap = median asking psf vs median 2026 resale psf; green means asking is at or below what sold.'):'No project matches that search.';
}
$('pjMore').onclick=()=>{shown+=12;draw()};
$('pjSearch').oninput=e=>{q=e.target.value;shown=12;draw()};
$('pjRegion').onchange=e=>{reg=e.target.value;shown=12;draw()};
document.querySelectorAll('.pjtbl th').forEach(th=>th.onclick=()=>{
  const k=th.dataset.k; if(sortK===k) dir=-dir; else {sortK=k;dir=1}
  document.querySelectorAll('.pjtbl th').forEach(x=>x.classList.toggle('on',x===th));
  th.dataset.dir=dir>0?'▲':'▼'; shown=12; draw();
});
$('pjFine').textContent='Asking prices: PropertyGuru for-sale listings, collected '+D.asof+'. Sold prices: URA resale transactions (apartments and condos) in 2026 so far. Asking prices are what sellers want, not what buyers pay, and a project’s gap moves with its unit mix, so treat it as a guide. Projects with fewer than 5 resale sales this year are left out so one sale cannot set the gap.';
draw();
})();
