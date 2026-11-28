"""Market-wide stats for the top of projects.html. Writes public/market-stats.js (window.MSTATS).
Private condo + apartment transactions (ECs and landed left out), year to date, for the two previous full calendar years and the current year to date.
Run weekly with the other project scripts, after the master parquet is refreshed."""
import json, pandas as pd
ROOT="/Volumes/Crucial SSD/Claude AI/data/"
d=pd.read_parquet(ROOT+"Transactions-data/Mirror/Total Transactions.parquet",columns=['Sale Date','Type of Sale','Property Type','Planning Region'])
d=d[d['Property Type'].isin(['Condominium','Apartment'])&d['Type of Sale'].isin(['New Sale','Resale','Sub Sale'])]
last=d['Sale Date'].max(); Y=last.year
d=d.assign(r=d['Planning Region'].astype(str).str.replace(' Region','',regex=False).str.replace('North East','North-East',regex=False),n=(d['Type of Sale']=='New Sale'))
ORDER=['Central','West','East','North-East','North']
years={}
for y in (Y-2,Y-1,Y):   # full calendar years, current year to the last sale date
    g=d[(d['Sale Date']>=f'{y}-01-01')&(d['Sale Date']<=(last if y==Y else pd.Timestamp(f'{y}-12-31')))]
    rg=g.groupby('r').agg(t=('n','size'),n=('n','sum'))
    years[y]={'new':int(g['n'].sum()),'resale':int((g['Type of Sale']=='Resale').sum()),'sub':int((g['Type of Sale']=='Sub Sale').sum()),
      'region':[[k,int(rg.loc[k,'n']),int(rg.loc[k,'t']-rg.loc[k,'n'])] for k in ORDER if k in rg.index]}
out={'year':Y,'to':last.strftime('%-d %b'),'years':{str(k):v for k,v in years.items()}}
open("public/market-stats.js","w").write("window.MSTATS="+json.dumps(out,separators=(',',':'))+";\n")
print(out)
