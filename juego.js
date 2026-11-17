// ======================= REGLAS DEL JUEGO (para ajustar fácil) =======================
const DIA=20;                 // segundos reales que dura un día de juego
const GENERA={org:3,rec:2,bas:1}; // kilos que produce tu casa cada día
const CAMION_CADA=5;          // cada cuántos días pasa el camión
const COSTO_BOTADERO=30;      // lo que cobra el camión por kilo
const PRECIO_RECICLAJE=150;   // lo que paga el reciclador por kilo
const PACA_KG=12;             // kilos de orgánicos para llenar una paca
const TIERRA_POR_PACA=5;      // kilos de tierra que da una paca al recoger la flor
const PRECIO_TIERRA=200;      // por kilo, vendida en una huerta
const MES=30;                 // días de un mes de juego
const FLORES=[ // nivel: 0 = paca nivel 1, 1 = nivel 2, 2 = nivel 3
  {n:'Margarita', spec:F('daisy','#ffffff','#d6dbe6','#f5c21b'),            nivel:0, costo:0,   seg:40,  premio:400},
  {n:'Girasol',   spec:F('daisy','#ffd23f','#e8a713','#6b3e1d','',{big:true}),nivel:0, costo:150, seg:70,  premio:900},
  {n:'Lavanda',   spec:F('lavanda','#a78bfa','#7c5ad6','#a78bfa'),          nivel:1, costo:300, seg:100, premio:1500},
  {n:'Rosa',      spec:F('rose','#e8384f','#a81c36','#e8384f'),             nivel:1, costo:500, seg:140, premio:2400},
  {n:'Hortensia', spec:F('cluster','#7fa8f5','#4f74d1','#dfe9ff'),          nivel:2, costo:800, seg:180, premio:3600},
  {n:'Orquídea',  spec:F('orchid','#d58cf0','#9b3fc4','#ffd23f'),           nivel:2, costo:1200,seg:240, premio:5200},
  {n:'Cartucho',  spec:F('calla','#ffffff','#cfd8dc','#f5c21b'),            nivel:0, costo:250, seg:90,  premio:1200},
  {n:'Cayena',    spec:F('cayena','#ff5a4d','#c2271f','#ffd23f'),           nivel:1, costo:650, seg:160, premio:3000},
];
const ORDEN_FLORES=FLORES.map((f,i)=>i).sort((a,b)=>FLORES[a].nivel-FLORES[b].nivel||FLORES[a].costo-FLORES[b].costo);
const CULTIVOS=[ // nivel: 0 = huerta nivel 1, 1 = nivel 2, 2 = nivel 3
  {n:'Lechuga',   nivel:0, tierra:2, seg:50,  premio:700,  col:'#7ed957'},
  {n:'Zanahoria', nivel:0, tierra:3, seg:90,  premio:1200, col:'#ff8c2e'},
  {n:'Tomate',    nivel:1, tierra:5, seg:140, premio:2200, col:'#e53935'},
  {n:'Fresa',     nivel:1, tierra:4, seg:110, premio:1800, col:'#e91e63'},
  {n:'Maíz',      nivel:2, tierra:6, seg:170, premio:3200, col:'#ffd23f'},
  {n:'Ahuyama',   nivel:2, tierra:8, seg:220, premio:4600, col:'#f57c00'},
];
const ORDEN_CULTIVOS=CULTIVOS.map((c,i)=>i).sort((a,b)=>CULTIVOS[a].nivel-CULTIVOS[b].nivel||CULTIVOS[a].premio-CULTIVOS[b].premio);
// Vecinos: producen residuos; si los recoges te pagan, si no se los lleva el camión
const VECINO_GENERA={org:2,rec:1.5}, VECINO_TOPE=14, PAGO_VECINO=60;
const VECINOS=[['Doña Rosa','#7a4fa3'],['Don Luis','#3f6fb5'],['Familia Gómez','#d98a2b'],['Sofi y Mateo','#2f8f7a'],['Doña Carmen','#b5506e'],['Juancho','#607d8b']];
const CARRITOS=[{cap:8},{cap:16,n:'Carrito grande',precio:2000},{cap:30,n:'Remolque de carga',precio:6000}];
const PRECIO_BICI=3500;
const CARRETA_KG=12, PRECIO_CARRETA=2500;      // carreta de reciclaje: se le compra al reciclador
const PRECIO_CANECAS=1200, BONO_CANECAS=1.3;    // canecas de separación: el reciclaje se paga mejor
const COMPRA_TIERRA=350, PRECIO_ABONO=250;      // en la tienda
const NIVELES=[{vel:1,premio:1},{vel:1.4,premio:1.25,precio:1500},{vel:2,premio:1.5,precio:4000}]; // mejoras de pacas y huertas
const SOMBREROS=[
  {id:'gorra',    n:'Gorra roja',        precio:400,  copa:'#e2574c', ala:'#b83a30', gorra:true},
  {id:'paja',     n:'Sombrero de paja',  precio:600,  copa:'#f0d98a', ala:'#e6c66a', cinta:'#7a4a21'},
  {id:'vueltiao', n:'Sombrero vueltiao', precio:1500, copa:'#f3ead2', ala:'#f3ead2', cinta:'#2b1d0e', rayas:true},
];
FLORES.forEach(f=>{ f.hi=genGrande(f.spec); });

// ======================= ESTADO Y GUARDADO =======================
const KEY='floresDelBarrio.v3';
const par=(a,fn)=>{ const o=[]; for(let i=0;i<a.length;i+=2) o.push(fn(a[i],a[i+1],i/2)); return o; };
const nuevo=()=>({monedas:500,dia:1,t:0,casa:{org:3,rec:2,bas:1},carro:{org:0,rec:0},tierra:0,abono:0,sombreros:{},puesto:'',mejoras:{},
  pacas:par(MAPA.pacas,()=>({kg:0,s:[]})),huertas:par(MAPA.huertas,()=>({c:-1,t:0})),
  mes:{gen:6,aprov:0,bot:0},anterior:null,flores:0,cosechas:0,found:{},visto:false});
let S=nuevo();
try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.pacas&&s.pacas.length===S.pacas.length&&s.huertas.length===S.huertas.length) S=Object.assign(S,s); }catch(e){}
// Ajuste de balance: la primera versión cobraba demasiado y dejaba deudas imposibles; se perdonan una sola vez
if((S.v||1)<2){ if(S.monedas<0) S.monedas=0; S.v=2; }
// Partidas anteriores: cada paca tenía una sola flor; ahora tiene una lista de flores sembradas
S.pacas.forEach(p=>{ if(!p.s){ p.s=p.flor>=0?[{f:p.flor,t:p.t||0}]:[]; delete p.flor; delete p.t; } });
function persist(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
const capacidad=()=>CARRITOS[Math.min(2,S.mejoras.carrito||0)].cap;
const libreOrg=()=>capacidad()-S.carro.org-(S.mejoras.carreta?0:S.carro.rec);
const libreRec=()=>S.mejoras.carreta?CARRETA_KG-S.carro.rec:capacidad()-S.carro.org-S.carro.rec;
const nivelDe=o=>Math.min(2,o.n||0);
const carga=()=>S.carro.org+S.carro.rec;
const kg=v=>(Math.round(v*10)/10).toString().replace('.',',');

// ======================= MAPA LISO =======================
const $=id=>document.getElementById(id);
const cv=$('game'), ctx=cv.getContext('2d'), VW=cv.width, VH=cv.height;
const Z=6;                    // píxeles por metro
const trazo=(p,cerrar)=>{ const q=new Path2D(); q.moveTo(p[0],p[1]); for(let i=2;i<p.length;i+=2) q.lineTo(p[i],p[i+1]); if(cerrar) q.closePath(); return q; };
const junta=(lista,cerrar)=>{ const q=new Path2D(); lista.forEach(p=>q.addPath(trazo(p,cerrar))); return q; };
const AREA=trazo(MAPA.area,true);
const FUERA=new Path2D(); FUERA.rect(-500,-500,MAPA.w+1000,MAPA.h+1000); FUERA.addPath(AREA);
const anchos=[...new Set(MAPA.calles.filter(c=>!c.s).map(c=>c.a))].sort((a,b)=>a-b);
const CALLES=anchos.map(a=>({a,q:junta(MAPA.calles.filter(c=>!c.s&&c.a===a).map(c=>c.p))}));
const SENDEROS=junta(MAPA.calles.filter(c=>c.s).map(c=>c.p));
const EDIFICIOS=junta(MAPA.edificios,true), PARQUES=junta(MAPA.parques.map(p=>p.p),true);
const AGUA_POL=junta(MAPA.agua.filter(a=>a.pol).map(a=>a.p),true), AGUA_LIN=MAPA.agua.filter(a=>!a.pol).map(a=>({a:a.a,q:trazo(a.p)}));
function enPoligono(p,x,y){ let d=false; for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){ if((p[i+1]>y)!==(p[j+1]>y)&&x<(p[j]-p[i])*(y-p[i+1])/(p[j+1]-p[i+1])+p[i]) d=!d; } return d; }
const enArea=(x,y)=>enPoligono(MAPA.area,x,y);

function dibujarMapa(g,escala,ox,oy,detalle){
  g.save(); g.setTransform(escala,0,0,escala,-ox,-oy);
  g.fillStyle='#bfe3a0'; g.fill(PARQUES);
  g.fillStyle='#9fd3f0'; g.fill(AGUA_POL); g.strokeStyle='#9fd3f0'; g.lineCap=g.lineJoin='round';
  AGUA_LIN.forEach(a=>{ g.lineWidth=a.a; g.stroke(a.q); });
  if(detalle){ g.strokeStyle='#cfc3a4'; CALLES.forEach(c=>{ g.lineWidth=c.a+3.2; g.stroke(c.q); }); }
  g.strokeStyle='#fffdf6'; CALLES.forEach(c=>{ g.lineWidth=detalle?c.a:Math.max(c.a,9); g.stroke(c.q); });
  if(detalle){
    g.strokeStyle='#e3cf9c'; g.lineWidth=1.6; g.setLineDash([2.5,2]); g.stroke(SENDEROS); g.setLineDash([]);
    g.fillStyle='#eadcc0'; g.fill(EDIFICIOS); g.strokeStyle='#c9b48c'; g.lineWidth=.5; g.stroke(EDIFICIOS);
  }
  g.fillStyle=detalle?'rgba(40,60,48,.5)':'rgba(24,38,28,.72)'; g.fill(FUERA,'evenodd');
  g.strokeStyle='#e2574c'; g.lineWidth=detalle?1:5; g.setLineDash(detalle?[4,3]:[]); g.stroke(AREA); g.setLineDash([]);
  g.restore();
}

// ---------- Sprites en píxel ----------
function spr(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d');
  fn((x,y,ww,hh,col)=>{ g.fillStyle=col; g.fillRect(x,y,ww,hh); }); return c; }
const casaSpr=col=>spr(26,26,r=>{ r(2,24,24,2,'rgba(0,0,0,.2)'); r(18,0,3,5,'#8d6e63'); r(1,3,24,10,col); for(let y=5;y<13;y+=3) r(1,y,24,1,shade(col,.8));
  r(0,12,26,2,shade(col,.62)); r(2,14,22,10,'#f3e6c6'); r(2,22,22,2,'#d9c79b'); r(11,17,5,7,'#7a4a21'); r(14,20,1,1,'#ffd23f');
  r(4,16,5,5,'#fff'); r(5,17,3,3,'#8fd0f0'); r(17,16,5,5,'#fff'); r(18,17,3,3,'#8fd0f0'); });
const CASA=casaSpr('#c0483c'), CASAS_VEC=VECINOS.map(v=>casaSpr(v[1]));
const BOLSA=spr(7,7,r=>{ r(1,2,5,5,'#2b2b2b'); r(0,3,7,3,'#2b2b2b'); r(2,0,3,2,'#444'); r(2,3,1,1,'#666'); });
const PACA=[0,1].map(lleno=>spr(22,16,r=>{ r(1,14,21,2,'rgba(0,0,0,.2)'); r(0,4,22,11,'#8d5a2b'); r(1,5,20,9,'#5c3a1a');
  for(let x=0;x<22;x+=5) r(x,4,2,11,'#6b4320'); r(0,8,22,1,'#a5713a');
  if(lleno){ r(1,1,20,4,'#4a2f17'); r(3,0,16,1,'#4a2f17'); [[3,2,'#7ed957'],[8,1,'#ff8c2e'],[13,3,'#ffd23f'],[17,2,'#7ed957'],[6,3,'#c2a878'],[11,2,'#7ed957']].forEach(([x,y,c])=>r(x,y,2,1,c)); } }));
const HUERTA=spr(22,14,r=>{ r(1,12,21,2,'rgba(0,0,0,.2)'); r(0,1,22,12,'#8d5a2b'); r(1,2,20,10,'#5c3a1a'); for(let y=4;y<12;y+=3) r(2,y,18,1,'#4a2f17'); });
const CARRETA=spr(16,12,r=>{ r(1,10,14,2,'rgba(0,0,0,.2)'); r(0,3,13,6,'#2f6fb5'); r(0,3,13,1,'#5b97d6'); r(13,2,3,1,'#555'); r(2,9,3,3,'#222'); r(9,9,3,3,'#222');
  r(1,0,5,3,'#f5f5f5'); r(6,1,5,2,'#e0e0e0'); });
const SACO=spr(6,5,r=>{ r(0,1,6,4,'#f5f5f5'); r(2,0,2,1,'#bbb'); });
const espejo=c=>{ const m=document.createElement('canvas'); m.width=c.width; m.height=c.height; const g=m.getContext('2d'); g.translate(c.width,0); g.scale(-1,1); g.drawImage(c,0,0); return m; };
const lados=c=>({right:c,left:espejo(c)});
const CAMION=lados(spr(30,19,r=>{ r(2,17,26,2,'rgba(0,0,0,.22)'); r(0,2,19,12,'#3d8f45'); r(0,2,19,2,'#58b868'); r(2,6,15,1,'#2d6e35'); r(2,9,15,1,'#2d6e35'); r(0,13,19,1,'#2d6e35');
  r(19,5,9,9,'#f5f5f5'); r(22,6,5,4,'#8fd0f0'); r(19,13,11,2,'#555'); r(28,10,2,2,'#ffd23f');
  r(3,13,6,6,'#222'); r(5,15,2,2,'#999'); r(20,13,6,6,'#222'); r(22,15,2,2,'#999'); }));
const BICI=lados(spr(22,13,r=>{ r(1,11,20,2,'rgba(0,0,0,.2)');
  [[0,5],[14,5]].forEach(([x,y])=>{ r(x+1,y,5,1,'#222'); r(x+1,y+6,5,1,'#222'); r(x,y+1,1,5,'#222'); r(x+6,y+1,1,5,'#222'); r(x+3,y+3,1,1,'#999'); });
  r(4,7,7,1,'#e2574c'); r(10,4,1,4,'#e2574c'); r(10,4,6,1,'#e2574c'); r(16,2,1,6,'#e2574c'); r(11,7,6,1,'#e2574c'); r(15,1,4,1,'#333'); r(8,3,4,1,'#333'); }));
const TIENDA=spr(30,26,r=>{ r(2,24,28,2,'rgba(0,0,0,.2)'); r(1,1,28,7,'#8e44ad'); r(1,1,28,1,'#a96bc4'); r(5,3,20,3,'#f6ecd0');
  for(let x=1;x<29;x+=4) r(x,8,4,4,(x>>2)%2?'#fff':'#e2574c'); r(2,12,26,12,'#f3e6c6'); r(2,22,26,2,'#d9c79b');
  r(4,14,9,7,'#fff'); r(5,15,7,5,'#8fd0f0'); r(6,17,2,3,'#3d8f45'); r(9,16,2,4,'#e6c66a'); r(18,14,7,10,'#7a4a21'); r(23,19,1,1,'#ffd23f'); });
const personas={};
function persona(col,dir,step){ const k=col.shirt+dir+step; return personas[k]||(personas[k]=spr(12,17,r=>{
  r(2,15,8,2,'rgba(0,0,0,.22)'); r(3,11,2,step===1?3:4,col.pants); r(7,11,2,step===2?3:4,col.pants);
  r(3,step===1?14:15,2,1,'#2b1d0e'); r(7,step===2?14:15,2,1,'#2b1d0e'); r(2,7,8,5,col.shirt);
  r(1,8,1,3,col.skin); r(10,8,1,3,col.skin); r(2,2,8,5,col.skin); r(2,0,8,3,col.hair); r(1,1,1,3,col.hair); r(10,1,1,3,col.hair);
  if(dir==='up'){ r(2,2,8,4,col.hair); return; }
  if(dir==='down'){ r(4,4,1,2,'#2b1d0e'); r(7,4,1,2,'#2b1d0e'); }
  else if(dir==='left'){ r(3,4,1,2,'#2b1d0e'); r(7,2,3,3,col.hair); }
  else { r(8,4,1,2,'#2b1d0e'); r(2,2,3,3,col.hair); } })); }
const YO={hair:'#4a2c14',skin:'#f0c49a',shirt:'#e2574c',pants:'#2f4f9c'}, RECI={hair:'#222',skin:'#c98d5e',shirt:'#2f6fb5',pants:'#3a3a45'};

// ---------- Sitios y árboles ----------
// La tienda queda en una esquina cerca de la casa
const TIENDA_POS=(()=>{ let m=null, md=Infinity; const ox=MAPA.casa[0]-90, oy=MAPA.casa[1]+30;
  MAPA.calles.forEach(c=>{ if(c.s||c.a<7) return; for(let i=0;i<c.p.length;i+=2){ const x=c.p[i]+8, y=c.p[i+1]+8, d=Math.hypot(x-ox,y-oy);
    if(d<md&&enArea(x,y)&&Math.hypot(x-MAPA.casa[0],y-MAPA.casa[1])>45){ md=d; m=[x,y]; } } });
  return m||[MAPA.casa[0]-40,MAPA.casa[1]+30]; })();
const SITIOS=[{t:'casa',x:MAPA.casa[0],y:MAPA.casa[1],i:0},{t:'tienda',x:TIENDA_POS[0],y:TIENDA_POS[1],i:0}]
  .concat(par(MAPA.pacas,(x,y,i)=>({t:'paca',x,y,i})), par(MAPA.huertas,(x,y,i)=>({t:'huerta',x,y,i})), par(MAPA.recicladores,(x,y,i)=>({t:'rec',x,y,i})));

// Casas de vecinos: edificios reales cercanos a la tuya, separados entre sí
{ const cand=[]; MAPA.edificios.forEach(p=>{ let x=0,y=0; for(let i=0;i<p.length;i+=2){ x+=p[i]; y+=p[i+1]; } x/=p.length/2; y/=p.length/2; if(enArea(x,y)) cand.push([x,y,Math.hypot(x-MAPA.casa[0],y-MAPA.casa[1])]); });
  cand.sort((a,b)=>a[2]-b[2]); const puestos=[];
  for(const q of cand){ if(puestos.length>=VECINOS.length) break; if(q[2]<90) continue;
    if(puestos.some(v=>Math.hypot(v[0]-q[0],v[1]-q[1])<110)||SITIOS.some(s=>Math.hypot(s.x-q[0],s.y-q[1])<28)) continue; puestos.push(q); }
  puestos.forEach((q,i)=>SITIOS.push({t:'vecino',x:q[0],y:q[1],i}));
  if(!S.vecinos||S.vecinos.length!==puestos.length) S.vecinos=puestos.map(()=>({org:2,rec:1.5})); }

// ---------- Camión de la basura: recorre las calles hasta tu casa ----------
const nodos=new Map();
const nodo=(x,y)=>{ const k=Math.round(x)+','+Math.round(y); let n=nodos.get(k); if(!n){ n={x,y,v:[],d:Infinity,prev:null,ok:false}; nodos.set(k,n); } return n; };
MAPA.calles.forEach(c=>{ if(c.s||c.a<7) return; for(let i=0;i<c.p.length-2;i+=2){ const a=nodo(c.p[i],c.p[i+1]), b=nodo(c.p[i+2],c.p[i+3]); if(a!==b){ a.v.push(b); b.v.push(a); } } });
const RUTAS=(()=>{ const L=[...nodos.values()]; if(!L.length) return null;
  const cerca=L.reduce((m,n)=>Math.hypot(n.x-MAPA.casa[0],n.y-MAPA.casa[1])<Math.hypot(m.x-MAPA.casa[0],m.y-MAPA.casa[1])?n:m); cerca.d=0;
  for(;;){ let u=null; for(const n of L) if(!n.ok&&n.d<Infinity&&(!u||n.d<u.d)) u=n; if(!u) break; u.ok=true;
    for(const w of u.v){ const d=u.d+Math.hypot(w.x-u.x,w.y-u.y); if(d<w.d){ w.d=d; w.prev=u; } } }
  const llegan=L.filter(n=>n.ok), camino=n=>{ const r=[]; for(;n;n=n.prev) r.push([n.x,n.y]); return r; }; // de n hasta la casa
  const medir=pts=>{ const acum=[0]; for(let i=1;i<pts.length;i++) acum.push(acum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1])); return {pts,acum,largo:acum[acum.length-1]||1}; };
  const entrada=llegan.reduce((m,n)=>n.x<m.x?n:m), salida=llegan.reduce((m,n)=>n.x>m.x?n:m);
  return {llegada:medir(camino(entrada)), ida:medir(camino(salida).reverse())}; })();
function puntoEn(r,f){ const d=Math.max(0,Math.min(1,f))*r.largo; let i=1; while(i<r.acum.length-1&&r.acum[i]<d) i++;
  const a=r.pts[i-1], b=r.pts[i]||a, t=(d-r.acum[i-1])/((r.acum[i]-r.acum[i-1])||1); return {x:a[0]+(b[0]-a[0])*t, y:a[1]+(b[1]-a[1])*t, dx:b[0]-a[0]}; }
let ladoCamion='right';
function camion(){ if(!RUTAS) return null; const f=((S.dia%CAMION_CADA)*DIA+S.t)/(CAMION_CADA*DIA);
  const c=f<.15?puntoEn(RUTAS.ida,f/.15):puntoEn(RUTAS.llegada,(f-.15)/.85); if(Math.abs(c.dx)>.5) ladoCamion=c.dx<0?'left':'right'; return c; }
const AR=MAPA.arboles, CELDA=32, rejilla=new Map();
for(let k=0;k<AR.length;k+=4){ const key=Math.floor(AR[k+1]/CELDA)*4096+Math.floor(AR[k]/CELDA); (rejilla.get(key)||rejilla.set(key,[]).get(key)).push(k); }
function arbolesEn(x0,y0,x1,y1,fn){ for(let cy=Math.floor(y0/CELDA);cy<=Math.floor(y1/CELDA);cy++)for(let cx=Math.floor(x0/CELDA);cx<=Math.floor(x1/CELDA);cx++){
  const l=rejilla.get(cy*4096+cx); if(l) for(const k of l) fn(k); } }

// ---------- Minimapa ----------
const mini=$('mini'), miniBase=document.createElement('canvas'); const ME=320/MAPA.w;
mini.width=miniBase.width=320; mini.height=miniBase.height=Math.round(MAPA.h*ME);
{ const g=miniBase.getContext('2d'); g.fillStyle='#dfeecb'; g.fillRect(0,0,320,mini.height); dibujarMapa(g,ME,0,0,false); }
const mctx=mini.getContext('2d');
const COLOR_SITIO={vecino:'#f48fb1',tienda:'#8e44ad',casa:'#e2574c',paca:'#8d5a2b',huerta:'#ff8c2e',rec:'#2f6fb5'};

// ======================= JUEGO =======================
const pl={x:MAPA.casa[0],y:MAPA.casa[1]+9,dir:'down',step:0,dest:null};
const keys={}; let paused=false, time=0, abierto=null, lugar='', cam={x:0,y:0};
const cupos=p=>nivelDe(p)>=1?2:1;   // desde el nivel 2 una paca aguanta dos flores
const estadoPaca=p=>p.kg<PACA_KG?'llenando':!p.s.length?'sembrar':p.s.every(s=>s.t>=FLORES[s.f].seg)?'lista':'creciendo';
const estadoHuerta=h=>h.c<0?'vacia':h.t<CULTIVOS[h.c].seg?'creciendo':'lista';
const llama=s=>s.t==='paca'?['sembrar','lista'].includes(estadoPaca(S.pacas[s.i])):s.t==='huerta'?estadoHuerta(S.huertas[s.i])==='lista':false;

function pasarDia(){
  S.dia++; const bas=GENERA.bas;
  S.casa.org+=GENERA.org; S.casa.rec+=GENERA.rec; S.casa.bas+=bas; S.mes.gen+=GENERA.org+GENERA.rec+bas;
  S.vecinos.forEach(v=>{ if(v.org+v.rec<VECINO_TOPE){ v.org+=VECINO_GENERA.org; v.rec+=VECINO_GENERA.rec; } });
  if(S.dia%CAMION_CADA===0){ const k=S.casa.org+S.casa.rec+S.casa.bas, cobro=Math.round(k*COSTO_BOTADERO);
    S.monedas-=cobro; S.mes.bot+=k; S.casa={org:0,rec:0,bas:0};
    const kv=S.vecinos.reduce((a,v)=>a+v.org+v.rec,0); S.vecinos.forEach(v=>{ v.org=0; v.rec=0; }); S.mes.vecBot=(S.mes.vecBot||0)+kv;
    showToast('Pasó el camión: '+kg(k)+' kg tuyos al botadero, −$'+cobro+(kv?'. De tus vecinos se llevó '+kg(kv)+' kg':'')); }
  if(S.dia%MES===0){ const m=S.mes, pct=m.gen?Math.round(m.aprov/m.gen*100):0, ant=S.anterior;
    say('<b>Fin del mes</b>Tu casa produjo '+kg(m.gen)+' kg. Aprovechaste '+kg(m.aprov)+' kg ('+pct+'%) y mandaste '+kg(m.bot)+' kg al botadero.'
      +((m.vecBot||0)?' El camión se llevó además '+kg(m.vecBot)+' kg de tus vecinos que nadie recogió.':'')+(ant?' El mes pasado fueron '+kg(ant.bot)+' kg al botadero.':'')+' ¡A mejorar el próximo!');
    S.anterior=m; S.mes={gen:0,aprov:0,bot:0}; }
  persist(); if(abierto) pintarPanel();
}

function update(dt){
  // el tiempo corre: días, flores y cultivos
  S.t+=dt; if(S.t>=DIA){ S.t-=DIA; pasarDia(); }
  S.pacas.forEach(p=>p.s.forEach(s=>{ if(s.t<FLORES[s.f].seg) s.t+=dt*NIVELES[nivelDe(p)].vel; }));
  S.huertas.forEach(h=>{ if(h.c>=0&&h.t<CULTIVOS[h.c].seg) h.t+=dt*NIVELES[nivelDe(h)].vel; });
  // movimiento: teclas o destino tocado
  let dx=0,dy=0;
  if(keys.left)dx-=1; if(keys.right)dx+=1; if(keys.up)dy-=1; if(keys.down)dy+=1;
  if(dx||dy) pl.dest=null;
  else if(pl.dest){ const ex=pl.dest.x-pl.x, ey=pl.dest.y-pl.y, d=Math.hypot(ex,ey), cerca=pl.dest.obj?(pl.dest.obj.arbol!==undefined?3:1.5):.6;
    if(d<=cerca){ const o=pl.dest.obj; pl.dest=null; if(o) llegar(o); } else { dx=ex/d; dy=ey/d; } }
  const mov=!!(dx||dy);
  if(mov){ const n=Math.hypot(dx,dy), v=(S.mejoras.bici?30:18)*dt; dx=dx/n*v; dy=dy/n*v;
    pl.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    if(enArea(pl.x+dx,pl.y+dy)){ pl.x+=dx; pl.y+=dy; }
    else if(enArea(pl.x+dx,pl.y)) pl.x+=dx; else if(enArea(pl.x,pl.y+dy)) pl.y+=dy; else pl.dest=null;
    pl.step=S.mejoras.bici?0:1+(Math.floor(time*8)%2);
  } else pl.step=0;
  if(abierto&&Math.hypot(abierto.x-pl.x,abierto.y+7-pl.y)>16) cerrarPanel();
  // rótulo del parque donde estás
  const pq=MAPA.parques.find(p=>enPoligono(p.p,pl.x,pl.y)), nom=pq?pq.n:'';
  if(nom!==lugar){ lugar=nom; $('place').textContent=nom; $('place').style.display=nom?'block':'none'; }
}

function burbuja(x,y,listo){ y+=Math.round(Math.sin(time*6)*2);
  ctx.fillStyle='#2b1d0e'; ctx.fillRect(x-13,y-3,26,29); ctx.fillRect(x-4,y+26,8,5);
  ctx.fillStyle=listo?'#58d858':'#fff'; ctx.fillRect(x-10,y,20,23); ctx.fillRect(x-1,y+23,2,3);
  ctx.fillStyle=listo?'#fff':'#e2574c'; ctx.fillRect(x-2,y+3,4,11); ctx.fillRect(x-2,y+17,4,4); }
function barra(x,y,f){ ctx.fillStyle='#2b1d0e'; ctx.fillRect(x-22,y,44,9); ctx.fillStyle='#cdbb98'; ctx.fillRect(x-20,y+2,40,5);
  ctx.fillStyle='#3d8f45'; ctx.fillRect(x-20,y+2,Math.round(40*Math.max(0,Math.min(1,f))),5); }

function draw(){
  cam.x=Math.max(0,Math.min(MAPA.w-VW/Z,pl.x-VW/Z/2)); cam.y=Math.max(0,Math.min(MAPA.h-VH/Z,pl.y-VH/Z/2));
  const ox=Math.round(cam.x*Z), oy=Math.round(cam.y*Z), X=x=>Math.round(x*Z)-ox, Y=y=>Math.round(y*Z)-oy;
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#dfeecb'; ctx.fillRect(0,0,VW,VH);
  dibujarMapa(ctx,Z,ox,oy,true);
  // nombres de calles
  ctx.font='bold 13px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#9aa0a8';
  MAPA.rotulos.forEach(r=>{ const x=X(r.x), y=Y(r.y); if(x<-80||y<-80||x>VW+80||y>VH+80) return;
    if(r.v){ ctx.save(); ctx.translate(x,y); ctx.rotate(-Math.PI/2); ctx.fillText(r.n,0,0); ctx.restore(); } else ctx.fillText(r.n,x,y); });
  ctx.imageSmoothingEnabled=false;
  if(pl.dest&&!pl.dest.obj){ ctx.strokeStyle='#e2574c'; ctx.lineWidth=3; const x=X(pl.dest.x), y=Y(pl.dest.y), r=6+Math.sin(time*8)*2; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.stroke(); }
  // todo lo que va encima, ordenado de arriba a abajo
  const ents=[];
  arbolesEn(cam.x-6,cam.y-2,cam.x+VW/Z+6,cam.y+VH/Z+10,k=>ents.push({y:AR[k+1],k}));
  SITIOS.forEach(s=>{ if(X(s.x)>-80&&X(s.x)<VW+80&&Y(s.y)>-100&&Y(s.y)<VH+80) ents.push({y:s.y,s}); });
  ents.push({y:pl.y,p:1});
  const cm=camion(); if(cm&&X(cm.x)>-90&&X(cm.x)<VW+90&&Y(cm.y)>-90&&Y(cm.y)<VH+90) ents.push({y:cm.y,c:cm});
  ents.sort((a,b)=>a.y-b.y);
  const post=[];
  for(const e of ents){
    if(e.p){ const x=X(pl.x), y=Y(pl.y), atras=(pl.dir==='right'||pl.dir==='down')?-1:1, niv=Math.min(2,S.mejoras.carrito||0), cw=[26,38,52][niv], bici=S.mejoras.bici;
      const cx=atras<0?x-(bici?26:14)-cw:x+(bici?26:14), cyy=y-22, alto=[14,16,20][niv];
      if(S.mejoras.carreta){ const kx=atras<0?cx-38:cx+cw+4; ctx.drawImage(CARRETA,kx,cyy-6,36,27); }
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(cx,cyy+20,cw,4); ctx.fillStyle=niv?'#5d6b7a':'#8a8f98'; ctx.fillRect(cx,cyy+18-alto,cw,alto); ctx.fillStyle='#b3b8c0'; ctx.fillRect(cx,cyy+18-alto,cw,3);
      ctx.fillStyle='#222'; ctx.fillRect(cx+3,cyy+17,6,6); ctx.fillRect(cx+cw-9,cyy+17,6,6); if(niv===2) ctx.fillRect(cx+cw/2-3,cyy+17,6,6);
      const cap=capacidad(), ho=Math.round((alto-2)*S.carro.org/cap), hr=S.mejoras.carreta?0:Math.round((alto-2)*S.carro.rec/cap), tope=cyy+18-alto+2;
      ctx.fillStyle='#6b4a1f'; ctx.fillRect(cx+2,tope-ho,cw-4,ho); ctx.fillStyle='#4f9be0'; ctx.fillRect(cx+2,tope-ho-hr,cw-4,hr);
      const py=y-48-(bici?15:0);
      if(bici) ctx.drawImage(BICI[pl.dir==='left'||pl.dir==='up'?'left':'right'],x-33,y-36,66,39);
      ctx.drawImage(persona(YO,pl.dir,pl.step),x-18,py,36,51);
      const h=SOMBREROS.find(o=>o.id===S.puesto);
      if(h){ const px=x-18;
        if(h.gorra){ ctx.fillStyle=h.copa; ctx.fillRect(px+6,py-3,24,9); ctx.fillStyle=h.ala;
          if(pl.dir==='right') ctx.fillRect(px+30,py+3,9,4); else if(pl.dir==='left') ctx.fillRect(px-3,py+3,9,4); else if(pl.dir==='down') ctx.fillRect(px+9,py+6,18,3); }
        else { ctx.fillStyle='#2b1d0e'; ctx.fillRect(px-5,py+2,46,7); ctx.fillStyle=h.ala; ctx.fillRect(px-4,py+3,44,5);
          if(h.rayas){ ctx.fillStyle='#2b1d0e'; for(let i=0;i<6;i++) ctx.fillRect(px-2+i*8,py+4,4,3); }
          ctx.fillStyle=h.copa; ctx.fillRect(px+6,py-7,24,10); ctx.fillStyle=h.cinta; ctx.fillRect(px+6,py,24,3); } } }
    else if(e.c){ const x=X(e.c.x), y=Y(e.c.y); ctx.drawImage(CAMION[ladoCamion],x-45,y-48,90,57); post.push(()=>etiqueta(x,y-58,'CAMIÓN')); }
    else if(e.s){ const s=e.s, x=X(s.x), y=Y(s.y);
      if(s.t==='casa'){ ctx.drawImage(CASA,x-39,y-66,78,78); post.push(()=>etiqueta(x,y-78,'TU CASA')); }
      else if(s.t==='paca'){ const p=S.pacas[s.i], est=estadoPaca(p);
        ctx.drawImage(PACA[p.kg>0?1:0],x-33,y-36,66,48); estrellas(x,y+16,nivelDe(p));
        p.s.forEach((s,k)=>{ const f=FLORES[s.f], g=Math.min(1,s.t/f.seg), t=Math.round(20+44*g), fx=x+(p.s.length>1?(k?20:-20):0); ctx.drawImage(f.hi,fx-t/2,y-30-t,t,t); });
        if(est==='llenando') post.push(()=>barra(x,y-50,p.kg/PACA_KG));
        else if(est==='creciendo') post.push(()=>barra(x,y-100,Math.min(...p.s.map(s=>s.t/FLORES[s.f].seg))));
        else post.push(()=>burbuja(x,y-(est==='lista'?128:72),est==='lista')); }
      else if(s.t==='huerta'){ const h=S.huertas[s.i], est=estadoHuerta(h); ctx.drawImage(HUERTA,x-33,y-30,66,42); estrellas(x,y+16,nivelDe(h));
        if(h.c>=0){ const c=CULTIVOS[h.c], g=Math.min(1,h.t/c.seg), t=3+Math.round(6*g);
          for(let i=0;i<8;i++){ const px=x-26+(i%4)*15, py=y-12+(i>>2)*12; ctx.fillStyle='#3d8f45'; ctx.fillRect(px,py-t,6,t); if(g>.6){ ctx.fillStyle=c.col; ctx.fillRect(px-1,py-t-4,8,6); } } }
        if(est==='creciendo') post.push(()=>barra(x,y-44,h.t/CULTIVOS[h.c].seg)); else if(est==='lista') post.push(()=>burbuja(x,y-66,true)); }
      else if(s.t==='vecino'){ const v=S.vecinos[s.i], n=Math.min(5,Math.floor((v.org+v.rec)/2.5)); ctx.drawImage(CASAS_VEC[s.i],x-39,y-66,78,78);
        for(let k=0;k<n;k++) ctx.drawImage(BOLSA,x+34+(k%3)*16-(k>2?8:0),y-14-(k>2?14:0),21,21);
        post.push(()=>etiqueta(x,y-78,VECINOS[s.i][0].toUpperCase())); }
      else if(s.t==='tienda'){ ctx.drawImage(TIENDA,x-45,y-66,90,78); post.push(()=>etiqueta(x,y-78,'TIENDA')); }
      else { ctx.drawImage(CARRETA,x+6,y-30,48,36); ctx.drawImage(persona(RECI,'down',0),x-22,y-48,36,51); post.push(()=>etiqueta(x+8,y-60,'RECICLADOR')); }
    }
    else ctx.drawImage(ESPECIES[AR[e.k+2]].mini,X(AR[e.k])-16,Y(AR[e.k+1])-44,32,48);
  }
  post.forEach(f=>f());
  // minimapa
  mctx.drawImage(miniBase,0,0);
  SITIOS.forEach(s=>{ if(s.t==='huerta'&&estadoHuerta(S.huertas[s.i])==='vacia') return; mctx.fillStyle='#0d150f'; mctx.fillRect(s.x*ME-4,s.y*ME-4,8,8); mctx.fillStyle=COLOR_SITIO[s.t]; mctx.fillRect(s.x*ME-3,s.y*ME-3,6,6); });
  if(cm){ mctx.fillStyle='#fff'; mctx.fillRect(cm.x*ME-5,cm.y*ME-4,10,8); mctx.fillStyle='#2d6e35'; mctx.fillRect(cm.x*ME-4,cm.y*ME-3,8,6); }
  mctx.fillStyle='#0d150f'; mctx.fillRect(pl.x*ME-5,pl.y*ME-5,10,10); mctx.fillStyle=Math.floor(time*3)%2?'#fff':'#ffe27a'; mctx.fillRect(pl.x*ME-3,pl.y*ME-3,6,6);
}
function estrellas(x,y,n){ for(let i=0;i<n;i++){ const ex=x-n*7+i*14; ctx.fillStyle='#2b1d0e'; ctx.fillRect(ex,y,12,12); ctx.fillStyle='#ffd23f'; ctx.fillRect(ex+2,y+2,8,8); ctx.fillStyle='#fff3a8'; ctx.fillRect(ex+3,y+3,3,3); } }
function etiqueta(x,y,t){ ctx.font='10px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(t).width+12; ctx.fillStyle='rgba(24,38,28,.85)'; ctx.fillRect(x-w/2,y-9,w,18); ctx.fillStyle='#ffe27a'; ctx.fillText(t,x,y+1); }

let last=0, hudT=0;
function loop(ts){ const dt=Math.min(0.05,(ts-last)/1000||0); last=ts; time+=dt; if(!paused) update(dt); draw();
  hudT+=dt; if(hudT>.25){ hudT=0; hud(); if(abierto&&abierto.vivo) pintarPanel(); } requestAnimationFrame(loop); }

// ======================= INTERFAZ =======================
const dialog=$('dialog'), panel=$('panel'), cardOv=$('cardOv'), albumOv=$('albumOv'), toast=$('toast');
let toastT=0, current=null;
function hud(){ const c=capacidad(), falta=CAMION_CADA-S.dia%CAMION_CADA, pct=S.mes.gen?Math.round(S.mes.aprov/S.mes.gen*100):0;
  $('hud').innerHTML='<span class="'+(S.monedas<0?'neg':'')+'"><b>$</b>'+S.monedas+'</span>'
    +'<span>CARRITO <i style="background:#8a5a2b"></i>'+kg(S.carro.org)+' <i style="background:#4f9be0"></i>'+kg(S.carro.rec)+' /'+c+'kg'+(S.mejoras.carreta?' +'+CARRETA_KG:'')+'</span>'+(S.abono>0?'<span>ABONO '+S.abono+'</span>':'')
    +'<span>TIERRA '+kg(S.tierra)+'kg</span><span class="sp"></span>'
    +'<span>DÍA '+S.dia+'</span><span>CAMIÓN: '+falta+'d</span><span>APROVECHADO '+pct+'%</span><div id="dia" style="width:'+(S.t/DIA*100)+'%"></div>'; }
function showToast(t){ toast.textContent=t; toast.style.display='block'; clearTimeout(toastT); toastT=setTimeout(()=>toast.style.display='none',3200); }
function say(html){ dialog.innerHTML=html+'<button class="btn" style="margin-top:10px">CONTINUAR</button>'; dialog.style.display='block'; paused=true; cerrarPanel(); }
dialog.addEventListener('click',()=>{ dialog.style.display='none'; paused=false; });
function cerrarPanel(){ abierto=null; panel.style.display='none'; }

// Cada panel devuelve {titulo, texto, botones:[[etiqueta, acción, deshabilitado?, alternativo?, dibujo?]]}
function botonMejora(o,que){ const n=nivelDe(o); if(n>=2) return []; const sig=NIVELES[n+1];
  return [['MEJORAR '+que+' A NIVEL '+(n+2)+' $'+sig.precio+'<br>Crece más rápido y da mejor premio',()=>{ S.monedas-=sig.precio; o.n=n+1; showToast('¡'+que+' mejorada a nivel '+(n+2)+'!'); },S.monedas<sig.precio,true]]; }
function botonAbono(o,total){ return [['USAR ABONO (tienes '+(S.abono||0)+')<br>Ahorra la mitad del tiempo que falta',()=>{ S.abono--; o.t+=(total-o.t)/2; },!(S.abono>0),true]]; }
function contenido(s){
  if(s.t==='casa'){ const c=S.casa;
    return {titulo:'TU CASA', vivo:true,
      texto:'En casa hay: orgánicos '+kg(c.org)+' kg · reciclables '+kg(c.rec)+' kg · basura '+kg(c.bas)+' kg.<br>Lo que siga aquí cuando llegue el camión se va al botadero y te cobran $'+COSTO_BOTADERO+' por kilo.',
      botones:[
        ['CARGAR ORGÁNICOS',()=>{ const n=Math.max(0,Math.min(S.casa.org,libreOrg())); S.casa.org-=n; S.carro.org+=n; },!c.org||libreOrg()<=0],
        ['CARGAR RECICLABLES',()=>{ const n=Math.max(0,Math.min(S.casa.rec,libreRec())); S.casa.rec-=n; S.carro.rec+=n; },!c.rec||libreRec()<=0],
        ['ÁRBOLES DEL BARRIO',openAlbum,false,true],
      ]}; }
  if(s.t==='vecino'){ const v=S.vecinos[s.i], nom=VECINOS[s.i][0];
    const cabe=tipo=>Math.max(0,Math.min(v[tipo],tipo==='org'?libreOrg():libreRec()));
    const recoger=tipo=>()=>{ const k=cabe(tipo), pago=Math.round(k*PAGO_VECINO); v[tipo]-=k; S.carro[tipo]+=k; S.monedas+=pago; S.mes.gen+=k; S.ayudas=(S.ayudas||0)+k; showToast(nom+' te pagó $'+pago+' por '+kg(k)+' kg'); };
    return {titulo:'CASA DE '+nom.toUpperCase(), vivo:true,
      texto:'Tiene orgánicos '+kg(v.org)+' kg · reciclables '+kg(v.rec)+' kg. Te paga $'+PAGO_VECINO+' por cada kilo que recojas, y el material queda para ti: llévalo a una paca o al reciclador. Lo que no recojas se lo lleva el camión al botadero.',
      botones:[['RECOGER ORGÁNICOS +$'+Math.round(cabe('org')*PAGO_VECINO),recoger('org'),cabe('org')<=0],['RECOGER RECICLABLES +$'+Math.round(cabe('rec')*PAGO_VECINO),recoger('rec'),cabe('rec')<=0]]}; }
  if(s.t==='tienda'){ const niv=Math.min(2,S.mejoras.carrito||0), sig=CARRITOS[niv+1], b=[];
    if(sig) b.push([sig.n+' $'+sig.precio+'<br>Carga '+sig.cap+' kg',()=>{ S.monedas-=sig.precio; S.mejoras.carrito=niv+1; showToast('¡Compraste: '+sig.n+'!'); },S.monedas<sig.precio]);
    if(!S.mejoras.bici) b.push(['Bicicleta de carga $'+PRECIO_BICI+'<br>Te mueves mucho más rápido',()=>{ S.monedas-=PRECIO_BICI; S.mejoras.bici=1; showToast('¡Ya tienes bicicleta!'); },S.monedas<PRECIO_BICI]);
    b.push(['Tierra 1 kg<br>$'+COMPRA_TIERRA,()=>{ S.monedas-=COMPRA_TIERRA; S.tierra+=1; },S.monedas<COMPRA_TIERRA,true]);
    b.push(['Tierra 5 kg<br>$'+COMPRA_TIERRA*5,()=>{ S.monedas-=COMPRA_TIERRA*5; S.tierra+=5; },S.monedas<COMPRA_TIERRA*5,true]);
    b.push(['Abono $'+PRECIO_ABONO+'<br>Acelera una siembra<br>Tienes '+(S.abono||0),()=>{ S.monedas-=PRECIO_ABONO; S.abono=(S.abono||0)+1; },S.monedas<PRECIO_ABONO,true]);
    SOMBREROS.forEach(h=>{ const mio=S.sombreros&&S.sombreros[h.id];
      b.push(mio?[(S.puesto===h.id?'QUITARME<br>':'PONERME<br>')+h.n,()=>{ S.puesto=S.puesto===h.id?'':h.id; },false,true]
                :[h.n+'<br>$'+h.precio,()=>{ S.monedas-=h.precio; (S.sombreros=S.sombreros||{})[h.id]=1; S.puesto=h.id; showToast('¡Te queda muy bien!'); },S.monedas<h.precio,true]); });
    return {titulo:'TIENDA DEL BARRIO', texto:'Tienes $'+S.monedas+'. Aquí consigues con qué cargar más, sembrar mejor y verte bien.', fila:true, botones:b}; }
  if(s.t==='rec'){ const precio=Math.round(PRECIO_RECICLAJE*(S.mejoras.canecas?BONO_CANECAS:1));
    const b=[['VENDER RECICLABLES +$'+Math.round(S.carro.rec*precio),()=>{ const n=S.carro.rec; S.monedas+=Math.round(n*precio); S.mes.aprov+=n; S.carro.rec=0; showToast('Vendiste '+kg(n)+' kg de reciclaje'); },!S.carro.rec]];
    if(!S.mejoras.carreta) b.push(['Carreta de reciclaje $'+PRECIO_CARRETA+'<br>Lleva '+CARRETA_KG+' kg de reciclables aparte del carrito',()=>{ S.monedas-=PRECIO_CARRETA; S.mejoras.carreta=1; showToast('¡Ya tienes carreta de reciclaje!'); },S.monedas<PRECIO_CARRETA,true]);
    if(!S.mejoras.canecas) b.push(['Canecas de separación $'+PRECIO_CANECAS+'<br>Reciclaje bien separado: te lo paga 30% mejor',()=>{ S.monedas-=PRECIO_CANECAS; S.mejoras.canecas=1; showToast('¡Ahora tu reciclaje vale más!'); },S.monedas<PRECIO_CANECAS,true]);
    return {titulo:'RECICLADOR', texto:'Te compra los reciclables a $'+precio+' el kilo. Llevas '+kg(S.carro.rec)+' kg. También vende cosas del oficio.', botones:b}; }
  if(s.t==='paca'){ const p=S.pacas[s.i], est=estadoPaca(p), nv=NIVELES[nivelDe(p)], niv=' · NIVEL '+(nivelDe(p)+1);
    if(est==='llenando') return {titulo:'PACA DIGESTORA'+niv, barra:p.kg/PACA_KG,
      texto:'Tiene '+kg(p.kg)+' de '+PACA_KG+' kg de orgánicos. Cuando se llene podrás sembrarle una flor. Llevas '+kg(S.carro.org)+' kg.',
      botones:[['DEJAR ORGÁNICOS',()=>{ const n=Math.min(S.carro.org,PACA_KG-p.kg); p.kg+=n; S.carro.org-=n; S.mes.aprov+=n; if(p.kg>=PACA_KG) showToast('¡Paca llena! Ya puedes sembrar'); },!S.carro.org],...botonMejora(p,'PACA')]};
    const libres=cupos(p)-p.s.length, listas=est==='lista', b=[];
    const total=p.s.reduce((a,s)=>a+Math.round(FLORES[s.f].premio*nv.premio),0);
    if(listas) b.push(['RECOGER<br>+$'+total+' y tierra',()=>{ S.monedas+=total; S.tierra+=TIERRA_POR_PACA; S.flores+=p.s.length; p.kg=0; p.s=[]; showToast('+$'+total+' y '+TIERRA_POR_PACA+' kg de tierra'); }]);
    if(libres>0) ORDEN_FLORES.forEach(i=>{ const f=FLORES[i], cerrada=f.nivel>nivelDe(p);
      b.push([f.n+'<br>'+(cerrada?'Paca nivel '+(f.nivel+1):(f.costo?'$'+f.costo:'Gratis')+' · '+Math.round(f.seg/nv.vel)+'s<br>Premio $'+Math.round(f.premio*nv.premio)),
        ()=>{ S.monedas-=f.costo; p.s.push({f:i,t:0}); },cerrada||(f.costo>0&&S.monedas<f.costo),false,f.hi]); });
    if(est==='creciendo') b.push(['USAR ABONO (tienes '+(S.abono||0)+')<br>Ahorra la mitad del tiempo que falta',()=>{ S.abono--; p.s.forEach(s=>{ const T=FLORES[s.f].seg; if(s.t<T) s.t+=(T-s.t)/2; }); },!(S.abono>0),true]);
    if(!p.s.length) b.push(...botonMejora(p,'PACA'));
    const detalle=p.s.map(s=>FLORES[s.f].n+(s.t>=FLORES[s.f].seg?' (lista)':' (faltan '+Math.ceil((FLORES[s.f].seg-s.t)/nv.vel)+'s)')).join(' · ');
    return {titulo:listas?'¡FLORES LISTAS!':p.s.length?'PACA SEMBRADA'+niv:'PACA LLENA: SIEMBRA'+niv, vivo:est==='creciendo', fila:true,
      barra:est==='creciendo'?Math.min(...p.s.map(s=>s.t/FLORES[s.f].seg)):undefined,
      texto:(p.s.length?detalle+'.':'Elige qué sembrar.')+(libres>0&&p.s.length?' Te queda un cupo para otra flor.':'')
        +(cupos(p)>1?'':' Con la paca en nivel 2 caben dos flores a la vez.')+' Al recoger, la paca da '+TIERRA_POR_PACA+' kg de tierra y queda libre.', botones:b}; }
  const h=S.huertas[s.i], est=estadoHuerta(h), nv=NIVELES[nivelDe(h)], niv=' · NIVEL '+(nivelDe(h)+1);
  if(est==='vacia') return {titulo:'HUERTA'+niv, vivo:confirmaVenta>time, texto:'Siembra con la tierra de las pacas o véndela aquí. Tienes '+kg(S.tierra)+' kg de tierra.', fila:true,
    botones:[...ORDEN_CULTIVOS.map(i=>{ const c=CULTIVOS[i], cerrado=c.nivel>nivelDe(h); return [c.n+'<br>'+(cerrado?'Huerta nivel '+(c.nivel+1):c.tierra+' kg tierra · '+Math.round(c.seg/nv.vel)+'s<br>Premio $'+Math.round(c.premio*nv.premio)),()=>{ S.tierra-=c.tierra; h.c=i; h.t=0; },cerrado||S.tierra<c.tierra]; }),
      [confirmaVenta>time?'¿SEGURO? VAS A VENDER '+kg(S.tierra)+' KG<br>Toca otra vez para confirmar':'VENDER TODA LA TIERRA +$'+Math.round(S.tierra*PRECIO_TIERRA),
        ()=>{ if(confirmaVenta>time){ const g=Math.round(S.tierra*PRECIO_TIERRA); S.monedas+=g; showToast('Vendiste '+kg(S.tierra)+' kg de tierra: +$'+g); S.tierra=0; confirmaVenta=0; } else confirmaVenta=time+4; },!S.tierra,true],...botonMejora(h,'HUERTA')]};
  const c=CULTIVOS[h.c], premio=Math.round(c.premio*nv.premio);
  if(est==='creciendo') return {titulo:c.n.toUpperCase()+' CRECIENDO', vivo:true, barra:h.t/c.seg, texto:'Faltan '+Math.ceil((c.seg-h.t)/nv.vel)+' segundos.', botones:botonAbono(h,c.seg)};
  return {titulo:'¡'+c.n.toUpperCase()+' LISTA!', texto:'Cosecha y vende por $'+premio+'.', botones:[['COSECHAR +$'+premio,()=>{ S.monedas+=premio; S.cosechas++; h.c=-1; h.t=0; showToast('Cosechaste '+c.n.toLowerCase()+': +$'+premio); }]]};
}
let firma='', confirmaVenta=0;   // vender la tierra pide tocar dos veces
function pintarPanel(){ if(!abierto) return; const c=contenido(abierto); abierto.vivo=c.vivo;
  const f=c.titulo+'|'+c.botones.map(b=>b[0]+(b[2]?1:0)).join('|');
  if(f===firma&&panel.style.display==='block'){ const bar=panel.querySelector('.barra div'); if(bar&&c.barra!==undefined) bar.style.width=(c.barra*100)+'%';
    const p=panel.querySelector('p'); if(p&&p.innerHTML!==c.texto) p.innerHTML=c.texto; return; }
  firma=f; panel.innerHTML='<button class="x">✕</button><h3>'+c.titulo+'</h3>'+(c.barra!==undefined?'<div class="barra"><div style="width:'+(c.barra*100)+'%"></div></div>':'')+'<p></p><div class="'+(c.fila?'fila':'')+'"></div>';
  panel.querySelector('p').innerHTML=c.texto;
  const cont=panel.lastChild; panel.querySelector('.x').onclick=cerrarPanel;
  c.botones.forEach(([txt,fn,off,alt,dib])=>{ const b=document.createElement('button'); b.className='btn'+(alt?' alt':''); b.disabled=!!off;
    if(dib){ const k=document.createElement('canvas'); beads(dib,k); b.appendChild(k); } b.insertAdjacentHTML('beforeend',txt);
    b.onclick=()=>{ fn(); persist(); hud(); pintarPanel(); }; cont.appendChild(b); });
  panel.style.display='block'; }
function llegar(o){ if(o.arbol!==undefined){ openCard(ESPECIES[AR[o.arbol+2]],AR[o.arbol+3]); return; } abierto=o; firma=''; confirmaVenta=0; pintarPanel(); }

// ---------- Tocar el mapa ----------
cv.addEventListener('pointerdown',ev=>{ if(paused) return; ev.preventDefault();
  const r=cv.getBoundingClientRect(), px=(ev.clientX-r.left)*VW/r.width, py=(ev.clientY-r.top)*VH/r.height, wx=cam.x+px/Z, wy=cam.y+py/Z;
  let obj=null, best=9; SITIOS.forEach(s=>{ const d=Math.hypot(s.x-wx,s.y-4-wy); if(d<best){ best=d; obj=s; } });
  if(obj){ cerrarPanel(); pl.dest={x:obj.x,y:obj.y+7,obj}; return; }
  let arbol=null; best=3.5; arbolesEn(wx-6,wy-2,wx+6,wy+10,k=>{ const d=Math.hypot(AR[k]-wx,AR[k+1]-3.5-wy); if(d<best){ best=d; arbol=k; } });
  cerrarPanel();
  if(arbol!==null) pl.dest={x:AR[arbol],y:AR[arbol+1]+2,obj:{arbol}};
  else if(enArea(wx,wy)) pl.dest={x:wx,y:wy}; });
function interact(){ if(dialog.style.display==='block'){ dialog.click(); return; } if(paused) return;
  let obj=null, best=14; SITIOS.forEach(s=>{ const d=Math.hypot(s.x-pl.x,s.y+7-pl.y); if(d<best){ best=d; obj=s; } });
  if(obj){ llegar(obj); return; }
  let arbol=null; best=6; arbolesEn(pl.x-8,pl.y-8,pl.x+8,pl.y+8,k=>{ const d=Math.hypot(AR[k]-pl.x,AR[k+1]-pl.y); if(d<best){ best=d; arbol=k; } });
  if(arbol!==null) llegar({arbol}); }

// ---------- Ficha y álbum de árboles ----------
const count=()=>ESPECIES.filter(e=>S.found[e.nombre]).length;
function cerrarFichas(){ cardOv.style.display='none'; albumOv.style.display='none'; paused=false; current=null; for(const k in keys) keys[k]=false; }
function openCard(e,altura){ current=e; paused=true; albumOv.style.display='none';
  beads(grande(e),$('cardSprite')); $('cardName').textContent=e.nombre.toUpperCase(); $('cardSci').textContent=e.spec.sci||'';
  $('cardFact').textContent=(e.cuantos===1?'Es el único de su especie en el barrio.':'Hay '+e.cuantos+' en el barrio.')+(altura?' Este mide unos '+altura+' m.':'');
  const rec=S.found[e.nombre], img=$('cardPhoto');
  if(rec&&rec.photo){ img.src=rec.photo; img.style.display='block'; } else img.style.display='none';
  $('cardStatus').textContent=rec?'✔ Registrado el '+rec.date:'';
  $('btnFoto').textContent=rec?(rec.photo?'CAMBIAR FOTO':'AÑADIR FOTO'):'REGISTRAR CON FOTO';
  $('btnReg').style.display=rec?'none':'block'; cardOv.style.display='flex'; $('card').scrollTop=0; }
function register(e,photo){ const isNew=!S.found[e.nombre], prev=S.found[e.nombre]||{};
  S.found[e.nombre]={date:prev.date||new Date().toLocaleDateString('es'),photo:photo||prev.photo||null}; persist(); openCard(e);
  if(isNew) showToast('¡'+e.corto+' registrado! Llevas '+count()+' de '+ESPECIES.length); }
$('btnReg').onclick=()=>current&&register(current,null);
$('btnFoto').onclick=()=>$('file').click();
$('btnClose').onclick=cerrarFichas;
$('file').onchange=ev=>{ const file=ev.target.files[0], e=current; ev.target.value=''; if(!file||!e) return;
  const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=56; const g=c.getContext('2d');
    const s=Math.min(img.width,img.height); g.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,56,56); URL.revokeObjectURL(img.src); register(e,c.toDataURL('image/png')); };
  img.src=URL.createObjectURL(file); };
function openAlbum(){ cardOv.style.display='none'; paused=true;
  $('albumSub').textContent=count()+' de '+ESPECIES.length+' especies registradas · de la más común a la más rara';
  const grid=$('grid'); grid.innerHTML='';
  ESPECIES.forEach(e=>{ const ok=!!S.found[e.nombre], d=document.createElement('div'); d.className='cell'+(ok?'':' no');
    if(ok){ const c=document.createElement('canvas'); beads(grande(e),c); d.appendChild(c); d.appendChild(document.createTextNode(e.corto)); d.onclick=()=>openCard(e); }
    else { const q=document.createElement('div'); q.className='q'; q.textContent='?'; d.appendChild(q); d.appendChild(document.createTextNode('???')); }
    const s=document.createElement('small'); s.textContent=e.cuantos+(e.cuantos===1?' árbol':' árboles'); d.appendChild(s); grid.appendChild(d); });
  albumOv.style.display='flex'; }
$('btnAlbumClose').onclick=cerrarFichas;

// ---------- Teclado ----------
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
addEventListener('keydown',e=>{
  if(KEYMAP[e.key]){ keys[KEYMAP[e.key]]=true; e.preventDefault(); }
  else if(e.key===' '||e.key==='Enter'){ if(cardOv.style.display==='flex'||albumOv.style.display==='flex') return; e.preventDefault(); interact(); }
  else if(e.key==='Escape'){ cerrarFichas(); cerrarPanel(); } });
addEventListener('keyup',e=>{ if(KEYMAP[e.key]) keys[KEYMAP[e.key]]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
setInterval(persist,5000);

hud(); requestAnimationFrame(loop);
if(!S.visto){ S.visto=true; say('<b>¡Bienvenido al barrio!</b>Tu casa produce residuos todos los días. Cárgalos en el carrito: los orgánicos van a las pacas de los parques y los reciclables al reciclador. Lo que quede en casa se lo lleva el camión al botadero, y eso cuesta. Cuando una paca se llena puedes sembrarle una flor y ganar premios.'); }
