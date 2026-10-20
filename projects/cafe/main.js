(function () {
  'use strict';

  /* ---------- Дані меню ---------- */
  const ph = (id, w = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
  const MENU = {
    'Кава': [
      { name: 'Еспресо', desc: 'Класичний шот, свіжий помел', price: 55 },
      { name: 'Американо', desc: 'Еспресо з гарячою водою', price: 65 },
      { name: 'Капучино', desc: 'Еспресо, молоко, щільна пінка', price: 85 },
      { name: 'Лате', desc: 'Багато молока, м’який смак', price: 95 },
      { name: 'Флет вайт', desc: 'Подвійний еспресо, оксамитове молоко', price: 95 },
      { name: 'Раф ванільний', desc: 'Вершки, ванільний цукор, еспресо', price: 110 },
      { name: 'Фільтр дня', desc: 'Ефіопія · цитрус · жасмин', price: 85 },
      { name: 'Еспресо тонік', desc: 'Освіжаюче поєднання для спеки', price: 90 },
      { name: 'Айс лате', desc: 'Лід, молоко, подвійний еспресо', price: 105 },
      { name: 'Какао з маршмелоу', desc: 'Бельгійський шоколад', price: 100 },
    ],
    'Чай': [
      { name: 'Матча лате', desc: 'Церемоніальна матча, овсяне молоко', price: 110 },
      { name: 'Карпатський збір', desc: 'Чабрець, м’ята, звіробій', price: 70 },
      { name: 'Чорний з бергамотом', desc: 'Класичний ерл грей', price: 65 },
      { name: 'Зелений сенча', desc: 'Легкий трав’яний смак', price: 65 },
      { name: 'Імбирний з лимоном', desc: 'Імбир, лимон, мед', price: 80 },
      { name: 'Чай з обліпихи', desc: 'Обліпиха, апельсин, мед', price: 90 },
    ],
    'Сніданки': [
      { name: 'Авокадо-тост', desc: 'Цільнозерновий хліб, авокадо, яйце пашот', price: 170 },
      { name: 'Яйця бенедикт', desc: 'Булочка, шинка, соус холандез', price: 190 },
      { name: 'Сирники з ягодами', desc: 'Домашні, зі сметаною та джемом', price: 140 },
      { name: 'Гранола з йогуртом', desc: 'Натуральний йогурт, мед, сезонні ягоди', price: 120 },
      { name: 'Вівсянка з грушею', desc: 'На молоці, з корицею та горіхами', price: 105 },
    ],
    'Випічка': [
      { name: 'Ранкова булочка', desc: 'Масло · кориця · цедра', price: 75 },
      { name: 'Круасан мигдальний', desc: 'Свіжий, щоранку з 6:00', price: 85 },
      { name: 'Синабон', desc: 'Тепла булочка з вершковою глазур’ю', price: 95 },
      { name: 'Круасан із шинкою та сиром', desc: 'Тепла солона випічка', price: 110 },
    ],
    'Десерти': [
      { name: 'Чізкейк сезонний', desc: 'Залежить від ягід на ринку', price: 130 },
      { name: 'Тірамісу', desc: 'Маскарпоне, савоярді, еспресо', price: 140 },
      { name: 'Брауні', desc: 'Шоколад, волоський горіх', price: 90 },
      { name: 'Медовик', desc: 'Домашній, зі сметанним кремом', price: 110 },
      { name: 'Панакота', desc: 'Ванільна, з ягідним соусом', price: 120 },
    ],
  };

  /* ---------- Ілюстрації страв (SVG: працюють без зовнішніх зображень) ---------- */
  const W = '#fffaf2';
  const ART = {
    cup: (liq, foam) => `<ellipse cx="60" cy="80" rx="40" ry="5" fill="#2b1d1422"/><path d="M26 36h56v16a28 28 0 0 1-28 28 28 28 0 0 1-28-28z" fill="${W}"/><path d="M82 42h6a9 9 0 0 1 0 18h-8" fill="none" stroke="${W}" stroke-width="5"/><ellipse cx="54" cy="36" rx="28" ry="6" fill="${liq}"/>${foam ? `<ellipse cx="54" cy="36" rx="19" ry="3.5" fill="${foam}"/>` : ''}<path d="M44 18c-5-6 5-9 0-15M56 18c-5-6 5-9 0-15M68 18c-5-6 5-9 0-15" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`,
    iced: () => `<ellipse cx="60" cy="82" rx="30" ry="4" fill="#2b1d1422"/><path d="M38 14h44l-5 62a6 6 0 0 1-6 5H49a6 6 0 0 1-6-5z" fill="#ffffff66" stroke="${W}" stroke-width="2"/><path d="M41 38h38l-3.4 38a4 4 0 0 1-4 3.6H48.4a4 4 0 0 1-4-3.6z" fill="#8a5a3a"/><path d="M41 38h38l-.8 9H41.8z" fill="#f1dcc0"/><rect x="46" y="28" width="14" height="14" rx="3" fill="#fff" opacity=".85" transform="rotate(-12 53 35)"/><rect x="62" y="34" width="13" height="13" rx="3" fill="#fff" opacity=".75" transform="rotate(14 68 40)"/><path d="M72 4 66 40" stroke="#c8f169" stroke-width="4" stroke-linecap="round"/>`,
    tea: (liq) => `<ellipse cx="60" cy="80" rx="38" ry="5" fill="#2b1d1422"/><path d="M30 38h52a2 2 0 0 1 2 2v8a26 26 0 0 1-26 26h-2a26 26 0 0 1-26-26v-8a2 2 0 0 1 2-2z" fill="${W}"/><path d="M84 44h5a8 8 0 0 1 0 16h-8" fill="none" stroke="${W}" stroke-width="5"/><ellipse cx="56" cy="39" rx="25" ry="4" fill="${liq}"/><path d="M56 39 70 14" stroke="#9a8a78" stroke-width="1.5"/><rect x="66" y="8" width="12" height="9" rx="1.5" fill="#c8f169" transform="rotate(25 72 12)"/>`,
    cocoa: () => ART.cup('#5b3522', null).replace('</svg>', '') + `<circle cx="44" cy="35" r="5" fill="#fff"/><circle cx="56" cy="33" r="5" fill="#ffe6ef"/><circle cx="66" cy="36" r="4.5" fill="#fff"/>`,
    bowl: (c) => `<ellipse cx="60" cy="80" rx="40" ry="5" fill="#2b1d1422"/><path d="M18 42h84a42 36 0 0 1-84 0z" fill="${W}"/><path d="M24 42c4-14 20-20 36-20s32 6 36 20z" fill="${c}"/><circle cx="46" cy="32" r="4" fill="#c0392b"/><circle cx="62" cy="28" r="4" fill="#5b3b8a"/><circle cx="76" cy="34" r="4" fill="#c0392b"/><circle cx="54" cy="36" r="3" fill="#e9b44c"/>`,
    toast: () => `<ellipse cx="60" cy="82" rx="38" ry="4" fill="#2b1d1422"/><path d="M26 30a18 14 0 0 1 36-8 18 14 0 0 1 32 8c4 6 0 12-2 14l-3 34H31l-3-34c-2-2-6-8-2-14z" fill="#e3b574"/><path d="M33 34c10-8 40-8 54 0l-2 36H35z" fill="#9bbf5c"/><circle cx="60" cy="48" r="13" fill="#fff"/><circle cx="60" cy="48" r="7" fill="#f2b84b"/>`,
    eggs: () => `<ellipse cx="60" cy="80" rx="46" ry="5" fill="#2b1d1422"/><circle cx="60" cy="48" r="38" fill="${W}"/><path d="M36 50c-4-14 12-22 22-16 14-2 24 12 14 22-8 8-24 8-36-6z" fill="#fff" stroke="#eadfcf"/><circle cx="52" cy="46" r="8" fill="#f2b84b"/><circle cx="72" cy="52" r="7" fill="#f2a53b"/><path d="M30 66c10 6 20 6 28 2" stroke="#c0392b" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    pancakes: () => `<ellipse cx="60" cy="80" rx="42" ry="5" fill="#2b1d1422"/><ellipse cx="60" cy="64" rx="34" ry="10" fill="#d9a05b"/><ellipse cx="60" cy="54" rx="34" ry="10" fill="#e6b36d"/><ellipse cx="60" cy="44" rx="34" ry="10" fill="#efc17f"/><ellipse cx="60" cy="38" rx="20" ry="5" fill="#fff"/><circle cx="52" cy="32" r="5" fill="#c0392b"/><circle cx="66" cy="31" r="5" fill="#8a2a5b"/><circle cx="60" cy="27" r="4" fill="#c0392b"/>`,
    croissant: (c) => `<ellipse cx="60" cy="78" rx="42" ry="5" fill="#2b1d1422"/><path d="M12 62c4-26 26-42 48-42s44 16 48 42c-8 4-14 2-18-4-6 8-18 10-30 10S36 66 30 58c-4 6-10 8-18 4z" fill="${c}"/><path d="M42 26c-2 12 0 24 6 36M60 22c0 14 0 28 0 42M78 26c2 12 0 24-6 36" stroke="#00000026" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    bun: (c) => `<ellipse cx="60" cy="80" rx="38" ry="5" fill="#2b1d1422"/><circle cx="60" cy="48" r="32" fill="${c}"/><path d="M60 48m-4 0a4 4 0 0 1 8 0 10 10 0 0 1-18 0 16 16 0 0 1 32 0 22 22 0 0 1-44 0" fill="none" stroke="#fffaf2" stroke-width="4" stroke-linecap="round" opacity=".9"/>`,
    cake: (c, top) => `<ellipse cx="60" cy="80" rx="44" ry="5" fill="#2b1d1422"/><path d="M14 66V40L96 26v40a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="${c}"/><path d="M14 40 96 26v8L14 48z" fill="${top}"/><path d="M14 54 96 42" stroke="#fff" stroke-width="3" opacity=".7"/><circle cx="82" cy="20" r="6" fill="#c0392b"/>`,
    brownie: () => `<ellipse cx="60" cy="80" rx="40" ry="5" fill="#2b1d1422"/><path d="M22 40 82 30l16 14v28L38 82 22 68z" fill="#4a2a1c"/><path d="M22 40 82 30l16 14-60 10z" fill="#6b3f28"/><circle cx="52" cy="40" r="4" fill="#c99a62"/><circle cx="72" cy="38" r="3.5" fill="#c99a62"/><circle cx="62" cy="46" r="3" fill="#d9ad76"/>`,
  };
  function artFor(i) {
    const n = i.name.toLowerCase();
    if (/тонік|айс/.test(n)) return ART.iced();
    if (/какао/.test(n)) return ART.cocoa();
    if (/матча/.test(n)) return ART.tea('#8fb55a');
    if (/еспресо|американо|фільтр/.test(n)) return ART.cup('#2b1608', null);
    if (/капучино|флет|раф|лате/.test(n)) return ART.cup('#b98a5e', '#f6e8d4');
    if (/чай|сенча|збір|бергамот|імбир|обліпих/.test(n)) return ART.tea(/обліпих/.test(n) ? '#f2a53b' : /сенча/.test(n) ? '#b5c860' : '#b9772f');
    if (/авокадо/.test(n)) return ART.toast();
    if (/бенедикт/.test(n)) return ART.eggs();
    if (/сирник/.test(n)) return ART.pancakes();
    if (/гранола|вівсян/.test(n)) return ART.bowl(/вівсян/.test(n) ? '#e3cfa8' : '#d9a05b');
    if (/із шинкою/.test(n)) return ART.croissant('#d89a52');
    if (/круасан/.test(n)) return ART.croissant('#e6b36d');
    if (/булочка|синабон/.test(n)) return ART.bun(/синабон/.test(n) ? '#d8a06a' : '#e3b574');
    if (/брауні/.test(n)) return ART.brownie();
    if (/тірамісу/.test(n)) return ART.cake('#f1e0c4', '#6b3f28');
    if (/медовик/.test(n)) return ART.cake('#e2b06a', '#f6e8d4');
    if (/панакота/.test(n)) return ART.cake('#fbf3ea', '#c0392b');
    return ART.cake('#f6e8d4', '#e9b44c'); // чізкейк
  }

  /* Години роботи: 0 = неділя … 6 = субота */
  const HOURS = { weekday: [8, 20], weekend: [9, 21] };
  const hoursFor = (day) => (day === 0 || day === 6 ? HOURS.weekend : HOURS.weekday);

  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- Мобільне меню ---------- */
  const burger = $('.burger');
  const nav = $('#menu-nav');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      burger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }
  });

  /* ---------- Статус «відкрито / зачинено» ---------- */
  function renderStatus() {
    const now = new Date();
    const [from, to] = hoursFor(now.getDay());
    const hour = now.getHours() + now.getMinutes() / 60;
    const isOpen = hour >= from && hour < to;
    const box = $('#open-status');
    box.classList.toggle('open', isOpen);
    box.classList.toggle('closed', !isOpen);
    $('.status-text', box).textContent = isOpen
      ? `Зараз відкрито · до ${String(to).padStart(2, '0')}:00`
      : `Зараз зачинено · відкриємось о ${String(from).padStart(2, '0')}:00`;
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* ---------- Меню з вкладками ---------- */
  const tabs = $('.tabs');
  const list = $('#menu-list');
  let activeTab = Object.keys(MENU)[0];

  function renderTabs() {
    tabs.innerHTML = '';
    Object.keys(MENU).forEach((cat) => {
      const b = document.createElement('button');
      b.className = 'tab';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(cat === activeTab));
      b.textContent = cat;
      b.addEventListener('click', () => { activeTab = cat; renderTabs(); renderMenu(); });
      tabs.appendChild(b);
    });
  }
  function renderMenu() {
    list.innerHTML = MENU[activeTab]
      .map((i) => `<li class="menu-item"><div class="food" data-cat="${activeTab}"><svg viewBox="0 0 120 90" role="img" aria-label="${i.name}">${artFor(i)}</svg></div><div class="menu-body"><div class="top-line"><span>${i.name}</span><span class="price">${i.price} ₴</span></div><p>${i.desc}</p></div></li>`)
      .join('');
  }
  renderTabs();
  renderMenu();

  /* ---------- Форма бронювання ---------- */
  const form = $('#booking');
  const dateInput = $('#b-date');
  const timeSelect = $('#b-time');
  const result = $('#book-result');

  const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = toISO(new Date());
  dateInput.value = toISO(new Date());

  function fillTimes() {
    const date = dateInput.value ? new Date(dateInput.value + 'T00:00') : new Date();
    const [from, to] = hoursFor(date.getDay());
    const options = [];
    for (let h = from; h < to; h++) {
      options.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
    }
    timeSelect.innerHTML = '<option value="">Оберіть час</option>' + options.map((t) => `<option>${t}</option>`).join('');
  }
  fillTimes();
  dateInput.addEventListener('change', fillTimes);

  function setError(name, message) {
    const field = form.elements[name].closest('.field');
    field.classList.toggle('invalid', Boolean(message));
    $(`.err[data-for="${name}"]`, form).textContent = message || '';
  }

  function validate() {
    const data = Object.fromEntries(new FormData(form));
    const errors = {};
    if (data.name.trim().length < 2) errors.name = 'Вкажіть ім’я (мінімум 2 символи).';
    if (data.phone.replace(/\D/g, '').length < 9) errors.phone = 'Вкажіть коректний номер телефону.';
    if (!data.date) errors.date = 'Оберіть дату.';
    else if (data.date < toISO(new Date())) errors.date = 'Дата не може бути в минулому.';
    if (!data.time) errors.time = 'Оберіть час.';
    ['name', 'phone', 'date', 'time'].forEach((f) => setError(f, errors[f]));
    return { ok: Object.keys(errors).length === 0, data, firstError: Object.keys(errors)[0] };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    result.hidden = true;
    const { ok, data, firstError } = validate();
    if (!ok) { form.elements[firstError].focus(); return; }
    const dateText = new Date(data.date + 'T00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
    result.textContent = `Дякуємо, ${data.name.trim()}! Столик на ${data.guests} ос. — ${dateText} о ${data.time}. Ми зателефонуємо для підтвердження.`;
    result.hidden = false;
    form.reset();
    dateInput.value = toISO(new Date());
    fillTimes();
  });
})();
