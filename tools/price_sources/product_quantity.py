"""Evidence-based package quantities; never density conversion or per-unit-price denominators."""
import re,decimal
D=decimal.Decimal
def parse(name):
    flags=re.sub(r'\d\+{1,2}등급','등급',name)
    if re.search(r'옵션|선택|증정|내외|이상|이하|혼합|모둠|세트|~|/|\+|\d\s*-\s*\d|당\s*\d|각\s*\d',flags):return None
    ms=list(re.finditer(r'(?<![\d.])([\d]+(?:\.[\d]+)?)\s*(kg|㎏|ml|mL|ℓ|L|리터|밀리리터|g|그램)(?![a-z])',name,re.I))
    if not ms:
        counts=list(re.finditer(r'(?<![\d.])(\d+)\s*(개입|구|개|알|판|팩|봉|병)(?![가-힣])',name))
        if not counts:return None
        canonical=lambda token:'ea' if token in ('개입','구','개','알') else {'팩':'pack','봉':'bag','병':'bottle','판':'pack'}[token]
        if any(m[1]!=counts[0][1] or canonical(m[2])!=canonical(counts[0][2]) for m in counts):return None
        m=counts[0];token=m[2];unit='ea' if token in ('개입','구','개','알') else {'팩':'pack','봉':'bag','병':'bottle','판':'pack'}[token]
        amount=D(m[1]);tail=name[m.end():];multi=re.match(r'\s*[x×*]\s*(\d+)',tail,re.I);end=m.end()
        if multi:amount*=D(multi[1]);end+=multi.end()
        elif re.search(r'[x×*]',name):return None
        return (amount,unit,name[m.start():end]) if 0<amount<=10_000_000 else None
    if len(ms)!=1:return None
    m=ms[0]
    if re.search(r'\d+\s*(?:봉|팩|병|개입|입)',name[:m.start()]):return None
    u=m[2].lower();unit='ml' if u in ('ml','ℓ','l','리터','밀리리터') else 'g';amount=D(m[1])*(1000 if u in ('kg','㎏','ℓ','l','리터') else 1)
    tail=name[m.end():];multi=re.match(r'\s*(?:[x×*]\s*(\d+)\s*(?:봉|팩|병|개|입)?|[·,]\s*(\d+)\s*(?:개입|개|병|팩|봉|입)(?![가-힣]))',tail,re.I)
    if re.search(r'[x×*]',name) and not multi:return None
    end=m.end()
    if multi:amount*=D(multi[1] or multi[2]);end+=multi.end()
    elif re.search(r'\d+\s*(?:봉|팩|병|개입|개|입)',tail):return None
    if re.search(r'\d+\s*(?:봉|팩|병|개입|개|입)',name[end:]):return None
    return (amount,unit,name[m.start():end]) if 0<amount<=10_000_000 else None
