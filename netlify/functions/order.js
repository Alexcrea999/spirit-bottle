// Netlify Function: приймає замовлення з сайту й надсилає в Telegram.
// Токен і chat ID беруться зі змінних середовища Netlify: TG_TOKEN і TG_CHAT_ID.
const PRICE = 499;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function cut(x, n) {
  return String(x == null ? '' : x).trim().slice(0, n);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TG_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!(token && chatId)) {
    console.error('Немає змінних TG_TOKEN або TG_CHAT_ID');
    return { statusCode: 500, body: 'Not configured' };
  }

  let d;
  try {
    d = JSON.parse(event.body ? event.body : '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Bad request' };
  }

  if (d.hp) {
    return { statusCode: 200, body: 'ok' };
  }

  const fio = cut(d.fio, 120);
  const phone = cut(d.phone, 20);
  const city = cut(d.city, 80);
  const np = cut(d.np, 120);
  const color = cut(d.color, 40);
  const n = parseInt(d.qty, 10);
  const qty = Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 1;

  if (!(fio && city && np && /^\+380\d{9}$/.test(phone))) {
    return { statusCode: 400, body: 'Invalid data' };
  }

  const text =
    '<b>Нове замовлення: Spirit 1000 мл</b>\n' +
    'ПІБ: ' + esc(fio) + '\n' +
    'Телефон: ' + esc(phone) + '\n' +
    'Місто: ' + esc(city) + '\n' +
    'Нова пошта: ' + esc(np) + '\n' +
    'Колір: ' + esc(color) + '\n' +
    'Кількість: ' + qty + '\n' +
    'Сума: ' + (qty * PRICE) + ' грн';

  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
    });
    if (!r.ok) {
      console.error('Telegram відповів:', r.status, await r.text());
      return { statusCode: 502, body: 'Telegram error' };
    }
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('Помилка запиту до Telegram:', e);
    return { statusCode: 502, body: 'Telegram error' };
  }
};
