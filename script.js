/* Alser Anca: rastrillo a escala + entradas + WhatsApp armado */
(function () {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '5492317464434';
  const wa = (t) => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);

  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add('loaded')));

  /* ---------- entradas por sección, escalonadas ---------- */
  const items = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sib = [...e.target.parentElement.querySelectorAll(':scope > .reveal')];
        const i = Math.max(0, sib.indexOf(e.target));
        e.target.style.transitionDelay = (i * 75) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add('in'));
  // red de seguridad: nada queda escondido
  setTimeout(() => items.forEach((el) => el.classList.add('in')), 4000);

  /* ---------- FAQ: el signo + / − ---------- */
  document.querySelectorAll('.faq summary').forEach((s) => {
    const pm = document.createElement('span'); pm.className = 'pm'; pm.setAttribute('aria-hidden', 'true');
    s.appendChild(pm);
  });

  /* ---------- rastrillo a escala ---------- */
  // Datos de la web vieja de Alser Anca (alseranca.com.ar, páginas por modelo)
  const RAKES = {
    4:  { w: 2.5,  t: '2,50 a 2,70', model: 'Rastrillo de tres puntos, 4 estrellas', three: true,
          desc: 'Va colgado del tractor, con enganche clase I y II. Tiene cuatro posiciones de trabajo que cambian el ángulo de barrido y 160 púas de acero de 8 mm. Para el transporte se pone paralelo al tractor.',
          rows: 'Brazos tipo balancín y resortes con regulación para dar más o menos presión sobre el suelo.',
          img: 'rastrillo-3-puntos-4-estrellas.jpg', iw: 629, ih: 391, ml: 'MLA-4031957824' },
    8:  { w: 6.5,  t: '2,70', model: 'Rastrillo en V de 8 estrellas',
          desc: 'Se pliega a mano sacando dos chavetas rápidas, en segundos y sin esfuerzo. Cuando junta tres hileras mueve también la del centro. Opcional: 4 y 4 estrellas.',
          rows: 'Trabaja así: mover y juntar 3 · mover y juntar 2 · mover 3 sin juntar.',
          img: 'rastrillo-v-8-estrellas.jpg', iw: 629, ih: 275, ml: null },
    10: { w: 7.9,  t: '2,70', model: 'Rastrillo en V de 10 estrellas',
          desc: 'Se pliega a mano sacando dos chavetas rápidas. Las ruedas están ubicadas para que quede balanceado. Opcional: 5 y 5 estrellas.',
          rows: 'Trabaja así: mover y juntar 3 · mover y juntar 2 · mover 3 sin juntar.',
          img: 'rastrillo-v-10-estrellas.jpg', iw: 629, ih: 219, ml: null },
    12: { w: 9.3,  t: '3,20', model: 'Rastrillo en V de 12 estrellas',
          desc: 'Junta tres hileras y mueve la del centro, porque tiene los brazos desiguales. Se pliega a mano sacando dos chavetas rápidas. Opcional: 6 y 6 estrellas.',
          rows: 'Trabaja así: mover y juntar 3 · mover y juntar 2 · mover 3 sin juntar.',
          img: 'rastrillo-v-12-estrellas.jpg', iw: 629, ih: 213, ml: 'MLA-4031760790' },
    14: { w: 11.2, t: '2,85', model: 'Rastrillo en V de 14 estrellas',
          desc: 'Apertura, cierre y altura con accionamiento hidráulico. Ancho de hilera regulable de 1,10 a 1,70 m. Mide 9 m de largo y apoya en cuatro ruedas 225 o 235 x 15.',
          rows: 'Trabaja así: juntando cinco hileras · juntando seis · dejando dos.',
          img: 'rastrillo-v-14-estrellas.jpg', iw: 629, ih: 227, ml: null },
    16: { w: 12.6, t: '2,85', model: 'Rastrillo en V de 16 estrellas',
          desc: 'El más grande: apertura, cierre y altura hidráulicos, hilera de 1,10 a 1,70 m y 10 m de largo. Para lotes grandes, donde conviene juntar varias hileras de una pasada.',
          rows: 'Trabaja así: juntando cinco hileras · juntando seis · dejando dos.',
          img: 'rastrillo-v-16-estrellas.jpg', iw: 629, ih: 200, ml: 'MLA-4031851722' }
  };
  const fmt = (n) => n.toFixed(2).replace('.', ',');
  const svg = document.getElementById('rakeSvg');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); (parent || svg).appendChild(n); return n; };

  const S = 600, PX = 540 / 14;   // el cuadro: 14 m de lado
  let current = 12, shownW = RAKES[12].w;

  function star(cx, cy, r, ang, g) {
    const s = el('g', { class: 'rk-star', transform: `translate(${cx} ${cy}) rotate(${ang})` }, g);
    el('circle', { r }, s);
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      el('line', { x1: 0, y1: 0, x2: (Math.cos(a) * r).toFixed(1), y2: (Math.sin(a) * r).toFixed(1) }, s);
    }
    el('circle', { r: r * 0.28, class: 'hub' }, s);
  }

  function draw(n, w) {
    const d = RAKES[n];
    while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);
    const cx = S / 2, hw = (w * PX) / 2;
    const top = 150, bottom = 470;
    // pasto cortado (la franja que barre)
    el('rect', { x: cx - hw, y: top - 10, width: hw * 2, height: S - top - 60, class: 'rk-swath' });
    for (let y = top; y < S - 76; y += 18) el('line', { x1: cx - hw + 4, y1: y, x2: cx + hw - 4, y2: y, class: 'rk-cut' });
    // tractor
    el('rect', { x: cx - 32, y: 14, width: 18, height: 34, class: 'rk-tire' });
    el('rect', { x: cx + 14, y: 14, width: 18, height: 34, class: 'rk-tire' });
    el('rect', { x: cx - 40, y: 66, width: 22, height: 44, class: 'rk-tire' });
    el('rect', { x: cx + 18, y: 66, width: 22, height: 44, class: 'rk-tire' });
    el('rect', { x: cx - 16, y: 8, width: 32, height: 112, rx: 6, class: 'rk-tractor' });

    const g = el('g', {});
    const r = Math.max(13, Math.min(24, (hw * 2) / (n * 0.95)));
    if (d.three) {
      // de tres puntos: una fila en diagonal detrás del tractor
      const y1 = top + 10, y2 = top + 120;
      el('line', { x1: cx, y1: 120, x2: cx, y2: y1 + 20, class: 'rk-beam' }, g);
      el('line', { x1: cx - hw, y1: y1, x2: cx + hw, y2: y2, class: 'rk-beam' }, g);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        star(cx - hw + t * hw * 2, y1 + t * (y2 - y1) + 22, r, 35, g);
      }
      el('rect', { x: cx + hw - 40, y: y2 + 36, width: 46, height: S - y2 - 110, class: 'rk-hilera' });
    } else {
      // en V: brazos que abren adelante y cierran atrás, una hilera al centro
      const half = n / 2, gap = 30;
      el('rect', { x: cx - 26, y: bottom - 10, width: 52, height: S - bottom - 66, class: 'rk-hilera' });
      el('line', { x1: cx, y1: 120, x2: cx, y2: bottom, class: 'rk-beam' }, g);
      [-1, 1].forEach((side) => {
        const x1 = cx + side * (hw - r), y1 = top + 10, x2 = cx + side * gap, y2 = bottom - 6;
        el('line', { x1: cx, y1: top + 30, x2: x1, y2: y1 + 6, class: 'rk-beam' }, g);
        el('line', { x1, y1, x2, y2, class: 'rk-beam' }, g);
        for (let i = 0; i < half; i++) {
          const t = half === 1 ? 0.5 : i / (half - 1);
          star(x1 + (x2 - x1) * t + side * r * 0.65, y1 + (y2 - y1) * t, r, side * 30, g);
        }
      });
    }
    // cota del ancho de labor
    const yd = S - 26;
    el('line', { x1: cx - hw, y1: yd, x2: cx + hw, y2: yd, class: 'rk-dim' });
    el('line', { x1: cx - hw, y1: yd - 12, x2: cx - hw, y2: yd + 12, class: 'rk-dim' });
    el('line', { x1: cx + hw, y1: yd - 12, x2: cx + hw, y2: yd + 12, class: 'rk-dim' });
    el('rect', { x: cx - 118, y: yd - 46, width: 236, height: 36, class: 'rk-labelbg' });
    const lbl = el('text', { x: cx, y: yd - 18, 'text-anchor': 'middle', class: 'rk-label' });
    lbl.textContent = fmt(w) + ' m de labor';
  }

  function tween(n) {
    const from = shownW, to = RAKES[n].w;
    if (reduce || from === to) { shownW = to; draw(n, to); return; }
    const t0 = performance.now(), dur = 520;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      shownW = from + (to - from) * e; draw(n, shownW);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function select(n) {
    current = n; const d = RAKES[n];
    document.querySelectorAll('.tabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.n === n)));
    document.getElementById('rkWidth').textContent = fmt(d.w);
    document.getElementById('rkModel').textContent = d.model;
    document.getElementById('rkDesc').textContent = d.desc + ' Ancho de transporte: ' + d.t + ' m.';
    document.getElementById('rkRows').textContent = d.rows;
    const ph = document.getElementById('rkPhoto');
    ph.src = 'assets/img/' + d.img; ph.width = d.iw; ph.height = d.ih;
    ph.alt = d.model + ' Alser Anca, abierto sobre el pasto';
    document.getElementById('rkWa').href = wa('Hola Alser Anca, quería consultar por el ' + d.model.charAt(0).toLowerCase() + d.model.slice(1) + ' (' + fmt(d.w) + ' m de labor). ¿Qué plazo de entrega tienen?');
    const ml = document.getElementById('rkMl');
    ml.href = d.ml ? 'https://articulo.mercadolibre.com.ar/' + d.ml : 'https://www.mercadolibre.com.ar/tienda/alser-anca';
    ml.textContent = d.ml ? 'Verlo en Mercado Libre' : 'Ver la tienda en Mercado Libre';
    tween(n);
  }

  if (svg) {
    const tabs = [...document.querySelectorAll('.tabs [role=tab]')];
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(+b.dataset.n));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const j = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        tabs[j].focus(); select(+tabs[j].dataset.n);
      });
    });
    draw(12, RAKES[12].w);
    select(12);
  }

  /* ---------- formulario → WhatsApp ---------- */
  const form = document.getElementById('waForm');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = form.nombre.value.trim(), m = form.maquina.value.trim();
    window.open(wa('Hola Alser Anca, soy ' + n + '. Quería consultar por: ' + m + '.'), '_blank', 'noopener');
  });

  /* ---------- botón fijo: aparece después del hero ---------- */
  const fab = document.querySelector('.fab'), hero = document.querySelector('.hero');
  if (fab && hero && 'IntersectionObserver' in window) {
    fab.classList.add('is-hidden');
    new IntersectionObserver(([e]) => fab.classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.35 }).observe(hero);
  }

  /* ---------- compartir ---------- */
  const sh = document.getElementById('shareBtn');
  if (sh) sh.addEventListener('click', async () => {
    const data = { title: 'Alser Anca', text: 'Rastrillos, segadoras y cortadoras de césped en 9 de Julio', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); sh.textContent = 'Link copiado'; }
    } catch (_) {}
  });
})();
