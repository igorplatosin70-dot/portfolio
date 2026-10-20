(function () {
  'use strict';

  const CREDENTIALS = { email: 'demo@portfolio.dev', pass: 'demo1234' };
  const SESSION_KEY = 'orderly-session';
  const STATUS_KEY = 'orderly-statuses';
  const STATUSES = ['Нове', 'В обробці', 'Відправлено', 'Скасовано'];
  const PAGE_SIZE = 8;

  const $ = (s, r = document) => r.querySelector(s);
  const money = (n) => `${Math.round(n).toLocaleString('uk-UA')} ₴`;
  const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* без збереження */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ігноруємо */ } },
  };

  /* ---------- Дані (детермінована генерація, щоб демо завжди виглядало однаково) ---------- */
  const NAMES = ['Олена Коваль', 'Андрій Мельник', 'Ірина Шевчук', 'Дмитро Бойко', 'Марія Ткачук', 'Віктор Кравець', 'Софія Литвин', 'Олег Гнатюк', 'Наталія Попович', 'Роман Савчук'];
  const PRODUCTS = [
    { name: 'Монстера', art: 'leaf', bg: '#e1efd6', fg: '#2f6b3a' },
    { name: 'Сансев’єрія', art: 'spike', bg: '#e8efd0', fg: '#4f7a2a' },
    { name: 'Горщик «Глина»', art: 'pot', bg: '#f1e2d3', fg: '#b86b43' },
    { name: 'Добриво', art: 'bottle', bg: '#e6eef6', fg: '#4a78a8' },
    { name: 'Фікус Лірата', art: 'leaf', bg: '#dfeadd', fg: '#3d7a4a' },
    { name: 'Обприскувач', art: 'bottle', bg: '#efe8f4', fg: '#7c5aa6' },
  ];
  function thumb(p) {
    const f = p.fg;
    const shapes = {
      leaf: `<path d="M50 88V52" stroke="${f}" stroke-width="4" stroke-linecap="round"/><path d="M50 56C22 52 14 28 24 14c24 0 30 20 26 42z" fill="${f}"/><path d="M50 62c26-2 34-24 26-38-22 2-30 18-26 38z" fill="${f}" opacity=".75"/><rect x="34" y="84" width="32" height="14" rx="4" fill="#b86b43"/>`,
      spike: `<path d="M50 90 38 24M50 90 50 14M50 90 62 24" stroke="${f}" stroke-width="9" stroke-linecap="round"/><rect x="32" y="84" width="36" height="14" rx="4" fill="#cfcabb"/>`,
      pot: `<path d="M24 38h52l-6 52a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill="${f}"/><rect x="20" y="30" width="60" height="12" rx="5" fill="${f}" opacity=".85"/>`,
      bottle: `<rect x="38" y="30" width="24" height="62" rx="8" fill="${f}"/><rect x="43" y="14" width="14" height="18" rx="3" fill="${f}" opacity=".7"/><rect x="42" y="48" width="16" height="22" rx="3" fill="#fff" opacity=".85"/>`,
    };
    return `<span class="thumb" style="background:${p.bg}"><svg viewBox="0 0 100 100" aria-hidden="true">${shapes[p.art]}</svg></span>`;
  }

  function buildOrders() {
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Array.from({ length: 36 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - Math.floor(rnd() * 10));
      return {
        id: 1001 + i,
        customer: NAMES[Math.floor(rnd() * NAMES.length)],
        product: PRODUCTS[Math.floor(rnd() * PRODUCTS.length)].name,
        date: localISO(d),
        amount: Math.round((300 + rnd() * 4200) / 10) * 10,
        status: STATUSES[Math.floor(rnd() * 4)],
      };
    });
  }
  const orders = buildOrders();
  try {
    const savedStatuses = JSON.parse(ls.get(STATUS_KEY) || '{}');
    orders.forEach((o) => { if (STATUSES.includes(savedStatuses[o.id])) o.status = savedStatuses[o.id]; });
  } catch { /* пошкоджені дані — ігноруємо */ }
  const saveStatuses = () => ls.set(STATUS_KEY, JSON.stringify(Object.fromEntries(orders.map((o) => [o.id, o.status]))));

  /* ---------- Авторизація ---------- */
  const loginBox = $('#login'), app = $('#app');
  function showApp(email) {
    loginBox.hidden = true; app.hidden = false;
    $('#who').textContent = email;
    render();
  }
  function showLogin() { app.hidden = true; loginBox.hidden = false; }

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#email').value.trim().toLowerCase();
    const pass = $('#pass').value;
    const err = $('#login-err');
    if (!email || !pass) { err.textContent = 'Заповніть email і пароль.'; return; }
    if (email !== CREDENTIALS.email || pass !== CREDENTIALS.pass) { err.textContent = 'Невірний email або пароль.'; return; }
    err.textContent = '';
    ls.set(SESSION_KEY, email);
    showApp(email);
  });
  $('#logout').addEventListener('click', () => { ls.del(SESSION_KEY); showLogin(); });

  /* ---------- Стан таблиці ---------- */
  const ui = { q: '', status: '', sortKey: 'date', dir: 'desc', page: 1 };

  function filtered() {
    const q = ui.q.trim().toLowerCase();
    const list = orders.filter((o) =>
      (!ui.status || o.status === ui.status) &&
      (!q || o.customer.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || String(o.id).includes(q)));
    const k = ui.sortKey, m = ui.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      if (typeof a[k] === 'number') return (a[k] - b[k]) * m;
      return String(a[k]).localeCompare(String(b[k]), 'uk') * m || (a.id - b.id);
    });
  }

  /* ---------- KPI та графік ---------- */
  function renderKpis() {
    const active = orders.filter((o) => o.status !== 'Скасовано');
    const revenue = active.reduce((s, o) => s + o.amount, 0);
    const kpis = [
      ['Виручка (без скасованих)', money(revenue)],
      ['Замовлень усього', orders.length],
      ['Середній чек', money(active.length ? revenue / active.length : 0)],
      ['Очікують обробки', orders.filter((o) => o.status === 'Нове' || o.status === 'В обробці').length],
    ];
    $('#kpis').innerHTML = kpis.map(([l, v]) => `<div class="kpi"><small>${l}</small><b>${v}</b></div>`).join('');
  }

  function renderChart() {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
    const data = days.map((d) => ({
      label: d.toLocaleDateString('uk-UA', { weekday: 'short' }),
      sum: orders.filter((o) => o.date === localISO(d) && o.status !== 'Скасовано').reduce((s, o) => s + o.amount, 0),
    }));
    const max = Math.max(...data.map((d) => d.sum), 1);
    const W = 700, H = 240, pad = 28, bw = 54, gap = (W - pad * 2 - bw * 7) / 6;
    const bars = data.map((d, i) => {
      const h = Math.round((d.sum / max) * (H - 70));
      const x = pad + i * (bw + gap), y = H - 30 - h;
      return `<g><rect class="bar-rect" x="${x}" y="${y}" width="${bw}" height="${h}" rx="8"><title>${d.label}: ${money(d.sum)}</title></rect>
        <text class="val" x="${x + bw / 2}" y="${y - 8}" text-anchor="middle">${d.sum ? Math.round(d.sum / 100) / 10 + 'k' : '0'}</text>
        <text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${d.label}</text></g>`;
    }).join('');
    $('#chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><line x1="${pad}" y1="${H - 30}" x2="${W - pad}" y2="${H - 30}" stroke="#e5e7eb"/>${bars}</svg>`;
  }

  /* ---------- Таблиця ---------- */
  function renderTable() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    ui.page = Math.min(ui.page, pages);
    const slice = list.slice((ui.page - 1) * PAGE_SIZE, ui.page * PAGE_SIZE);
    $('#rows').innerHTML = slice.map((o) => `
      <tr><td>#${o.id}</td><td>${esc(o.customer)}</td><td><span class="prod">${thumb(PRODUCTS.find((p) => p.name === o.product))}${esc(o.product)}</span></td>
        <td>${new Date(o.date + 'T00:00').toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' })}</td>
        <td class="num">${money(o.amount)}</td>
        <td><select class="s-${o.status.replace(/\s/g, '')}" data-id="${o.id}" aria-label="Статус замовлення ${o.id}">${STATUSES.map((s) => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('');
    $('#no-rows').hidden = list.length > 0;
    $('#page-info').textContent = list.length ? `Сторінка ${ui.page} з ${pages} · ${list.length} замовл.` : '';
    $('#prev').disabled = ui.page <= 1;
    $('#next').disabled = ui.page >= pages;
    document.querySelectorAll('th button[data-sort]').forEach((b) => {
      b.dataset.dir = b.dataset.sort === ui.sortKey ? ui.dir : '';
    });
  }

  function render() { renderKpis(); renderChart(); renderTable(); }

  $('#search').addEventListener('input', (e) => { ui.q = e.target.value; ui.page = 1; renderTable(); });
  $('#status').addEventListener('change', (e) => { ui.status = e.target.value; ui.page = 1; renderTable(); });
  $('#prev').addEventListener('click', () => { ui.page--; renderTable(); });
  $('#next').addEventListener('click', () => { ui.page++; renderTable(); });
  document.querySelector('thead').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sort]'); if (!b) return;
    ui.dir = ui.sortKey === b.dataset.sort && ui.dir === 'asc' ? 'desc' : 'asc';
    ui.sortKey = b.dataset.sort; renderTable();
  });
  $('#rows').addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-id]'); if (!sel) return;
    const order = orders.find((o) => o.id === Number(sel.dataset.id));
    if (order && STATUSES.includes(sel.value)) { order.status = sel.value; saveStatuses(); render(); }
  });

  /* ---------- Експорт CSV ---------- */
  $('#export').addEventListener('click', () => {
    const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['№', 'Клієнт', 'Товар', 'Дата', 'Сума', 'Статус'], ...filtered().map((o) => [o.id, o.customer, o.product, o.date, o.amount, o.status])];
    const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'orders.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ---------- Старт ---------- */
  const session = ls.get(SESSION_KEY);
  if (session === CREDENTIALS.email) showApp(session); else showLogin();
})();
