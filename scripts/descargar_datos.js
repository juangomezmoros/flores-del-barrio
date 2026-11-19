#!/usr/bin/env node
// Descarga datos abiertos de Bogotá para el juego de flores.
// Uso: node scripts/descargar_datos.js
// El área SIEMPRE se lee de data/area_juego.geojson: si cambias el polígono, no hay que tocar este código.

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const AREA = path.join(DATA, 'area_juego.geojson');
const PAGINA = 2000;

const CAPAS = [
  { nombre: 'arboles', titulo: 'Árboles', color: '#2e7d32', paginar: true,
    url: 'https://geoportal.jbb.gov.co/agc/rest/services/IDECA/CensoArbol/MapServer/0' },
  { nombre: 'huertas', titulo: 'Huertas', color: '#ef6c00',
    url: 'https://geoportal.jbb.gov.co/agc/rest/services/IDECA/proyectosurbanos/MapServer/2' },
  { nombre: 'jardineras', titulo: 'Jardineras', color: '#d81b60',
    url: 'https://geoportal.jbb.gov.co/agc/rest/services/IDECA/proyectosurbanos/MapServer/1' },
  { nombre: 'parques', titulo: 'Parques', color: '#00897b',
    url: 'https://visorsrv.idrd.gov.co/srv/rest/services/ParquesIDRD/Parques/MapServer/0' },
  { nombre: 'techos_verdes', titulo: 'Techos verdes y jardines verticales', color: '#5e35b1',
    url: 'https://mapas.ambientebogota.gov.co/server/rest/services/Ecourbanismo/Techos_verdes_Jardines_Verticales/MapServer/1' },
  // Catastro Bogotá: construcciones, uso de cada manzana, espacio público y vías reales
  { nombre: 'construcciones', titulo: 'Construcciones (Catastro)', color: '#8d6e63', paginar: true, mapa: false,
    url: 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Mapa_Referencia/Mapa_Referencia/MapServer/39' },
  { nombre: 'usos', titulo: 'Uso predominante por manzana', color: '#ff7043', paginar: true, mapa: false,
    url: 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro/usopredominante/MapServer/0' },
  { nombre: 'espacio_publico', titulo: 'Predios de uso público', color: '#43a047', paginar: true,
    url: 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/espaciopublico/inventarios/MapServer/3' },
  { nombre: 'calzadas', titulo: 'Calzadas', color: '#757575', paginar: true, mapa: false,
    url: 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Mapa_Referencia/Mapa_Referencia/MapServer/15' },
  { nombre: 'andenes', titulo: 'Andenes', color: '#bdbdbd', paginar: true, mapa: false,
    url: 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Mapa_Referencia/Mapa_Referencia/MapServer/16' },
];

// ---------- Área del juego ----------
function areaAnillo(anillo) { // área con signo (fórmula del cordón); positiva = antihorario
  let a = 0;
  for (let i = 0; i < anillo.length - 1; i++) a += anillo[i][0] * anillo[i + 1][1] - anillo[i + 1][0] * anillo[i][1];
  return a / 2;
}

function leerArea() {
  if (!fs.existsSync(AREA)) throw new Error('No encuentro ' + AREA);
  const gj = JSON.parse(fs.readFileSync(AREA, 'utf8'));
  const geoms = gj.type === 'FeatureCollection' ? gj.features.map(f => f.geometry)
    : gj.type === 'Feature' ? [gj.geometry] : [gj];
  const poligonos = [];
  for (const g of geoms) {
    if (!g) continue;
    if (g.type === 'Polygon') poligonos.push(g.coordinates);
    else if (g.type === 'MultiPolygon') poligonos.push(...g.coordinates);
  }
  // Descarta polígonos sin área (por ejemplo, un clic suelto que quedó guardado como polígono)
  const validos = poligonos.filter(p => p[0] && p[0].length >= 4 && Math.abs(areaAnillo(p[0])) > 1e-12);
  const descartados = poligonos.length - validos.length;
  if (descartados) console.log(`Aviso: ignoré ${descartados} polígono(s) sin área en area_juego.geojson.`);
  if (validos.length === 0) throw new Error('area_juego.geojson no tiene ningún polígono válido.');
  if (validos.length > 1) throw new Error(`area_juego.geojson tiene ${validos.length} polígonos con área; deja solo uno.`);
  return validos[0];
}

function aEsri(poligono) {
  // Esri espera el anillo exterior en sentido horario y los huecos en antihorario
  const rings = poligono.map((anillo, i) => {
    const horario = areaAnillo(anillo) < 0;
    return (i === 0) === horario ? anillo : [...anillo].reverse();
  });
  return { rings, spatialReference: { wkid: 4326 } };
}

// ---------- Consultas ----------
async function consultar(url, esri, extra = {}) {
  const cuerpo = new URLSearchParams({
    where: '1=1',
    geometry: JSON.stringify(esri),
    geometryType: 'esriGeometryPolygon',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outSR: '4326',
    outFields: '*',
    f: 'geojson',
    ...extra,
  });
  const r = await fetch(url + '/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: cuerpo,
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const texto = await r.text();
  let json;
  try { json = JSON.parse(texto); } catch { throw new Error('Respuesta que no es JSON: ' + texto.slice(0, 120)); }
  if (json.error) throw new Error(json.error.message + (json.error.details ? ' ' + [].concat(json.error.details).join(' ') : ''));
  if (!Array.isArray(json.features)) throw new Error('Respuesta sin "features"');
  return json;
}

const excedio = j => !!(j.exceededTransferLimit || (j.properties && j.properties.exceededTransferLimit));
const idDe = f => f.id ?? f.properties?.OBJECTID ?? f.properties?.objectid ?? JSON.stringify(f.geometry);

async function descargarPaginado(url, esri) {
  const vistos = new Set(), todos = [];
  let offset = 0;
  for (;;) {
    const j = await consultar(url, esri, { orderByFields: 'OBJECTID', resultOffset: String(offset), resultRecordCount: String(PAGINA) });
    let nuevos = 0;
    for (const f of j.features) { const id = idDe(f); if (!vistos.has(id)) { vistos.add(id); todos.push(f); nuevos++; } }
    process.stdout.write(`    página desde ${offset}: ${j.features.length} elementos\n`);
    if (j.features.length === 0 || nuevos === 0) break;            // no hay más (o el servidor repite la misma página)
    if (j.features.length < PAGINA && !excedio(j)) break;          // última página
    offset += j.features.length;
  }
  return { type: 'FeatureCollection', features: todos };
}

// ---------- Calles, edificios y agua (OpenStreetMap) ----------
// Se piden por la caja envolvente del área (con un margen) para que el borde del mapa del juego tenga contexto.
async function descargarOSM(poligono) {
  const lons = poligono[0].map(p => p[0]), lats = poligono[0].map(p => p[1]), M = 0.0004;
  const caja = [Math.min(...lats) - M, Math.min(...lons) - M, Math.max(...lats) + M, Math.max(...lons) + M].join(',');
  const consulta = `[out:json][timeout:60];(way["highway"](${caja});way["building"](${caja});way["waterway"](${caja});way["natural"="water"](${caja}););out geom;`;
  // Los servidores de Overpass se saturan a ratos: reintenta alternando entre varios
  const SERVIDORES = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  let json, ultimo;
  for (let i = 0; i < 6 && !json; i++) {
    const servidor = SERVIDORES[i % SERVIDORES.length];
    try {
      const r = await fetch(servidor, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'flores-barrio-script/1.0' },
        body: new URLSearchParams({ data: consulta }),
        signal: AbortSignal.timeout(120000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      json = await r.json();
    } catch (e) {
      ultimo = e; console.log(`    intento ${i + 1} falló (${e.message}), reintentando…`);
      await new Promise(ok => setTimeout(ok, 4000));
    }
  }
  if (!json) throw ultimo;
  const capas = { calles: [], edificios: [], agua: [] };
  for (const e of json.elements) {
    if (e.type !== 'way' || !e.geometry) continue;
    const coords = e.geometry.map(p => [p.lon, p.lat]), t = e.tags || {};
    const cerrado = coords.length > 3 && coords[0][0] === coords.at(-1)[0] && coords[0][1] === coords.at(-1)[1];
    const feat = (geometry) => ({ type: 'Feature', id: e.id, properties: t, geometry });
    if (t.highway) capas.calles.push(feat({ type: 'LineString', coordinates: coords }));
    else if (t.building && cerrado) capas.edificios.push(feat({ type: 'Polygon', coordinates: [coords] }));
    else if (t.natural === 'water' && cerrado) capas.agua.push(feat({ type: 'Polygon', coordinates: [coords] }));
    else if (t.waterway) capas.agua.push(feat({ type: 'LineString', coordinates: coords }));
  }
  for (const [nombre, features] of Object.entries(capas))
    fs.writeFileSync(path.join(DATA, nombre + '.geojson'), JSON.stringify({ type: 'FeatureCollection', features }));
  return capas;
}

// ---------- Mapa de verificación ----------
function escribirPreview(poligono, resultados) {
  const incrustar = o => JSON.stringify(o).replace(/</g, '\\u003c');
  const area = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: poligono } };
  const capas = resultados.filter(r => r.datos && r.mapa !== false).map(r => ({ titulo: r.titulo, color: r.color, datos: r.datos }));
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verificación del área del juego</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0}body{font-family:system-ui,sans-serif}
.leyenda{background:#fff;padding:8px 10px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.3);font-size:13px;line-height:1.6}
.leyenda i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const AREA=${incrustar(area)};
const CAPAS=${incrustar(capas)};
const map=L.map('map',{preferCanvas:true});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,maxNativeZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
const borde=L.geoJSON(AREA,{style:{color:'#e53935',weight:3,fill:false,dashArray:'6 4'}}).addTo(map);
map.fitBounds(borde.getBounds().pad(0.15));
const control=L.control.layers(null,{'Área del juego':borde},{collapsed:false}).addTo(map);
const filas=CAPAS.map(c=>{
  const capa=L.geoJSON(c.datos,{
    style:{color:c.color,weight:2,fillOpacity:.25},
    pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:4,color:c.color,weight:1,fillColor:c.color,fillOpacity:.7}),
    onEachFeature:(f,l)=>{const p=f.properties||{};l.bindPopup('<b>'+c.titulo+'</b><br>'+Object.keys(p).slice(0,14).map(k=>k+': '+p[k]).join('<br>'));}
  }).addTo(map);
  control.addOverlay(capa,c.titulo+' ('+c.datos.features.length+')');
  return '<i style="background:'+c.color+'"></i>'+c.titulo+': '+c.datos.features.length;
});
const ley=L.control({position:'bottomleft'});
ley.onAdd=()=>{const d=L.DomUtil.create('div','leyenda');d.innerHTML='<i style="background:#e53935"></i>Área del juego<br>'+filas.join('<br>');return d;};
ley.addTo(map);
</script></body></html>`;
  fs.writeFileSync(path.join(DATA, 'preview.html'), html);
}

// ---------- Principal ----------
(async () => {
  const poligono = leerArea();
  const ext = poligono[0];
  const lons = ext.map(p => p[0]), lats = ext.map(p => p[1]);
  console.log('Área del juego: ' + (ext.length - 1) + ' vértices');
  console.log(`  norte ${Math.max(...lats)} · sur ${Math.min(...lats)} · este ${Math.max(...lons)} · oeste ${Math.min(...lons)}\n`);
  const esri = aEsri(poligono);

  const resultados = [];
  for (const capa of CAPAS) {
    console.log('Descargando ' + capa.nombre + '…');
    try {
      let datos;
      if (capa.paginar) datos = await descargarPaginado(capa.url, esri);
      else {
        const j = await consultar(capa.url, esri);
        if (excedio(j)) console.log('    Aviso: el servidor cortó la respuesta; puede haber más elementos.');
        datos = { type: 'FeatureCollection', features: j.features };
      }
      fs.writeFileSync(path.join(DATA, capa.nombre + '.geojson'), JSON.stringify(datos));
      resultados.push({ ...capa, datos });
    } catch (e) {
      const causa = e.cause ? ' (' + (e.cause.code || e.cause.message) + ')' : '';
      console.log('    ERROR: ' + e.message + causa);
      resultados.push({ ...capa, error: e.message + causa });
    }
  }

  console.log('Descargando calles, edificios y agua (OpenStreetMap)…');
  let osm = null, osmError = null;
  try { osm = await descargarOSM(poligono); } catch (e) { osmError = e.message; console.log('    ERROR: ' + e.message); }

  console.log('\n===== Elementos por capa =====');
  for (const r of resultados)
    console.log('  ' + (r.nombre + '.geojson').padEnd(24) + (r.datos ? r.datos.features.length : 'FALLÓ: ' + r.error));
  for (const n of ['calles', 'edificios', 'agua'])
    console.log('  ' + (n + '.geojson').padEnd(24) + (osm ? osm[n].length : 'FALLÓ: ' + osmError));
  if (osmError) process.exitCode = 1;

  const arboles = resultados.find(r => r.nombre === 'arboles');
  if (arboles && arboles.datos && arboles.datos.features.length) {
    const props = arboles.datos.features[0].properties || {};
    const campo = Object.keys(props).find(k => k.toLowerCase() === 'nombre_esp');
    if (!campo) console.log('\nNo encontré el campo Nombre_Esp. Campos disponibles: ' + Object.keys(props).join(', '));
    else {
      const conteo = {};
      for (const f of arboles.datos.features) { const n = (f.properties[campo] || '(sin especie)').toString().trim(); conteo[n] = (conteo[n] || 0) + 1; }
      const orden = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
      console.log(`\n===== Árboles por especie (${orden.length} especies) =====`);
      for (const [n, c] of orden) console.log('  ' + String(c).padStart(5) + '  ' + n);
    }
  }

  escribirPreview(poligono, resultados);
  console.log('\nMapa de verificación: data/preview.html');
  if (resultados.some(r => r.error)) process.exitCode = 1;
})().catch(e => { console.error('Error: ' + e.message); process.exit(1); });
