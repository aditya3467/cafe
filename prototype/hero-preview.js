import {FrameCache} from './frame-cache.js';
const $=s=>document.querySelector(s), hero=$('.hero'),cup=$('.cup'),canvas=$('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const copy=$('.copy'),debug=$('.debug'),notice=$('.notice'),cue=$('.scroll-cue');
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));const range=(p,a,b)=>clamp((p-a)/(b-a));
const smooth=x=>x*x*(3-2*x);const mix=(a,b,t)=>a+(b-a)*t;
let progress=0,previous=0,direction=1,requested=1,rendered=0,raf=0,geometry,trigger,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cache=new FrameCache(()=>schedule(),(n,error)=>{console.warn(error.message);notice.textContent=`Frame ${n} unavailable. Holding the last available image.`;schedule();});
function measure(){
 const W=hero.clientWidth,H=hero.clientHeight,mobile=W<=700;
 // Both layers use the same untrimmed 1280×720 coordinate system.
 const initialScale=Math.min(W*(mobile?.74:.48)/400,H*(mobile?.52:.68)/383);
 const endScale=mobile?Math.min(W*.91/720,H*.43/720):Math.min(W*.70/1280,H*.72/720);
 const startCenter={x:W/2,y:H/2};
 const endCenter=mobile?{x:W/2,y:H*.70}:{x:W*.735,y:H*.53};
 geometry={W,H,mobile,initialScale,endScale,startCenter,endCenter};
 // Source-sized backing canvas avoids wasteful high-DPR upscaling.
 canvas.width=1280;canvas.height=720;
 if(rendered&&cache.get(rendered))ctx.drawImage(cache.get(rendered),0,0);
 schedule();
}
function schedule(){if(!raf&&!disposed)raf=requestAnimationFrame(update);}
function transform(el,scale,x,y){gsap.set(el,{x,y,scale});}
function update(){
 raf=0;if(!geometry)return;
 const g=geometry,t=smooth(range(progress,0,.34));
 const s=mix(g.initialScale,g.endScale,t),cx=mix(g.startCenter.x,g.endCenter.x,t),cy=mix(g.startCenter.y,g.endCenter.y,t);
 transform(cup,s,cx-648*s,cy-367.5*s);
 transform(canvas,g.endScale,g.endCenter.x-648*g.endScale,g.endCenter.y-367.5*g.endScale);
 // No sequence advance until movement and the registered handoff are complete.
 requested=progress<=.48?1:Math.round(1+238*range(progress,.48,.94));
 const bitmap=cache.get(requested);
 if(bitmap&&requested!==rendered){ctx.drawImage(bitmap,0,0,1280,720);rendered=requested;}
 cache.request(requested,direction,rendered||1);
 // On reversing out of the pour, require frame 1 before showing the cutout.
 const registered=rendered===1;
 const handoff=smooth(range(progress,.39,.47));
 let canvasOpacity=progress<.48?(registered?smooth(range(progress,.34,.40)):0):1;
 if(!rendered)canvasOpacity=0;
 const cupOpacity=progress<.48?(registered?1-handoff:1):(!rendered?1:0);
 gsap.set(canvas,{opacity:reduced?0:canvasOpacity});gsap.set(cup,{opacity:reduced?1:cupOpacity});
 const content=smooth(range(progress,.12,.32));
 gsap.set(copy,{autoAlpha:reduced?0:content,y:(1-content)*28});
 gsap.set(cue,{opacity:1-range(progress,0,.08)});
 debug.value=`SCROLL ${(progress*100).toFixed(1)}%  |  FRAME ${String(rendered||1).padStart(3,'0')} / 239\nTARGET ${requested}  |  CACHE ${cache.frames.size}/18  |  ${direction>0?'FORWARD':'REVERSE'}${requested!==rendered?' · LOADING':''}`;
 window.heroPreview.state={progress,requested,rendered,cache:cache.frames.size,peak:cache.peak,inflight:cache.loading.size,direction,geometry:g,canvasOpacity,cupOpacity,failed:[...cache.failed]};
}
window.heroPreview={state:{},ready:false,phases:{movement:[0,.34],handoff:[.34,.48],pour:[.48,.94],hold:[.94,1]},scrollTo(p){if(trigger)window.scrollTo(0,trigger.start+clamp(p)*(trigger.end-trigger.start));},refresh(){ScrollTrigger.refresh();},};
async function init(){
 if(!window.gsap||!window.ScrollTrigger){notice.textContent='Animation libraries could not load. Static cup preview retained.';return;}
 gsap.registerPlugin(ScrollTrigger);await cup.decode();measure();
 if(!reduced){
  const driver={p:0};
  gsap.to(driver,{p:1,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:()=>`+=${Math.max(innerHeight*5,3200)}`,pin:true,scrub:.18,invalidateOnRefresh:true,onRefresh:measure},onUpdate(){progress=driver.p;direction=progress===previous?direction:progress>previous?1:-1;previous=progress;schedule();}});
  trigger=ScrollTrigger.getAll()[0];
 }else{notice.textContent='Reduced motion: static empty-cup preview.';}
 cache.request(1);schedule();window.heroPreview.ready=true;
}
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();if(trigger)ScrollTrigger.refresh();},160);});
$('#restart').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'instant'});});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);cache.dispose();trigger?.kill();});
init().catch(error=>{notice.textContent='Prototype initialization failed. The empty cup remains available.';console.error(error);});
