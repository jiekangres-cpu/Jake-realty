"""Market-wide stats for the top of projects.html. Writes public/market-stats.js (window.MSTATS).
Private condo + apartment transactions (ECs and landed left out), year to date, compared with the same dates in earlier years.
Run weekly with the other project scripts, after the master parquet is refreshed."""
import json, pandas as pd
ROOT="/Volumes/Crucial SSD/Claude AI/data/"
d=pd.read_parquet(ROOT+"Transactions-data/Mirror/Total Transactions.parquet",columns=['Sale Date','Type of Sale','Property Type','Planning Region'])
d=d[d['Property Type'].isin(['Condominium','Apartment'])&d['Type of Sale'].isin(['New Sale','Resale','Sub Sale'])]
last=d['Sale Date'].max(); Y=last.year
years={}
for y in (Y-2,Y-1,Y):
    g=d[(d['Sale Date']>=f'{y}-01-01')&(d['Sale Date']<=last.replace(year=y))]
    years[y]={'new':int((g['Type of Sale']=='New Sale').sum()),'resale':int((g['Type of Sale']=='Resale').sum()),'sub':int((g['Type of Sale']=='Sub Sale').sum())}
cur=d[(d['Sale Date']>=f'{Y}-01-01')]
reg=cur.assign(r=cur['Planning Region'].astype(str).str.replace(' Region','',regex=False).str.replace('North East','North-East',regex=False)).groupby('r').size().sort_values(ascending=False)
out={'year':Y,'to':last.strftime('%-d %b'),'years':{str(k):v for k,v in years.items()},'region':[[k,int(v)] for k,v in reg.items()]}
open("public/market-stats.js","w").write("window.MSTATS="+json.dumps(out,separators=(',',':'))+";\n")
print(out)
