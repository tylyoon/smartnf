import {api,element} from './food-studio-core.js';
const get=id=>document.getElementById(id);
const fields={supplier:'거래처',item:'품목',sku:'SKU',qty:'수량(포장 수)',unitPrice:'포장당 단가(원)',tax:'별도 세금(원)',total:'합계(원)',line:'원문 행'};
let doc;
async function call(action,data){
    const result=await api('/api/me/business-documents/'+action,data);
    if(result.error)throw Error(result.error);
    return result;
}
function action(id,fn){
    get(id).onclick=async()=>{
        get(id).disabled=true;
        try{await fn();}catch(e){get('message').textContent=e.message;}
        finally{get(id).disabled=false;if(doc)permissions();}
    };
}
function permissions(){
    const review=doc.state==='REVIEW';
    for(const id of ['save','approve','add'])get(id).disabled=!review;
    for(const id of ['excel','send'])get(id).disabled=review;
}
function line(row={}){
    const box=element('fieldset');box.append(element('legend','품목 '+(get('lines').children.length+1)));
    for(const [key,title] of Object.entries(fields)){
        const label=element('label',title),input=element('input');
        input.value=row[key]??'';input.dataset.key=key;
        if(['qty','unitPrice','tax','total','line'].includes(key)){input.type='number';input.min=key==='line'?1:0;input.step=key==='line'?1:'any';}
        input.setAttribute('aria-label',title);
        input.readOnly=doc.state!=='REVIEW';label.append(input);box.append(label);
    }
    if(doc.state==='REVIEW'){const remove=element('button','행 삭제','secondary');remove.onclick=()=>box.remove();box.append(remove);}
    get('lines').append(box);
}
function values(){return [...get('lines').children].map(box=>Object.fromEntries([...box.querySelectorAll('input')].map(f=>[f.dataset.key,f.value])));}
async function open(id){
    doc=await call('get',{id});get('review').hidden=false;
    get('source').textContent=doc.source.split(/\r\n|[\r\n\f]/).map((s,i)=>(i+1)+'  '+s).join('\n');
    get('lines').replaceChildren();doc.rows.forEach(line);if(!doc.rows.length&&doc.state==='REVIEW')line();
    get('message').textContent=doc.name+' · '+({REVIEW:'검수 필요',APPROVED:'승인 완료',SENT:'전달 완료'}[doc.state])+' · v'+doc.version+' · '+doc.note;
    get('metrics').textContent=doc.metrics||'';permissions();
}
async function list(id){
    const {documents}=await call('list',{});get('documents').replaceChildren();
    for(const d of documents){const opt=element('option',d.name+' · v'+d.version);opt.value=d.id;get('documents').append(opt);}
    if(documents.length){get('documents').value=id||documents[0].id;await open(get('documents').value);}
}
get('documents').onchange=()=>open(get('documents').value).catch(e=>get('message').textContent=e.message);
action('submit',async()=>{
    const file=get('upload').files[0];if(!file||file.size>5000000)throw Error('5MB 이하 파일을 선택하세요.');
    const encoded=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});
    const result=await call('upload',{name:file.name,content:encoded,ai:get('ai').checked});await list(result.id);
    if(result.duplicate)get('message').append(' · 기존 접수 문서');
});
action('add',()=>line());
for(const key of ['save','approve'])action(key,async()=>{await call(key,{id:doc.id,version:doc.version,rows:values()});await list(doc.id);});
action('send',async()=>{const {verified}=await call('send',{id:doc.id});await open(doc.id);get('message').append(' · '+verified+'행 수신값 대조 완료');});
action('excel',async()=>{const result=await call('excel',{id:doc.id});const a=element('a');a.href='data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'+result.content;a.download='SmartNF-'+doc.id+'.xlsx';a.click();});
list().catch(e=>get('message').textContent=e.message);
