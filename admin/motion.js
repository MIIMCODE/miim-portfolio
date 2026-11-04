/* Decorative only. Rendering pauses offscreen/in background and respects reduced motion. */
(() => {
  'use strict';
  const art = document.querySelector('.login-art');
  const stage = document.querySelector('.core-stage');
  const canvas = document.getElementById('login-particles');
  if (!art || !stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let width = 0, height = 0, points = [], raf = 0, visible = false, last = 0;
  function resize() {
    const box = art.getBoundingClientRect(); width = box.width; height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = Array.from({ length: width < 400 ? 24 : 48 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: .4 + Math.random() * 1.1, speed: .08 + Math.random() * .19, alpha: .12 + Math.random() * .45 }));
    draw(false); schedule();
  }
  function draw(move) {
    ctx.clearRect(0, 0, width, height);
    for (const p of points) {
      if (move) { p.y -= p.speed; if (p.y < -3) p.y = height + 3; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224,175,83,${p.alpha})`; ctx.fill();
    }
  }
  function schedule() {
    if (!raf && visible && !document.hidden && !reduced.matches) raf = requestAnimationFrame(tick);
  }
  function tick(time) {
    raf = 0;
    if (!visible || document.hidden || reduced.matches) return;
    if (time - last > 30) { draw(true); last = time; }
    schedule();
  }
  function resetTilt() { stage.style.removeProperty('--tilt-x'); stage.style.removeProperty('--tilt-y'); }
  art.addEventListener('pointermove', event => {
    if (reduced.matches || !fine.matches || innerWidth <= 650) return;
    const box = art.getBoundingClientRect();
    stage.style.setProperty('--tilt-y', ((event.clientX - box.left) / box.width * 9 - 4.5).toFixed(2) + 'deg');
    stage.style.setProperty('--tilt-x', (4 - (event.clientY - box.top) / box.height * 8).toFixed(2) + 'deg');
  });
  art.addEventListener('pointerleave', resetTilt);
  new ResizeObserver(resize).observe(art);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(art);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => { resetTilt(); draw(false); schedule(); });
})();
