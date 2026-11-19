import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const bundle=readFileSync(new URL('../src/main/resources/static/js/personal-mypage.js',import.meta.url),'utf8');
const focus=bundle.slice(bundle.indexOf('      let x = () => {',bundle.indexOf('function Xo('))+6,bundle.indexOf('      return window.addEventListener("focus", x)',bundle.indexOf('function Xo(')));
function harness({dirty=false,pending=false}={}){
 const calls=[],ctx={Kt:{current:{date:'2027-04-01',dirty,consent:{eventId:1}}},Lt:{current:pending},yt:{current:0},zt:{current:false},Vt:{current:true},je:async()=>({eventId:1,agreed:true}),pl:d=>calls.push(d),T:m=>calls.push(m),i:()=>{},f:()=>{},o:()=>{},y:()=>{},B:()=>{}};
 vm.createContext(ctx);vm.runInContext(focus+';globalThis.focus=x',ctx);return {ctx,calls,run:async()=>{ctx.focus();await new Promise(setImmediate);}};
}
test('returning to clean MyPage fetches the currently selected saved date',async()=>{const h=harness();await h.run();assert.deepEqual(h.calls,['2027-04-01']);});
test('unsaved edits survive focus',async()=>{const h=harness({dirty:true});await h.run();assert.equal(h.calls.length,1);assert.match(h.calls[0],/갱신을 보류/);});
test('uncertain save survives focus',async()=>{const h=harness({pending:true});await h.run();assert.match(h.calls[0],/갱신을 보류/);});
test('late focus response cannot overwrite another load',async()=>{const h=harness();let resolve;h.ctx.je=()=>new Promise(r=>resolve=r);h.ctx.focus();h.ctx.yt.current++;resolve({eventId:1,agreed:true});await new Promise(setImmediate);assert.deepEqual(h.calls,[]);});
test('edits made while consent check is pending survive',async()=>{const h=harness();let resolve;h.ctx.je=()=>new Promise(r=>resolve=r);h.ctx.focus();h.ctx.Kt.current.dirty=true;resolve({eventId:1,agreed:true});await new Promise(setImmediate);assert.match(h.calls[0],/갱신을 보류/);});
test('same-date lookup reloads only clean draft',()=>{
 const start=bundle.indexOf('    function wt('),end=bundle.indexOf('    function Jt(',start),code=bundle.slice(start,end);
 for(const dirty of [false,true]){const calls=[];const ctx={pe:()=>true,M:false,l:'2027-04-01',Kt:{current:{dirty}},Lt:{current:null},At:{current:null},F:()=>{},lt:()=>{},a:()=>{},pl:d=>calls.push(d),T:()=>{}};vm.createContext(ctx);vm.runInContext(code+';wt("2027-04-01")',ctx);assert.equal(calls.length,dirty?0:1);}
});
