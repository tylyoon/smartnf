import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/main/resources/static/js/meal-studio.js',import.meta.url),'utf8');
const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{events:{},addEventListener(k,f){this.events[k]=f;}});return nodes.get(id);};
let owner='member:1',resolveCatalog,calls=0,completed=0,renders=0;
const items=[{name:'소고기',text:'소고기 100g',grams:100}],catalogData=new Map([['public',{name:'소고기',nutrients:{energy:100}}]]);
const c={Map,Promise,Error,$,accountKey:()=>owner,catalog:new Map(),catalogReady:false,catalogLoading:null,revision:1,saving:false,pendingSave:null,
 loadCatalog(){calls++;return new Promise(resolve=>resolveCatalog=resolve);},nutritionItems:()=>items,parseRecipe:()=>[{foodId:'public'}],resolveIngredientMatches:async()=>{},completeNutrition:async list=>{assert.equal(list,items);completed++;},refreshLibraryEditors(){},renderSides(){},renderCurrentMeal(){renders++;},period:[{}],renderCalendar(){renders++;},persistStudio(){},today:'2026-12-01'};
vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function matchPublicNutrition('),source.indexOf('async function init()'))+';this.prepareNutritionCatalog=prepareNutritionCatalog;',c);
let waiting=c.prepareNutritionCatalog();await Promise.resolve();assert.equal(calls,1);assert.equal(c.prepareNutritionCatalog(),waiting,'parallel requests share one load');assert.match($('fs-period-nutrition-status').textContent,/待|기다리지 않고/);assert(!c.catalogReady);
resolveCatalog(catalogData);assert(await waiting);await Promise.resolve();await Promise.resolve();assert(c.catalogReady);assert.equal(items[0].foodId,'public','late nutrition reaches existing generated snapshot');assert(completed>0);assert(renders>0);assert.equal($('fs-load-library').disabled,false);
// A failed or synchronously throwing loader can actually be retried.
c.catalogReady=false;c.loadCatalog=()=>{calls++;throw Error('offline');};assert.equal(await c.prepareNutritionCatalog(),false);assert.equal(c.catalogLoading,null);assert.equal($('fs-retry-catalog').hidden,false);assert.match($('fs-period-nutrition-status').textContent,/추천은 계속 이용/);
c.loadCatalog=async()=>{calls++;return catalogData;};await $('fs-retry-catalog').events.click();assert(c.catalogReady);assert.equal($('fs-retry-catalog').hidden,true);
// An empty data file is not reported as a successful nutrition load.
c.catalogReady=false;c.loadCatalog=async()=>new Map();assert.equal(await c.prepareNutritionCatalog(),false);assert.match($('fs-period-nutrition-status').textContent,/사용 가능한 영양 자료/);
// Results from an old account cannot populate the new account's catalog.
c.loadCatalog=()=>new Promise(resolve=>resolveCatalog=resolve);waiting=c.prepareNutritionCatalog();await Promise.resolve();owner='member:2';resolveCatalog(catalogData);assert.equal(await waiting,false);assert.equal(c.catalogReady,false);
// Draft restoration failures do not skip the independent nutrition startup.
c.readStudioDraft=()=>{throw Error('draft problem');};c.loadCatalog=async()=>{calls++;return catalogData;};
vm.runInContext(source.slice(source.indexOf('async function init()'),source.indexOf('\ninit();'))+';this.init=init;',c);
const before=calls;await c.init();await Promise.resolve();await Promise.resolve();assert(calls>before);assert.match($('fs-status').textContent,/draft problem/);await c.catalogLoading;
console.log('PASS independent nutrition startup, loading coalescence, late snapshot hydration, failed/synchronous load retry, empty-map rejection, account guard, startup despite draft errors');
