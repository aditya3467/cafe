const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => value * value * (3 - 2 * value);

/** Native MP4 playback; only scene transforms are controlled by GSAP. */
export function createCinema(hero, root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const videos = {sip: root.querySelector('#sipping-film'), crack: root.querySelector('#crack-film')};
  const layers = Object.fromEntries([...root.querySelectorAll('[data-scene]')].map(el => [el.dataset.scene, el]));
  const controls = root.querySelector('.film-controls');
  const toggle = root.querySelector('[data-film-toggle]');
  const replay = root.querySelector('[data-film-replay]');
  const status = root.querySelector('.film-status');
  const cover = root.querySelector('.scene-occlusion');
  const ready = new Map();
  let geometry, p = 0, previous = 0, active = 'hero', desired = 'hero';
  let inView = false, paused = false, swap, token = 0;
  let completed = {sip: false, crack: false};
  let preparing = false;

  function prepare(name) {
    if (ready.has(name)) return ready.get(name);
    const video = videos[name];
    const promise = new Promise((resolve, reject) => {
      const finish = () => {
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
        cleanup(); resolve(video);
      };
      const fail = () => {cleanup(); reject(new Error(`Could not load ${name} video.`));};
      const cleanup = () => {video.removeEventListener('loadeddata', finish); video.removeEventListener('error', fail);};
      video.addEventListener('loadeddata', finish); video.addEventListener('error', fail);
      // loadeddata guarantees a decodable current (opening) frame, not just metadata.
      video.preload = 'auto';
      if (video.readyState >= 2) finish(); else video.load();
    });
    ready.set(name, promise);
    promise.catch(() => {ready.delete(name); status.textContent = 'The film is unavailable. You can still explore the edible experience below.';});
    return promise;
  }

  function state() {
    window.cup2eatCinema.state = {progress:p,active,desired,inView,paused,preparing,completed:{...completed},
      videos:Object.fromEntries(Object.entries(videos).map(([name,v]) => [name,{time:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:0,paused:v.paused,ready:v.readyState,ended:v.ended}]))};
  }
  function syncPlayback() {
    for (const [name, video] of Object.entries(videos)) {
      const shouldPlay = !reduced && name === active && inView && !document.hidden && !paused && p >= .22 && !video.ended;
      if (!shouldPlay) video.pause();
      else if (video.paused) video.play().catch(error => {
        if(error.name === 'AbortError') return;
        paused = true; toggle.textContent = 'Play film'; status.textContent = 'Press play to watch the film.'; state();
      });
    }
    toggle.textContent = paused ? 'Play film' : 'Pause film';
    state();
  }
  function hideHero(hidden) {
    if (hidden) {
      gsap.set(hero.querySelectorAll('.sequence, .cup, .copy, .scroll-cue'), {opacity:0});
      hero.querySelector('.hero-cta').inert = true;
    }
  }
  async function show(next, {restart = false} = {}) {
    if (next === desired && (active !== next || !restart)) return;
    desired = next;
    const request = ++token;
    swap?.kill();
    if (videos[next]) {
      preparing = true; state();
      try {await prepare(next);} catch {preparing = false; state(); return;}
      if (request !== token) return;
    }
    preparing = false;
    if (request !== token) return;
    // Occlude completely before swapping or seeking; never blend two cups.
    swap = gsap.to(cover,{autoAlpha:1,duration:.24,ease:'power2.in'});
    await swap;
    if (request !== token) return;
    Object.values(videos).forEach(v => v.pause());
    const video = videos[next];
    if (video && (restart || video.ended) && video.currentTime > .001) {
      await new Promise(resolve => {
        video.addEventListener('seeked',resolve,{once:true});video.currentTime=0;
      });
      if (request !== token) return;
    }
    Object.entries(layers).forEach(([name,el]) => {
      gsap.set(el,{autoAlpha:name===next?1:0});el.inert=name!==next;
    });
    active = next;
    hideHero(next !== 'hero');
    controls.hidden = next === 'hero';
    toggle.hidden = next === 'brand';
    status.textContent = '';
    syncPlayback();
    hero.dispatchEvent(new Event('cinema-redraw'));
    swap = gsap.to(cover,{autoAlpha:0,duration:.42,ease:'power2.out'});
  }
  function reset() {
    completed = {sip:false,crack:false}; paused = false;
    Object.values(videos).forEach(v => v.pause());
  }
  function update(progress, heroGeometry, renderedFrame) {
    geometry = heroGeometry;
    const reversing = progress < previous - .00001;
    p = renderedFrame === 239 ? clamp(progress) : 0; previous = p;
    if (reduced) return;
    if (p === 0) {
      if (active !== 'hero' || desired !== 'hero') {
        ++token; swap?.kill(); gsap.set(cover,{autoAlpha:0});
        Object.values(layers).forEach(el => {gsap.set(el,{autoAlpha:0});el.inert=true;});
        active = desired = 'hero'; preparing=false; controls.hidden = true; reset();
      }
      syncPlayback(); return;
    }
    const t = smooth(clamp(p / .20));
    // Push towards the filled-cup rim from the exact validated source mapping.
    const scale = geometry.endScale * (1 + .55 * t);
    const x = geometry.endCenter.x * (1-t) + geometry.W*.52*t;
    const y = geometry.endCenter.y * (1-t) + geometry.H*.52*t;
    gsap.set(hero.querySelector('.sequence'),{scale,x:x-(648*(1-t)+640*t)*scale,y:y-(367.5*(1-t)+315*t)*scale});
    gsap.set(hero.querySelector('.copy'),{opacity:1-smooth(clamp(p/.12))});
    if (p > .02) hero.querySelector('.hero-cta').inert = true;
    if (p < .20) {
      if (active !== 'hero' || desired !== 'hero') {reset();show('hero');}
    } else if (reversing && p < .58 && ['crack','brand'].includes(desired)) {
      reset(); show('sip',{restart:true});
    } else if (reversing && p >= .58 && p < .92 && desired === 'brand') {
      completed.crack = false; paused = false; show('crack',{restart:true});
    } else if (p >= .22 && desired === 'hero') show('sip',{restart:true});
    // Later scroll positions never skip unfinished actions: native playback gates them.
    if (active === 'sip' && completed.sip) show('crack',{restart:true});
    if (active === 'crack' && completed.crack) show('brand');
    hideHero(active !== 'hero'); syncPlayback();
  }

  const observer = new IntersectionObserver(entries => {
    if (reduced) {
      for (const entry of entries) {
        if (entry.isIntersecting) prepare(entry.target === videos.sip ? 'sip' : 'crack').catch(() => {});
        else entry.target.pause();
      }
    } else {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }
  }, {threshold:.15});
  document.addEventListener('visibilitychange', syncPlayback);
  Object.entries(videos).forEach(([name,v]) => {
    v.addEventListener('timeupdate',state);
    v.addEventListener('ended',() => {
      completed[name] = true;
      if (!reduced && inView && p >= .22) show(name === 'sip' ? 'crack' : 'brand',{restart:name==='sip'});
      state();
    });
  });
  toggle.addEventListener('click',() => {paused=!paused;syncPlayback();});
  replay.addEventListener('click',() => {reset();show('sip',{restart:true});});
  window.cup2eatCinema = {state:{},scrollTo(progress) {
    const trigger=ScrollTrigger.getAll().find(t=>t.trigger===hero);
    const base=Math.max(innerHeight*5,3200);
    if(trigger)window.scrollTo(0,trigger.start+base+clamp(progress)*Math.max(innerHeight*6,4800));
  }};

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    observer.observe(videos.sip); observer.observe(videos.crack);
    // Manual controls remain available; no camera or scene animation is installed.
    return null;
  }
  root.classList.add('is-enhanced'); hero.append(root);
  Object.values(layers).forEach(el => {gsap.set(el,{autoAlpha:0});el.inert=true;});
  Object.values(videos).forEach(v => {v.controls=false;});
  observer.observe(hero);
  window.addEventListener('pagehide',event=>{if(event.persisted)return;observer.disconnect();swap?.kill();Object.values(videos).forEach(v=>v.pause());});
  return {
    length:() => Math.max(innerHeight*6,4800), update,
    warm() {if(!ready.has('sip')) prepare('sip').then(()=>prepare('crack')).catch(()=>{});},
  };
}
