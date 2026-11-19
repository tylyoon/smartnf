import {accountKey,readDraft,writeDraft} from './food-studio-core.js';
const prefix='smartnf.studio-draft.v1:',transferPrefix='smartnf.studio-transfer.v1:';
const maxAge=7*24*3600000;
function member(){const value=accountKey();if(!value||value==='anonymous')throw Error('로그인 후 이용해 주세요.');return value;}
function recipesValid(recipes){return Array.isArray(recipes)&&recipes.length<=30&&recipes.every(r=>r&&typeof r.name==='string'&&r.name.length<=100&&Number.isInteger(r.servings)&&r.servings>0&&r.servings<=24&&Array.isArray(r.ingredients)&&r.ingredients.length<=25&&r.ingredients.every(x=>typeof x==='string')&&Array.isArray(r.steps)&&r.steps.every(x=>typeof x==='string'));}
export function recipeIdentity(r){return JSON.stringify([r.name,r.servings,r.minutes,r.ingredients,r.steps]);}
export function readStudioDraft(){
 const raw=localStorage.getItem(prefix+member());if(!raw)return null;
 try{const value=JSON.parse(raw);if(value.account!==member()||Date.now()-value.updated>maxAge)return null;
  if(!value.state||!recipesValid(value.state.recipes)||!Array.isArray(value.state.active)||value.state.active.length>80)throw Error();return value.state;
 }catch{throw Error('보관한 식단 초안을 읽지 못했습니다. 이 브라우저의 저장 상태를 확인해 주세요.');}
}
export function writeStudioDraft(state){
 if(!recipesValid(state.recipes))throw Error('초안에 보관할 요리 형식을 확인해 주세요.');
 const raw=JSON.stringify({account:member(),updated:Date.now(),state});if(raw.length>2000000)throw Error('초안이 너무 커 자동 보관하지 못했습니다. 요리·기간 구성을 줄여 주세요.');
 const key=prefix+member();localStorage.setItem(key,raw);if(localStorage.getItem(key)!==raw)throw Error('초안을 보관하지 못했습니다.');
}
export function stageMealTransfer(){
 const recipes=readDraft();if(!recipes.length)throw Error('먼저 요리를 담아 주세요.');const old=readStudioDraft();
 const identities=new Set([...(old?.recipes||[]),...recipes].map(recipeIdentity));if(identities.size>30)throw Error('시뮬레이터 초안에는 최대 30개 요리를 둘 수 있습니다. 시뮬레이터에서 새 초안을 시작한 뒤 다시 보내주세요.');
 const id=crypto.randomUUID(),raw=JSON.stringify({account:member(),created:Date.now(),recipes});const key=transferPrefix+member()+':'+id;
 sessionStorage.setItem(key,raw);if(sessionStorage.getItem(key)!==raw)throw Error('요리 이동을 준비하지 못했습니다. 담은 목록은 유지했습니다.');return id;
}
export function loadMealTransfer(id){
 if(!id)return null;const raw=sessionStorage.getItem(transferPrefix+member()+':'+id);if(!raw)return null;
 const value=JSON.parse(raw);if(value.account!==member()||Date.now()-value.created>3600000||!recipesValid(value.recipes)||value.recipes.length>20)throw Error('이동할 요리를 확인하지 못했습니다. 추천 화면에서 다시 보내주세요.');return value;
}
export function acknowledgeMealTransfer(id,transfer){
 let changed=false;
 if(JSON.stringify(readDraft())===JSON.stringify(transfer.recipes)){writeDraft([]);if(readDraft().length)throw Error('초안은 보관했지만 담은 목록을 비우지 못했습니다.');}
 else if(readDraft().length)changed=true; // Never erase another tab's changed basket.
 sessionStorage.removeItem(transferPrefix+member()+':'+id);return changed;
}
export function clearStudioDraft(){localStorage.removeItem(prefix+member());}
