(function () {
  'use strict';

  /* Open-Meteo: безкоштовний публічний API без ключа */
  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
  const LAST_KEY = 'weather-last-place';
  const TIMEOUT_MS = 10000;

  const $ = (s, r = document) => r.querySelector(s);

  /* Коди погоди WMO → емодзі та опис українською */
  const WMO = [
    [[0], '☀️', 'Ясно'], [[1], '🌤️', 'Переважно ясно'], [[2], '⛅', 'Мінлива хмарність'], [[3], '☁️', 'Хмарно'],
    [[45, 48], '🌫️', 'Туман'], [[51, 53, 55, 56, 57], '🌦️', 'Мряка'], [[61, 63, 65, 66, 67], '🌧️', 'Дощ'],
    [[71, 73, 75, 77], '❄️', 'Сніг'], [[80, 81, 82], '🌧️', 'Зливи'], [[85, 86], '🌨️', 'Снігопад'], [[95, 96, 99], '⛈️', 'Гроза'],
  ];
  const wmo = (code) => { const m = WMO.find(([codes]) => codes.includes(code)); return m ? { icon: m[1], text: m[2] } : { icon: '🌡️', text: 'Невідомо' }; };

  /* ---------- Мережа з тайм-аутом та зрозумілими помилками ---------- */
  async function getJSON(url, params) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${url}?${new URLSearchParams(params)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Сервер не відповів вчасно. Спробуйте ще раз.');
      if (!navigator.onLine) throw new Error('Немає з’єднання з інтернетом.');
      throw new Error('Не вдалося отримати дані. Спробуйте пізніше.');
    } finally { clearTimeout(timer); }
  }

  /* ---------- Резервний режим ----------
     Якщо живий API недоступний (немає інтернету, сторінку відкрито в середовищі, що блокує
     зовнішні запити), застосунок показує приклад погоди для міст із цього списку. */
  const CITIES = [
    ['Київ', 'Київ', 'Україна', 50.45, 30.52], ['Львів', 'Львівська область', 'Україна', 49.84, 24.02],
    ['Харків', 'Харківська область', 'Україна', 49.99, 36.23], ['Одеса', 'Одеська область', 'Україна', 46.48, 30.73],
    ['Дніпро', 'Дніпропетровська область', 'Україна', 48.46, 35.05], ['Запоріжжя', 'Запорізька область', 'Україна', 47.84, 35.14],
    ['Івано-Франківськ', 'Івано-Франківська область', 'Україна', 48.92, 24.71], ['Ужгород', 'Закарпатська область', 'Україна', 48.62, 22.29],
    ['Варшава', 'Мазовецьке воєводство', 'Польща', 52.23, 21.01], ['Краків', 'Малопольське воєводство', 'Польща', 50.06, 19.94],
    ['Берлін', 'Берлін', 'Німеччина', 52.52, 13.41], ['Лондон', 'Англія', 'Велика Британія', 51.51, -0.13],
    ['Париж', 'Іль-де-Франс', 'Франція', 48.86, 2.35], ['Нью-Йорк', 'Нью-Йорк', 'США', 40.71, -74.01],
  ].map(([name, admin1, country, latitude, longitude]) => ({ name, admin1, country, latitude, longitude }));

  function sampleForecast(place) {
    const now = new Date();
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    const north = place.latitude >= 0 ? 1 : -1;
    const season = -Math.cos((2 * Math.PI * (doy + 10)) / 365) * north;
    const mean = 22 - Math.abs(place.latitude) * 0.33 + season * 9;
    let seed = Math.round(Math.abs(place.latitude * 100 + place.longitude * 10)) + now.getDate();
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const codes = [0, 1, 2, 3, 3, 61, 2, 45, 80, 1];
    const time = [], code = [], hi = [], lo = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      time.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
      const t = mean + (rnd() - 0.5) * 5;
      hi.push(t + 3); lo.push(t - 4); code.push(codes[Math.floor(rnd() * codes.length)]);
    }
    return {
      current: { temperature_2m: mean + 1, apparent_temperature: mean - 1, relative_humidity_2m: 55 + Math.round(rnd() * 30), wind_speed_10m: 2 + rnd() * 5, weather_code: code[0] },
      daily: { time, weather_code: code, temperature_2m_max: hi, temperature_2m_min: lo },
    };
  }

  /* ---------- Демо-дані: якщо API недоступний (офлайн, блокування запитів), сторінка все одно працює ---------- */
  // Місто | англійські назви | широта | довгота | типова температура | країна
  const DEMO_CITIES = `
Київ|Kyiv Kiev|50.45|30.52|11|Україна
Харків|Kharkiv|49.99|36.23|10|Україна
Одеса|Odesa Odessa|46.48|30.72|14|Україна
Дніпро|Dnipro|48.46|35.05|12|Україна
Запоріжжя|Zaporizhzhia Zaporozhye|47.84|35.14|12|Україна
Львів|Lviv|49.84|24.03|9|Україна
Кривий Ріг|Kryvyi Rih|47.91|33.39|12|Україна
Миколаїв|Mykolaiv|46.97|32.0|13|Україна
Вінниця|Vinnytsia|49.23|28.47|10|Україна
Херсон|Kherson|46.64|32.62|13|Україна
Полтава|Poltava|49.59|34.55|10|Україна
Чернігів|Chernihiv|51.49|31.29|9|Україна
Черкаси|Cherkasy|49.44|32.06|10|Україна
Житомир|Zhytomyr|50.25|28.66|9|Україна
Суми|Sumy|50.91|34.8|9|Україна
Хмельницький|Khmelnytskyi|49.42|26.98|9|Україна
Чернівці|Chernivtsi|48.29|25.94|10|Україна
Рівне|Rivne|50.62|26.25|9|Україна
Кропивницький|Kropyvnytskyi|48.51|32.26|11|Україна
Івано-Франківськ|Ivano-Frankivsk|48.92|24.71|9|Україна
Тернопіль|Ternopil|49.55|25.59|9|Україна
Луцьк|Lutsk|50.75|25.34|9|Україна
Ужгород|Uzhhorod|48.62|22.29|11|Україна
Біла Церква|Bila Tserkva|49.8|30.12|10|Україна
Бровари|Brovary|50.51|30.79|10|Україна
Ірпінь|Irpin|50.52|30.25|10|Україна
Буча|Bucha|50.55|30.21|10|Україна
Мукачево|Mukachevo|48.44|22.72|11|Україна
Дрогобич|Drohobych|49.35|23.51|9|Україна
Стрий|Stryi|49.26|23.85|9|Україна
Коломия|Kolomyia|48.53|25.04|9|Україна
Умань|Uman|48.75|30.22|10|Україна
Кременчук|Kremenchuk|49.07|33.42|10|Україна
Нікополь|Nikopol|47.57|34.4|12|Україна
Слов'янськ|Sloviansk|48.87|37.62|10|Україна
Краматорськ|Kramatorsk|48.72|37.56|10|Україна
Мелітополь|Melitopol|46.85|35.37|13|Україна
Бердянськ|Berdiansk|46.76|36.8|13|Україна
Варшава|Warsaw Warszawa|52.23|21.01|10|Польща
Краків|Krakow Cracow|50.06|19.94|9|Польща
Вроцлав|Wroclaw|51.11|17.04|10|Польща
Познань|Poznan|52.41|16.93|10|Польща
Гданськ|Gdansk|54.35|18.65|9|Польща
Лодзь|Lodz|51.76|19.46|10|Польща
Щецін|Szczecin|53.43|14.55|10|Польща
Люблін|Lublin|51.25|22.57|9|Польща
Катовіце|Katowice|50.26|19.02|9|Польща
Білосток|Bialystok|53.13|23.16|8|Польща
Жешув|Rzeszow|50.04|21.99|9|Польща
Перемишль|Przemysl|49.78|22.77|9|Польща
Берлін|Berlin|52.52|13.4|10|Німеччина
Мюнхен|Munich Munchen|48.14|11.58|9|Німеччина
Гамбург|Hamburg|53.55|9.99|9|Німеччина
Франкфурт|Frankfurt|50.11|8.68|11|Німеччина
Лондон|London|51.51|-0.13|12|Велика Британія
Париж|Paris|48.86|2.35|13|Франція
Рим|Rome Roma|41.9|12.5|18|Італія
Мілан|Milan Milano|45.46|9.19|14|Італія
Мадрид|Madrid|40.42|-3.7|17|Іспанія
Барселона|Barcelona|41.39|2.17|18|Іспанія
Лісабон|Lisbon Lisboa|38.72|-9.14|19|Португалія
Прага|Prague Praha|50.08|14.44|9|Чехія
Відень|Vienna Wien|48.21|16.37|10|Австрія
Будапешт|Budapest|47.5|19.04|12|Угорщина
Братислава|Bratislava|48.15|17.11|11|Словаччина
Вільнюс|Vilnius|54.69|25.28|7|Литва
Рига|Riga|56.95|24.11|7|Латвія
Таллінн|Tallinn|59.44|24.75|6|Естонія
Стокгольм|Stockholm|59.33|18.07|6|Швеція
Осло|Oslo|59.91|10.75|6|Норвегія
Копенгаген|Copenhagen|55.68|12.57|8|Данія
Амстердам|Amsterdam|52.37|4.9|11|Нідерланди
Брюссель|Brussels|50.85|4.35|11|Бельгія
Афіни|Athens|37.98|23.73|21|Греція
Стамбул|Istanbul|41.01|28.98|17|Туреччина
Кишинів|Chisinau|47.01|28.86|11|Молдова
Тбілісі|Tbilisi|41.72|44.79|15|Грузія
Нью-Йорк|New York|40.71|-74.01|14|США
Лос-Анджелес|Los Angeles|34.05|-118.24|22|США
Чикаго|Chicago|41.88|-87.63|12|США
Торонто|Toronto|43.65|-79.38|10|Канада
Токіо|Tokyo|35.68|139.69|18|Японія
Пекін|Beijing|39.9|116.4|14|Китай
Дубай|Dubai|25.2|55.27|33|ОАЕ
Тель-Авів|Tel Aviv|32.09|34.78|27|Ізраїль
`.trim().split('\n').map((r) => {
    const [name, en, lat, lon, base, country] = r.split('|');
    return { name, en: en.toLowerCase(), country, latitude: +lat, longitude: +lon, base: +base };
  });
  let apiDown = false;

  function demoSearch(name) {
    const q = name.trim().toLowerCase().replace(/[’`ʼ]/g, "'");
    if (q.length < 2) return [];
    const hit = (c) => c.name.toLowerCase().includes(q) || c.en.split(' ').some((w) => w.startsWith(q)) || c.en.includes(q);
    return DEMO_CITIES.filter(hit).sort((x, y) => Number(!x.name.toLowerCase().startsWith(q)) - Number(!y.name.toLowerCase().startsWith(q))).slice(0, 5);
  }

  function demoForecast(place) {
    // Детермінована «погода»: залежить від міста й дати, тож однакова для всіх відвідувачів у той самий день
    const base = typeof place.base === 'number' ? place.base : Math.round(26 - Math.abs(place.latitude) * 0.3);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const seedOf = (i) => Math.abs(Math.sin((place.latitude * 12.9898 + place.longitude * 78.233 + Math.floor(today.getTime() / 864e5) + i) * 43758.5453)) % 1;
    const codes = [0, 1, 2, 3, 3, 61, 80, 45];
    const time = [], code = [], max = [], min = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      time.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
      const r = seedOf(i);
      code.push(codes[Math.floor(r * codes.length)]);
      max.push(Math.round(base + 3 + (r - 0.5) * 8));
      min.push(Math.round(base - 4 + (r - 0.5) * 6));
    }
    const r0 = seedOf(0);
    return {
      current: { temperature_2m: base + 1 + (r0 - 0.5) * 6, apparent_temperature: base - 1 + (r0 - 0.5) * 6, relative_humidity_2m: 55 + Math.round(r0 * 35), wind_speed_10m: 1.5 + r0 * 6, weather_code: code[0] },
      daily: { time, weather_code: code, temperature_2m_max: max, temperature_2m_min: min },
    };
  }

  /* ---------- Стан ---------- */
  function setState(kind, text) {
    const el = $('#state');
    el.className = 'state' + (kind === 'error' ? ' error' : kind === 'note' ? ' note' : '');
    el.innerHTML = '';
    if (kind === 'note') el.className = 'state note';
    if (kind === 'loading') { const l = document.createElement('span'); l.className = 'loader'; el.appendChild(l); }
    el.appendChild(document.createTextNode(text || ''));
  }

  /* ---------- Пошук міста ---------- */
  let offline = false;
  async function searchCity(name) {
    if (!apiDown) {
      try {
        const data = await getJSON(GEO_URL, { name, count: 5, language: 'uk', format: 'json' });
        return Array.isArray(data.results) ? data.results : [];
      } catch (err) { apiDown = true; }
    }
    return demoSearch(name);
  }

  async function showPlace(place) {
    $('#suggest').hidden = true;
    setState('loading', `Завантажую погоду: ${place.name}…`);
    let data = null;
    if (!apiDown) {
      try {
        data = await getJSON(FORECAST_URL, {
          latitude: place.latitude, longitude: place.longitude, timezone: 'auto', wind_speed_unit: 'ms',
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        });
      } catch (err) { apiDown = true; }
    }
    try {
      if (data) {
        render(place, data);
        setState('', '');
      } else {
        render(place, demoForecast(place));
        setState('note', 'Сервіс погоди зараз недоступний, тому показано демонстраційні дані. На сайті з доступом до мережі тут будуть живі дані Open-Meteo.');
      }
      try { localStorage.setItem(LAST_KEY, JSON.stringify({ name: place.name, admin1: place.admin1, country: place.country, latitude: place.latitude, longitude: place.longitude, base: place.base })); } catch { /* без збереження */ }
    } catch (err) {
      setState('error', err.message);
    }
  }

  const deg = (n) => `${Math.round(n)}°`;
  function render(place, data) {
    const c = data.current, d = data.daily;
    if (!c || !d) throw new Error('API повернув неповні дані.');
    const w = wmo(c.weather_code);
    $('#place').textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
    $('#icon').textContent = w.icon;
    $('#temp').textContent = deg(c.temperature_2m);
    $('#desc').textContent = w.text;
    $('#feels').textContent = deg(c.apparent_temperature);
    $('#hum').textContent = `${Math.round(c.relative_humidity_2m)}%`;
    $('#wind').textContent = `${Math.round(c.wind_speed_10m)} м/с`;
    $('#now').hidden = false;

    const week = $('#week');
    week.innerHTML = '';
    d.time.forEach((iso, i) => {
      const wd = wmo(d.weather_code[i]);
      const cell = document.createElement('div');
      cell.className = 'day';
      cell.title = wd.text;
      const label = i === 0 ? 'Сьогодні' : new Date(iso + 'T00:00').toLocaleDateString('uk-UA', { weekday: 'short' });
      cell.innerHTML = `<span class="d"></span><span class="i">${wd.icon}</span><b>${deg(d.temperature_2m_max[i])}</b><span class="lo">${deg(d.temperature_2m_min[i])}</span>`;
      cell.querySelector('.d').textContent = label;
      week.appendChild(cell);
    });
    week.hidden = false;
  }

  /* ---------- Події ---------- */
  $('#search').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#city').value.trim();
    if (name.length < 2) { setState('error', 'Введіть назву міста (мінімум 2 символи).'); return; }
    setState('loading', 'Шукаю місто…');
    try {
      const results = await searchCity(name);
      if (!results.length) { setState('error', `Місто «${name}» не знайдено. Перевірте написання${apiDown ? ' (у демо-режимі доступно близько 90 великих міст України та світу)' : ''}.`); $('#suggest').hidden = true; return; }
      if (results.length === 1) { showPlace(results[0]); return; }
      const box = $('#suggest');
      box.innerHTML = '';
      results.forEach((r) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = '<span></span> <small></small>';
        b.firstChild.textContent = r.name;
        b.lastChild.textContent = [r.admin1, r.country].filter(Boolean).join(', ');
        b.addEventListener('click', () => showPlace(r));
        li.appendChild(b); box.appendChild(li);
      });
      box.hidden = false;
      setState('', 'Оберіть потрібне місто зі списку.');
    } catch (err) { setState('error', err.message); }
  });

  $('#geo').addEventListener('click', () => {
    if (!navigator.geolocation) { setState('error', 'Ваш браузер не підтримує геолокацію.'); return; }
    setState('loading', 'Визначаю місцезнаходження…');
    navigator.geolocation.getCurrentPosition(
      (pos) => showPlace({ name: 'Моя локація', latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setState('error', 'Не вдалося визначити місцезнаходження. Введіть місто вручну.'),
      { timeout: 8000 });
  });

  /* ---------- Старт: остання локація або Київ ---------- */
  let start = { name: 'Київ', country: 'Україна', latitude: 50.45, longitude: 30.52 };
  try { const s = JSON.parse(localStorage.getItem(LAST_KEY)); if (s && typeof s.latitude === 'number' && typeof s.longitude === 'number') start = s; } catch { /* лишаємо Київ */ }
  showPlace(start);
})();
