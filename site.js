/* The pencil: draws a china-marker loop around anything marked as chosen
   (<mark class="circled"> in text, class="select" on a frame).
   Each loop is seeded, so it keeps the same shape on every visit.
   The first loop is drawn by hand when it comes into view; the rest are
   already there, the way a page looks after someone has read it. */
(() => {
  const marks = [...document.querySelectorAll('mark.circled, .select')];
  if (!marks.length) return;

  const NS = 'http://www.w3.org/2000/svg';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  function loop(w, h, rnd) {
    const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
    const tilt = (rnd() - 0.5) * 0.09;                 // a few degrees off level
    const start = Math.PI * (1.02 + rnd() * 0.22);     // the pen goes down at the left
    const sweep = Math.PI * 2 * (1.07 + rnd() * 0.09); // and overshoots where it began
    const p1 = rnd() * 6.283, p2 = rnd() * 6.283;
    const n = 80, pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, t = start + sweep * u;
      const wobble = 1 + 0.035 * Math.sin(2 * t + p1) + 0.02 * Math.sin(3 * t + p2);
      const widen = 1 + 0.07 * u;                       // the loop opens as it closes
      const x = Math.cos(t) * rx * wobble * widen;
      const y = Math.sin(t) * ry * wobble * widen;
      pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt),
                cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    return 'M' + pts.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join(' L');
  }

  function draw(el, i, animate) {
    el.querySelector(':scope > svg.pencil')?.remove();
    const box = el.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const padX = Math.max(fs * 0.45, box.width * 0.05);
    const padY = Math.max(fs * 0.3, box.height * 0.07);
    const w = box.width + padX * 2, h = box.height + padY * 2;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pencil');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.left = -padX + 'px';
    svg.style.top = -padY + 'px';

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', loop(w, h, seeded(1009 + i * 7919)));
    svg.appendChild(path);
    el.appendChild(svg);

    if (animate) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 1100ms cubic-bezier(.55,.1,.3,1)';
      requestAnimationFrame(() => { path.style.strokeDashoffset = 0; });
    }
  }

  const drawAll = (except) => marks.forEach((el, i) => { if (i !== except) draw(el, i, false); });

  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    if (still || !('IntersectionObserver' in window)) { drawAll(-1); return; }
    drawAll(0);
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { draw(marks[0], 0, true); io.disconnect(); }
    }, { threshold: 1, rootMargin: '0px 0px -12% 0px' });
    io.observe(marks[0]);
  });

  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => marks.forEach((el, i) => draw(el, i, false)), 150);
  });
})();
