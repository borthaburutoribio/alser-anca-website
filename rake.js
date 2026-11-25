/* Alser Anca: el rastrillo visto desde arriba, a escala real (14 x 14 m), en canvas.
   Dibuja el tractor, el chasis, las estrellas con sus púas (girando), las andanas que
   junta y la hilera que deja atrás. window.Rake.set(datos) cambia de modelo;
   window.Rake.fold(true/false) lo pliega al ancho de transporte. */
(function () {
  const cv = document.getElementById('rakeCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = 14;                        // metros por lado del cuadro
  const R = 0.72;                      // radio de cada estrella (1,44 m de diámetro)
  const C = {
    field: '#24452A', field2: '#28502F', stub: '#5E7A3C', stub2: '#6F8A47',
    hay: '#C8B45A', hay2: '#A8913E', hayHi: '#E2D27F',
    tube: '#F27A00', tubeDk: '#A94F00', tubeHi: '#FFC27A',
    steel: '#D3D9DE', steelDk: '#7C858C', rim: '#AEB6BC',
    red: '#E4181E', redHi: '#FF5A4E', redDk: '#9E0E12', tire: '#151515', tread: '#2E2E2E',
    cab: '#1B1B1B', glass: '#3A4A55', yellow: '#FCC618', ink: '#15130E'
  };

  let W = 0, dpr = 1, k = 1;
  let data = null, from = null, t0 = 0, anim = 1;   // anim: 0→1 transición entre modelos
  let open = 1, openTarget = 1;                       // 1 trabajando, 0 plegado
  let g = 0, spin = 0, last = 0, running = false, visible = false;

  // pasto: marcas fijas al suelo que avanzan con el tractor
  const ticks = Array.from({ length: 340 }, () => [Math.random() * M - M / 2, Math.random() * M, 0.12 + Math.random() * 0.2]);
  const hayMarks = Array.from({ length: 420 }, () => [Math.random(), Math.random() * M, 0.15 + Math.random() * 0.25, Math.random()]);

  function size() {
    const r = cv.getBoundingClientRect();
    W = r.width; dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr);
    k = W / M;
    frame(0);
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const num = (s) => parseFloat(String(s).split(' ').pop().replace(',', '.'));

  // geometría en metros de un modelo, abierto (o=1) o plegado (o=0)
  function geom(d, o) {
    const w = d.w, tr = num(d.t);
    if (d.three) {
      const L = 2.6, aW = Math.acos(Math.min(1, (w - 0.9) / L)), aF = Math.PI / 2 - 0.05;
      const a = lerp(aF, aW, o), cx = lerp(0.9, 0, o), cy = 6.2;
      const p1 = [cx - Math.cos(a) * L / 2, cy - Math.sin(a) * L / 2], p2 = [cx + Math.cos(a) * L / 2, cy + Math.sin(a) * L / 2];
      return { three: true, n: d.n, p1, p2, L: w / 2, yR: p2[1], wx: p2[0] };
    }
    const half = d.n / 2, arm = half * 0.85 + 0.3;
    const xF = lerp(tr / 2 - 0.45, w / 2 - 0.45, o), xR = 0.75, yF = 4.9;
    const dy = Math.sqrt(Math.max(arm * arm - (xF - xR) * (xF - xR), 1));
    return { three: false, n: d.n, half, xF, xR, yF, yR: yF + dy, L: w / 2 };
  }

  function wheelsOf(G) {
    const out = [];
    if (G.three) {
      const ang = Math.atan2(G.p2[0] - G.p1[0], G.p2[1] - G.p1[1]);
      for (let i = 0; i < G.n; i++) {
        const t = (i + 0.5) / G.n;
        out.push({ x: lerp(G.p1[0], G.p2[0], t) - 0.2, y: lerp(G.p1[1], G.p2[1], t) + 0.25, phi: ang * 0.55, side: 1 });
      }
      return out;
    }
    [-1, 1].forEach((s) => {
      const fx = s * G.xF, rx = s * G.xR;
      const ang = Math.atan2(rx - fx, G.yR - G.yF);
      for (let i = 0; i < G.half; i++) {
        const t = (i + 0.5) / G.half;
        out.push({ x: lerp(fx, rx, t) + s * 0.18, y: lerp(G.yF, G.yR, t), phi: ang * 0.62, side: s });
      }
    });
    return out.sort((a, b) => a.y - b.y);
  }

  /* ---------- piezas de dibujo (unidades: metros) ---------- */
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function tube(x1, y1, x2, y2, w) {
    ctx.lineCap = 'round';
    [[C.tubeDk, w], [C.tube, w * 0.72], [C.tubeHi, w * 0.16]].forEach(([c, lw], i) => {
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
      const off = i === 2 ? -w * 0.18 : 0;
      ctx.moveTo(x1 + off, y1 + off * 0.3); ctx.lineTo(x2 + off, y2 + off * 0.3); ctx.stroke();
    });
  }

  function field(G, o) {
    // franjas de corte (1 m) y rastrojo
    for (let x = -M / 2; x < M / 2; x += 1) { ctx.fillStyle = (Math.round(x) % 2) ? C.field : C.field2; ctx.fillRect(x, 0, 1.001, M); }
    // andanas delante del rastrillo
    const bands = Math.max(2, Math.round((G.L * 2) / 2.1));
    if (o > 0.02) {
      ctx.globalAlpha = o;
      for (let i = 0; i < bands; i++) {
        const cx = -G.L + (i + 0.5) * (G.L * 2 / bands);
        ctx.fillStyle = C.hay2; ctx.fillRect(cx - 0.55, 0, 1.1, M);
        ctx.fillStyle = C.hay; ctx.fillRect(cx - 0.45, 0, 0.9, M);
        hayMarks.forEach(([fx, fy, len, sh]) => {
          if (fx > 0.5 && i % 2) return;
          const x = cx - 0.42 + fx * 0.84, y = (fy + g) % M;
          ctx.strokeStyle = sh > 0.5 ? C.hayHi : C.hay2; ctx.lineWidth = 0.035;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (sh - 0.5) * 0.12, y + len); ctx.stroke();
        });
      }
      ctx.globalAlpha = 1;
    }
    // lo que ya pasó por las estrellas queda limpio
    ctx.fillStyle = C.stub;
    ctx.beginPath();
    if (G.three) {
      ctx.moveTo(-G.L - 0.6, G.p1[1] + 0.4); ctx.lineTo(G.p2[0] + 0.4, G.p2[1] + 0.6);
      ctx.lineTo(G.p2[0] + 0.4, M); ctx.lineTo(-G.L - 0.6, M);
    } else {
      ctx.moveTo(-G.L - 0.3, G.yF + 0.4); ctx.lineTo(-G.xR, G.yR + 0.4); ctx.lineTo(G.xR, G.yR + 0.4);
      ctx.lineTo(G.L + 0.3, G.yF + 0.4); ctx.lineTo(G.L + 0.3, M); ctx.lineTo(-G.L - 0.3, M);
    }
    ctx.closePath(); ctx.globalAlpha = o; ctx.fill(); ctx.globalAlpha = 1;
    ticks.forEach(([x, y, l]) => {
      const yy = (y + g) % M;
      ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.03;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 0.04, yy + l); ctx.stroke();
    });
    // la hilera que deja atrás
    if (o > 0.02) {
      const hx = G.three ? G.p2[0] + 0.1 : 0, hy = (G.three ? G.p2[1] : G.yR) + 0.1, hw = 0.7 + 0.15 * (G.L > 4 ? 1 : 0);
      ctx.globalAlpha = o;
      ctx.fillStyle = C.hay2; rr(hx - hw - 0.1, hy, (hw + 0.1) * 2, M - hy + 1, 0.5); ctx.fill();
      ctx.fillStyle = C.hay; rr(hx - hw, hy + 0.1, hw * 2, M - hy + 1, 0.45); ctx.fill();
      hayMarks.forEach(([fx, fy, len, sh], i) => {
        if (i % 2) return;
        const x = hx - hw + 0.08 + fx * (hw * 2 - 0.16), y = (fy + g) % M;
        if (y < hy + 0.15) return;
        ctx.strokeStyle = sh > 0.45 ? C.hayHi : C.hay2; ctx.lineWidth = 0.04;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (sh - 0.5) * 0.18, y + len); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  }

  function tractor() {
    const tread = (x, y, w, h) => {
      ctx.fillStyle = C.tire; rr(x, y, w, h, 0.08); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.strokeStyle = C.tread; ctx.lineWidth = 0.06;
      for (let yy = y - 0.3 + ((g * 1.0) % 0.24); yy < y + h + 0.3; yy += 0.24) {
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w / 2, yy + 0.1); ctx.lineTo(x + w, yy); ctx.stroke();
      }
      ctx.restore();
    };
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; rr(-1.0, 0.75, 2.3, 3.5, 0.3); ctx.fill();
    tread(-1.16, 2.55, 0.52, 1.45); tread(0.64, 2.55, 0.52, 1.45);   // traseras
    tread(-0.86, 0.75, 0.3, 0.72); tread(0.56, 0.75, 0.3, 0.72);     // delanteras
    ctx.fillStyle = C.redDk; rr(-0.46, 0.42, 0.92, 2.3, 0.22); ctx.fill();
    ctx.fillStyle = C.red; rr(-0.42, 0.42, 0.84, 2.25, 0.2); ctx.fill();
    ctx.fillStyle = C.redHi; rr(-0.07, 0.55, 0.14, 1.9, 0.07); ctx.fill();
    ctx.fillStyle = '#2A2A2A'; rr(-0.3, 0.44, 0.6, 0.1, 0.04); ctx.fill();          // parrilla
    ctx.fillStyle = C.red; rr(-1.2, 2.5, 0.6, 0.55, 0.12); ctx.fill(); rr(0.6, 2.5, 0.6, 0.55, 0.12); ctx.fill(); // guardabarros
    ctx.fillStyle = C.cab; rr(-0.72, 2.25, 1.44, 1.55, 0.16); ctx.fill();
    ctx.fillStyle = C.glass; rr(-0.62, 2.33, 1.24, 0.22, 0.06); ctx.fill();
    ctx.fillStyle = '#2B2B2B'; rr(-0.58, 2.62, 1.16, 1.06, 0.12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; rr(-0.5, 2.68, 0.45, 0.95, 0.1); ctx.fill();
    ctx.fillStyle = '#0E0E0E'; ctx.beginPath(); ctx.arc(0.3, 0.95, 0.07, 0, 7); ctx.fill(); // escape
    // barra de tiro
    ctx.strokeStyle = '#5A5A5A'; ctx.lineWidth = 0.1; ctx.beginPath(); ctx.moveTo(0, 3.8); ctx.lineTo(0, 4.5); ctx.stroke();
  }

  function star(w) {
    const u = [Math.sin(w.phi), Math.cos(w.phi)], v = [u[1], -u[0]], e = 0.38;
    const P = (rad, th) => [w.x + u[0] * rad * Math.cos(th) + v[0] * rad * e * Math.sin(th), w.y + u[1] * rad * Math.cos(th) + v[1] * rad * e * Math.sin(th)];
    // sombra
    ctx.save(); ctx.translate(w.x + 0.14, w.y + 0.16); ctx.rotate(-w.phi);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, 0, R * e * 1.3, R * 1.05, 0, 0, 7); ctx.fill(); ctx.restore();
    const N = 30, rot = spin * (w.side < 0 ? -1 : 1);
    const tines = (front) => {
      for (let i = 0; i < N; i++) {
        const th = rot + i * 2 * Math.PI / N, s = Math.sin(th);
        if ((s >= 0) !== front) continue;
        const a = P(R * 0.96, th), b = P(R + 0.27, th + 0.1);
        ctx.strokeStyle = front ? C.steel : C.steelDk; ctx.lineWidth = 0.034;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(P(R + 0.08, th + 0.02)[0], P(R + 0.08, th + 0.02)[1], b[0], b[1]); ctx.stroke();
      }
    };
    tines(false);
    // llanta (aro) y rayos
    ctx.strokeStyle = C.rim; ctx.lineWidth = 0.04; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const p = P(R, i * Math.PI / 20); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,40,40,0.9)'; ctx.lineWidth = 0.025;
    for (let i = 0; i < 6; i++) { const p = P(R * 0.95, rot * 1 + i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    tines(true);
    // maza con su bolillero
    ctx.fillStyle = C.tubeDk; ctx.beginPath(); ctx.arc(w.x, w.y, 0.13, 0, 7); ctx.fill();
    ctx.fillStyle = C.tube; ctx.beginPath(); ctx.arc(w.x, w.y, 0.09, 0, 7); ctx.fill();
    ctx.fillStyle = '#1A1A1A'; ctx.beginPath(); ctx.arc(w.x, w.y, 0.04, 0, 7); ctx.fill();
  }

  function frameRake(G, wheels) {
    if (G.three) {
      tube(0, 4.4, G.p1[0] + 0.5, G.p1[1], 0.14);
      tube(0, 4.4, (G.p1[0] + G.p2[0]) / 2, (G.p1[1] + G.p2[1]) / 2, 0.12);
      tube(G.p1[0], G.p1[1], G.p2[0], G.p2[1], 0.16);
      wheels.forEach(star);
      return;
    }
    // ruedas del chasis
    [-1, 1].forEach((s) => { ctx.fillStyle = C.tire; rr(s * 0.62 - 0.12, G.yR - 0.05, 0.24, 0.62, 0.06); ctx.fill(); });
    tube(0, 4.4, 0, G.yR + 0.35, 0.18);                               // lanza central
    tube(-G.xR - 0.1, G.yR + 0.2, G.xR + 0.1, G.yR + 0.2, 0.12);     // eje trasero
    // estrellas de atrás primero, después brazos, después las de adelante
    const back = wheels.filter((w) => w.y > (G.yF + G.yR) / 2), front = wheels.filter((w) => w.y <= (G.yF + G.yR) / 2);
    back.forEach(star);
    [-1, 1].forEach((s) => {
      tube(0, G.yF + 0.9, s * G.xF, G.yF, 0.12);                     // tensores
      tube(s * G.xF, G.yF, s * G.xR, G.yR, 0.15);                     // brazos
      ctx.fillStyle = '#3A3A3A'; ctx.beginPath(); ctx.arc(s * G.xF, G.yF, 0.1, 0, 7); ctx.fill();
    });
    front.forEach(star);
  }

  function ruler(G, o, d) {
    ctx.fillStyle = 'rgba(10,14,9,0.62)'; ctx.fillRect(-M / 2, M - 0.95, M, 0.95);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.03;
    for (let m = -7; m <= 7; m++) { const h = m % 2 ? 0.14 : 0.26; ctx.beginPath(); ctx.moveTo(m, M - 0.12); ctx.lineTo(m, M - 0.12 - h); ctx.stroke(); }
    const half = lerp(num(d.t) / 2, d.w / 2, o), y = M - 0.62;
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 0.07;
    ctx.beginPath(); ctx.moveTo(-half, y); ctx.lineTo(half, y); ctx.moveTo(-half, y - 0.22); ctx.lineTo(-half, y + 0.22); ctx.moveTo(half, y - 0.22); ctx.lineTo(half, y + 0.22); ctx.stroke();
    const txt = o > 0.5 ? (d.w.toFixed(2).replace('.', ',') + ' m de labor') : (d.t + ' m en transporte');
    ctx.font = '900 0.5px Epilogue, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width + 0.5;
    ctx.fillStyle = C.ink; rr(-tw / 2, y - 1.02, tw, 0.66, 0.06); ctx.fill();
    ctx.fillStyle = C.yellow; ctx.fillText(txt, 0, y - 0.68);
  }

  function frame(now) {
    if (!data || !W) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    if (running && !reduce) { g = (g + dt * 1.6) % M; spin += dt * 2.6; }
    open += (openTarget - open) * (reduce ? 1 : Math.min(1, dt * 4));
    if (Math.abs(openTarget - open) < 0.002) open = openTarget;
    if (anim < 1) anim = reduce ? 1 : Math.min(1, (now - t0) / 650);
    const Gn = geom(data, open);
    let G = Gn;
    if (from && anim < 1 && !Gn.three && !from.three) {
      const Gf = geom(from, open), e = ease(anim);
      G = Object.assign({}, Gn, { xF: lerp(Gf.xF, Gn.xF, e), yR: lerp(Gf.yR, Gn.yR, e), L: lerp(Gf.L, Gn.L, e) });
    }
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * W / 2, 0);
    ctx.clearRect(-M / 2, 0, M, M);
    field(G, open);
    frameRake(G, wheelsOf(G));
    tractor();
    ruler(G, open, data);
    if (running && !reduce) requestAnimationFrame(frame);
    else if (anim < 1 || Math.abs(openTarget - open) > 0.002) requestAnimationFrame(frame);
  }

  function kick() { last = 0; requestAnimationFrame(frame); }
  window.Rake = {
    set(d) { from = data; data = d; t0 = performance.now(); anim = from ? 0 : 1; if (!running) kick(); },
    fold(f) { openTarget = f ? 0 : 1; if (!running) kick(); }
  };

  new ResizeObserver(size).observe(cv);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      const was = running; running = visible && !reduce;
      if (running && !was) kick();
    }, { threshold: 0.05 }).observe(cv);
  }
  if (document.fonts) document.fonts.ready.then(() => frame(performance.now()));
})();
