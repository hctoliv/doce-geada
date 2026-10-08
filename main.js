(() => {
  // WhatsApp da Doce Geada (link da bio: beacons.ai/docegeada)
  const WA_NUMBER = '5511948422035';
  const wa = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduce;

  /* ================= sabores (cardápio do iFood da loja) ================= */
  const LINES = { trufados: 'Trufados & Irresistíveis', cremosa: 'Linha Cremosa', frutas: 'Frutas & Refrescantes' };
  const FLAVORS = [
    { id: 'morango-do-amor', name: 'Morango do Amor', line: 'trufados', tag: 'Edição limitada', w: 900, h: 675,
      desc: 'Ninho com morango. A cremosidade do Ninho com pedacinhos da fruta em cada mordida.' },
    { id: 'ninho-trufado', name: 'Ninho Trufado', line: 'trufados', tag: 'Campeão', w: 759, h: 569,
      desc: 'Creme de leite Ninho com gotas de chocolate e uma camada generosa de Nutella.' },
    { id: 'laka-oreo', name: 'Laka Oreo', line: 'trufados', tag: 'Campeão', w: 894, h: 671,
      desc: 'Base de Ninho com Oreo e cobertura de chocolate branco Laka com Oreo.' },
    { id: 'ferrero', name: 'Ferrero Rocher', line: 'trufados', w: 900, h: 675,
      desc: 'Chocolate ao leite com pedaços de avelã e camada generosa de Nutella.' },
    { id: 'pudim', name: 'Pudim', line: 'cremosa', w: 900, h: 675,
      desc: 'O clássico pudim em versão geladinha, envolvido numa calda de caramelo.' },
    { id: 'cocada', name: 'Cocada Cremosa', line: 'cremosa', w: 900, h: 675,
      desc: 'Coco natural e ralado na base, recheio de creme de coco que derrete na boca.' },
    { id: 'limao', name: 'Tortinha de Limão', line: 'frutas', w: 900, h: 675,
      desc: 'Cremoso e refrescante, com sabor marcante de limão e pedacinhos de biscoito.' },
    { id: 'maracuja', name: 'Mousse de Maracujá', line: 'frutas', w: 900, h: 675,
      desc: 'Leve, refrescante e perfeito pra adoçar o seu dia.' },
    { id: 'mousse-morango', name: 'Mousse de Morango', line: 'frutas', w: 900, h: 675,
      desc: 'Mousse aveludado com morangos frescos, pedaços da fruta e geleia artesanal.' },
    { id: 'abacaxi', name: 'Delícia de Abacaxi', line: 'frutas', w: 900, h: 675,
      desc: 'Abacaxi suculento com geleia artesanal e pedaços da fruta.' }
  ];
  const byId = Object.fromEntries(FLAVORS.map(f => [f.id, f]));

  /* ================= estado da caixa ================= */
  const KEY = 'docegeada-caixa';
  let box = {};
  try { box = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { box = {}; }
  Object.keys(box).forEach(k => { if (!byId[k] || !(box[k] > 0)) delete box[k]; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(box)); } catch (e) {} };
  const total = () => Object.values(box).reduce((a, b) => a + b, 0);

  /* ================= cardápio ================= */
  const grid = $('[data-grid]');
  grid.innerHTML = FLAVORS.map(f => `
    <article class="card" data-reveal data-card="${f.id}" data-line="${f.line}">
      <div class="card__img">
        <img src="img/${f.id}.webp" alt="Geladinho ${f.name}" width="${f.w}" height="${f.h}" loading="lazy">
        ${f.tag ? `<span class="tag${f.id === 'morango-do-amor' ? ' tag--berry' : ''}">${f.tag}</span>` : ''}
      </div>
      <div class="card__body">
        <h3>${f.name}</h3>
        <p>${f.desc}</p>
        <div class="card__foot">
          <span class="card__line">${LINES[f.line]}</span>
          <div class="qty">
            <button type="button" data-dec="${f.id}" aria-label="Tirar um ${f.name}"><svg><use href="#minus"/></svg></button>
            <output data-q="${f.id}">0</output>
            <button type="button" data-inc="${f.id}" aria-label="Adicionar um ${f.name}"><svg><use href="#plus"/></svg></button>
          </div>
        </div>
      </div>
    </article>`).join('');

  // filtro por linha
  $$('[data-tabs] button').forEach(b => b.addEventListener('click', () => {
    $$('[data-tabs] button').forEach(x => x.setAttribute('aria-selected', x === b));
    const line = b.dataset.line;
    $$('[data-card]').forEach(c => c.classList.toggle('is-hidden', line !== 'all' && c.dataset.line !== line));
    if (hasGsap) ScrollTrigger.refresh();
  }));

  /* ================= caixa ================= */
  const tray = $('[data-tray]');
  const list = $('[data-box-list]');
  const hint = $('[data-box-hint]');
  const fab = $('[data-fab]');
  const fabBadge = $('[data-fab-badge]');
  const fabLabel = $('[data-fab-label]');
  const toastEl = $('[data-toast]');
  const HINT = hint.innerHTML;
  let toastT;

  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  };
  const bump = el => { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); };

  const render = () => {
    const n = total();
    $('[data-box-total]').textContent = n;

    // bandeja com 10 lugares
    const items = Object.entries(box).flatMap(([id, q]) => Array(q).fill(id));
    const SLOTS = 10;
    const shown = items.length > SLOTS ? items.slice(0, SLOTS - 1) : items;
    let html = '';
    for (let i = 0; i < SLOTS; i++) {
      if (items.length > SLOTS && i === SLOTS - 1) html += `<span class="slot slot--more">+${items.length - (SLOTS - 1)}</span>`;
      else html += `<span class="slot">${shown[i] ? `<img src="img/${shown[i]}.webp" alt="">` : ''}</span>`;
    }
    tray.innerHTML = html;

    list.innerHTML = n
      ? Object.entries(box).map(([id, q]) => `<li><span>${byId[id].name}</span><b>${q}x</b></li>`).join('')
      : '<li class="box__empty">Ainda vazia. Escolhe um sabor ali no cardápio.</li>';

    if (n >= 6) {
      hint.classList.add('is-hot');
      hint.innerHTML = `Com <b>${n} geladinhos</b> já dá pra pedir combo. A gente confirma o melhor preço no zap.`;
    } else {
      hint.classList.remove('is-hot');
      hint.innerHTML = n ? `Faltam <b>${6 - n}</b> pra chegar na quantidade de combo. ${HINT}` : HINT;
    }

    FLAVORS.forEach(f => {
      const q = box[f.id] || 0;
      const out = $(`[data-q="${f.id}"]`);
      if (out) out.textContent = q;
      const dec = $(`[data-dec="${f.id}"]`);
      if (dec) dec.disabled = !q;
      const card = $(`[data-card="${f.id}"]`);
      if (card) card.classList.toggle('is-picked', q > 0);
    });

    fabBadge.hidden = !n;
    fabBadge.textContent = n;
    fabLabel.textContent = n ? 'Ver caixa' : 'Pedir';
    save();
  };

  const add = (id, d) => {
    box[id] = Math.max(0, (box[id] || 0) + d);
    if (!box[id]) delete box[id];
    render();
    if (d > 0) { bump(fab); toast(`${byId[id].name} na caixa ✦`); }
  };

  document.addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const quick = e.target.closest('[data-add]');
    if (inc) add(inc.dataset.inc, 1);
    if (dec) add(dec.dataset.dec, -1);
    if (quick) { add(quick.dataset.add, 1); bump(quick); }
  });

  $('[data-box-form]').addEventListener('submit', e => {
    e.preventDefault();
    const n = total();
    if (!n) {
      const b = $('[data-box]');
      b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
      toast('Escolhe pelo menos um sabor');
      return;
    }
    const fd = new FormData(e.target);
    const nome = (fd.get('nome') || '').trim();
    const bairro = (fd.get('bairro') || '').trim();
    const lines = [
      `Oi, Doce Geada!${nome ? ` Aqui é ${nome}.` : ''} Montei minha caixa pelo site:`,
      '',
      ...Object.entries(box).map(([id, q]) => `• ${q}x ${byId[id].name}`),
      '',
      `Total: ${n} geladinho${n > 1 ? 's' : ''}`
    ];
    if (n >= 6) lines.push('Tem combo pra essa quantidade?');
    if (bairro) lines.push(`Bairro: ${bairro}`);
    window.open(wa(lines.join('\n')), '_blank', 'noopener');
  });

  /* ================= festa ================= */
  $('[data-party-form]').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = fd.get('data');
    const dataBR = data ? data.split('-').reverse().join('/') : '';
    const qtd = (fd.get('qtd') || '').trim();
    const lines = [
      'Oi, Doce Geada! Quero fazer uma encomenda pra festa.',
      '',
      `Tipo: ${fd.get('tipo')}`,
      dataBR ? `Data: ${dataBR}` : 'Data: ainda vou definir',
      qtd ? `Quantidade: uns ${qtd} geladinhos` : 'Quantidade: queria uma ajuda pra calcular',
      '',
      'Pode me passar os sabores e o orçamento?'
    ];
    window.open(wa(lines.join('\n')), '_blank', 'noopener');
  });

  // links simples com mensagem pronta
  $$('[data-wa-link]').forEach(a => { a.href = wa(a.dataset.waLink); });
  $('[data-year]').textContent = new Date().getFullYear();

  render();

  /* ================= brilhos de geada ================= */
  const sp = $('[data-sparkles]');
  if (!reduce) {
    const N = innerWidth < 700 ? 10 : 18;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('i');
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--s:${8 + Math.random() * 14}px;--t:${3 + Math.random() * 4}s;--d:${-Math.random() * 6}s`;
      s.innerHTML = '<svg><use href="#spark"/></svg>';
      sp.append(s);
    }
  }

  /* ================= revelar / vídeos ================= */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * .08}s`; io.observe(el); });

  const vio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !reduce) e.target.play().catch(() => {}); else e.target.pause();
  }), { threshold: .15 });
  $$('[data-autoplay]').forEach(v => vio.observe(v));

  /* ================= navegação ================= */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = y => {
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    fab.classList.toggle('is-on', y > innerHeight * .7);
    lastY = y;
  };
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* ================= abertura ================= */
  const loader = $('.loader');
  const count = $('[data-count]');
  const t0 = performance.now();
  const MIN = reduce ? 0 : 1500;
  let loaded = false;
  addEventListener('load', () => { loaded = true; });
  setTimeout(() => { loaded = true; }, 4500);

  const tick = now => {
    const p = Math.min(1, (now - t0) / MIN);
    const shown = loaded ? p : Math.min(p, .9);
    count.textContent = Math.round(shown * 100);
    if (shown >= 1) return finish();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  function finish() {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.remove(), 1300);
    intro();
  }

  /* ================= movimento ================= */
  let lenis;
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: .1 });
      lenis.on('scroll', e => { ScrollTrigger.update(); onScroll(e.scroll); });
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
  }

  // âncoras suaves
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id.length > 1 && $(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  function intro() {
    if (!motion) return;
    if (lenis) lenis.start();

    const tl = gsap.timeline({ delay: .45, defaults: { ease: 'expo.out' } });
    tl.from('.hero__h1 .line > span', { yPercent: 110, duration: 1.2, stagger: .1 })
      .from('.hero .eyebrow, .hero__lead, .hero__ctas', { y: 30, opacity: 0, duration: 1, stagger: .08 }, '-=.9')
      .from('.hero__giant span', { yPercent: 60, opacity: 0, duration: 1.4, stagger: .07 }, 0)
      .from('.pop--c', { yPercent: 70, rotate: 6, duration: 1.5 }, .1)
      .from('.pop--l', { yPercent: 90, rotate: -14, duration: 1.5 }, .25)
      .from('.pop--r', { yPercent: 90, rotate: 14, duration: 1.5 }, .35)
      .from('.stamp', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.7)' }, .7);
  }

  if (motion) {
    // hero: geladinhos sobem em velocidades diferentes, letras se abrem
    const hero = $('[data-hero]');
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    // descem de volta pra borda (o corte da mão nunca aparece)
    gsap.to('.pop--c', { yPercent: 14, ease: 'none', scrollTrigger: st });
    gsap.to('.pop--l', { yPercent: 30, rotate: -10, ease: 'none', scrollTrigger: st });
    gsap.to('.pop--r', { yPercent: 24, rotate: 10, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__giant span', { y: (i) => -40 - i * 30, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__copy', { yPercent: -20, opacity: .2, ease: 'none', scrollTrigger: st });

    // mouse mexe os geladinhos
    if (fine) {
      const pops = $$('.pop').map(el => ({ el, d: +el.dataset.depth, x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3' }), r: gsap.quickTo(el, 'rotationY', { duration: .9, ease: 'power3' }) }));
      hero.addEventListener('pointermove', e => {
        const nx = e.clientX / innerWidth - .5;
        pops.forEach(p => { p.x(nx * 40 * p.d); p.r(nx * 10 * p.d); });
      });
    }

    // faixa infinita que acelera com a rolagem
    $$('[data-marquee]').forEach(row => {
      const span = row.firstElementChild;
      row.append(span.cloneNode(true), span.cloneNode(true));
      const dir = +row.dataset.marquee;
      const w = span.offsetWidth;
      const xf = gsap.utils.wrap(-w, 0);
      let x = dir > 0 ? -w : 0, boost = 0;
      gsap.ticker.add(() => {
        x += dir * (0.6 + boost);
        boost *= .92;
        gsap.set(row, { x: xf(x) });
      });
      ScrollTrigger.create({ onUpdate: s => { boost = Math.min(8, Math.abs(s.getVelocity()) / 300); } });
    });

    // mordida: rolagem horizontal presa (desktop)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const track = $('[data-bite-track]');
      const num = $('[data-bite-n]');
      const cards = $$('.bcard', track);
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '[data-bite]', pin: '.bite__pin', start: 'top top',
          end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true,
          onUpdate: s => { num.textContent = String(Math.min(cards.length, 1 + Math.round(s.progress * (cards.length - 1)))).padStart(2, '0'); }
        }
      });
      cards.forEach(c => {
        gsap.fromTo($('img', c), { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });

    // por que: pílula do vídeo cresce
    gsap.from('.why__pill', { scale: .82, rotate: -4, ease: 'none', scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'top 30%', scrub: true } });

    // festa: geladinhos flutuam
    $$('[data-float]').forEach((el, i) => {
      gsap.to(el, { y: i ? 18 : -18, rotation: i ? -3 : 3, duration: 3 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    gsap.from('.party__pops figure', { yPercent: 40, opacity: 0, stagger: .15, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.party', start: 'top 70%' } });

    // chamada final: o círculo do pudim abre e toma a tela
    const final = $('[data-final]');
    const mask = $('[data-final-mask]');
    const small = () => innerWidth < 901 ? 'circle(22% at 50% 26%)' : 'circle(14% at 74% 50%)';
    gsap.fromTo(mask, { clipPath: small }, {
      clipPath: 'circle(150% at 50% 50%)', ease: 'none',
      scrollTrigger: {
        trigger: final, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
        onUpdate: s => {
          mask.style.setProperty('--shade', Math.min(1, Math.max(0, (s.progress - .35) * 2.5)));
          final.classList.toggle('is-dark', s.progress > .55);
        }
      }
    });

    // botões magnéticos
    if (fine) $$('[data-magnetic]').forEach(b => {
      const x = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' });
      const y = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .25);
        y((e.clientY - r.top - r.height / 2) * .35);
      });
      b.addEventListener('pointerleave', () => { x(0); y(0); });
    });

    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    // sem animação: chamada final já aberta
    const final = $('[data-final]');
    final.style.height = 'auto';
    $('.final__stage').style.position = 'relative';
    $('[data-final-mask]').style.clipPath = 'none';
    $('[data-final-mask]').style.setProperty('--shade', 1);
    final.classList.add('is-dark');
  }
})();
