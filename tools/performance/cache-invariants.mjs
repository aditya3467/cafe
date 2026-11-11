import assert from 'node:assert/strict';
globalThis.matchMedia=()=>({matches:false});
const active=new Map();let peakFetches=0,fetches=0,duplicateDecodes=0;
globalThis.fetch=(url,{signal}={})=>new Promise((resolve,reject)=>{
 fetches++;active.set(url,true);peakFetches=Math.max(peakFetches,active.size);
 const timer=setTimeout(()=>{active.delete(url);resolve({ok:true,blob:async()=>Object.assign(new Blob([new Uint8Array(1200)]),{frame:Number(/frame_(\d+)/.exec(url)[1])})});},12);
 signal?.addEventListener('abort',()=>{clearTimeout(timer);active.delete(url);reject(new DOMException('aborted','AbortError'));},{once:true});
});
const decoding=new Set();globalThis.createImageBitmap=async blob=>{
 if(decoding.has(blob.frame))duplicateDecodes++;
 decoding.add(blob.frame);await new Promise(r=>setTimeout(r,3));decoding.delete(blob.frame);
 return {frame:blob.frame,closed:false,close(){assert.equal(this.closed,false,'bitmap closed twice');this.closed=true;}};
};
const {FrameCache}=await import('../../js/frame-cache.js');
const errors=[];const cache=new FrameCache(()=>{},(n,e)=>errors.push([n,e]),{limit:8});
const wait=async condition=>{const start=performance.now();while(!condition()){assert(performance.now()-start<3000,'timeout');await new Promise(r=>setTimeout(r,5));}};
cache.request(1);await wait(()=>cache.frames.has(1));
cache.request(50,1,1,{warm:true});await wait(()=>cache.frames.has(50)&&cache.loading.size===0&&cache.decoding.size===0);
const before=cache.stats.decodes;for(let i=0;i<20;i++)cache.request(50,1,50,{warm:true});await new Promise(r=>setTimeout(r,40));
const stableExtra=cache.stats.decodes-before;assert.equal(stableExtra,0,'stable target must not churn decodes');assert(cache.frames.has(1));assert(cache.frames.has(50));assert(cache.frames.size<=8);
cache.request(200,1,50,{warm:true});cache.request(5,-1,50,{warm:true});await wait(()=>cache.frames.has(5));
assert(cache.frames.has(50),'displayed frame is protected');assert.equal(cache.resolve(5,-1,50).frame,5);
assert(cache.peak<=8);assert(peakFetches<=3);assert.equal(duplicateDecodes,0);assert.equal(errors.length,0);
cache.dispose();await new Promise(r=>setTimeout(r,30));assert.equal(cache.frames.size,0);assert.equal(cache.encoded.size,0);
console.log(JSON.stringify({passed:true,peakFetches,peakDecoded:cache.peak,duplicateConcurrentDecodes:duplicateDecodes,obsoleteRequestsAborted:cache.stats.aborted,stableTargetExtraDecodes:stableExtra,fetches},null,2));
