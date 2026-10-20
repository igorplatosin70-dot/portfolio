(function () {
  'use strict';

  /* ---------- Каталог ---------- */
  // art: тип SVG-ілюстрації, bg/fg: кольори (без зовнішніх зображень — працює офлайн)
  const PRODUCTS = [
    { id: 1, name: 'Монстера Деліціоза', cat: 'Рослини', price: 650, pop: 98, art: 'leaf', bg: '#e1efd6', fg: '#2f6b3a', desc: 'Велике різьблене листя, невибаглива.' },
    { id: 2, name: 'Фікус Лірата', cat: 'Рослини', price: 890, pop: 80, art: 'leaf', bg: '#dfeadd', fg: '#3d7a4a', desc: 'Скульптурний силует для світлої кімнати.' },
    { id: 3, name: 'Сансев’єрія', cat: 'Рослини', price: 420, pop: 92, art: 'spike', bg: '#e8efd0', fg: '#4f7a2a', desc: 'Витримає навіть забуті поливи.' },
    { id: 4, name: 'Замійокулькас', cat: 'Рослини', price: 540, pop: 75, art: 'spike', bg: '#dcebe0', fg: '#2a5e45', desc: 'Глянцеве листя, любить напівтінь.' },
    { id: 5, name: 'Горщик «Глина» 18 см', cat: 'Горщики', price: 220, pop: 70, art: 'pot', bg: '#f1e2d3', fg: '#b86b43', desc: 'Тераса, матова поверхня.' },
    { id: 6, name: 'Горщик «Молоко» 22 см', cat: 'Горщики', price: 310, pop: 66, art: 'pot', bg: '#f1f0ea', fg: '#cfcabb', desc: 'Кераміка з підставкою.' },
    { id: 7, name: 'Добриво універсальне', cat: 'Догляд', price: 140, pop: 60, art: 'bottle', bg: '#e6eef6', fg: '#4a78a8', desc: 'Рідке, на 40 поливів.' },
    { id: 8, name: 'Обприскувач 500 мл', cat: 'Догляд', price: 180, pop: 55, art: 'bottle', bg: '#efe8f4', fg: '#7c5aa6', desc: 'Дрібний туман для листя.' },
  ];

  const PROMOS = { DEMO10: 0.10 };
  const FREE_SHIP_FROM = 1000;
  const SHIP_COST = 80;
  const STORAGE_KEY = 'listok-cart-v1';

  const $ = (s, r = document) => r.querySelector(s);
  const money = (n) => `${Math.round(n).toLocaleString('uk-UA')} ₴`;

  /* ---------- Безпечний localStorage ---------- */
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } },
    write(v) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* приватний режим — працюємо без збереження */ } },
  };
  const saved = store.read();
  const state = {
    cart: Array.isArray(saved.cart) ? saved.cart.filter((i) => PRODUCTS.some((p) => p.id === i.id) && i.qty > 0) : [],
    promo: PROMOS[saved.promo] ? saved.promo : null,
    cat: 'Усі', q: '', sort: 'pop',
  };
  const persist = () => store.write({ cart: state.cart, promo: state.promo });

  /* ---------- Ілюстрації ---------- */
  function artSVG(p) {
    const f = p.fg;
    const shapes = {
      leaf: `<path d="M50 88V52" stroke="${f}" stroke-width="4" stroke-linecap="round"/><path d="M50 56C22 52 14 28 24 14c24 0 30 20 26 42z" fill="${f}"/><path d="M50 62c26-2 34-24 26-38-22 2-30 18-26 38z" fill="${f}" opacity=".75"/><rect x="34" y="84" width="32" height="14" rx="4" fill="#b86b43"/>`,
      spike: `<path d="M50 90 38 24M50 90 50 14M50 90 62 24" stroke="${f}" stroke-width="9" stroke-linecap="round"/><rect x="32" y="84" width="36" height="14" rx="4" fill="#cfcabb"/>`,
      pot: `<path d="M24 38h52l-6 52a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill="${f}"/><rect x="20" y="30" width="60" height="12" rx="5" fill="${f}" opacity=".85"/>`,
      bottle: `<rect x="38" y="30" width="24" height="62" rx="8" fill="${f}"/><rect x="43" y="14" width="14" height="18" rx="3" fill="${f}" opacity=".7"/><rect x="42" y="48" width="16" height="22" rx="3" fill="#fff" opacity=".85"/>`,
    };
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${p.name}">${shapes[p.art]}</svg>`;
  }

  /* ---------- Каталог ---------- */
  const grid = $('#grid');
  function visible() {
    const q = state.q.trim().toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (state.cat === 'Усі' || p.cat === state.cat) &&
      (!q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)));
    const sorters = {
      pop: (a, b) => b.pop - a.pop,
      asc: (a, b) => a.price - b.price,
      desc: (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name, 'uk'),
    };
    return list.sort(sorters[state.sort]);
  }
  function renderGrid() {
    const list = visible();
    grid.innerHTML = list.map((p) => `
      <li class="card">
        <div class="art" style="background:${p.bg}">${artSVG(p)}</div>
        <div class="card-body"><small>${p.cat}</small><h3>${p.name}</h3><p>${p.desc}</p>
          <div class="buy"><span class="price">${money(p.price)}</span><button class="add" data-id="${p.id}" type="button">У кошик</button></div></div>
      </li>`).join('');
    $('#empty').hidden = list.length > 0;
    $('#count').textContent = `Знайдено товарів: ${list.length}`;
  }
  function renderCats() {
    const cats = ['Усі', ...new Set(PRODUCTS.map((p) => p.cat))];
    $('#cats').innerHTML = cats.map((c) => `<button class="chip" type="button" aria-pressed="${c === state.cat}" data-cat="${c}">${c}</button>`).join('');
  }

  $('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    state.cat = b.dataset.cat; renderCats(); renderGrid();
  });
  $('#q').addEventListener('input', (e) => { state.q = e.target.value; renderGrid(); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.add'); if (!b) return;
    addToCart(Number(b.dataset.id));
    b.textContent = 'Додано ✓';
    setTimeout(() => { b.textContent = 'У кошик'; }, 1000);
  });

  /* ---------- Кошик ---------- */
  function addToCart(id) {
    const line = state.cart.find((i) => i.id === id);
    if (line) line.qty = Math.min(line.qty + 1, 20); else state.cart.push({ id, qty: 1 });
    $('#done').hidden = true;
    persist(); renderCart();
  }
  function setQty(id, qty) {
    state.cart = state.cart.map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    persist(); renderCart();
  }

  function totals() {
    const sub = state.cart.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.id).price * i.qty, 0);
    const disc = state.promo ? sub * PROMOS[state.promo] : 0;
    const after = sub - disc;
    const ship = state.cart.length === 0 || after >= FREE_SHIP_FROM ? 0 : SHIP_COST;
    return { sub, disc, ship, total: after + ship, after };
  }

  function renderCart() {
    const count = state.cart.reduce((s, i) => s + i.qty, 0);
    $('#cart-count').textContent = count;
    $('#cart-list').innerHTML = state.cart.map((i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return `<li class="cart-item"><div class="art" style="background:${p.bg}">${artSVG(p)}</div>
        <div><b>${p.name}</b><small>${money(p.price)} × ${i.qty}</small>
          <div class="qty"><button type="button" data-act="dec" data-id="${p.id}" aria-label="Менше">−</button><span aria-live="polite">${i.qty}</span><button type="button" data-act="inc" data-id="${p.id}" aria-label="Більше">+</button></div></div>
        <div><b>${money(p.price * i.qty)}</b><br><button class="rm" type="button" data-act="rm" data-id="${p.id}">Видалити</button></div></li>`;
    }).join('');
    const empty = state.cart.length === 0;
    $('#cart-empty').hidden = !empty;
    $('#cart-foot').hidden = empty;
    const t = totals();
    $('#sum-sub').textContent = money(t.sub);
    $('#sum-disc-row').hidden = !state.promo;
    $('#sum-disc').textContent = `−${money(t.disc)}`;
    $('#sum-ship').textContent = t.ship ? money(t.ship) : 'Безкоштовно';
    $('#sum-total').textContent = money(t.total);
    $('#ship-note').textContent = t.after >= FREE_SHIP_FROM
      ? 'Безкоштовна доставка застосована.'
      : `Ще ${money(FREE_SHIP_FROM - t.after)} до безкоштовної доставки.`;
    if (state.promo) { setPromoMsg(`Промокод ${state.promo} застосовано: −${PROMOS[state.promo] * 100}%`, 'ok'); }
  }

  $('#cart-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = Number(b.dataset.id);
    const line = state.cart.find((i) => i.id === id);
    if (b.dataset.act === 'inc') setQty(id, Math.min(line.qty + 1, 20));
    if (b.dataset.act === 'dec') setQty(id, line.qty - 1);
    if (b.dataset.act === 'rm') setQty(id, 0);
  });

  /* ---------- Промокод ---------- */
  function setPromoMsg(text, kind) {
    const m = $('#promo-msg'); m.textContent = text; m.className = `promo-msg ${kind || ''}`;
  }
  $('#promo').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('#promo-in').value.trim().toUpperCase();
    if (!code) { setPromoMsg('Введіть промокод.', 'bad'); return; }
    if (!PROMOS[code]) { setPromoMsg('Такого промокоду не існує.', 'bad'); return; }
    state.promo = code; persist(); renderCart();
  });

  /* ---------- Оформлення (тестове) ---------- */
  $('#checkout').addEventListener('click', () => {
    const t = totals();
    const num = Math.floor(100000 + Math.random() * 900000);
    state.cart = []; state.promo = null; persist(); renderCart();
    setPromoMsg('');
    const done = $('#done');
    done.textContent = `Дякуємо! Тестове замовлення №${num} на ${money(t.total)} прийнято. Реальна оплата в демо не підключена.`;
    done.hidden = false;
    $('#cart-foot').hidden = false;
    $('#checkout').hidden = true;
    setTimeout(() => { $('#checkout').hidden = false; $('#cart-foot').hidden = state.cart.length === 0; }, 4000);
  });

  /* ---------- Панель кошика ---------- */
  const drawer = $('#drawer'), overlay = $('#overlay'), openBtn = $('#cart-open');
  function openDrawer() { drawer.hidden = false; overlay.hidden = false; $('#cart-close').focus(); }
  function closeDrawer() { drawer.hidden = true; overlay.hidden = true; openBtn.focus(); }
  openBtn.addEventListener('click', openDrawer);
  $('#cart-close').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

  renderCats(); renderGrid(); renderCart();
})();
