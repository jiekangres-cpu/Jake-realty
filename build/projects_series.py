"""Builds per-project psf/volume series for the Projects chart.
Outputs public/pj/<slug>.json (one per project in projects-data.js) and public/pj/segments.json (district and region lines).
Run build/projects_data.py first, then this script (it adds slugs and periods to projects-data.js).
Periods are half-years from 2017. Sale types: New Sale, and Open market = Resale + Sub Sale (the JSON 'vr' volume and the resale-only psf (second array) are open market).
Bedroom filter uses Confirmed and Confirmed (stack) tags only (key 0 = all rows, whatever the tag)."""
import json, re, os, numpy as np, pandas as pd
ROOT="/Volumes/Crucial SSD/Claude AI/data/"
d=pd.read_parquet(ROOT+"Transactions-data/Mirror/Total Transactions.parquet",columns=['Project Name','Unit Price ($ PSF)','Sale Date','Type of Sale','Property Type','Postal District','Planning Region','Size (Bedrooms)','Bedroom Status'])
d=d[d['Type of Sale'].isin(['New Sale','Resale','Sub Sale'])&d['Unit Price ($ PSF)'].notna()&(d['Unit Price ($ PSF)']>0)].copy()
d=d[d['Sale Date']>='2017-01-01']
d['p']=(d['Sale Date'].dt.year-2017)*2+(d['Sale Date'].dt.month>6).astype(int)
NP=int(d['p'].max())+1
LAB=[f"{2017+p//2} H{p%2+1}" for p in range(NP)]
d['pk']=d['Project Name'].str.upper().str.strip()
d['new']=(d['Type of Sale']=='New Sale')
d['bed']=np.where(d['Bedroom Status'].isin(['Confirmed','Confirmed (stack)']),d['Size (Bedrooms)'].fillna(0).astype(int),-1)
d['bed']=d['bed'].clip(upper=5)
d['dist']=d['Postal District'].astype(str).str.zfill(2)
d['Region']=d['Planning Region'].astype(str).str.replace(' Region','',regex=False).str.replace('North East','North-East',regex=False)  # planning region (CCR/RCR/OCR is ambiguous in the master for boundary districts)
BEDS=[0,1,2,3,4,5]
def series(g):
    """g: transactions of one group. Returns {b: {m: psf list}, ...} and volumes per bedroom."""
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
def pack(s):  # compact: psf with new, psf resale-only, new volume, resale volume per bedroom key
    return {str(b):[s[b][1],s[b][0],s[b]['vn'],s[b]['vr']] for b in BEDS}
os.makedirs("public/pj",exist_ok=True)
# segments (strata private, ECs left out)
seg=d[d['Property Type'].isin(['Condominium','Apartment'])]
SEG={'periods':LAB,'district':{},'region':{}}
for k,g in seg.groupby('dist'): SEG['district'][k]=pack(series(g))
for k,g in seg.groupby('Region'): SEG['region'][k]=pack(series(g))
open("public/pj/segments.json","w").write(json.dumps(SEG,separators=(',',':')))
# projects
js=open("public/projects-data.js").read(); P=json.loads(js[len("window.PROJECTS="):].rstrip().rstrip(';'))
names=[r[0] for r in P['rows']]
ft=pd.read_excel(ROOT+"Fact_Table__Projects_with_MRT_distance_with_PSchool.xlsx")
bypk={k:g for k,g in d.groupby('pk')}
slugs={}; miss=[]; total=0
for r in P['rows']:
    name=r[0]; key=None
    # original upper-case name: match on normalised key
    nk=re.sub(r'[^A-Z0-9]','',name.upper())
    cand=[k for k in bypk if re.sub(r'[^A-Z0-9]','',k)==nk]
    if not cand: miss.append(name); continue
    g=bypk[cand[0]]
    slug=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    base=slug; i=2
    while slug in slugs: slug=f"{base}-{i}"; i+=1
    slugs[slug]=name
    dist=g['dist'].mode().iloc[0]; reg=g['Region'].mode().iloc[0]
    o={"name":name,"district":dist,"region":reg,"series":pack(series(g))}
    s=json.dumps(o,separators=(',',':')); total+=len(s)
    open(f"public/pj/{slug}.json","w").write(s)
    r.append(slug)
P['cols'].append('slug'); P['periods']=LAB
for r in P['rows']:
    if len(r)==10: r.append(None)
open("public/projects-data.js","w").write("window.PROJECTS="+json.dumps(P,separators=(',',':'))+";\n")
print("periods",NP,LAB[0],LAB[-1],"projects",len(slugs),"missing",len(miss),miss[:8],"avg bytes",total//max(1,len(slugs)),"seg",len(json.dumps(SEG))//1024,"KB")
print("last sale",d['Sale Date'].max())
