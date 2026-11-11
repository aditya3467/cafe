import {mountHero} from './hero-animation.js';

mountHero(document.querySelector('#hero'));

// Native section anchors work without JavaScript. With enhancement, preserve
// focus at the destination as well as its visual scroll position.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('a[href="#experience"], a[href="#hero"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    const behavior = reducedMotion ? 'instant' : 'smooth';
    if (target.id === 'hero') window.scrollTo({top: 0, behavior});
    else target.scrollIntoView({behavior, block: 'start'});
    target.focus({preventScroll: true});
    history.replaceState(null, '', link.getAttribute('href'));
  });
});
