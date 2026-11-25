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
  let current = 12;

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
    if (window.Rake) window.Rake.set(Object.assign({ n }, d));
  }

  if (document.getElementById('rakeCanvas')) {
    const tabs = [...document.querySelectorAll('.tabs [role=tab]')];
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(+b.dataset.n));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const j = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        tabs[j].focus(); select(+tabs[j].dataset.n);
      });
    });
    document.querySelectorAll('.modes [data-fold]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.modes [data-fold]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (window.Rake) window.Rake.fold(b.dataset.fold === '1');
    }));
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
