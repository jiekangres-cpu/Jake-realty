"""Builds the project table rows and per-project psf/volume series for projects.html.
Covers ALL existing private projects in the fact table (Status blank: not en bloc, not gone), about 2,790.
Run build/projects_data.py first (summary plus the PropertyGuru asking data), then this script.
Outputs: public/pj/<slug>.json (one per project with sales since 2017), public/pj/segments*.json (district and region lines per category),
public/projects-rows.js (window.PROJECTS.rows, loaded only on projects.html) and rewrites public/projects-data.js without rows (home page summary).
Periods are half-years from 2017. Open market = Resale + Sub Sale. Table sold psf = median 2026 open market psf; gap only where there are listings and 5+ open market sales.
Categories: strata (condo, apartment, mixed), ec (executive condominium), landed (terrace, semi-d, detached). Segment lines compare like with like.
Bedroom filter uses Confirmed and Confirmed (stack) tags only (key 0 = all rows, whatever the tag)."""
import json, re, os, glob, numpy as np, pandas as pd
ROOT="/Volumes/Crucial SSD/Claude AI/data/"
YEAR=2026; MIN_GAP=5
d=pd.read_parquet(ROOT+"Transactions-data/Mirror/Total Transactions.parquet",columns=['Project Name','Unit Price ($ PSF)','Sale Date','Type of Sale','Property Type','Postal District','Planning Region','Size (Bedrooms)','Bedroom Status'])
d=d[d['Type of Sale'].isin(['New Sale','Resale','Sub Sale'])&d['Unit Price ($ PSF)'].notna()&(d['Unit Price ($ PSF)']>0)].copy()
d=d[d['Sale Date']>='2017-01-01']
d['p']=(d['Sale Date'].dt.year-2017)*2+(d['Sale Date'].dt.month>6).astype(int)
NP=int(d['p'].max())+1
LAB=[f"{2017+p//2} H{p%2+1}" for p in range(NP)]
nk=lambda s:re.sub(r'[^A-Z0-9]','',str(s).upper())
d['nk']=d['Project Name'].map(nk)
d['new']=(d['Type of Sale']=='New Sale')
d['bed']=np.where(d['Bedroom Status'].isin(['Confirmed','Confirmed (stack)']),d['Size (Bedrooms)'].fillna(0).astype(int),-1).clip(max=5)
d['dist']=d['Postal District'].astype(str).str.zfill(2)
REGMAP={'Central Region':'Central','East Region':'East','North East Region':'North-East','North Region':'North','West Region':'West'}
d['Region']=d['Planning Region'].map(REGMAP)
CAT={'Condominium':'strata','Apartment':'strata','Mixed Development':'strata','Executive Condominium':'ec','Terrace House':'landed','Semi-Detached House':'landed','Detached House':'landed'}
d['cat']=d['Property Type'].map(CAT)
BEDS=[0,1,2,3,4,5]
def series(g):
    out={}
    for b in BEDS:
        gb=g if b==0 else g[g['bed']==b]
        row={}
        for m in (1,0):
            gm=gb if m==1 else gb[~gb['new']]
            med=gm.groupby('p')['Unit Price ($ PSF)'].median()
            row[m]=[(int(round(med[p])) if p in med.index else None) for p in range(NP)]
        nn=gb[gb['new']].groupby('p').size(); nr=gb[~gb['new']].groupby('p').size()
        row['vn']=[int(nn.get(p,0)) for p in range(NP)]; row['vr']=[int(nr.get(p,0)) for p in range(NP)]
        out[b]=row
    return out
def pack(s): return {str(b):[s[b][1],s[b][0],s[b]['vn'],s[b]['vr']] for b in BEDS}
os.makedirs("public/pj",exist_ok=True)
for f in glob.glob("public/pj/*.json"): os.remove(f)
# segments per category (like with like)
for cat,fn in (('strata','segments.json'),('ec','segments-ec.json'),('landed','segments-landed.json')):
    seg=d[d['cat']==cat]; SEG={'periods':LAB,'district':{},'region':{}}
    for k,g in seg.groupby('dist'): SEG['district'][k]=pack(series(g))
    for k,g in seg.groupby('Region'): SEG['region'][k]=pack(series(g))
    open("public/pj/"+fn,"w").write(json.dumps(SEG,separators=(',',':')))
# projects
js=open("public/projects-data.js").read(); P=json.loads(js[len("window.PROJECTS="):].rstrip().rstrip(';'))
ci={k:i for i,k in enumerate(P['cols'])}
ask={}
for r in (P.get('rows') or []): ask[nk(r[ci['name']])]=r   # PropertyGuru asking data, scraped large condos
ft=pd.read_excel(ROOT+"Fact_Table__Projects_with_MRT_distance_with_PSchool.xlsx")
ft=ft[ft['Status'].isna()].copy()
def tc(s):
    s=str(s).strip().title()
    for a,b in ((" Of "," of "),(" At "," at "),(" And "," and "),(" The "," the "),("'S","'s"),(" Ec"," EC"),(" Ii"," II"),(" Iii"," III")): s=s.replace(a,b)
    return re.sub(r"\b(Mrt|Nus|Ntu)\b",lambda g:g.group(1).upper(),s)
bynk={k:g for k,g in d.groupby('nk')}
slugs=set(); rows=[]; nopsales=0; total=0
for _,f in ft.sort_values('Project Name').iterrows():
    key=nk(f['Project Name']); g=bynk.get(key)
    name=tc(f['Project Name']); a=ask.get(key)
    reg=REGMAP.get(f['Planning Region'],''); dist=str(int(f['Postal District'])).zfill(2) if pd.notna(f['Postal District']) else ''
    ten='Freehold' if re.search('Freehold|999',str(f['Freehold/Leasehold']),re.I) else '99-year'
    cd=pd.to_numeric(f['Completion Date'],errors='coerce'); age=int(YEAR-cd) if pd.notna(cd) else None
    units=int(f['Number of Units (Actual)']) if pd.notna(f['Number of Units (Actual)']) else None
    cat=CAT.get(f['Property Type'],'strata'); slug=None; txns=0; sold=None
    if g is not None:
        cat=g['cat'].mode().iloc[0] if g['cat'].notna().any() else cat
        dist=dist or g['dist'].mode().iloc[0]; reg=reg or (g['Region'].mode().iloc[0] if g['Region'].notna().any() else '')
        slug=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-') or 'project'; base=slug; i=2
        while slug in slugs: slug=f"{base}-{i}"; i+=1
        slugs.add(slug)
        s=json.dumps({"name":name,"cat":cat,"district":dist,"region":reg,"series":pack(series(g))},separators=(',',':')); total+=len(s)
        open(f"public/pj/{slug}.json","w").write(s)
        cur=g[(g['Sale Date'].dt.year==YEAR)&~g['new']]; txns=len(cur)
        sold=int(round(cur['Unit Price ($ PSF)'].median())) if txns else None
    else: nopsales+=1
    listings=a[ci['listings']] if a else 0; askp=a[ci['askPsf']] if a else None
    gap=round((askp/sold-1)*100,1) if (askp and sold and txns>=MIN_GAP) else None
    rows.append([name,listings,askp,txns,sold,gap,reg,ten,age,units,slug,cat])
cols=["name","listings","askPsf","txns","soldPsf","premium","region","tenure","age","units","slug","cat"]
P.pop('rows',None); P['cols']=cols; P['periods']=LAB; P['all']=len(rows)
open("public/projects-data.js","w").write("window.PROJECTS="+json.dumps(P,separators=(',',':'))+";\n")
open("public/projects-rows.js","w").write("window.PROJECTS.rows="+json.dumps(rows,separators=(',',':'))+";\n")
print("projects",len(rows),"with charts",len(slugs),"no sales since 2017",nopsales,"avg bytes",total//max(1,len(slugs)))
print("with asking",sum(1 for r in rows if r[2]),"with gap",sum(1 for r in rows if r[5] is not None),"with 2026 open market sales",sum(1 for r in rows if r[3]),"last sale",d['Sale Date'].max())
