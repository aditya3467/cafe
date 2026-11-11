import * as sequence from './frame-sequence.js?v=hero-pack-v1';
const getFrameSource=sequence.getFrameSource;

/** Separate, bounded compressed-byte and decoded-pixel caches. */
export class FrameCache {
  constructor(onReady, onError, options = {}) {
    const mobile = matchMedia('(max-width: 700px)').matches;
    this.limit = options.limit ?? (mobile ? 12 : 20);
    this.concurrency = options.concurrency ?? 3;
    this.decodeConcurrency = 2;
    this.byteLimit = (mobile ? 8 : 12) * 1024 * 1024;
    this.onReady = onReady; this.onError = onError;
    this.frames = new Map(); this.encoded = new Map();
    this.loading = new Map(); this.decoding = new Set(); this.failed = new Set();
    this.retryAt = new Map(); this.attempts = new Map(); this.unavailablePacks = new Set();
    this.target = 1; this.displayed = 1; this.direction = 1; this.warm = false;
    this.peak = 0; this.bytes = 0; this.disposed = false; this.velocity = 0;
    this.lastRequestTime = performance.now(); this.lastTarget = 1; this.motion = [];
    this.stats = {downloads:0,downloadBytes:0,decodes:0,evictions:0,encodedEvictions:0,aborted:0,fallbacks:0,peakEncodedBytes:0,peakDownloads:0,peakDecodes:0,decodeMs:[],fetchMs:[]};
  }

  request(target, direction = 1, displayed = 1, {warm = false} = {}) {
    const now = performance.now();
    if (target !== this.lastTarget) {
      if (direction !== this.direction) this.motion = [];
      this.motion.push({target,time:now});
      this.motion = this.motion.filter(s=>now-s.time<400);
      const first=this.motion[0];
      if(this.motion.length>1)this.velocity=Math.min(240,Math.abs(target-first.target)*1000/Math.max(16,now-first.time));
      this.lastRequestTime=now;this.lastTarget=target;
    }
    Object.assign(this, {target,direction,displayed,warm});
    this.plan();
  }

  get(frame) {
    const bitmap = this.frames.get(frame);
    if (bitmap) {this.frames.delete(frame); this.frames.set(frame,bitmap);}
    return bitmap;
  }

  /** Never jump ahead of scroll, or backwards while scrolling forwards. */
  resolve(target, direction, displayed) {
    if (this.frames.has(target)) return {frame:target,bitmap:this.get(target)};
    if (target === 1) return null; // exact registration is mandatory at handoff
    const candidates = [...this.frames.keys()].filter(n => direction > 0
      ? n <= target && n >= displayed : n >= target && n <= displayed);
    if (!candidates.length) return null;
    const frame = candidates.sort((a,b) => Math.abs(a-target)-Math.abs(b-target))[0];
    return {frame,bitmap:this.get(frame)};
  }

  plan() {
    if (this.disposed) return;
    const valid = list => [...new Set(list)].filter(n => n >= 1 && n <= 239);
    // Decode contiguous neighbors: changing stride/parity needlessly churns bitmaps.
    const stride = 1;
    const availableEncoded=[...this.encoded.keys()].filter(n=>this.direction>0?n<=this.target&&n>=this.displayed:n>=this.target&&n<=this.displayed);
    const fallback=availableEncoded.sort((a,b)=>Math.abs(a-this.target)-Math.abs(b-this.target))[0];
    const pixels = [this.target,...(fallback?[fallback]:[]),1];
    const ahead = this.warm ? this.limit - 6 : 0;
    for (let i=1;i<=ahead;i++) pixels.push(this.target+i*this.direction*stride);
    if (this.warm) for(let i=1;i<=2;i++) pixels.push(this.target-i*this.direction);
    this.pixelPriority = valid(pixels);
    const timings=this.stats.fetchMs.slice(-12);
    const leadMs=timings.length?timings.reduce((a,b)=>a+b,0)/timings.length:180;
    const lead=this.warm?Math.min(65,Math.max(2,Math.ceil(this.velocity*leadMs/1000))):0;
    // Reserve upcoming network slots for the time at which a transfer will finish.
    const predicted=this.target+this.direction*lead;
    const compressed=this.warm?[this.target,1,predicted,predicted+this.direction*2,...this.pixelPriority]:[this.target];
    if (this.warm) {
      const horizon = Math.min(80, Math.max(40, Math.ceil(this.velocity * 1.25)));
      for (let i=1;i<=horizon;i++) compressed.push(this.target+i*this.direction);
      for (let i=1;i<=6;i++) compressed.push(this.target-i*this.direction);
    }
    if(this.warm && sequence.getFramePack){
      // Fetch adjacent compressed packs early; keep decoding bounded separately.
      // Fifteen packs fit inside the compressed-byte budget even on mobile.
      const ordered=[];
      for(let n=this.target;n>=1&&n<=239;n+=this.direction)ordered.push(n);
      for(let n=this.target-this.direction;n>=1&&n<=239;n-=this.direction)ordered.push(n);
      this.bytePriority=valid([this.target,1,...ordered]);
    }else this.bytePriority = valid(compressed);
    const wanted = new Set(this.bytePriority);
    for (const [n,entry] of this.loading) {
      // Preserve near-complete transfers; cancel only very young, obsolete work.
      if (!(entry.pack?.frames.some(([frame])=>wanted.has(frame))||wanted.has(entry.frame)) && Math.abs(entry.frame-this.target)>80 && !entry.headers && performance.now()-entry.start<100) entry.controller.abort();
    }
    this.pump();
  }

  pump() {
    if (this.disposed) return;
    const now = performance.now();
    for (const n of this.bytePriority) {
      if (this.loading.size >= this.concurrency) break;
      let pack=sequence.getFramePack?.(n);
      if(pack&&this.unavailablePacks.has(pack.index))pack=null;
      const key=pack?`pack:${pack.index}`:n;
      if (this.encoded.has(n) || this.frames.has(n) || this.loading.has(key) || this.failed.has(n) || (this.retryAt.get(n)||0)>now) continue;
      const entry = {controller:new AbortController(),start:now,headers:false,pack,key,frame:n};
      this.loading.set(key,entry); this.stats.peakDownloads = Math.max(this.stats.peakDownloads,this.loading.size);
      this.download(n,entry);
    }
    for (const n of this.pixelPriority) {
      if (this.decoding.size >= this.decodeConcurrency) break;
      if (this.frames.has(n) || this.decoding.has(n) || !this.encoded.has(n)) continue;
      this.decoding.add(n); this.stats.peakDecodes = Math.max(this.stats.peakDecodes,this.decoding.size);
      this.decode(n);
    }
  }

  async download(n,entry) {
    try {
      const fetchBlob = async format => {
        const response = await fetch(getFrameSource(n,format), {signal:entry.controller.signal});
        entry.headers = true;
        if (!response.ok) throw new Error(`Frame ${n}: HTTP ${response.status}`);
        return response.blob();
      };
      let blob, packed=false;
      if(entry.pack){
        try{
          const response=await fetch(entry.pack.url,{signal:entry.controller.signal});entry.headers=true;
          if(!response.ok)throw new Error(`Pack HTTP ${response.status}`);
          blob=await response.blob();
          if(blob.size!==entry.pack.bytes)throw new Error('Incomplete frame pack');
          packed=true;
        }catch(error){if(error.name==='AbortError')throw error;this.unavailablePacks.add(entry.pack.index);this.stats.fallbacks++;}
      }
      if(!packed){
        try {blob = await fetchBlob('webp');}
        catch(error) {
          if (error.name === 'AbortError') throw error;
          this.stats.fallbacks++; blob = await fetchBlob('png');
        }
      }
      if (this.disposed) return;
      this.stats.downloads++; this.stats.downloadBytes += blob.size;
      this.record(this.stats.fetchMs,performance.now()-entry.start);
      const frames=packed?entry.pack.frames:[[n,0,blob.size]];
      for(const [frame,offset,length] of frames){
        if(this.encoded.has(frame))continue;
        this.encoded.set(frame,packed?blob.slice(offset,offset+length,'image/webp'):blob);this.bytes+=length;
      }
      this.trimEncoded(); this.stats.peakEncodedBytes = Math.max(this.stats.peakEncodedBytes,this.bytes);
    } catch(error) {
      if (error.name === 'AbortError') this.stats.aborted++;
      else {
        const attempts = (this.attempts.get(n)||0)+1; this.attempts.set(n,attempts);
        if (attempts >= 2) {this.failed.add(n); this.onError(n,error);}
        else {this.retryAt.set(n,performance.now()+750);setTimeout(()=>this.plan(),760);}
      }
    } finally {this.loading.delete(entry.key);this.plan();}
  }

  async decode(n) {
    const start = performance.now();
    const blob = this.encoded.get(n);
    try {
      const bitmap = await createImageBitmap(blob);
      if (this.disposed) {bitmap.close();return;}
      this.stats.decodes++;this.record(this.stats.decodeMs,performance.now()-start);
      const needed = this.pixelPriority.includes(n) || n===this.displayed;
      if (!needed) {bitmap.close();return;}
      while(this.frames.size >= this.limit) {
        const victim = [...this.frames.keys()].find(k=>k!==1&&k!==this.target&&k!==this.displayed&&!this.pixelPriority.includes(k))
          ?? [...this.frames.keys()].find(k=>k!==1&&k!==this.target&&k!==this.displayed);
        if (victim === undefined) {bitmap.close();return;}
        this.frames.get(victim).close();this.frames.delete(victim);this.stats.evictions++;
      }
      this.frames.set(n,bitmap);this.peak=Math.max(this.peak,this.frames.size);
      this.onReady(n);
    } catch(error) {this.failed.add(n);this.onError(n,error);}
    finally {this.decoding.delete(n);this.trimEncoded();this.pump();}
  }

  trimEncoded() {
    for (const [n,blob] of this.encoded) {
      if (this.bytes <= this.byteLimit) break;
      if (n===1 || n===this.target || n===this.displayed || this.decoding.has(n)) continue;
      this.encoded.delete(n);this.bytes-=blob.size;this.stats.encodedEvictions++;
    }
  }

  record(list,value) {list.push(value);if(list.length>1024)list.shift();}

  snapshot() {
    return {...this.stats,decodeMs:this.stats.decodeMs.slice(-1000),fetchMs:this.stats.fetchMs.slice(-1000),decoded:this.frames.size,decodedLimit:this.limit,
      estimatedDecodedBytes:this.frames.size*1280*720*4,encodedBytes:this.bytes,encodedLimitBytes:this.byteLimit,inflight:this.loading.size,decoding:this.decoding.size};
  }

  dispose() {
    this.disposed=true;this.loading.forEach(e=>e.controller.abort());
    this.frames.forEach(b=>b.close());this.frames.clear();this.encoded.clear();this.bytes=0;
  }
}
