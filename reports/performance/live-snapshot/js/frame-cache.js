import {getFrameSource} from './frame-sequence.js';

// An explicit decoded-image budget; encoded network caching is browser managed.
export class FrameCache {
  constructor(onReady, onError, {limit = 18, concurrency = 3} = {}) {
    Object.assign(this, {onReady,onError,limit,concurrency});
    this.frames=new Map();this.loading=new Map();this.failed=new Set();this.queue=[];
    this.target=1;this.displayed=1;this.direction=1;this.peak=0;this.disposed=false;
  }
  request(target,direction=1,displayed=1) {
    Object.assign(this,{target,direction,displayed});
    // Replace stale queued work on every direction/target change.
    const priority=[target,1];
    for(let n=1;n<=9;n++)priority.push(target+n*direction);
    for(let n=1;n<=3;n++)priority.push(target-n*direction);
    this.queue=[...new Set(priority)].filter(n=>n>=1&&n<=239&&!this.frames.has(n)&&!this.loading.has(n)&&!this.failed.has(n));
    this.pump();
  }
  get(frame) {const value=this.frames.get(frame);if(value){this.frames.delete(frame);this.frames.set(frame,value);}return value;}
  pump() {
    if(this.disposed)return;
    while(this.loading.size<this.concurrency&&this.queue.length){
      const n=this.queue.shift();const controller=new AbortController();this.loading.set(n,controller);
      this.load(n,controller);
    }
  }
  async load(n,controller) {
    let bitmap;
    try {
      const path=getFrameSource(n);
      const response=await fetch(path,{signal:controller.signal});
      if(!response.ok)throw new Error(`Frame ${n}: HTTP ${response.status}`);
      bitmap=await createImageBitmap(await response.blob());
      if(this.disposed){bitmap.close();return;}
      // Evict before admitting the newly decoded bitmap.
      while(this.frames.size>=this.limit){
        const victim=[...this.frames.keys()].find(k=>k!==1&&k!==this.target&&k!==this.displayed);
        if(victim===undefined)break;
        this.frames.get(victim).close();this.frames.delete(victim);
      }
      this.frames.set(n,bitmap);this.peak=Math.max(this.peak,this.frames.size);this.onReady(n);
    } catch(error){if(error.name!=='AbortError'){this.failed.add(n);this.onError(n,error);}}
    finally{this.loading.delete(n);this.pump();}
  }
  dispose(){this.disposed=true;this.loading.forEach(c=>c.abort());this.frames.forEach(b=>b.close());this.frames.clear();this.queue=[];}
}
