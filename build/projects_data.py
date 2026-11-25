"""Builds public/projects-data.js from the weekly PropertyGuru analysis (asking psf vs 2026 resale psf).
Usage: python3 build/projects_data.py   (edit WEEK/ASOF for a new week)"""
import json, re, pandas as pd, numpy as np
ROOT="/Volumes/Crucial SSD/Claude AI/data/"
WEEK="PropertyGuru Weekly Listings/Week 2026-11-16/"
ASOF="16 Nov 2026"
MIN_TXN=5
f=ROOT+WEEK+"asking_vs_2026_transaction_psf_2026-11-16.xlsx"
bp=pd.read_excel(f,sheet_name="By project"); bb=pd.read_excel(f,sheet_name="By bedroom")
ft=pd.read_excel(ROOT+"Fact_Table__Projects_with_MRT_distance_with_PSchool.xlsx")
ft['k']=ft['Project Name'].str.upper().str.strip(); bp['k']=bp['Project'].str.upper().str.strip()
m=bp.merge(ft.drop_duplicates('k'),on='k',how='left')
x=m[m['2026 resale txns']>=MIN_TXN].copy()
x['age']=2026-pd.to_numeric(x['Completion Date'],errors='coerce')
x['ten']=np.where(x['Freehold/Leasehold'].astype(str).str.contains('Freehold|999',case=False),'Freehold','99-year')
REG={'Central Region':'Central','East Region':'East','North East Region':'North-East','North Region':'North','West Region':'West'}
x['reg']=x['Planning Region'].map(REG)
def tc(s):
    s=s.title()
    for a,b in ((" Of "," of "),(" At "," at "),(" And "," and "),(" The "," the "),("'S","'s"),(" Ec"," EC"),(" Ii"," II"),(" Iii"," III")): s=s.replace(a,b)
    return re.sub(r"\b(Mrt|Nus|Ntu)\b",lambda g:g.group(1).upper(),s)
def seg(col,order=None):
    g=x.groupby(col,observed=True)['Premium %'].agg(['count','median']).reset_index()
    if order: g[col]=pd.Categorical(g[col],order); g=g.sort_values(col)
    return [[str(r[col]),int(r['count']),round(float(r['median']),1)] for _,r in g.iterrows()]
x['ageb']=pd.cut(x['age'],[-1,5,10,20,30,100],labels=['0 to 5 yrs','6 to 10 yrs','11 to 20 yrs','21 to 30 yrs','Over 30 yrs'])
bbx=bb[bb['2026 resale txns']>=MIN_TXN]
beds=[[f"{int(b)}-bed" if b<5 else "5-bed",int(len(g)),round(float(g['Premium %'].median()),1)] for b,g in bbx.groupby('Bedrooms') if len(g)>=20]
rows=[[tc(r['Project']),int(r['Listings (unique)']),round(float(r['Asking psf median'])),int(r['2026 resale txns']),round(float(r['2026 resale psf median'])),round(float(r['Premium %']),1),
       (str(r['reg']) if pd.notna(r['reg']) else ''),r['ten'],(int(r['age']) if pd.notna(r['age']) else None),(int(r['Number of Units (Actual)']) if pd.notna(r['Number of Units (Actual)']) else None)] for _,r in x.sort_values('Premium %').iterrows()]
out={"asof":ASOF,"projects":len(x),"listings":int(x['Listings (unique)'].sum()),"median":round(float(x['Premium %'].median()),1),
 "above":round(float((x['Premium %']>0).mean()*100)),"within2":int(((x['Premium %']<=2)).sum()),"below":int((x['Premium %']<=0).sum()),
 "region":seg('reg',['Central','East','North-East','North','West']),"tenure":seg('ten',['Freehold','99-year']),
 "age":seg('ageb',['0 to 5 yrs','6 to 10 yrs','11 to 20 yrs','21 to 30 yrs','Over 30 yrs']),"beds":beds,
 "cols":["name","listings","askPsf","txns","soldPsf","premium","region","tenure","age","units"],"rows":rows}
open("public/projects-data.js","w").write("window.PROJECTS="+json.dumps(out,separators=(',',':'))+";\n")
print({k:v for k,v in out.items() if k!='rows'}); print(len(rows),rows[0],rows[-1])
