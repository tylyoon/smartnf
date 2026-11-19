import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const server=spawn('python',['-u','tests/business_ui_server.py'],{cwd:root});
const [message]=await once(server.stdout,'data');
const base='http://127.0.0.1:'+message.toString().trim();
let browser;
const errors=[];
try {
    const launch={headless:true};
    if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
    if(process.env.PLAYWRIGHT_NO_SANDBOX==='1')launch.args=['--no-sandbox'];
    browser=await chromium.launch(launch);
    const sellerContext=await browser.newContext({viewport:{width:1366,height:1000}});
    const buyerContext=await browser.newContext({viewport:{width:390,height:844}});
    for(const [context,member] of [[sellerContext,1],[buyerContext,2]])await context.addCookies([{name:'fixtureMember',value:String(member),url:base}]);
    const seller=await sellerContext.newPage(),buyer=await buyerContext.newPage();
    for(const page of [seller,buyer])page.on('pageerror',error=>errors.push(String(error)));
    async function api(page,op,data={}){
        return page.evaluate(async({op,data})=>{
            const response=await fetch('/api/me/business-trade/'+op,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':'fixture'},body:JSON.stringify({...data,requestId:crypto.randomUUID()})});
            const value=await response.json();if(value.error)throw Error(value.error);return value;
        },{op,data});
    }
    await seller.goto(base+'/preview/business');
    await buyer.goto(base+'/preview/business');
    await seller.locator('#action option[value=register]').waitFor({state:'attached'});
    const selling=(await api(seller,'register',{name:'테스트 농장'})).id;
    const buying=(await api(buyer,'register',{name:'테스트 급식소'})).id;
    const sku=(await api(seller,'catalog',{org:selling,name:'양송이 1kg',origin:'국내',unit:'g',pack:1000,price:9000,allergens:'미확인',protein:3,sodium:5})).id;
    await seller.reload();await buyer.reload();
    await seller.waitForFunction(()=>document.querySelector('#sync-status').textContent.includes('자동 갱신 중'));
    await buyer.waitForFunction(()=>document.querySelector('#sync-status').textContent.includes('자동 갱신 중'));
    // A supplier can keep entering a different product while a new buyer order arrives.
    await seller.selectOption('#action','catalog');
    await seller.locator('#fields [name=name]').fill('입력 중인 상품');
    await buyer.selectOption('#action','order');
    await buyer.selectOption('#fields [name=sku]',sku);
    await buyer.locator('#fields [name=packs]').fill('2');
    await buyer.click('#execute');
    await buyer.waitForFunction(()=>document.querySelector('#message').textContent==='처리했습니다.');
    await seller.waitForFunction(()=>document.querySelector('#tasks').textContent.includes('양송이 1kg'),{timeout:15000});
    assert.equal(await seller.locator('#fields [name=name]').inputValue(),'입력 중인 상품');
    assert.ok(Number(await seller.locator('#unread').textContent())>0);
    seller.on('dialog',dialog=>dialog.accept());
    await seller.getByRole('button',{name:'판매자 발주 승인 · 내용 확인',exact:true}).click();
    await seller.click('#execute');
    await seller.waitForFunction(()=>document.querySelector('#message').textContent==='처리했습니다.');
    await buyer.waitForFunction(()=>document.querySelector('#tasks').textContent.includes('모의 결제·재고 예약'),{timeout:15000});
    // Visible, accessible selects and forms fit the mobile viewport.
    assert.equal(await buyer.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    assert.ok(await buyer.locator('#execute').evaluate(e=>e.getBoundingClientRect().height)>=42);
    await buyer.selectOption('#action','rfq');
    await buyer.selectOption('#fields [name=seller]',selling);
    await buyer.locator('#fields [name=name]').fill('미등록 후추');
    await buyer.locator('#fields [name=spec]').fill('100g 병');
    await buyer.selectOption('#fields [name=unit]','g');
    await buyer.locator('#fields [name=qty]').fill('200');
    await buyer.locator('#fields [name=delivery]').fill('2090-01-01');
    await buyer.click('#execute');
    await buyer.waitForFunction(()=>document.querySelector('#result').textContent.includes('RFQ-'));
    await seller.waitForFunction(()=>document.querySelector('#tasks').textContent.includes('미등록 후추'),{timeout:15000});
    await buyer.click('#report-form button[type=submit]');
    await buyer.waitForFunction(()=>document.querySelector('#report-result').textContent.includes('18,000원'));
    assert.equal(await buyer.locator('#export-report').isEnabled(),true);
    // Document worker and the redesigned form preserve approval flow.
    await buyer.goto(base+'/preview/business/documents');
    await buyer.locator('#upload').setInputFiles({name:'test.txt',mimeType:'text/plain',buffer:Buffer.from('테스트 농장 양송이 1kg 2포장 18000원')});
    await buyer.click('#submit');
    await buyer.locator('#lines input[data-key=supplier]').waitFor();
    for(const [key,value] of Object.entries({supplier:'테스트 농장',item:'양송이 1kg',sku,qty:'2',unitPrice:'9000',tax:'0',total:'18000',line:'1'}))
        await buyer.locator('#lines input[data-key='+key+']').fill(value);
    await buyer.click('#save');
    await buyer.waitForFunction(()=>document.querySelector('#message').textContent.includes('v2'));
    await buyer.click('#approve');
    await buyer.waitForFunction(()=>document.querySelector('#message').textContent.includes('승인 완료'));
    assert.equal(await buyer.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    assert.equal(await buyer.locator('#lines input[data-key=total]').inputValue(),'18000');
    assert.deepEqual(errors,[]);
    console.log('PASS two-account order notifications, preserved input, approval update, RFQ, report, document approval, desktop/mobile layout');
} finally {
    if(browser)await browser.close();server.kill();
}
