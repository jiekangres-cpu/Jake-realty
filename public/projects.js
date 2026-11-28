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
if($('pjTiles')) tiles.forEach(t=>{const d=mk('div','tile');d.append(mk('b','',t[0]),mk('span','',t[1]));$('pjTiles').append(d)});

// bar cards
if($('pjCards')){
const cards=[['By region',D.region,'Planning region'],['By tenure',D.tenure,''],['By age of the building',D.age,'']];
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

}
if(!$('pjBody')) return;
// table
const C={}; D.cols.forEach((k,i)=>C[k]=i);
let sortK='txns', dir=-1, q='', reg='', typ='', shown=12;
const CATL={strata:'Condo or apartment',ec:'Executive condominium',landed:'Landed'};
if($('pjN')) $('pjN').textContent=num(D.rows.length);
const Y_=String((D.periods&&D.periods.length?D.periods[D.periods.length-1]:'2026').slice(0,4));
const regs=[...new Set(D.rows.map(r=>r[C.region]).filter(Boolean))].sort();
regs.forEach(r=>{const o=mk('option','',r);o.value=r;$('pjRegion').append(o)});
function rows(){
  const t=q.trim().toLowerCase();
  let a=D.rows.filter(r=>(!reg||r[C.region]===reg)&&(!typ||r[C.cat]===typ)&&(!t||r[C.name].toLowerCase().includes(t)));
  a.sort((x,y)=>{const A=x[C[sortK]],B=y[C[sortK]];if(A==null&&B==null)return 0;if(A==null)return 1;if(B==null)return -1;return (typeof A==='string'?A.localeCompare(B):A-B)*dir||y[C.txns]-x[C.txns]});
  return a;
}
function draw(){
  const a=rows(), body=$('pjBody'); body.textContent='';
  a.slice(0,shown).forEach(r=>{
    const tr=document.createElement('tr'),td=document.createElement('td');
    if(r[C.slug]){tr.className='pick';tr.tabIndex=0;tr.onclick=()=>pickProject(r[C.slug],true);tr.onkeydown=e=>{if(e.key==='Enter')pickProject(r[C.slug],true)}}
    td.append(mk('span','pn',r[C.name]));
    const meta=[CATL[r[C.cat]],r[C.listings]?r[C.listings]+' listing'+(r[C.listings]>1?'s':''):'',r[C.region],r[C.tenure]==='Freehold'?'Freehold':'99-yr',r[C.age]!=null?r[C.age]+' yrs old':'',r[C.slug]?'':'No sales since 2017'].filter(Boolean).join(' · ');
    td.append(mk('small','',meta));
    const dash='–', gv=r[C.premium];
    const g=mk('td','n g '+(gv!=null&&gv<=0?'dn':''),gv!=null?sgn(gv):dash);
    const ta=mk('td','n',r[C.askPsf]?'$'+num(r[C.askPsf]):dash),tsd=mk('td','n',r[C.soldPsf]?'$'+num(r[C.soldPsf]):dash),tn=mk('td','n',num(r[C.txns]));ta.dataset.l='Asking psf';tsd.dataset.l='Sold psf';g.dataset.l='Gap';tn.dataset.l=Y_+' sales';
    tr.append(td,tn,tsd,ta,g);body.append(tr);
  });
  $('pjMore').hidden=a.length<=shown;
  $('pjMore').textContent='Show more ('+Math.min(12,a.length-shown)+' of '+(a.length-shown)+' left)';
  $('pjCount').textContent=a.length?('Showing '+Math.min(shown,a.length)+' of '+num(a.length)+' projects. Sold psf = median open market psf (resale and sub sales) in '+Y_+'. Gap = median asking psf vs sold psf, shown where the project has current listings and 5 or more open market sales; green means asking is at or below what sold.'):'No project matches that search.';
}
$('pjMore').onclick=()=>{shown+=12;draw()};
$('pjSearch').oninput=e=>{q=e.target.value;shown=12;draw()};
$('pjRegion').onchange=e=>{reg=e.target.value;shown=12;draw()};
if($('pjType')) $('pjType').onchange=e=>{typ=e.target.value;shown=12;draw()};
document.querySelectorAll('.pjtbl th').forEach(th=>th.onclick=()=>{
  const k=th.dataset.k; if(sortK===k) dir=-dir; else {sortK=k;dir=(k==='name'?1:-1)}
  document.querySelectorAll('.pjtbl th').forEach(x=>x.classList.toggle('on',x===th));
  th.dataset.dir=dir>0?'▲':'▼'; shown=12; draw();
});
$('pjFine').textContent='Every existing private project (en bloc and demolished ones are left out), including executive condominiums and landed estates. Asking prices: PropertyGuru for-sale listings of larger completed condos, collected '+D.asof+'; other projects show sold prices only. Sold prices: URA transactions in '+Y_+' so far. Asking prices are what sellers want, not what buyers pay, and a project’s gap moves with its unit mix, so treat it as a guide.';
draw();

// market stats: transactions by year (full years, current year to date), split open market vs new, with a planning region breakdown
(function(){
  const M=window.MSTATS, box=$('pjStats'); if(!M||!box) return;
  const ys=Object.keys(M.years).sort(), CUR=String(M.year);
  let yr=CUR, ty='all'; // ty: all | open | new
  const nw=y=>M.years[y].new, op=y=>M.years[y].resale+M.years[y].sub;
  const cnt=(n,o)=>ty==='new'?n:ty==='open'?o:n+o;
  const TL={all:'',open:' (open market)',new:' (new sales)'};
  const per=y=>y===CUR?'1 Jan to '+M.to+' '+y:'1 Jan to 31 Dec '+y;
  function segs(track,n,o,scale,pickYear){
    [['open',o,'mo'],['new',n,'mn']].forEach(p=>{
      if(ty!=='all'&&ty!==p[0]) return;
      const i=mk('i',p[2]+' seg'+(ty===p[0]?' sel':'')); i.style.width=(p[1]/scale*100)+'%'; i.dataset.t=p[0];
      i.title=(p[0]==='open'?'Open market ':'New sales ')+num(p[1])+' (tap to '+(ty===p[0]?'show both':'show only this')+')';
      i.setAttribute('role','button'); i.tabIndex=0;
      const go=e=>{e.stopPropagation();ty=(ty===p[0]?'all':p[0]);if(pickYear)yr=pickYear;render()};
      i.onclick=go; i.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(e)}};
      track.append(i);
    });
  }
  function render(){
    box.textContent='';
    const Yv=M.years[yr], total=cnt(nw(yr),op(yr));
    box.append(mk('div','eyebrow','Transactions, '+(yr===CUR?yr+' so far':yr)+TL[ty]));
    const top=mk('div','mtop'), big=mk('div','mbig');
    big.append(mk('b','',num(total)),mk('span','','private condo and apartment sales, '+per(yr)));
    top.append(big);box.append(top);
    // type filter
    const tp=mk('div','mtype'); tp.setAttribute('role','group');tp.setAttribute('aria-label','Sale type');
    [['all','All sales'],['open','Open market'],['new','New sales']].forEach(p=>{const b=mk('button','pjchip'+(ty===p[0]?' on':''),p[1]);b.type='button';
      if(p[0]==='open')b.prepend(mk('i','sw mo'));if(p[0]==='new')b.prepend(mk('i','sw mn'));
      b.onclick=()=>{ty=p[0];render()};tp.append(b)});
    box.append(tp);
    // year bars (2024 and 2025 are full years)
    const sc=Math.max.apply(null,ys.map(y=>cnt(nw(y),op(y)))), bars=mk('div','mbars');
    ys.forEach(y=>{
      const r=mk('div','mrow pick'+(y===yr?' cur':'')), t=mk('div','mtrack');
      r.setAttribute('role','button'); r.tabIndex=0; r.title='Show '+y+' by planning region';
      r.onclick=()=>{yr=y;render()}; r.onkeydown=e=>{if(e.key==='Enter'){yr=y;render()}};
      segs(t,nw(y),op(y),sc,y);
      r.append(mk('span','my',y===CUR?y+' YTD':y),t,mk('b','',num(cnt(nw(y),op(y)))));bars.append(r);
    });
    box.append(bars);
    box.append(mk('p','fine','Tap a year to see it by planning region. Tap the tan or blue part of a bar to show only open market (resale and sub sales) or only new sales; tap again to show both. 2024 and 2025 are full calendar years, '+CUR+' runs to '+M.to+'.'));
    box.append(mk('p','fine','New sales '+num(nw(yr))+' · open market '+num(op(yr))+' ('+num(Yv.resale)+' resale, '+num(Yv.sub)+' sub sales). Executive condominiums and landed homes are not included. Source: URA.'));
    // regions for the chosen year
    const rg=mk('div','mreg');rg.append(mk('h4','',yr+' by planning region'+TL[ty]),mk('p','fine','Tap a region to filter the project table below.'));
    const rm=Math.max.apply(null,Yv.region.map(r=>cnt(r[1],r[2])))||1;
    Yv.region.forEach(r=>{
      const row=mk('div','mrow pick'+(reg===r[0]?' sel':'')),t=mk('div','mtrack');
      row.setAttribute('role','button');row.tabIndex=0;row.dataset.r=r[0];
      const go=()=>{const on=reg===r[0];reg=on?'':r[0];shown=12;$('pjRegion').value=reg;draw();rg.querySelectorAll('.mrow').forEach(x=>x.classList.toggle('sel',x.dataset.r===reg));if(!on)$('pjTable').scrollIntoView({behavior:'smooth',block:'start'})};
      row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter')go()};
      segs(t,r[1],r[2],rm);
      row.append(mk('span','my',r[0]),t,mk('b','',num(cnt(r[1],r[2]))));row.title=r[0]+': '+num(r[2])+' open market, '+num(r[1])+' new';rg.append(row);
    });
    box.append(rg);
    box.hidden=false;
  }
  render();
})();
// ---- project chart: 3 psf lines (project, district, region) + stacked new/resale volume bars
const PER=D.periods||[], NP=PER.length;
const NS='http://www.w3.org/2000/svg';
const sv=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.append(e);return e};
const CL={proj:'#946a22',dist:'#1f6fb2',reg:'#7d7a72',res:'#e2cf9c',nw:'#4a6a9c'};
const BEDS=[[0,'All'],[1,'1 bed'],[2,'2 bed'],[3,'3 bed'],[4,'4 bed'],[5,'5+ bed']];
let proj=null, seg=null, bed=0, inclNew=true, segP={};
const cache={};
const lastLab=i=>PER[i]+(i===NP-1?' (to Oct)':'');
const getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw 0;return r.json()});
async function pickProject(slug,scroll){
  try{
    proj=cache[slug]||(cache[slug]=await getJSON('pj/'+slug+'.json'));
    proj.slug=slug;
    const sf={strata:'segments',ec:'segments-ec',landed:'segments-landed'}[proj.cat||'strata'];
    seg=await (segP[sf]||(segP[sf]=getJSON('pj/'+sf+'.json')));
    const row=D.rows.find(r=>r[C.slug]===slug); proj.row=row;
    buildBeds(); renderChart();
    if(scroll) $('pjChartCard').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){ console.error('pjChart',e); $('pjSvg').textContent='Could not load this chart. Try again in a moment.'; }
}
function vol(b,k){return proj.series[b][k].reduce((a,x)=>a+x,0)}
function buildBeds(){
  const box=$('pjBeds'); box.textContent='';
  if(vol(bed,2)+vol(bed,3)===0) bed=0;
  BEDS.forEach(([b,l])=>{
    const tot=vol(b,2)+vol(b,3), btn=mk('button','pjchip'+(b===bed?' on':''),l);
    btn.type='button'; btn.disabled=tot===0; btn.title=tot===0?'No sales in this project':'';
    btn.onclick=()=>{bed=b;box.querySelectorAll('.pjchip').forEach(x=>x.classList.toggle('on',x===btn));renderChart()};
    box.append(btn);
  });
}
$('pjNew').onchange=e=>{inclNew=e.target.checked;if(proj)renderChart()};
function renderChart(){
  const S=proj.series[bed], dS=(seg.district[proj.district]||{})[bed], rS=(seg.region[proj.region]||{})[bed];
  const k=inclNew?0:1, P=S[k], DD=dS?dS[k]:[], RR=rS?rS[k]:[], VN=S[2], VR=S[3];
  const cl={ec:' (ECs)',landed:' (landed)'}[proj.cat]||'', dLab='District '+Number(proj.district)+cl, rLab=proj.region+' Region'+cl;
  $('pjTitle').textContent=proj.name;
  const r=proj.row;
  $('pjSub').textContent=[dLab,rLab,r&&r[C.units]&&r[C.cat]!=='landed'?num(r[C.units])+' units':'',r&&r[C.age]!=null?r[C.age]+' yrs old':'',bed?BEDS[bed][1]+' units':'All unit sizes',inclNew?'New and open market':'Open market only'].filter(Boolean).join(' · ');
  const lg=$('pjLegend'); lg.textContent='';
  const sw=(c,t,kind)=>{const s=mk('span');const i=mk('i','lg '+kind);i.style.background=kind==='sq'?c:'';i.style.borderColor=c;if(kind==='line')i.style.background=c;s.append(i,document.createTextNode(t));lg.append(s)};
  sw(CL.proj,'This project','line');sw(CL.dist,dLab,'line');sw(CL.reg,rLab,'line');sw(CL.res,'Project open market sales','sq');if(inclNew)sw(CL.nw,'Project new sales','sq');
  const host=$('pjSvg'); host.textContent='';
  const have=P.some(v=>v!=null);
  const vals=[].concat(P,DD,RR).filter(v=>v!=null);
  if(!vals.length||(!have&&!VR.some(x=>x)&&!VN.some(x=>x))){host.append(mk('p','fine','No sales for this filter.'));$('pjLatest').textContent='';return}
  const W=Math.max(300,host.clientWidth||340), H=W<520?300:360, ml=46, mr=34, mt=10, mb=26, pw=W-ml-mr, ph=H-mt-mb;
  let lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals); const pad=(hi-lo)*.1||100, rawStep=(hi-lo+2*pad)/4, step=[50,100,200,250,500,1000].find(x=>x>=rawStep)||1000; lo=Math.max(0,Math.floor((lo-pad)/step)*step); hi=Math.ceil((hi+pad)/step)*step;
  const barH=ph*.32, vmax=Math.max(1,Math.max.apply(null,VR.map((x,i)=>x+(inclNew?VN[i]:0))));
  const X=i=>ml+(i+.5)*pw/NP, Y=v=>mt+ph-(v-lo)/(hi-lo)*ph, bw=pw/NP*.62;
  const svg=sv('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,role:'img','aria-label':'Price per sq ft for '+proj.name+' against its district and region, with new and open market sales volume (this project only)'},host);
  svg.style.display='block';
  for(let v=lo;v<=hi+1e-6;v+=step){const y=Y(v);sv('line',{x1:ml,x2:W-mr,y1:y,y2:y,stroke:'#e9e4d8','stroke-width':1},svg);const tx=sv('text',{x:ml-6,y:y+4,'text-anchor':'end','font-size':11,fill:'#6b6962'},svg);tx.textContent='$'+num(Math.round(v))}
  for(let t=0;t<=2;t++){const v=Math.round(vmax*t/2), y=mt+ph-barH*(v/vmax);const tx=sv('text',{x:W-mr+5,y:y+4,'font-size':10.5,fill:'#6b6962'},svg);tx.textContent=v}
  const lab=sv('text',{x:W-mr+5,y:mt+ph-barH-8,'font-size':10,fill:'#6b6962'},svg);lab.textContent='sales';
  // bars
  for(let i=0;i<NP;i++){
    const r=VR[i]||0, n=inclNew?(VN[i]||0):0, x=X(i)-bw/2, base=mt+ph;
    const hr=barH*r/vmax, hn=barH*n/vmax;
    if(r) sv('rect',{x,y:base-hr,width:bw,height:hr,fill:CL.res,opacity:.9,rx:1.5},svg);
    if(n) sv('rect',{x,y:base-hr-hn,width:bw,height:hn,fill:CL.nw,opacity:.85,rx:1.5},svg);
  }
  // x labels
  for(let i=0;i<NP;i++){ if(i%(W<520?4:2)===0){const tx=sv('text',{x:X(i)+pw/NP*.5,y:H-8,'text-anchor':'middle','font-size':11,fill:'#6b6962'},svg);tx.textContent=PER[i].slice(0,4)} }
  // lines
  const line=(arr,color,w,dash,dots)=>{
    let d='',pen=false; arr.forEach((v,i)=>{if(v==null)return;d+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);pen=true});
    if(!d)return; sv('path',{d,fill:'none',stroke:color,'stroke-width':w,'stroke-dasharray':dash||'none','stroke-linejoin':'round','stroke-linecap':'round'},svg);
    if(dots) arr.forEach((v,i)=>{if(v!=null)sv('circle',{cx:X(i),cy:Y(v),r:3,fill:'#fff',stroke:color,'stroke-width':1.8},svg)});
  };
  line(RR,CL.reg,2,'5 4');line(DD,CL.dist,2);line(P,CL.proj,2.8,null,true);
  // hover
  const guide=sv('line',{y1:mt,y2:mt+ph,stroke:'#946a22','stroke-width':1,opacity:0,'stroke-dasharray':'3 3'},svg);
  const ov=sv('rect',{x:ml,y:mt,width:pw,height:ph,fill:'transparent'},svg), tip=$('pjTip');
  const show=ev=>{
    const b=svg.getBoundingClientRect(), px=(ev.clientX-b.left)*(W/b.width); const i=Math.min(NP-1,Math.max(0,Math.floor((px-ml)/(pw/NP))));
    guide.setAttribute('x1',X(i));guide.setAttribute('x2',X(i));guide.setAttribute('opacity',1);
    const f=v=>v==null?'no sales':'$'+num(v)+' psf';
    tip.textContent='';
    tip.append(mk('b','',lastLab(i)));
    [['This project',P[i],CL.proj],[dLab,DD[i],CL.dist],[rLab,RR[i],CL.reg]].forEach(a=>{const d=mk('div','pjtl');const dot=mk('i');dot.style.background=a[2];d.append(dot,document.createTextNode(a[0]+': '+f(a[1])));tip.append(d)});
    tip.append(mk('div','pjtl muted','Open market sales: '+VR[i]+(inclNew?' · New sales: '+VN[i]:'')));
    tip.hidden=false; const cb=$('pjChartCard').getBoundingClientRect(), x=(X(i)*b.width/W)+(b.left-cb.left), tw=tip.offsetWidth;
    tip.style.left=Math.max(4,Math.min(cb.width-tw-4,x-tw/2))+'px'; tip.style.top=(b.top-cb.top+6)+'px';
  };
  ov.addEventListener('pointermove',show);ov.addEventListener('pointerdown',show);
  ov.addEventListener('pointerleave',()=>{tip.hidden=true;guide.setAttribute('opacity',0)});
  // latest line
  const last=a=>{for(let i=a.length-1;i>=0;i--) if(a[i]!=null) return [a[i],PER[i]];return null};
  const lp=last(P),ld=last(DD),lr=last(RR);
  $('pjLatest').textContent=lp?('Latest: this project $'+num(lp[0])+' psf ('+lp[1]+')'+(ld?' · '+dLab+' $'+num(ld[0]):'')+(lr?' · '+rLab+' $'+num(lr[0]):'')+'. Median price per sq ft by half-year. Open market = resale plus sub sales.'):'This project has no sales for this filter. District and region lines still show.';
}
addEventListener('resize',()=>{if(proj)renderChart()});
if(D.rows.length&&C.slug!=null){const top=D.rows.reduce((a,r)=>r[C.txns]>a[C.txns]?r:a,D.rows[0]); if(top[C.slug]) pickProject(top[C.slug],false);}


// quick find: type a name, pick a suggestion, chart loads
(function(){
  const inp=$('pjFind'), ul=$('pjFindList'); if(!inp||C.slug==null) return;
  const pool=D.rows.filter(r=>r[C.slug]);
  function show(){
    const t=inp.value.trim().toLowerCase(); ul.textContent='';
    if(!t){ul.hidden=true;inp.setAttribute('aria-expanded','false');return}
    const hit=pool.filter(r=>r[C.name].toLowerCase().includes(t)).sort((a,b)=>(a[C.name].toLowerCase().startsWith(t)?0:1)-(b[C.name].toLowerCase().startsWith(t)?0:1)||b[C.txns]-a[C.txns]).slice(0,8);
    if(!hit.length){const li=mk('li','none','No large condo matches that name');ul.append(li)}
    hit.forEach(r=>{const li=mk('li','',r[C.name]);li.setAttribute('role','option');li.append(mk('small','',r[C.region]||''));
      li.onmousedown=e=>{e.preventDefault();inp.value=r[C.name];ul.hidden=true;pickProject(r[C.slug],false);$('pjChartCard').scrollIntoView({behavior:'smooth',block:'nearest'})};ul.append(li)});
    ul.hidden=false;inp.setAttribute('aria-expanded','true');
  }
  inp.oninput=show; inp.onfocus=show; inp.onblur=()=>{ul.hidden=true};
  inp.onkeydown=e=>{if(e.key==='Enter'){const f=ul.querySelector('li:not(.none)');if(f)f.onmousedown(e)}};
})();
})();
