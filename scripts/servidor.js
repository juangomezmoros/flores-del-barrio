#!/usr/bin/env node
// Servidor local mínimo para probar el juego: node scripts/servidor.js  →  http://localhost:8123
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), PUERTO = Number(process.env.PORT) || 8123;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.geojson': 'application/json', '.css': 'text/css', '.png': 'image/png' };
http.createServer((req, res) => {
  const ruta = path.normalize(decodeURIComponent(req.url.split('?')[0]));
  const archivo = path.join(RAIZ, ruta === path.sep ? 'index.html' : ruta);
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404).end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(datos);
  });
}).listen(PUERTO, process.env.HOST || '127.0.0.1', () => {
  console.log('Juego en http://localhost:' + PUERTO);
  if (process.env.HOST) for (const lista of Object.values(require('os').networkInterfaces())) for (const d of lista || [])
    if (d.family === 'IPv4' && !d.internal) console.log('Desde el celular (misma red WiFi): http://' + d.address + ':' + PUERTO);
});
