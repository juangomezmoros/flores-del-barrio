# Flores del Barrio

Juego en el navegador sobre un barrio real de Bogotá: recoges los residuos de tu casa y de tus vecinos, llenas pacas digestoras, siembras flores y cultivos en las huertas, y evitas que todo termine en el botadero. De paso puedes registrar los árboles reales del barrio.

## Jugar

Abre `index.html` desde un servidor web (por ejemplo, GitHub Pages) o en local:

```bash
node scripts/servidor.js
```

y entra a http://localhost:8123. Para abrirlo desde un celular en la misma red WiFi:

```bash
HOST=0.0.0.0 PORT=8080 node scripts/servidor.js
```

## Actualizar el mapa

El área del juego está en `data/area_juego.geojson`. Si la cambias:

```bash
node scripts/descargar_datos.js
node scripts/construir_mapa.js
```

Solo se necesita Node.js; los scripts no tienen dependencias.

## Archivos

- `index.html`: la página del juego.
- `juego.js`: reglas, mapa, personajes y paneles. Los precios y tiempos están al principio.
- `especies.js`: dibujos en píxel de las flores y los árboles.
- `data/mapa.js`: el mapa ya procesado (lo genera `construir_mapa.js`).
- `scripts/`: descarga de datos, construcción del mapa y servidor local.

## Datos

- Censo de arbolado urbano y huertas: Jardín Botánico de Bogotá (IDECA).
- Parques: Instituto Distrital de Recreación y Deporte (IDRD).
- Calles, edificios y agua: © colaboradores de OpenStreetMap, bajo licencia ODbL.
