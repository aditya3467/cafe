import fs from 'node:fs/promises';
const out=new URL('../screenshots',import.meta.url).pathname;const targets=await(await fetch('http://127.0.0.1:9222/json')).json();const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),events=[];ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result)}else events.push(d)});const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const until=async expr=>ev(`new Promise((resolve,reject)=>{const start=performance.now();function check(){if(${expr})resolve(true);else if(performance.now()-start>15000)reject(new Error('wait timeout: '+${JSON.stringify(expr)}));else setTimeout(check,30)}check()})`);
await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
const results={};for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:name==='mobile'});await send('Page.navigate',{url:'http://127.0.0.1:8000/prototype/hero-preview.html'});await until('window.heroPreview?.ready && window.heroPreview.state.rendered===1');
 const samples=[];
 for(const [label,p] of [['initial',0],['moving',.20],['aligned',.34],['handoff',.43],['pour-start',.48],['pour',.72],['final',.97],['reverse-pour',.65],['reverse-handoff',.43],['reverse-initial',0]]){
  await ev(`window.heroPreview.scrollTo(${p})`);await until(`Math.abs(window.heroPreview.state.progress-${p})<.002 && window.heroPreview.state.requested===window.heroPreview.state.rendered`);
  const state=await ev(`({...window.heroPreview.state,scrollY,heroTop:document.querySelector('.hero').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth,registrationError:(()=>{const a=document.querySelector('.cup').getBoundingClientRect(),b=document.querySelector('canvas').getBoundingClientRect();return {x:Math.abs(a.x-b.x),y:Math.abs(a.y-b.y),width:Math.abs(a.width-b.width),height:Math.abs(a.height-b.height)}})()})`);samples.push({label,...state});
  if(['initial','moving','handoff','pour','final','reverse-handoff','reverse-initial'].includes(label))await fs.writeFile(`${out}/${name}-${label}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 // Fast jumps exercise cache misses and reversal rather than only fully settled scrolling.
 for(const p of [.99,.52,.87,.03,.96]){await ev(`window.heroPreview.scrollTo(${p})`);await ev('new Promise(r=>setTimeout(r,45))');}
 await until('window.heroPreview.state.rendered===239 && window.heroPreview.state.requested===239');
 results[name]={samples,fastScrubFinal:await ev('window.heroPreview.state')};console.log(name,'passed',samples.map(s=>`${s.label}:${s.rendered}`).join(' '));
}
results.errors=events.filter(e=>e.method==='Runtime.exceptionThrown'||e.method==='Log.entryAdded'&&e.params.entry.level==='error'||e.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(e.params.type)||e.method==='Network.loadingFailed');
results.failedHTTP=events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400).map(e=>({url:e.params.response.url,status:e.params.response.status}));
await fs.writeFile(new URL('../browser-validation.json',import.meta.url),JSON.stringify(results,null,2));console.log('errors',JSON.stringify(results.errors),'failed HTTP',JSON.stringify(results.failedHTTP));ws.close();
