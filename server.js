'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DIR = process.env.PHOTO_DIR || path.join(__dirname, 'fotos');
const TTL = (+process.env.PHOTO_TTL_HOURS || 24) * 3600e3;
fs.mkdirSync(DIR, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.css': 'text/css', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.json': 'application/json' };
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter(t => now - t < 600000); a.push(now); hits.set(ip, a);
  return a.length > 600;
}
const send = (res, code, body, type = 'application/json', extra = {}) => {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

setInterval(() => {
  const now = Date.now();
  for (const f of fs.readdirSync(DIR)) {
    try { if (now - fs.statSync(path.join(DIR, f)).mtimeMs > TTL) fs.unlinkSync(path.join(DIR, f)); } catch (_) {}
  }
}, 600000).unref();

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  if (req.method === 'POST' && url.pathname === '/api/foto') {
    if (limited(ip)) return send(res, 429, { error: 'Demasiadas solicitudes.' });
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > 4e6) req.destroy(); else chunks.push(c); });
    req.on('end', () => {
      let d; try { d = JSON.parse(Buffer.concat(chunks).toString()); } catch { return send(res, 400, { error: 'Solicitud inválida.' }); }
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(d && d.img || '');
      if (!m) return send(res, 400, { error: 'Imagen inválida.' });
      const buf = Buffer.from(m[1], 'base64');
      if (buf.length < 1000 || buf[0] !== 0xff || buf[1] !== 0xd8) return send(res, 400, { error: 'Imagen inválida.' });
      const id = crypto.randomBytes(7).toString('hex');
      fs.writeFileSync(path.join(DIR, id + '.jpg'), buf);
      send(res, 201, { id });
    });
    return;
  }

  let m = /^\/f\/([a-f0-9]{14})\.jpg$/.exec(url.pathname);
  if (req.method === 'GET' && m) {
    fs.readFile(path.join(DIR, m[1] + '.jpg'), (e, b) => e
      ? send(res, 404, 'Esta foto ya no está disponible.', 'text/plain; charset=utf-8')
      : send(res, 200, b, 'image/jpeg', { 'Content-Disposition': 'inline; filename="foto-familia-utpl.jpg"', 'Cache-Control': 'private, max-age=3600' }));
    return;
  }
  m = /^\/f\/([a-f0-9]{14})$/.exec(url.pathname);
  if (req.method === 'GET' && m) {
    if (!fs.existsSync(path.join(DIR, m[1] + '.jpg'))) return send(res, 404, 'Esta foto ya no está disponible.', 'text/plain; charset=utf-8');
    return send(res, 200, `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu foto · UTPL</title>
<body style="margin:0;background:#1c4069;font-family:system-ui,sans-serif;text-align:center;color:#fff;padding:16px">
<img src="/f/${m[1]}.jpg" alt="Tu foto" style="max-width:100%;border-radius:12px;box-shadow:0 6px 24px #0006">
<p><a href="/f/${m[1]}.jpg" download="foto-familia-utpl.jpg" style="display:inline-block;background:#f2c142;color:#1c4069;font-weight:700;padding:14px 26px;border-radius:30px;text-decoration:none">Descargar foto</a></p>
<p style="font-size:12px;opacity:.8">La foto se elimina automáticamente a las 24 horas.</p></body></html>`, 'text/html; charset=utf-8');
  }

  if (req.method === 'GET') {
    const p = url.pathname === '/' ? '/index.html' : url.pathname;
    const f = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(path.join(__dirname, 'public'))) return send(res, 403, 'No', 'text/plain');
    return fs.readFile(f, (e, b) => e ? send(res, 404, 'No encontrado', 'text/plain') : send(res, 200, b, MIME[path.extname(f)] || 'application/octet-stream', p.startsWith('/vendor/') ? { 'Cache-Control': 'public, max-age=86400' } : {}));
  }
  send(res, 404, { error: 'No encontrado' });
}).listen(PORT, () => console.log('Jaguar en puerto ' + PORT));
