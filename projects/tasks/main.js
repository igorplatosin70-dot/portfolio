(function () {
  'use strict';

  const KEY = 'tasks-demo-v1';
  const PRIORITY = { high: 'Високий', mid: 'Середній', low: 'Низький' };
  const $ = (s, r = document) => r.querySelector(s);
  const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

  /* ---------- Збереження з обробкою помилок ---------- */
  let canStore = true;
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(raw)) return raw.filter((t) => t && typeof t.title === 'string' && t.id);
    } catch { /* пошкоджений JSON або заборонений storage */ }
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); canStore = true; }
    catch { canStore = false; }
    $('#storage-warn').hidden = canStore;
  }

  const tasks = load() || [
    { id: 'a1', title: 'Зібрати портфоліо для Upwork', priority: 'high', due: '', done: false },
    { id: 'a2', title: 'Додати посилання на GitHub до кожного проєкту', priority: 'mid', due: '', done: false },
    { id: 'a3', title: 'Перевірити мобільну версію', priority: 'low', due: '', done: true },
  ];
  const ui = { filter: 'all', q: '', editing: null, lastDeleted: null };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- Рендер ---------- */
  function shown() {
    const q = ui.q.trim().toLowerCase();
    const order = { high: 0, mid: 1, low: 2 };
    return tasks
      .filter((t) => (ui.filter === 'all' || (ui.filter === 'done') === t.done) && (!q || t.title.toLowerCase().includes(q)))
      .sort((a, b) => Number(a.done) - Number(b.done) || order[a.priority] - order[b.priority]);
  }

  function render() {
    const list = shown();
    $('#list').innerHTML = '';
    list.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'item' + (t.done ? ' done' : '');
      li.dataset.id = t.id; li.dataset.p = t.priority;

      const check = document.createElement('input');
      check.type = 'checkbox'; check.className = 'check'; check.checked = t.done;
      check.setAttribute('aria-label', `Виконано: ${t.title}`);

      const body = document.createElement('div'); body.className = 'body';
      if (ui.editing === t.id) {
        const inp = document.createElement('input');
        inp.className = 'edit-input'; inp.value = t.title; inp.maxLength = 120; inp.dataset.edit = '1';
        inp.setAttribute('aria-label', 'Редагувати завдання');
        body.appendChild(inp);
      } else {
        const title = document.createElement('div'); title.className = 'title'; title.textContent = t.title;
        const meta = document.createElement('div'); meta.className = 'meta';
        const p = document.createElement('span'); p.textContent = `Пріоритет: ${PRIORITY[t.priority]}`;
        meta.appendChild(p);
        if (t.due) {
          const d = document.createElement('span');
          const late = !t.done && t.due < todayISO();
          d.textContent = `${late ? 'Прострочено · ' : 'До '}${new Date(t.due + 'T00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}`;
          if (late) d.className = 'late';
          meta.appendChild(d);
        }
        body.append(title, meta);
      }

      const acts = document.createElement('div'); acts.className = 'acts';
      acts.innerHTML = ui.editing === t.id
        ? '<button type="button" data-act="save" aria-label="Зберегти">✓</button><button type="button" data-act="cancel" aria-label="Скасувати редагування">✕</button>'
        : '<button type="button" data-act="edit" aria-label="Редагувати">✎</button><button type="button" data-act="del" aria-label="Видалити">🗑</button>';
      li.append(check, body, acts);
      $('#list').appendChild(li);
    });

    const empty = $('#empty');
    empty.hidden = list.length > 0;
    if (!list.length) empty.textContent = tasks.length === 0 ? 'Список порожній. Додайте перше завдання ✨' : 'Нічого не знайдено за цим фільтром.';

    const done = tasks.filter((t) => t.done).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    $('#progress-bar').style.width = pct + '%';
    $('#progress-text').textContent = tasks.length ? `Виконано ${done} із ${tasks.length} · ${pct}%` : 'Поки що немає завдань';
    $('#left').textContent = `Залишилось: ${tasks.length - done}`;
    $('#clear').hidden = done === 0;

    const editInput = $('[data-edit]');
    if (editInput) { editInput.focus(); editInput.setSelectionRange(editInput.value.length, editInput.value.length); }
  }

  /* ---------- Додавання з валідацією ---------- */
  $('#add').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#title').value.trim().replace(/\s+/g, ' ');
    const err = $('#form-error');
    if (!title) { err.textContent = 'Введіть назву завдання.'; $('#title').focus(); return; }
    if (tasks.some((t) => t.title.toLowerCase() === title.toLowerCase() && !t.done)) { err.textContent = 'Таке активне завдання вже є.'; return; }
    err.textContent = '';
    tasks.unshift({ id: uid(), title, priority: $('#priority').value, due: $('#due').value, done: false });
    $('#title').value = ''; $('#due').value = '';
    save(); render();
  });
  $('#title').addEventListener('input', () => { $('#form-error').textContent = ''; });

  /* ---------- Дії у списку ---------- */
  const list = $('#list');
  list.addEventListener('change', (e) => {
    if (!e.target.classList.contains('check')) return;
    const t = tasks.find((x) => x.id === e.target.closest('.item').dataset.id);
    if (t) { t.done = e.target.checked; save(); render(); }
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.closest('.item').dataset.id;
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const act = b.dataset.act;
    if (act === 'edit') { ui.editing = id; render(); }
    if (act === 'cancel') { ui.editing = null; render(); }
    if (act === 'save') commitEdit(id);
    if (act === 'del') {
      ui.lastDeleted = { task: tasks[idx], idx };
      tasks.splice(idx, 1); save(); render(); toast('Завдання видалено');
    }
  });
  list.addEventListener('keydown', (e) => {
    if (!e.target.dataset.edit) return;
    if (e.key === 'Enter') commitEdit(e.target.closest('.item').dataset.id);
    if (e.key === 'Escape') { ui.editing = null; render(); }
  });
  function commitEdit(id) {
    const inp = $('[data-edit]');
    const val = inp.value.trim().replace(/\s+/g, ' ');
    if (!val) { inp.focus(); inp.style.borderColor = '#b3261e'; return; }
    tasks.find((t) => t.id === id).title = val;
    ui.editing = null; save(); render();
  }

  /* ---------- Фільтри, пошук, очищення ---------- */
  $('#filter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    ui.filter = b.dataset.f;
    document.querySelectorAll('#filter button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  $('#find').addEventListener('input', (e) => { ui.q = e.target.value; render(); });
  $('#clear').addEventListener('click', () => {
    const removed = tasks.filter((t) => t.done);
    if (!removed.length) return;
    for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].done) tasks.splice(i, 1);
    ui.lastDeleted = { many: removed };
    save(); render(); toast(`Видалено виконаних: ${removed.length}`);
  });

  /* ---------- Скасування видалення ---------- */
  let toastTimer;
  function toast(text) {
    $('#toast-text').textContent = text; $('#toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; ui.lastDeleted = null; }, 5000);
  }
  $('#undo').addEventListener('click', () => {
    const d = ui.lastDeleted; if (!d) return;
    if (d.many) tasks.push(...d.many); else tasks.splice(d.idx, 0, d.task);
    ui.lastDeleted = null; $('#toast').hidden = true; save(); render();
  });

  save();
  render();
})();
