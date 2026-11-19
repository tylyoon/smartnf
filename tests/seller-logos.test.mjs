import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/main/resources/static/js/price-reference.js',import.meta.url),'utf8');
class Node{constructor(tag,text){this.tag=tag;this.text=text;this.children=[];this.events={};}replaceChildren(){this.children=[];}append(...nodes){this.children.push(...nodes);}addEventListener(event,fn){this.events[event]=fn;}}
test('seller cards contain official-origin icon and label, with no grid spacer nodes',()=>{
 const context={element:(...args)=>new Node(...args),encodeURIComponent};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('export function sellerLinks'),source.indexOf('export async function refreshReference')).replace('export ',''),context);
 const root=new Node('div');context.sellerLinks(root,'우유');assert.equal(root.children.length,14);
 for(const link of root.children){assert.equal(link.tag,'a');assert.equal(link.children.length,2);const [image,label]=link.children;assert.equal(image.tag,'img');assert.equal(image.src,new URL(link.href).origin+'/favicon.ico');assert.ok(label.text);assert.equal(link.rel,'noopener noreferrer');image.events.error();assert.equal(image.hidden,true);}
 context.sellerLinks(root,'');assert.ok(root.children.every(link=>link.href===new URL(link.href).origin+'/'));
});
