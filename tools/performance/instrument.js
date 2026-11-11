(() => {
 performance.setResourceTimingBufferSize(10000);
 const data=window.__heroPerf={requests:[],fetches:[],decodes:[],draws:[],closes:0,samples:[],longTasks:[]};
 const blobUrls=new WeakMap(),bitmaps=new WeakMap();
 const frame=url=>Number(/frame_(\d+)/.exec(url)?.[1]||0);
 const fetchOriginal=window.fetch;
 window.fetch=async function(...args){
  const url=String(args[0]?.url||args[0]),start=performance.now();
  try{const response=await fetchOriginal.apply(this,args);if(frame(url)||/pack_\d+\.bin/.test(url)){
   const entry={url,frame:frame(url),start,headers:performance.now(),status:response.status};data.fetches.push(entry);
   const original=response.blob.bind(response);response.blob=async()=>{const blob=await original();entry.end=performance.now();entry.bytes=blob.size;blobUrls.set(blob,url);return blob;};
  }return response;}catch(e){if(frame(url)||/pack_\d+\.bin/.test(url))data.fetches.push({url,frame:frame(url),start,end:performance.now(),error:e.name});throw e;}
 };
 const decode=window.createImageBitmap;
 window.createImageBitmap=async function(source,...args){const start=performance.now(),bitmap=await decode.call(this,source,...args),url=blobUrls.get(source)||'';if(frame(url)||/pack_\d+\.bin/.test(url)){data.decodes.push({frame:frame(url),start,end:performance.now(),url});bitmaps.set(bitmap,url);}return bitmap;};
 const close=ImageBitmap.prototype.close;ImageBitmap.prototype.close=function(){if(bitmaps.has(this))data.closes++;return close.call(this);};
 const draw=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(image,...args){const start=performance.now(),result=draw.call(this,image,...args);if(this.canvas.classList.contains('sequence'))data.draws.push({frame:frame(bitmaps.get(image)||''),time:start,ms:performance.now()-start});return result;};
 try{new PerformanceObserver(list=>data.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});}catch{}
 for(const suffix of ['', '?v=hero-pack-v1'])import(new URL('js/frame-cache.js'+suffix,location.href).href).then(({FrameCache})=>{
  const request=FrameCache.prototype.request;
  FrameCache.prototype.request=function(target,...args){data.cacheRef=this;data.requests.push({frame:target,time:performance.now(),cache:this.frames.size,inflight:this.loading.size});return request.call(this,target,...args);};
  if(FrameCache.prototype.decode){const decodeFrame=FrameCache.prototype.decode;FrameCache.prototype.decode=function(n){const blob=this.encoded.get(n);if(blob)blobUrls.set(blob,'decoded:#frame_'+String(n).padStart(6,'0')+'.webp');return decodeFrame.call(this,n);};}
 }).catch(()=>{});
 function sample(){const state=window.cup2eatHero?.state;if(Number.isFinite(state?.requested))data.samples.push({time:performance.now(),requested:state.requested,rendered:state.rendered,progress:state.progress,cache:state.cache,inflight:state.inflight,rawScroll:scrollY,heap:performance.memory?.usedJSHeapSize});requestAnimationFrame(sample);}requestAnimationFrame(sample);
})();
