"""Build a local LSA food-name embedding model; no remote models, private data or APIs."""
import pathlib,json,base64,hashlib,numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
root=pathlib.Path(__file__).resolve().parents[1];base=root/'src/main/resources/static/js/data/food-nutrition'
m=json.loads((base/'manifest.json').read_text(encoding='utf8'));rows=[]
for source,meta in m['sources'].items():
 data=(base/m['version']/meta['index']).read_bytes()
 expected=m['files_sha256'].get(meta['index']) or m['files_sha256'].get(m['version']+'/'+meta['index'])
 if hashlib.sha256(data).hexdigest()!=expected:raise ValueError('Source index checksum mismatch')
 index=json.loads(data);assert len(index)==meta['count'];rows.extend(index)
assert len({r['id'] for r in rows})==len(rows)
def norm(s):return ''.join(s.lower().split()).replace('계란','달걀').replace('칼치','갈치')
texts=[norm(r['name']) for r in rows]
v=TfidfVectorizer(analyzer='char',ngram_range=(1,3),max_features=8000,sublinear_tf=True,dtype=np.float32)
training=sorted(set(texts));x=v.fit_transform(training);svd=TruncatedSVD(n_components=96,random_state=42);svd.fit(x);vectors=svd.transform(v.transform(texts));vectors/=np.maximum(np.linalg.norm(vectors,axis=1,keepdims=True),1e-12)
def encode(a):return base64.b64encode(np.asarray(a,dtype='<f4').tobytes()).decode('ascii')
model={'trainingLibraries':{'numpy':np.__version__,'scikit-learn':sklearn.__version__},'method':'LSA-TFIDF-char-1-3','version':m['version'],'dimensions':96,'vocabulary':v.vocabulary_,'idf':encode(v.idf_),'projection':encode(svd.components_.T),'ids':[r['id'] for r in rows],'vectors':encode(vectors),'explainedVariance':float(svd.explained_variance_ratio_.sum())}
# Convert NumPy scalar vocabulary indices for JSON.
model['vocabulary']={k:int(i) for k,i in model['vocabulary'].items()}
(base/'semantic-lsa.json').write_text(json.dumps(model,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print('LSA built:',len(rows),'foods,',len(v.vocabulary_),'features, 96 dimensions; variance',model['explainedVariance'])
