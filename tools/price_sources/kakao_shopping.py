"""Transient Kakao search adapter; on-demand user lookup; no scheduled retailer collection."""
import json,os,sys,urllib.parse,urllib.request

def main():
    if os.getenv('SMARTNF_KAKAO_LOOKUP_ENABLED','true').lower()=='false':sys.exit(3)
    if len(sys.argv)!=2 or not 1<=len(sys.argv[1].strip())<=100:sys.exit(2)
    query=sys.argv[1].strip()
    if any(ord(c)<32 for c in query):sys.exit(2)
    url='https://shoppinghow.kakao.com/v7.0/product/search.json?q='+urllib.parse.quote(query)
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'SmartNF-ProductLookup/1.0'}),timeout=20) as r:
            if r.status!=200:sys.exit(4)
            raw=r.read(2_000_001)
        if len(raw)>2_000_000:sys.exit(4)
        data=json.loads(raw)
        if str(data.get('code'))!='200':sys.exit(4)
        lines=[]
        for p in data.get('middleProdlist',{}).get('data',[])[:15]:
            for mall in (p.get('mallList') or [])[:3]:
                price=str(mall.get('price',''))
                if not price.isdigit() or not 0<int(price)<=100_000_000:continue
                link=urllib.parse.urljoin('https://shoppinghow.kakao.com',str(mall.get('link','')))
                parsed=urllib.parse.urlsplit(link)
                if parsed.scheme!='https' or parsed.hostname!='shoppinghow.kakao.com' or parsed.path!='/go.daum':continue
                fields=[str(p.get('productId',''))[:60],str(p.get('productName',''))[:250],str(p.get('bundleName',''))[:50],str(mall.get('name',''))[:100],price,link,str(mall.get('delivery_price',''))[:30],str(p.get('priceModifiedTime',''))[:30]]
                lines.append('\t'.join(urllib.parse.quote(v,safe='') for v in fields))
                if len(lines)>=20:break
            if len(lines)>=20:break
        print('\n'.join(lines))
    except Exception:sys.exit(4)

if __name__=='__main__':main()
