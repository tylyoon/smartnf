import {api,accountKey} from './food-studio-core.js';
import {element,roles} from './business-format.js';

const selector=document.getElementById('alert-org');
const status=document.getElementById('alert-status');
const list=document.getElementById('alert-items');
const storageKey='smartnf.business.org:'+accountKey();
let timer,loading=false,revision=0,last='';
async function call(action,body) {
    const result=await api('/api/me/business-trade/'+action,body);
    if(result.error)throw Error(result.error);
    return result;
}
async function refresh() {
    if(loading)return;
    loading=true;
    const version=revision;
    try {
        const organizations=await call('organizations',{});
        if(version!==revision)return;
        let selected=selector.value;
        if(!selected){try{selected=sessionStorage.getItem(storageKey);}catch{/* Storage can be disabled. */}}
        if(JSON.stringify([...selector.options].map(o=>o.value))!==JSON.stringify(organizations.map(o=>o.id))){
            selector.replaceChildren();
            for(const org of organizations)selector.add(new Option(org.name+' · '+org.id+' · '+roles[org.role],org.id));
        }
        if(organizations.some(o=>o.id===selected))selector.value=selected;
        const org=selector.value;
        if(!org){status.textContent='업체 등록 후 업무 알림을 확인할 수 있습니다.';return;}
        const data=await call('notifications',{org});
        if(version!==revision)return;
        status.textContent='미확인 알림 '+data.unread+'건 · 5초 간격 자동 확인';
        const snapshot=JSON.stringify([org,data]);
        if(snapshot===last)return;
        last=snapshot;list.replaceChildren();
        for(const notice of data.notifications){
            const item=element('article',null,'business-notice-item');
            item.append(element('p',(notice.isRead?'':'새 알림 · ')+notice.message));
            const link=element('a','거래 업무에서 확인하기','business-button');
            link.href='/preview/business?org='+encodeURIComponent(org)+'&order='+encodeURIComponent(notice.ref);
            item.append(link);
            if(!notice.isRead){
                const read=element('button','읽음 처리','secondary');
                read.type='button';
                read.onclick=async()=>{
                    read.disabled=true;
                    try{await call('readNotice',{org,id:notice.id,requestId:crypto.randomUUID()});await refresh();}
                    catch(e){status.textContent=e.message;read.disabled=false;}
                };
                item.append(read);
            }
            list.append(item);
        }
        if(!data.notifications.length)list.append(element('p','업무 알림이 없습니다.'));
    }catch(e){status.textContent='업무 알림 연결 확인 필요 · '+e.message;}
    finally{loading=false;}
}
selector.onchange=()=>{
    revision++;last='';
    try{sessionStorage.setItem(storageKey,selector.value);}catch{/* Storage can be disabled. */}
    refresh();
};
async function poll(){if(!document.hidden)await refresh();timer=setTimeout(poll,5000);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
window.addEventListener('pagehide',()=>clearTimeout(timer));
poll();
