#!/usr/bin/env node
// Convierte los datos descargados (data/*.geojson) en el mapa del juego: data/mapa.js
// El mapa es vectorial (formas lisas) y se gira para que las calles queden derechas.
// Uso: node scripts/construir_mapa.js   (después de node scripts/descargar_datos.js)

const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data');
const leer = n => { const p = path.join(DATA, n + '.geojson'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).features : []; };

// ---------- Área ----------
const areaAnillo = r => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; };
const poligonosDe = g => !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
const validos = leer('area_juego').flatMap(f => poligonosDe(f.geometry)).filter(p => p[0] && p[0].length >= 4 && Math.abs(areaAnillo(p[0])) > 1e-12);
if (validos.length !== 1) { console.error('area_juego.geojson debe tener exactamente un polígono con área.'); process.exit(1); }
const areaLL = validos[0][0];

// ---------- Proyección a metros (x hacia el este, y hacia el sur) ----------
const lon0 = Math.min(...areaLL.map(p => p[0])), lat0 = Math.max(...areaLL.map(p => p[1]));
const mx = 111320 * Math.cos(lat0 * Math.PI / 180), my = 110574;
const plano = ([lon, lat]) => [(lon - lon0) * mx, (lat0 - lat) * my];

// ---------- Giro: se busca la dirección dominante de las calles ----------
const ANCHO = { motorway: 16, trunk: 16, primary: 16, secondary: 13, tertiary: 10, residential: 7, unclassified: 7, living_street: 7, service: 4 };
const callesGJ = leer('calles').map(f => ({ tipo: String(f.properties.highway).replace('_link', ''), nombre: f.properties.name || '', pts: f.geometry.coordinates.map(plano) }));
let sx = 0, sy = 0;
for (const c of callesGJ) if (ANCHO[c.tipo] >= 7) for (let i = 0; i < c.pts.length - 1; i++) {
  const dx = c.pts[i + 1][0] - c.pts[i][0], dy = c.pts[i + 1][1] - c.pts[i][1], l = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  sx += l * Math.cos(4 * a); sy += l * Math.sin(4 * a);
}
const ANG = Math.atan2(sy, sx) / 4, co = Math.cos(ANG), si = Math.sin(ANG);
const girar = ([x, y]) => [x * co + y * si, -x * si + y * co];
const P0 = ll => girar(plano(ll));

// Origen: esquina del área (ya girada) con un margen
const MARGEN = 40;
const areaG = areaLL.map(P0);
const ox = Math.min(...areaG.map(p => p[0])) - MARGEN, oy = Math.min(...areaG.map(p => p[1])) - MARGEN;
const W = Math.max(...areaG.map(p => p[0])) - ox + MARGEN, H = Math.max(...areaG.map(p => p[1])) - oy + MARGEN;
const P = ll => { const [x, y] = P0(ll); return [x - ox, y - oy]; };
const area = areaLL.map(P);
const r1 = v => Math.round(v * 10) / 10;
const plana = pts => pts.flatMap(p => [r1(p[0]), r1(p[1])]);
const visible = pts => pts.some(p => p[0] > -60 && p[1] > -60 && p[0] < W + 60 && p[1] < H + 60);
function enArea([x, y]) { let d = false; for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
  const [xi, yi] = area[i], [xj, yj] = area[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d; } return d; }
const centroide = pts => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);

// ---------- Capas ----------
const calles = [], rotulos = [], vertices = [];
for (const f of leer('calles')) {
  const tipo = String(f.properties.highway).replace('_link', ''), pts = f.geometry.coordinates.map(P);
  if (!visible(pts)) continue;
  const ancho = ANCHO[tipo] || 2.2;
  calles.push({ a: ancho, s: ANCHO[tipo] ? 0 : 1, p: plana(pts) });
  if (ancho >= 7) for (const p of pts) if (enArea(p)) vertices.push(p);
  const nombre = f.properties.name;
  if (nombre && ancho >= 7) { // rótulo en el tramo más largo, sin repetir el mismo nombre muy cerca
    let mejor = null, ml = 25;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (l > ml) { ml = l; mejor = i; } }
    if (mejor !== null) { const a = pts[mejor], b = pts[mejor + 1], x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
      if (x > 0 && y > 0 && x < W && y < H && !rotulos.some(r => r.n === nombre && Math.hypot(r.x - x, r.y - y) < 170))
        rotulos.push({ n: nombre, x: r1(x), y: r1(y), v: Math.abs(b[1] - a[1]) > Math.abs(b[0] - a[0]) ? 1 : 0 }); }
  }
}
function dentroDe(pol, [x, y]) { let d = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
  const [xi, yi] = pol[i], [xj, yj] = pol[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d; } return d; }
const exteriores = f => poligonosDe(f.geometry).map(pol => pol[0].map(P));
// Uso de cada manzana (Catastro): se toma el año más reciente
const usosGJ = leer('usos'), ultimoAno = Math.max(0, ...usosGJ.map(f => f.properties.ANO || 0));
const USO = { 'RESIDENCIAL': 'R', 'COMERCIO Y OFICINAS': 'C', 'DOTACIONAL': 'D', 'BODEGAS': 'B' };
const manzanas = usosGJ.filter(f => f.properties.ANO === ultimoAno).flatMap(f => exteriores(f).map(pts => ({ pts, u: USO[f.properties.GRUPOUSOECON] || 'O' })));
const usoEn = c => (manzanas.find(m => dentroDe(m.pts, c)) || { u: 'O' }).u;
// Construcciones: las de Catastro (todas, con pisos); si no hay, las de OpenStreetMap
const constGJ = leer('construcciones');
const edificios = (constGJ.length ? constGJ.flatMap(f => exteriores(f).map(pts => ({ pts, n: f.properties.CONNPISOS || 1 })))
  : leer('edificios').map(f => ({ pts: f.geometry.coordinates[0].map(P), n: 1 })))
  .filter(e => visible(e.pts) && e.pts.length > 3).map(e => ({ ...e, c: centroide(e.pts.slice(0, -1)) })).map(e => ({ ...e, u: usoEn(e.c) }));
// Zonas verdes: predios de uso público recreativos o comunales (Catastro) y parques del IDRD
const verdes = [];
for (const f of leer('espacio_publico')) { const u = (f.properties.USO_NIVEL_ || '') + ' ' + (f.properties.USO_NIVEL1 || '');
  if (!/RECREATIVAS|COMUNAL|RONDAS/.test(u) || /PLAZA/.test(u)) continue;
  for (const pts of exteriores(f)) if (visible(pts)) verdes.push({ n: String(f.properties.NOMBRE_URB || '').replace(/\s+/g, ' ').trim(), pts }); }
// Calzadas y andenes reales (Catastro)
const calzadas = leer('calzadas').flatMap(exteriores).filter(visible), andenes = leer('andenes').flatMap(exteriores).filter(visible);
const agua = leer('agua').map(f => f.geometry.type === 'Polygon'
  ? { pol: 1, p: plana(f.geometry.coordinates[0].map(P)) }
  : { a: /river|canal/.test(f.properties.waterway) ? 5 : 2.5, p: plana(f.geometry.coordinates.map(P)) });
const parques = [];
for (const f of leer('parques')) for (const pol of poligonosDe(f.geometry)) {
  const pts = pol[0].map(P); if (visible(pts)) parques.push({ n: 'Parque ' + String(f.properties.NOMBRE_PARQ || '').replace(/\s+/g, ' ').trim(), pts });
}
const enVerde = c => verdes.some(v => dentroDe(v.pts, c)) || parques.some(q => dentroDe(q.pts, c));
// El punto dentro de una zona verde más cercano a c (buscando en una rejilla de 2 m alrededor)
function alVerde(c) { if (enVerde(c)) return { p: c, d: 0 }; let m = null;
  for (let r = 2; r <= 120 && !m; r += 2) for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2, q = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
    if (enArea(q) && enVerde(q)) { m = { p: q, d: r }; break; } }
  return m || { p: c, d: -1 }; }

// ---------- Árboles ----------
const arbolesGJ = leer('arboles').filter(f => f.geometry);
const nombreDe = f => String(f.properties.Nombre_Esp || 'Sin identificar').replace(/\s+/g, ' ').trim();
const conteo = {}; for (const f of arbolesGJ) conteo[nombreDe(f)] = (conteo[nombreDe(f)] || 0) + 1;
const especies = Object.entries(conteo).sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ n, c }));
const idEspecie = Object.fromEntries(especies.map((e, i) => [e.n, i]));
const arboles = [];
for (const f of arbolesGJ) { const [x, y] = P(f.geometry.coordinates); arboles.push(r1(x), r1(y), idEspecie[nombreDe(f)], Math.round(f.properties.Altura_Total || 0)); }

// ---------- Huertas (solo ubicación: no se publican nombres ni direcciones de casas) ----------
const huertas = [];
for (const f of leer('huertas')) { if (!f.geometry) continue; const p = P(f.geometry.coordinates);
  if (enArea(p) && !huertas.some(h => Math.hypot(h[0] - p[0], h[1] - p[1]) < 12)) huertas.push(p); }

// ---------- Sitios del juego ----------
const cArea = centroide(area.slice(0, -1));
const masCercano = (lista, obj, ok = () => true) => lista.filter(ok).reduce((m, p) => !m || Math.hypot(p[0] - obj[0], p[1] - obj[1]) < Math.hypot(m[0] - obj[0], m[1] - obj[1]) ? p : m, null);
// Zonas de pacas y huertas comunitarias reales: puntos marcados a mano (data/pacas_reales.geojson y data/huertas_reales.geojson)
const puntos = n => leer(n).filter(f => f.geometry && f.geometry.type === 'Point').map(f => P(f.geometry.coordinates)).filter(enArea);
const huertasCom = puntos('huertas_reales');
// Las pacas siempre van en zonas verdes: si un punto cae fuera, se corre a la zona verde más cercana
const zonasPaca = puntos('pacas_reales').map((p, i) => { const v = alVerde(p);
  if (v.d > 0) console.log(`Aviso: la zona de pacas ${i + 1} no estaba en zona verde; la corrí ${Math.round(v.d)} m`);
  if (v.d < 0) console.log(`Aviso: la zona de pacas ${i + 1} no tiene zona verde cerca; queda donde la marcaste`); return v.p; });
// Casa: el edificio más cercano al punto medio de las dos zonas de pacas más cercanas entre sí
// (sin zonas, el más cercano al centro del área)
let foco = cArea;
if (zonasPaca.length >= 2) { let md = Infinity;
  for (let i = 0; i < zonasPaca.length; i++) for (let j = i + 1; j < zonasPaca.length; j++) {
    const a = zonasPaca[i], b = zonasPaca[j], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < md) { md = d; foco = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; } } }
else if (zonasPaca.length === 1) foco = zonasPaca[0];
const lejosDeZonas = c => zonasPaca.concat(huertasCom).every(z => Math.hypot(z[0] - c[0], z[1] - c[1]) > 35);
// Tu casa: una construcción residencial de hasta 3 pisos
const casa = masCercano(edificios.filter(e => e.u === 'R' && e.n <= 3 && enArea(e.c) && lejosDeZonas(e.c)).map(e => e.c), foco)
  || masCercano(edificios.map(e => e.c).filter(c => enArea(c) && lejosDeZonas(c)), foco) || foco;
// Recicladores: en esquinas, repartidos a lo largo del área
const xs = area.map(p => p[0]), xmin = Math.min(...xs), xmax = Math.max(...xs);
const recicladores = [0.2, 0.5, 0.8].map(f => masCercano(vertices, [xmin + f * (xmax - xmin), cArea[1]])).filter(Boolean).map(p => [p[0] + 6, p[1] + 6]);

// ---------- Salida ----------
const mapa = {
  w: Math.ceil(W), h: Math.ceil(H), giro: r1(ANG * 180 / Math.PI),
  area: plana(area), calles, rotulos,
  edificios: edificios.map(e => ({ p: plana(e.pts), n: e.n, u: e.u })), agua, parques: parques.map(q => ({ n: q.n, p: plana(q.pts) })),
  verdes: verdes.map(v => ({ n: v.n, p: plana(v.pts) })), calzadas: calzadas.map(plana), andenes: andenes.map(plana),
  especies, arboles, huertas: plana(huertas), casa: plana([casa]), zonasPaca: plana(zonasPaca), huertasCom: plana(huertasCom), recicladores: plana(recicladores),
};
fs.writeFileSync(path.join(DATA, 'mapa.js'), '// Generado por scripts/construir_mapa.js: no editar a mano\nwindow.MAPA=' + JSON.stringify(mapa) + ';\n');

console.log(`Mapa: ${mapa.w} x ${mapa.h} m, girado ${mapa.giro}° para enderezar las calles`);
console.log(`Calles: ${calles.length} · Rótulos: ${rotulos.length} · Construcciones: ${edificios.length} · Parques: ${parques.length} · Zonas verdes: ${verdes.length} · Calzadas: ${calzadas.length} · Andenes: ${andenes.length} · Agua: ${agua.length}`);
const usos = {}; edificios.forEach(e => usos[e.u] = (usos[e.u] || 0) + 1); console.log('Construcciones por uso (R residencial, C comercio, D dotacional, B bodegas, O otros):', JSON.stringify(usos));
console.log(`Árboles: ${arboles.length / 4} (${especies.length} especies) · Huertas: ${huertas.length}`);
console.log(`Sitios del juego: casa en ${plana([casa])} · ${zonasPaca.length} zonas de pacas · ${huertasCom.length} huertas comunitarias · ${recicladores.length} recicladores`);
console.log(`Archivo: data/mapa.js (${Math.round(fs.statSync(path.join(DATA, 'mapa.js')).size / 1024)} KB)`);
