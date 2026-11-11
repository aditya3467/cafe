import {FrameCache} from './frame-cache.js';

// Geometry, phase mapping and cache scheduling preserved from the validated prototype.
export function mountHero(root, {continuation = null} = {}) {
if (!root) return null;
const $=s=>root.querySelector(s), hero=root,cup=$('.cup'),canvas=$('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const copy=$('.copy'),notice=$('.notice'),cue=$('.scroll-cue'),cta=$('.hero-cta');
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));const range=(p,a,b)=>clamp((p-a)/(b-a));
const smooth=x=>x*x*(3-2*x);const mix=(a,b,t)=>a+(b-a)*t;
let cinemaProgress=0;
let progress=0,previous=0,direction=1,requested=1,rendered=0,raf=0,geometry,trigger,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cache=new FrameCache(()=>schedule(),(n,error)=>{console.warn(error.message);notice.textContent='The coffee animation is taking a moment. You can still discover the experience below.';schedule();});
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
const transforms=new WeakMap();
function transform(el,scale,x,y){const key=`${scale}:${x}:${y}:${el===canvas?cinemaProgress:0}`;if(transforms.get(el)!==key){gsap.set(el,{x,y,scale});transforms.set(el,key);}}
function update(){
 raf=0;if(!geometry)return;
 const g=geometry,t=reduced?1:smooth(range(progress,0,.34));
 const s=mix(g.initialScale,g.endScale,t),cx=mix(g.startCenter.x,g.endCenter.x,t),cy=mix(g.startCenter.y,g.endCenter.y,t);
 transform(cup,s,cx-648*s,cy-367.5*s);
 transform(canvas,g.endScale,g.endCenter.x-648*g.endScale,g.endCenter.y-367.5*g.endScale);
 // No sequence advance until movement and the registered handoff are complete.
 requested=progress<=.48?1:Math.round(1+238*range(progress,.48,.94));
 if(!reduced)cache.request(requested,direction,rendered||1,{warm:progress>=.10});
 const available=cache.resolve(requested,direction,rendered||1);
 if(available&&available.frame!==rendered){ctx.drawImage(available.bitmap,0,0,1280,720);rendered=available.frame;cache.displayed=rendered;}
 // On reversing out of the pour, require frame 1 before showing the cutout.
 const registered=rendered===1;
 const handoff=smooth(range(progress,.39,.47));
 let canvasOpacity=progress<.48?(registered?smooth(range(progress,.34,.40)):0):1;
 if(!rendered)canvasOpacity=0;
 const cupOpacity=progress<.48?(registered?1-handoff:1):(!rendered?1:0);
 gsap.set(canvas,{opacity:reduced?0:canvasOpacity});gsap.set(cup,{opacity:reduced?1:cupOpacity});
 const content=smooth(range(progress,.12,.32));
 gsap.set(copy,{autoAlpha:reduced?1:content,y:reduced?0:(1-content)*28});
 const showCta=reduced||progress>=.94;
 gsap.set(cta,{autoAlpha:showCta?1:0});cta.tabIndex=showCta?0:-1;
 cta.inert=!showCta;
 gsap.set(cue,{opacity:1-range(progress,0,.08)});
 if(progress>=.85)continuation?.warm();
 continuation?.update(cinemaProgress,g,rendered);
 window.cup2eatHero.state={progress,requested,rendered,cache:cache.frames.size,peak:cache.peak,inflight:cache.loading.size,direction,geometry:g,canvasOpacity,cupOpacity,failed:[...cache.failed]};
}
window.cup2eatHero={state:{},ready:false,performance:()=>cache.snapshot(),phases:{movement:[0,.34],handoff:[.34,.48],pour:[.48,.94],hold:[.94,1]},scrollTo(p){if(trigger)window.scrollTo(0,trigger.start+clamp(p)*Math.max(innerHeight*5,3200));},refresh(){ScrollTrigger.refresh();},};
async function init(){
 if(!window.gsap||!window.ScrollTrigger){notice.textContent='Animation libraries could not load. Static cup preview retained.';return;}
 gsap.registerPlugin(ScrollTrigger);await cup.decode();hero.classList.add('is-enhanced');measure();
 if(!reduced){
  const driver={p:0};
  gsap.to(driver,{p:1,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:()=>`+=${Math.max(innerHeight*5,3200)+(continuation?.length()||0)}`,pin:true,scrub:.18,invalidateOnRefresh:true,onRefresh:measure},onUpdate(){const base=Math.max(innerHeight*5,3200),extra=continuation?.length()||0,distance=driver.p*(base+extra);progress=clamp(distance/base);cinemaProgress=extra?clamp((distance-base)/extra):0;direction=progress===previous?direction:progress>previous?1:-1;previous=progress;schedule();}});
  trigger=ScrollTrigger.getAll()[0];
 }
 if(!reduced)cache.request(1);schedule();window.cup2eatHero.ready=true;
}
hero.addEventListener('cinema-redraw',schedule);
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();if(trigger)ScrollTrigger.refresh();},160);});

window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;cancelAnimationFrame(raf);cache.dispose();trigger?.kill();});
init().catch(error=>{hero.classList.remove('is-enhanced');notice.textContent='Explore coffee in an edible waffle cup below.';console.error(error);});

return window.cup2eatHero;
}
