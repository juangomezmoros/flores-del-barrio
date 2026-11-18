// ======================= REGLAS DEL JUEGO (para ajustar fácil) =======================
const DIA=20;                  // segundos reales que dura un día
const CAMION_CADA=5;           // cada cuántos días pasa el camión
const MES=30;                  // días de un mes de juego
const GENERA={o:3,r:2,b:1};    // bolsas de 1 kg que produce tu casa al día: orgánicos, reciclables, basura
const COBRO_CAMION=8;          // $ por kilo que el camión se lleva de tu casa
const PAGO_RECICLAJE=15;       // $ por kilo de reciclaje
const PAGO_VECINO=10;          // $ por kilo que recoges de un vecino
const VECINO_DIA=2, VECINO_TOPE=10;
const PACA_KG=12;              // orgánicos para llenar una paca
const TIERRA_POR_FLOR=3;       // bolsas de tierra que da cada flor al recogerla
const CAPACIDAD=[8,16,30];     // bolsas que carga cada carrito
const VELOCIDAD=[14,22];       // metros por segundo: a pie y en bicicleta
const RADIOS=[70,160,320,600,1300]; // el barrio se va abriendo por zonas alrededor de tu casa
const NIVELES=[{vel:1,premio:1},{vel:1.4,premio:1.3},{vel:2,premio:1.7}];
const FLORES=[ // nivel mínimo de la paca: 0, 1 o 2
  {n:'Margarita', spec:F('daisy','#ffffff','#d6dbe6','#f5c21b'),             nivel:0, seg:40,  premio:60},
  {n:'Girasol',   spec:F('daisy','#ffd23f','#e8a713','#6b3e1d','',{big:true}),nivel:0, seg:60,  premio:90},
  {n:'Cartucho',  spec:F('calla','#ffffff','#cfd8dc','#f5c21b'),             nivel:0, seg:70,  premio:110},
  {n:'Lavanda',   spec:F('lavanda','#a78bfa','#7c5ad6','#a78bfa'),           nivel:1, seg:80,  premio:180},
  {n:'Rosa',      spec:F('rose','#e8384f','#a81c36','#e8384f'),              nivel:1, seg:100, premio:240},
  {n:'Cayena',    spec:F('cayena','#ff5a4d','#c2271f','#ffd23f'),            nivel:1, seg:110, premio:280},
  {n:'Hortensia', spec:F('cluster','#7fa8f5','#4f74d1','#dfe9ff'),           nivel:2, seg:130, premio:420},
  {n:'Orquídea',  spec:F('orchid','#d58cf0','#9b3fc4','#ffd23f'),            nivel:2, seg:160, premio:600},
];
const CULTIVOS=[
  {n:'Lechuga',   nivel:0, tierra:2, seg:45,  premio:80,  col:'#7ed957'},
  {n:'Zanahoria', nivel:0, tierra:3, seg:70,  premio:130, col:'#ff8c2e'},
  {n:'Fresa',     nivel:1, tierra:4, seg:90,  premio:220, col:'#e91e63'},
  {n:'Tomate',    nivel:1, tierra:5, seg:110, premio:290, col:'#e53935'},
  {n:'Maíz',      nivel:2, tierra:6, seg:130, premio:420, col:'#ffd23f'},
  {n:'Ahuyama',   nivel:2, tierra:8, seg:160, premio:600, col:'#f57c00'},
];
const SOMBREROS=[
  {id:'gorra',    n:'Gorra roja',        copa:'#e2574c', ala:'#b83a30', gorra:true},
  {id:'paja',     n:'Sombrero de paja',  copa:'#f0d98a', ala:'#e6c66a', cinta:'#7a4a21'},
  {id:'vueltiao', n:'Sombrero vueltiao', copa:'#f3ead2', ala:'#f3ead2', cinta:'#2b1d0e', rayas:true},
];
const VECINOS=[['Doña Rosa','#7a4fa3'],['Don Luis','#3f6fb5'],['Familia Gómez','#d98a2b'],['Sofi y Mateo','#2f8f7a'],['Doña Carmen','#b5506e'],['Juancho','#607d8b']];
FLORES.forEach(f=>{ f.hi=genGrande(f.spec); });

// ======================= ESTADO Y GUARDADO =======================
const KEY='floresDelBarrio.v4';
const nuevo=()=>({monedas:50,dia:1,t:0,casa:{o:3,r:2,b:1},carga:[],hechos:{},pagado:{},nivel:{},
  pacas:{},huertas:{},vecinos:{},carrito:0,bici:0,sombreros:{},puesto:'',zona:0,mes:{gen:6,aprov:0,bot:0},found:{},movido:false});
let S=nuevo();
try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.hechos) S=Object.assign(S,s); }catch(e){}
function persist(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }

// ======================= MAPA =======================
const $=id=>document.getElementById(id);
const cv=$('game'), ctx=cv.getContext('2d');
const PXM=6;                   // píxeles de dibujo por metro (antes de escalar a la pantalla)
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
const enEdificio=(x,y)=>MAPA.edificios.some(p=>enPoligono(p,x,y));

function dibujarMapa(g,escala,ox,oy){
  g.save(); g.setTransform(escala,0,0,escala,-ox,-oy);
  g.fillStyle='#bfe3a0'; g.fill(PARQUES);
  g.fillStyle='#9fd3f0'; g.fill(AGUA_POL); g.strokeStyle='#9fd3f0'; g.lineCap=g.lineJoin='round';
  AGUA_LIN.forEach(a=>{ g.lineWidth=a.a; g.stroke(a.q); });
  g.strokeStyle='#cfc3a4'; CALLES.forEach(c=>{ g.lineWidth=c.a+3.2; g.stroke(c.q); });
  g.strokeStyle='#fffdf6'; CALLES.forEach(c=>{ g.lineWidth=c.a; g.stroke(c.q); });
  g.strokeStyle='#e3cf9c'; g.lineWidth=1.6; g.setLineDash([2.5,2]); g.stroke(SENDEROS); g.setLineDash([]);
  g.fillStyle='#eadcc0'; g.fill(EDIFICIOS); g.strokeStyle='#c9b48c'; g.lineWidth=.5; g.stroke(EDIFICIOS);
  g.fillStyle='rgba(40,60,48,.55)'; g.fill(FUERA,'evenodd');
  g.restore();
}

// ======================= DIBUJOS EN PÍXEL =======================
function spr(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d');
  fn((x,y,ww,hh,col)=>{ g.fillStyle=col; g.fillRect(x,y,ww,hh); }); return c; }
const casaSpr=col=>spr(26,26,r=>{ r(2,24,24,2,'rgba(0,0,0,.2)'); r(18,0,3,5,'#8d6e63'); r(1,3,24,10,col); for(let y=5;y<13;y+=3) r(1,y,24,1,shade(col,.8));
  r(0,12,26,2,shade(col,.62)); r(2,14,22,10,'#f3e6c6'); r(2,22,22,2,'#d9c79b'); r(11,17,5,7,'#7a4a21'); r(14,20,1,1,'#ffd23f');
  r(4,16,5,5,'#fff'); r(5,17,3,3,'#8fd0f0'); r(17,16,5,5,'#fff'); r(18,17,3,3,'#8fd0f0'); });
const CASA=casaSpr('#c0483c'), CASAS_VEC=VECINOS.map(v=>casaSpr(v[1]));
const bolsa=(c,o)=>spr(7,8,r=>{ r(1,3,5,5,c); r(0,4,7,3,c); r(2,1,3,2,o); r(3,0,1,1,o); r(2,4,1,1,'rgba(255,255,255,.35)'); });
const ICON={o:bolsa('#8a5a2b','#5c3a1a'), r:bolsa('#3f8fe0','#2560a8'), b:bolsa('#2b2b2b','#555'),
  t:spr(9,6,r=>{ r(1,2,7,4,'#5c3a1a'); r(0,4,9,2,'#4a2f17'); r(3,1,3,1,'#6b4320'); r(2,2,1,1,'#7ed957'); r(6,3,1,1,'#7ed957'); })};
const COLOR_CARGA={o:['#8a5a2b','#a8733d'],r:['#3f8fe0','#6aaef0'],t:['#4a2f17','#6b4a2a']};
const PACA=[0,1].map(lleno=>spr(22,16,r=>{ r(1,14,21,2,'rgba(0,0,0,.2)'); r(0,4,22,11,'#8d5a2b'); r(1,5,20,9,'#5c3a1a');
  for(let x=0;x<22;x+=5) r(x,4,2,11,'#6b4320'); r(0,8,22,1,'#a5713a');
  if(lleno){ r(1,1,20,4,'#4a2f17'); r(3,0,16,1,'#4a2f17'); [[3,2,'#7ed957'],[8,1,'#ff8c2e'],[13,3,'#ffd23f'],[17,2,'#7ed957'],[6,3,'#c2a878'],[11,2,'#7ed957']].forEach(([x,y,c])=>r(x,y,2,1,c)); } }));
const HUERTA=spr(22,14,r=>{ r(1,12,21,2,'rgba(0,0,0,.2)'); r(0,1,22,12,'#8d5a2b'); r(1,2,20,10,'#5c3a1a'); for(let y=4;y<12;y+=3) r(2,y,18,1,'#4a2f17'); });
const CARRETA=spr(16,12,r=>{ r(1,10,14,2,'rgba(0,0,0,.2)'); r(0,3,13,6,'#2f6fb5'); r(0,3,13,1,'#5b97d6'); r(13,2,3,1,'#555'); r(2,9,3,3,'#222'); r(9,9,3,3,'#222');
  r(1,0,5,3,'#f5f5f5'); r(6,1,5,2,'#e0e0e0'); });
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

// ======================= SITIOS =======================
// Las huertas y las casas de los vecinos son lugares reales; la primera paca, el reciclador y la tienda se ubican cerca de tu casa.
const C=MAPA.casa, dC=(x,y)=>Math.hypot(x-C[0],y-C[1]);
const SITIOS={};
const poner=(id,t,x,y,i)=>{ SITIOS[id]={id,t,x,y,i:i||0,d:dC(x,y)}; };
const separado=(x,y,sep)=>Object.values(SITIOS).every(s=>Math.hypot(s.x-x,s.y-y)>=sep);
poner('casa','casa',C[0],C[1]);
{ const hs=[]; for(let i=0;i<MAPA.huertas.length;i+=2) hs.push([MAPA.huertas[i],MAPA.huertas[i+1]]);
  hs.sort((a,b)=>dC(...a)-dC(...b)); let n=0;
  for(const [x,y] of hs){ if(n>=8) break; if(dC(x,y)<18||!separado(x,y,14)) continue; poner('h'+n,'huerta',x,y,n); n++; } }
function cercaDeCasa(id,t,ang){ for(let r=22;r<90;r+=3) for(let k=0;k<32;k++){ const a=ang+(k%2?1:-1)*Math.ceil(k/2)*Math.PI/16, x=C[0]+Math.cos(a)*r, y=C[1]+Math.sin(a)*r;
    if(enArea(x,y)&&!enEdificio(x,y)&&separado(x,y,16)){ poner(id,t,x,y); return; } } poner(id,t,C[0]+25,C[1]+10); }
cercaDeCasa('p0','paca',0); cercaDeCasa('r0','rec',Math.PI); cercaDeCasa('tienda','tienda',Math.PI/2);
{ let n=1; for(let i=0;i<MAPA.pacas.length;i+=2){ const x=MAPA.pacas[i], y=MAPA.pacas[i+1]; if(separado(x,y,20)){ poner('p'+n,'paca',x,y); n++; } } }
{ let n=1; for(let i=0;i<MAPA.recicladores.length;i+=2){ const x=MAPA.recicladores[i], y=MAPA.recicladores[i+1]; if(separado(x,y,20)){ poner('r'+n,'rec',x,y); n++; } } }
{ const cand=[]; MAPA.edificios.forEach(p=>{ let x=0,y=0; for(let i=0;i<p.length;i+=2){ x+=p[i]; y+=p[i+1]; } x/=p.length/2; y/=p.length/2; if(enArea(x,y)) cand.push([x,y]); });
  cand.sort((a,b)=>dC(...a)-dC(...b)); let n=0;
  for(const [x,y] of cand){ if(n>=VECINOS.length) break; if(dC(x,y)<25||!separado(x,y,18)) continue;
    if(Object.values(SITIOS).some(s=>s.t==='vecino'&&Math.hypot(s.x-x,s.y-y)<40)) continue; poner('v'+n,'vecino',x,y,n); n++; } }
const LISTA=Object.values(SITIOS);

// ======================= LA SECUENCIA DE CONSTRUCCIÓN =======================
// Todo lo que se puede construir o mejorar, en orden. En el mapa se ven las dos próximas.
const r10=v=>Math.round(v/10)*10;
const SEQ=[], pendientes=[], cuenta={};
const programar=(paso,despues)=>pendientes.push({en:SEQ.length+despues,paso});
const soltar=(todo)=>{ pendientes.sort((a,b)=>a.en-b.en); while(pendientes.length&&(todo||pendientes[0].en<=SEQ.length)) SEQ.push(pendientes.shift().paso); };
let zonaGen=0;
function zonaPara(s){ while(zonaGen<RADIOS.length-1&&s.d>RADIOS[zonaGen]-8){ const R=RADIOS[zonaGen], ux=(s.x-C[0])/s.d, uy=(s.y-C[1])/s.d; let f=1, x, y;
    do{ x=C[0]+ux*(R-10)*f; y=C[1]+uy*(R-10)*f; f-=.05; }while(f>.1&&!enArea(x,y));
    zonaGen++; SEQ.push({tipo:'zona',z:zonaGen,costo:r10(150*Math.pow(zonaGen,1.8)),x,y,ico:'🔓'}); } }
const ICO_SITIO={paca:'🌸',huerta:'🥬',rec:'♻️',vecino:'🏠',tienda:'🛒'};
function construir(id){ const s=SITIOS[id]; zonaPara(s); const j=cuenta[s.t]||0; cuenta[s.t]=j+1;
  const primero={paca:0,rec:30,huerta:60,vecino:40,tienda:80}[s.t], base={paca:220,huerta:160,vecino:110,rec:260,tienda:80}[s.t];
  SEQ.push({tipo:'construir',s:id,costo:j?r10(base*(1+.5*j)):primero,x:s.x,y:s.y+4,ico:ICO_SITIO[s.t]});
  if(s.t==='paca'||s.t==='huerta'){
    programar({tipo:'nivel',s:id,n:1,costo:r10(300*(1+.3*j)),x:s.x+13,y:s.y+5,ico:'⬆️'},3);
    programar({tipo:'nivel',s:id,n:2,costo:r10(900*(1+.3*j)),x:s.x+13,y:s.y+5,ico:'⬆️'},9); } }
const T_=SITIOS.tienda, enTienda=dx=>({x:T_.x+dx,y:T_.y+13});
['p0','r0','h0','v0','tienda'].forEach(construir);
SEQ.push({tipo:'carrito',n:1,costo:150,...enTienda(-12),ico:'🛒'});
const GLOBALES=[{tipo:'bici',costo:300,...enTienda(0),ico:'🚲'},{tipo:'sombrero',h:'gorra',costo:120,...enTienda(12),ico:'🧢'},
  {tipo:'carrito',n:2,costo:900,...enTienda(-12),ico:'🛒'},{tipo:'sombrero',h:'paja',costo:300,...enTienda(12),ico:'👒'},{tipo:'sombrero',h:'vueltiao',costo:700,...enTienda(12),ico:'🎩'}];
LISTA.filter(s=>!['casa','p0','r0','h0','v0','tienda'].includes(s.id)).sort((a,b)=>a.d-b.d).forEach((s,k)=>{
  construir(s.id); soltar(); if(k%3===1&&GLOBALES.length) SEQ.push(GLOBALES.shift()); });
soltar(true); SEQ.push(...GLOBALES);
const CONSTRUIDO_EN={}; SEQ.forEach((p,i)=>{ if(p.tipo==='construir') CONSTRUIDO_EN[p.s]=i; });
const hecho=id=>id==='casa'||!!S.hechos[CONSTRUIDO_EN[id]];
const nivelDe=id=>S.nivel[id]||0;
const radio=()=>RADIOS[S.zona]||RADIOS[RADIOS.length-1];
const proximos=()=>{ const r=[]; for(let i=0;i<SEQ.length&&r.length<2;i++) if(!S.hechos[i]){ const p=SEQ[i];
    if(r.length===1&&dC(p.x,p.y)>radio()) break; r.push(i); } return r; };

// Estado de cada sitio (se crea cuando se construye)
const paca=id=>S.pacas[id]||(S.pacas[id]={kg:0,s:[],tierra:0});
const huerta=id=>S.huertas[id]||(S.huertas[id]={tierra:0,c:-1,t:0,prox:0});
const vecino=id=>S.vecinos[id]||(S.vecinos[id]={n:4});
const cupos=id=>nivelDe(id)>=1?2:1;
const pacaLista=p=>p.s.length&&p.s.every(s=>s.t>=FLORES[s.f].seg);
const azar=lista=>lista[Math.floor(Math.random()*lista.length)];
function elegirCultivo(id){ const ok=CULTIVOS.map((c,i)=>i).filter(i=>CULTIVOS[i].nivel<=nivelDe(id)); return azar(ok.slice(-2)); }

// ======================= CAMIÓN =======================
const nodos=new Map();
const nodo=(x,y)=>{ const k=Math.round(x)+','+Math.round(y); let n=nodos.get(k); if(!n){ n={x,y,v:[],d:Infinity,prev:null,ok:false}; nodos.set(k,n); } return n; };
MAPA.calles.forEach(c=>{ if(c.s||c.a<7) return; for(let i=0;i<c.p.length-2;i+=2){ const a=nodo(c.p[i],c.p[i+1]), b=nodo(c.p[i+2],c.p[i+3]); if(a!==b){ a.v.push(b); b.v.push(a); } } });
const RUTAS=(()=>{ const L=[...nodos.values()]; if(!L.length) return null;
  const cerca=L.reduce((m,n)=>dC(n.x,n.y)<dC(m.x,m.y)?n:m); cerca.d=0;
  for(;;){ let u=null; for(const n of L) if(!n.ok&&n.d<Infinity&&(!u||n.d<u.d)) u=n; if(!u) break; u.ok=true;
    for(const w of u.v){ const d=u.d+Math.hypot(w.x-u.x,w.y-u.y); if(d<w.d){ w.d=d; w.prev=u; } } }
  const llegan=L.filter(n=>n.ok), camino=n=>{ const r=[]; for(;n;n=n.prev) r.push([n.x,n.y]); return r; };
  const medir=pts=>{ const acum=[0]; for(let i=1;i<pts.length;i++) acum.push(acum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1])); return {pts,acum,largo:acum[acum.length-1]||1}; };
  const entrada=llegan.reduce((m,n)=>n.x<m.x?n:m), salida=llegan.reduce((m,n)=>n.x>m.x?n:m);
  return {llegada:medir(camino(entrada)), ida:medir(camino(salida).reverse())}; })();
function puntoEn(r,f){ const d=Math.max(0,Math.min(1,f))*r.largo; let i=1; while(i<r.acum.length-1&&r.acum[i]<d) i++;
  const a=r.pts[i-1], b=r.pts[i]||a, t=(d-r.acum[i-1])/((r.acum[i]-r.acum[i-1])||1); return {x:a[0]+(b[0]-a[0])*t, y:a[1]+(b[1]-a[1])*t, dx:b[0]-a[0]}; }
let ladoCamion='right';
function camion(){ if(!RUTAS) return null; const f=((S.dia%CAMION_CADA)*DIA+S.t)/(CAMION_CADA*DIA);
  const c=f<.15?puntoEn(RUTAS.ida,f/.15):puntoEn(RUTAS.llegada,(f-.15)/.85); if(Math.abs(c.dx)>.5) ladoCamion=c.dx<0?'left':'right'; return c; }

// ======================= ÁRBOLES =======================
const AR=MAPA.arboles, CELDA=32, rejilla=new Map();
for(let k=0;k<AR.length;k+=4){ const key=Math.floor(AR[k+1]/CELDA)*4096+Math.floor(AR[k]/CELDA); (rejilla.get(key)||rejilla.set(key,[]).get(key)).push(k); }
function arbolesEn(x0,y0,x1,y1,fn){ for(let cy=Math.floor(y0/CELDA);cy<=Math.floor(y1/CELDA);cy++)for(let cx=Math.floor(x0/CELDA);cx<=Math.floor(x1/CELDA);cx++){
  const l=rejilla.get(cy*4096+cx); if(l) for(const k of l) fn(k); } }

// ======================= PANTALLA =======================
let dpr=1, K=1, VW=0, VH=0;   // K: píxeles de pantalla por píxel de dibujo; VW/VH: tamaño visible en píxeles de dibujo
function ajustar(){ dpr=Math.min(2,window.devicePixelRatio||1); const w=innerWidth, h=innerHeight;
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); K=Math.min(w,h)/400*dpr; VW=cv.width/K; VH=cv.height/K; }
addEventListener('resize',ajustar); ajustar();

// ======================= JUEGO =======================
const pl={x:C[0],y:C[1]+10,dir:'down',step:0};
const cam={x:pl.x-VW/PXM/2,y:pl.y-VH/PXM/2};
const keys={}; let paused=false, time=0, tic=0, quieto=0;
const vuelos=[], textos=[];
const capacidad=()=>CAPACIDAD[S.carrito||0];
const lleva=t=>S.carga.includes(t);
const quitar=t=>{ const i=S.carga.lastIndexOf(t); if(i>=0) S.carga.splice(i,1); };
const flotar=(x,y,txt,col)=>textos.push({x,y,txt,col:col||'#fff',t:0});
const volar=(ax,ay,bx,by,ico)=>vuelos.push({ax,ay,bx,by,ico,t:0});
const caminable=(x,y)=>enArea(x,y)&&dC(x,y)<=radio();
function ganar(v,x,y){ S.monedas+=v; flotar(x,y,'+$'+v,'#ffe27a'); bump('pMon'); }
function bump(id){ const e=$(id); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }

function pasarDia(){
  S.dia++; S.casa.o+=GENERA.o; S.casa.r+=GENERA.r; S.casa.b+=GENERA.b; S.mes.gen+=GENERA.o+GENERA.r+GENERA.b;
  LISTA.forEach(s=>{ if(s.t==='vecino'&&hecho(s.id)){ const v=vecino(s.id); v.n=Math.min(VECINO_TOPE,v.n+VECINO_DIA); } });
  if(S.dia%CAMION_CADA===0){ const k=S.casa.o+S.casa.r+S.casa.b, cobro=k*COBRO_CAMION;
    S.monedas=Math.max(0,S.monedas-cobro); S.mes.bot+=k; S.casa={o:0,r:0,b:0};
    LISTA.forEach(s=>{ if(s.t==='vecino'&&hecho(s.id)) vecino(s.id).n=0; });
    if(k){ flotar(C[0],C[1]-12,'−$'+cobro,'#ff8a80'); toast('🚛 El camión se llevó '+k+' kg de tu casa: −$'+cobro); } else toast('🚛 Pasó el camión y tu casa estaba limpia'); }
  if(S.dia%MES===0){ const m=S.mes, pct=m.gen?Math.round(m.aprov/m.gen*100):0;
    toast('📅 Fin de mes: aprovechaste '+pct+'% y mandaste '+m.bot+' kg al botadero'); S.mes={gen:0,aprov:0,bot:0}; }
  persist();
}

// Lo que pasa cuando estás cerca de cada sitio: todo es automático
function actuar(s){
  const id=s.id, lleno=S.carga.length>=capacidad();
  if(s.t==='casa'){ if(lleno) return; const t=S.casa.o?'o':S.casa.r?'r':null; if(!t) return;
    S.casa[t]--; S.carga.push(t); volar(s.x,s.y-6,pl.x,pl.y-10,t); return; }
  if(s.t==='vecino'){ const v=vecino(id); if(lleno||!v.n) return; const t=v.n%2?'r':'o'; v.n--; S.carga.push(t); S.mes.gen++;
    volar(s.x,s.y-6,pl.x,pl.y-10,t); ganar(PAGO_VECINO,s.x,s.y-14); return; }
  if(s.t==='rec'){ if(!lleva('r')) return; quitar('r'); S.mes.aprov++; volar(pl.x,pl.y-10,s.x,s.y-4,'r'); ganar(PAGO_RECICLAJE,s.x,s.y-14); return; }
  if(s.t==='paca'){ const p=paca(id);
    if(pacaLista(p)){ const pr=p.s.reduce((a,x)=>a+Math.round(FLORES[x.f].premio*NIVELES[nivelDe(id)].premio),0);
      ganar(pr,s.x,s.y-18); p.tierra+=TIERRA_POR_FLOR*p.s.length; p.s=[]; p.kg=0; return; }
    if(p.tierra>0&&!lleno){ p.tierra--; S.carga.push('t'); volar(s.x,s.y-6,pl.x,pl.y-10,'t'); return; }
    if(!p.s.length&&p.kg<PACA_KG&&lleva('o')){ quitar('o'); p.kg++; S.mes.aprov++; volar(pl.x,pl.y-10,s.x,s.y-4,'o');
      if(p.kg>=PACA_KG){ const ok=FLORES.map((f,i)=>i).filter(i=>FLORES[i].nivel<=nivelDe(id)).slice(-3);
        for(let k=0;k<cupos(id);k++) p.s.push({f:azar(ok),t:0}); } }
    return; }
  if(s.t==='huerta'){ const h=huerta(id);
    if(h.c>=0&&h.t>=CULTIVOS[h.c].seg){ ganar(Math.round(CULTIVOS[h.c].premio*NIVELES[nivelDe(id)].premio),s.x,s.y-16); h.c=-1; h.t=0; h.prox=elegirCultivo(id); return; }
    if(h.c<0&&lleva('t')){ quitar('t'); h.tierra++; volar(pl.x,pl.y-10,s.x,s.y-4,'t');
      if(h.tierra>=CULTIVOS[h.prox].tierra){ h.tierra=0; h.c=h.prox; h.t=0; } } }
}
// Pagar una construcción: te paras encima y la plata se va gastando
function pagar(i,dt){ const p=SEQ[i], ya=S.pagado[i]||0;
  if(p.costo>0){ const falta=p.costo-ya; if(S.monedas<=0) return; const v=Math.min(falta,S.monedas,Math.max(1,Math.ceil(Math.max(40,p.costo/1.2)*dt)));
    S.monedas-=v; S.pagado[i]=ya+v; if(Math.random()<.5) volar(pl.x,pl.y-12,p.x,p.y,'$'); if(S.pagado[i]<p.costo) return; }
  else { S.pagado[i]=ya-dt; if(S.pagado[i]>-.35) return; }   // lo gratis se construye con solo pararse un momento
  S.hechos[i]=1; delete S.pagado[i];
  if(p.tipo==='construir'){ const s=SITIOS[p.s]; if(s.t==='huerta') huerta(s.id).prox=elegirCultivo(s.id); flotar(s.x,s.y-20,'¡Listo!','#9cff9c'); }
  else if(p.tipo==='nivel'){ S.nivel[p.s]=p.n; flotar(p.x,p.y-20,'¡Nivel '+(p.n+1)+'!','#9cff9c'); }
  else if(p.tipo==='carrito'){ S.carrito=p.n; flotar(p.x,p.y-20,'+'+CAPACIDAD[p.n]+' bolsas','#9cff9c'); }
  else if(p.tipo==='bici'){ S.bici=1; flotar(p.x,p.y-20,'¡Bicicleta!','#9cff9c'); }
  else if(p.tipo==='sombrero'){ S.sombreros[p.h]=1; S.puesto=p.h; flotar(p.x,p.y-20,'¡Te queda bien!','#9cff9c'); }
  else if(p.tipo==='zona'){ S.zona=p.z; flotar(p.x,p.y-20,'¡Más barrio!','#9cff9c'); }
  persist(); }

// Hacia dónde apunta la flecha: la siguiente cosa útil por hacer
function objetivo(){
  const prox=proximos(), cerca=(lista)=>lista.reduce((m,s)=>!m||Math.hypot(s.x-pl.x,s.y-pl.y)<Math.hypot(m.x-pl.x,m.y-pl.y)?s:m,null);
  const activos=t=>LISTA.filter(s=>s.t===t&&hecho(s.id)&&dC(s.x,s.y)<=radio());
  for(const i of prox){ const p=SEQ[i]; if(S.monedas>=Math.max(0,p.costo-Math.max(0,S.pagado[i]||0))) return p; }
  const listas=[...activos('paca').filter(s=>pacaLista(paca(s.id))||paca(s.id).tierra>0&&S.carga.length<capacidad()),
    ...activos('huerta').filter(s=>{ const h=huerta(s.id); return h.c>=0&&h.t>=CULTIVOS[h.c].seg; })];
  if(listas.length) return cerca(listas);
  if(lleva('o')){ const o=cerca(activos('paca').filter(s=>{ const p=paca(s.id); return !p.s.length&&p.kg<PACA_KG; })); if(o) return o; }
  if(lleva('r')){ const o=cerca(activos('rec')); if(o) return o; }
  if(lleva('t')){ const o=cerca(activos('huerta').filter(s=>huerta(s.id).c<0)); if(o) return o; }
  if(S.carga.length<capacidad()){ if(S.casa.o+S.casa.r>0) return SITIOS.casa;
    const v=cerca(activos('vecino').filter(s=>vecino(s.id).n>=3)); if(v) return v; }
  return prox.length?SEQ[prox[0]]:null;
}

function update(dt){
  S.t+=dt; if(S.t>=DIA){ S.t-=DIA; pasarDia(); }
  for(const id in S.pacas){ const p=S.pacas[id]; p.s.forEach(x=>{ if(x.t<FLORES[x.f].seg) x.t+=dt*NIVELES[nivelDe(id)].vel; }); }
  for(const id in S.huertas){ const h=S.huertas[id]; if(h.c>=0&&h.t<CULTIVOS[h.c].seg) h.t+=dt*NIVELES[nivelDe(id)].vel; }
  // movimiento: joystick o teclas
  let dx=0,dy=0;
  if(joy&&joy.activo){ const ex=joy.x-joy.x0, ey=joy.y-joy.y0, m=Math.hypot(ex,ey); if(m>6){ const f=Math.min(1,m/35); dx=ex/m*f; dy=ey/m*f; } }
  if(keys.left)dx-=1; if(keys.right)dx+=1; if(keys.up)dy-=1; if(keys.down)dy+=1;
  const m=Math.hypot(dx,dy);
  if(m>0){ if(m>1){ dx/=m; dy/=m; } const v=VELOCIDAD[S.bici?1:0]*dt, mx=dx*v, my=dy*v;
    pl.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    if(caminable(pl.x+mx,pl.y+my)){ pl.x+=mx; pl.y+=my; } else if(caminable(pl.x+mx,pl.y)) pl.x+=mx; else if(caminable(pl.x,pl.y+my)) pl.y+=my;
    pl.step=S.bici?0:1+(Math.floor(time*8)%2); quieto=0;
    if(!S.movido){ S.movido=true; $('swipe').style.display='none'; }
  } else { pl.step=0; quieto+=dt; }
  // acciones automáticas cada 0,12 s con los sitios cercanos
  tic+=dt; if(tic>=.12){ tic=0; LISTA.forEach(s=>{ if(hecho(s.id)&&Math.hypot(s.x-pl.x,s.y+3-pl.y)<9) actuar(s); }); }
  proximos().forEach(i=>{ const p=SEQ[i]; if(Math.hypot(p.x-pl.x,p.y-pl.y)<4.5) pagar(i,dt); });
  vuelos.forEach(v=>v.t+=dt/.3); for(let i=vuelos.length-1;i>=0;i--) if(vuelos[i].t>=1) vuelos.splice(i,1);
  textos.forEach(v=>v.t+=dt); for(let i=textos.length-1;i>=0;i--) if(textos[i].t>=1.2) textos.splice(i,1);
}

// ======================= DIBUJO =======================
let X=x=>x, Y=y=>y;
function etiquetaTexto(txt,x,y,tam,col){ ctx.font=tam+'px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.lineWidth=4; ctx.strokeStyle='#2b1d0e'; ctx.strokeText(txt,x,y); ctx.fillStyle=col||'#fff'; ctx.fillText(txt,x,y); }
function globo(x,y,ico,num,col){ y+=Math.round(Math.sin(time*4+x)*1.5); const w=num!==undefined?48:30;
  ctx.fillStyle='#2b1d0e'; ctx.beginPath(); ctx.roundRect(x-w/2-2,y-17,w+4,30,12); ctx.fill(); ctx.beginPath(); ctx.moveTo(x-6,y+12); ctx.lineTo(x+6,y+12); ctx.lineTo(x,y+19); ctx.fill();
  ctx.fillStyle=col||'#fff'; ctx.beginPath(); ctx.roundRect(x-w/2,y-15,w,26,10); ctx.fill();
  const ix=num!==undefined?x-w/2+5:x-10; if(ico instanceof HTMLCanvasElement) ctx.drawImage(ico,ix,y-12,20,20); else { ctx.font='16px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(ico,ix,y-1); }
  if(num!==undefined){ ctx.font='10px "Press Start 2P",monospace'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#2b1d0e'; ctx.fillText(String(num),x+2,y); } }
function anillo(x,y,f){ ctx.lineWidth=5; ctx.strokeStyle='#2b1d0e'; ctx.beginPath(); ctx.arc(x,y,11,0,7); ctx.stroke();
  ctx.strokeStyle='#cdbb98'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,11,0,7); ctx.stroke();
  ctx.strokeStyle='#58d858'; ctx.beginPath(); ctx.arc(x,y,11,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,f)); ctx.stroke(); }
function estrellas(x,y,n){ for(let i=0;i<n;i++){ const ex=x-n*7+i*14; ctx.fillStyle='#2b1d0e'; ctx.fillRect(ex,y,12,12); ctx.fillStyle='#ffd23f'; ctx.fillRect(ex+2,y+2,8,8); ctx.fillStyle='#fff3a8'; ctx.fillRect(ex+3,y+3,3,3); } }

function dibujarPad(i){ const p=SEQ[i], x=X(p.x), y=Y(p.y), f=p.costo?Math.min(1,(S.pagado[i]||0)/p.costo):Math.min(1,-(S.pagado[i]||0)/.35), enc=Math.hypot(p.x-pl.x,p.y-pl.y)<4.5;
  if(p.tipo==='construir'){ ctx.setLineDash([8,6]); ctx.lineWidth=3; ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.beginPath(); ctx.roundRect(x-40,y-34,80,44,10); ctx.stroke(); ctx.setLineDash([]); }
  const s=enc?40:36; ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(-s/2+2,-s/2+4,s,s,8); ctx.fill();
  ctx.fillStyle='#5f6670'; ctx.beginPath(); ctx.roundRect(-s/2,-s/2,s,s,8); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-s/2,-s/2,s,s,8); ctx.clip(); ctx.fillStyle='#58b868'; ctx.fillRect(-s/2,s/2-s*f,s,s*f); ctx.restore();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.roundRect(-s/2+3,-s/2+3,s-6,s-6,6); ctx.stroke();
  ctx.font='17px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.ico,0,-5);
  ctx.restore();
  etiquetaTexto(p.costo?'$'+Math.max(0,p.costo-(S.pagado[i]>0?S.pagado[i]:0)):'GRATIS',x,y+11,9,'#fff'); }

function dibujarSitio(s){ const x=X(s.x), y=Y(s.y), id=s.id;
  if(s.t==='casa'){ ctx.drawImage(CASA,x-39,y-66,78,78); const nb=Math.min(6,S.casa.b); for(let k=0;k<nb;k++) ctx.drawImage(ICON.b,x+36+(k%3)*12,y-10-Math.floor(k/3)*12,14,16);
    const n=S.casa.o+S.casa.r; if(n) return ()=>globo(x,y-80,S.casa.o?ICON.o:ICON.r,n); return; }
  if(s.t==='vecino'){ const v=vecino(id); ctx.drawImage(CASAS_VEC[s.i%CASAS_VEC.length],x-39,y-66,78,78);
    for(let k=0;k<Math.min(6,v.n);k++) ctx.drawImage(k%2?ICON.o:ICON.r,x+36+(k%3)*12,y-10-Math.floor(k/3)*12,14,16);
    if(v.n) return ()=>globo(x,y-80,ICON.o,v.n); return; }
  if(s.t==='tienda'){ ctx.drawImage(TIENDA,x-45,y-66,90,78); return; }
  if(s.t==='rec'){ ctx.drawImage(CARRETA,x+6,y-30,48,36); ctx.drawImage(persona(RECI,'down',0),x-22,y-48,36,51);
    return ()=>globo(x,y-62,ICON.r,undefined,lleva('r')?'#c8f7c5':'#fff'); }
  const n=nivelDe(id), e=[1,1.2,1.4][n];
  if(s.t==='paca'){ const p=paca(id); ctx.drawImage(PACA[p.kg>0?1:0],x-33*e,y-36*e,66*e,48*e); estrellas(x,y+14,n);
    p.s.forEach((q,k)=>{ const f=FLORES[q.f], g=Math.min(1,q.t/f.seg), t=Math.round(20+40*g), fx=x+(p.s.length>1?(k?18:-18):0); ctx.drawImage(f.hi,fx-t/2,y-28*e-t,t,t); });
    if(pacaLista(p)) return ()=>globo(x,y-100*e,FLORES[p.s[0].f].hi,undefined,'#c8f7c5');
    if(p.s.length) return ()=>anillo(x,y-96*e,Math.min(...p.s.map(q=>q.t/FLORES[q.f].seg)));
    if(p.tierra>0) return ()=>globo(x,y-56*e,ICON.t,p.tierra);
    return ()=>globo(x,y-56*e,ICON.o,PACA_KG-p.kg); }
  if(s.t==='huerta'){ const h=huerta(id); ctx.drawImage(HUERTA,x-33*e,y-30*e,66*e,42*e); estrellas(x,y+14,n);
    if(h.c>=0){ const c=CULTIVOS[h.c], g=Math.min(1,h.t/c.seg), t=3+Math.round(6*g);
      for(let i=0;i<8;i++){ const px=x-26*e+(i%4)*15*e, py=y-12*e+(i>>2)*12*e; ctx.fillStyle='#3d8f45'; ctx.fillRect(px,py-t,6,t); if(g>.6){ ctx.fillStyle=c.col; ctx.fillRect(px-1,py-t-4,8,6); } }
      if(g>=1) return ()=>globo(x,y-52*e,'🧺',undefined,'#c8f7c5'); return ()=>anillo(x,y-48*e,g); }
    return ()=>globo(x,y-50*e,ICON.t,CULTIVOS[h.prox].tierra-h.tierra); }
}

function dibujarJugador(){ const x=X(pl.x), y=Y(pl.y), atras=(pl.dir==='right'||pl.dir==='down')?-1:1, niv=S.carrito||0, cw=[26,38,52][niv], bici=S.bici;
  const cx=atras<0?x-(bici?26:14)-cw:x+(bici?26:14), cyy=y-22;
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(cx,cyy+20,cw,4); ctx.fillStyle=niv?'#5d6b7a':'#8a8f98'; ctx.fillRect(cx,cyy+6,cw,12); ctx.fillStyle='#b3b8c0'; ctx.fillRect(cx,cyy+6,cw,3);
  ctx.fillStyle='#222'; ctx.fillRect(cx+3,cyy+17,6,6); ctx.fillRect(cx+cw-9,cyy+17,6,6); if(niv===2) ctx.fillRect(cx+cw/2-3,cyy+17,6,6);
  // la carga se apila en el carrito: se ve cuánto llevas
  const cols=niv+1, bw=(cw-6)/cols;
  S.carga.forEach((t,i)=>{ const c=i%cols, r=Math.floor(i/cols), bx=cx+3+c*bw, by=cyy+6-(r+1)*6, col=COLOR_CARGA[t];
    ctx.fillStyle='#2b1d0e'; ctx.fillRect(bx,by,bw-1,6); ctx.fillStyle=col[0]; ctx.fillRect(bx+1,by+1,bw-3,4); ctx.fillStyle=col[1]; ctx.fillRect(bx+1,by+1,bw-3,1); });
  if(S.carga.length>=capacidad()) etiquetaTexto('LLENO',cx+cw/2,cyy+6-Math.ceil(S.carga.length/cols)*6-10,8,'#ffe27a');
  const py=y-48-(bici?15:0);
  if(bici) ctx.drawImage(BICI[pl.dir==='left'||pl.dir==='up'?'left':'right'],x-33,y-36,66,39);
  ctx.fillStyle='rgba(88,216,88,.35)'; ctx.beginPath(); ctx.ellipse(x,y+1,16,6,0,0,7); ctx.fill();
  ctx.drawImage(persona(YO,pl.dir,pl.step),x-18,py,36,51);
  const h=SOMBREROS.find(o=>o.id===S.puesto);
  if(h){ const px=x-18;
    if(h.gorra){ ctx.fillStyle=h.copa; ctx.fillRect(px+6,py-3,24,9); ctx.fillStyle=h.ala;
      if(pl.dir==='right') ctx.fillRect(px+30,py+3,9,4); else if(pl.dir==='left') ctx.fillRect(px-3,py+3,9,4); else if(pl.dir==='down') ctx.fillRect(px+9,py+6,18,3); }
    else { ctx.fillStyle='#2b1d0e'; ctx.fillRect(px-5,py+2,46,7); ctx.fillStyle=h.ala; ctx.fillRect(px-4,py+3,44,5);
      if(h.rayas){ ctx.fillStyle='#2b1d0e'; for(let i=0;i<6;i++) ctx.fillRect(px-2+i*8,py+4,4,3); }
      ctx.fillStyle=h.copa; ctx.fillRect(px+6,py-7,24,10); ctx.fillStyle=h.cinta; ctx.fillRect(px+6,py,24,3); } } }

function flecha(o){ if(!o) return; const x=X(o.x), y=Y(o.y), m=30;
  if(x>m&&x<VW-m&&y>90&&y<VH-m){ const b=Math.abs(Math.sin(time*5))*10, ay=y-(o.tipo?52:110)-b;
    ctx.fillStyle='#2b1d0e'; ctx.beginPath(); ctx.moveTo(x-16,ay-3); ctx.lineTo(x+16,ay-3); ctx.lineTo(x+16,ay+10); ctx.lineTo(x+24,ay+10); ctx.lineTo(x,ay+34); ctx.lineTo(x-24,ay+10); ctx.lineTo(x-16,ay+10); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(x-12,ay); ctx.lineTo(x+12,ay); ctx.lineTo(x+12,ay+13); ctx.lineTo(x+18,ay+13); ctx.lineTo(x,ay+29); ctx.lineTo(x-18,ay+13); ctx.lineTo(x-12,ay+13); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff3a8'; ctx.fillRect(x-9,ay+3,5,9); return; }
  // fuera de la pantalla: una flecha en el borde apunta hacia allá
  const cx=VW/2, cy=VH/2, a=Math.atan2(y-cy,x-cx), r=Math.min((VW/2-40)/Math.abs(Math.cos(a)||1e-6),(VH/2-60)/Math.abs(Math.sin(a)||1e-6));
  ctx.save(); ctx.translate(cx+Math.cos(a)*r,cy+Math.sin(a)*r); ctx.rotate(a); const b=Math.abs(Math.sin(time*5))*6; ctx.translate(-b,0);
  ctx.fillStyle='#2b1d0e'; ctx.beginPath(); ctx.moveTo(24,0); ctx.lineTo(-10,-20); ctx.lineTo(-10,20); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-6,-14); ctx.lineTo(-6,14); ctx.closePath(); ctx.fill(); ctx.restore(); }

function draw(dt){
  // la cámara sigue al jugador con suavidad
  const tx=pl.x-VW/PXM/2, ty=pl.y-VH/PXM/2-4, s=Math.min(1,dt*6); cam.x+=(tx-cam.x)*s; cam.y+=(ty-cam.y)*s;
  const esc=PXM*K, ox=cam.x*esc, oy=cam.y*esc;
  X=x=>(x-cam.x)*PXM; Y=y=>(y-cam.y)*PXM;
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#dfeecb'; ctx.fillRect(0,0,cv.width,cv.height);
  dibujarMapa(ctx,esc,ox,oy);
  // zona todavía cerrada: niebla fuera del círculo
  ctx.setTransform(esc,0,0,esc,-ox,-oy); const R=radio(); const niebla=new Path2D(); niebla.rect(cam.x-50,cam.y-50,VW/PXM+100,VH/PXM+100); niebla.arc(C[0],C[1],R,0,7);
  ctx.fillStyle='rgba(225,236,240,.72)'; ctx.fill(niebla,'evenodd'); ctx.setLineDash([3,2]); ctx.lineWidth=.6; ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.arc(C[0],C[1],R,0,7); ctx.stroke(); ctx.setLineDash([]);
  ctx.setTransform(K,0,0,K,0,0); ctx.imageSmoothingEnabled=false;
  ctx.font='bold 13px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#9aa0a8';
  MAPA.rotulos.forEach(r=>{ const x=X(r.x), y=Y(r.y); if(x<-80||y<-80||x>VW+80||y>VH+80) return;
    if(r.v){ ctx.save(); ctx.translate(x,y); ctx.rotate(-Math.PI/2); ctx.fillText(r.n,0,0); ctx.restore(); } else ctx.fillText(r.n,x,y); });
  const prox=proximos();
  // todo lo que va encima, ordenado de arriba a abajo
  const ents=[], vis=(x,y)=>X(x)>-100&&X(x)<VW+100&&Y(y)>-140&&Y(y)<VH+80;
  arbolesEn(cam.x-8,cam.y-4,cam.x+VW/PXM+8,cam.y+VH/PXM+12,k=>ents.push({y:AR[k+1],k}));
  LISTA.forEach(s=>{ if(hecho(s.id)&&vis(s.x,s.y)) ents.push({y:s.y,s}); });
  ents.push({y:pl.y,p:1});
  const cm=camion(); if(cm&&vis(cm.x,cm.y)) ents.push({y:cm.y,c:cm});
  ents.sort((a,b)=>a.y-b.y);
  const post=[];
  for(const e of ents){
    if(e.p) dibujarJugador();
    else if(e.c){ ctx.drawImage(CAMION[ladoCamion],X(e.c.x)-45,Y(e.c.y)-48,90,57); }
    else if(e.s){ const f=dibujarSitio(e.s); if(f) post.push(f); }
    else ctx.drawImage(ESPECIES[AR[e.k+2]].mini,X(AR[e.k])-16,Y(AR[e.k+1])-44,32,48);
  }
  prox.forEach(dibujarPad);   // los cuadros para construir van encima de los árboles para que siempre se vean
  post.forEach(f=>f());
  vuelos.forEach(v=>{ const t=v.t, x=X(v.ax+(v.bx-v.ax)*t), y=Y(v.ay+(v.by-v.ay)*t)-Math.sin(t*Math.PI)*24;
    if(v.ico==='$'){ ctx.fillStyle='#2b1d0e'; ctx.fillRect(x-8,y-5,16,10); ctx.fillStyle='#58b868'; ctx.fillRect(x-7,y-4,14,8); ctx.fillStyle='#2e7d32'; ctx.fillRect(x-2,y-2,4,4); }
    else ctx.drawImage(ICON[v.ico],x-8,y-9,16,18); });
  textos.forEach(v=>{ ctx.globalAlpha=Math.max(0,1-v.t/1.2); etiquetaTexto(v.txt,X(v.x),Y(v.y)-v.t*30,11,v.col); ctx.globalAlpha=1; });
  if(!paused) flecha(objetivo());
  // joystick
  if(joy&&joy.activo){ ctx.setTransform(dpr,0,0,dpr,0,0); const ex=joy.x-joy.x0, ey=joy.y-joy.y0, m=Math.hypot(ex,ey), f=m>45?45/m:1;
    ctx.fillStyle='rgba(255,255,255,.28)'; ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(joy.x0,joy.y0,55,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(joy.x0+ex*f,joy.y0+ey*f,24,0,7); ctx.fill(); }
}

let last=0, hudT=0;
function loop(ts){ const dt=Math.min(.05,(ts-last)/1000||0); last=ts; time+=dt; if(!paused) update(dt); draw(dt);
  hudT+=dt; if(hudT>.15){ hudT=0; hud(); } requestAnimationFrame(loop); }

// ======================= INTERFAZ =======================
function hud(){ $('pMon').textContent='$'+S.monedas; $('pCarga').textContent=S.carga.length+'/'+capacidad();
  $('pCam').textContent=(CAMION_CADA-S.dia%CAMION_CADA)+'d'; }
let toastT=0; function toast(t){ const e=$('toast'); e.textContent=t; e.style.display='block'; clearTimeout(toastT); toastT=setTimeout(()=>e.style.display='none',3500); }

// Joystick: arrastra el dedo en cualquier parte. Un toque corto sobre un árbol abre su ficha.
let joy=null;
cv.addEventListener('pointerdown',e=>{ if(paused) return; e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  joy={id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,t0:performance.now(),activo:true,max:0}; });
cv.addEventListener('pointermove',e=>{ if(!joy||e.pointerId!==joy.id) return; joy.x=e.clientX; joy.y=e.clientY; joy.max=Math.max(joy.max,Math.hypot(joy.x-joy.x0,joy.y-joy.y0)); });
const soltarJoy=e=>{ if(!joy||e.pointerId!==joy.id) return; const tap=joy.max<10&&performance.now()-joy.t0<350, px=joy.x0, py=joy.y0; joy=null;
  if(!tap) return; const wx=cam.x+px*dpr/K/PXM, wy=cam.y+py*dpr/K/PXM; let arbol=null, best=4;
  arbolesEn(wx-6,wy-2,wx+6,wy+10,k=>{ const d=Math.hypot(AR[k]-wx,AR[k+1]-3.5-wy); if(d<best){ best=d; arbol=k; } });
  if(arbol!==null) openCard(ESPECIES[AR[arbol+2]],AR[arbol+3]); };
cv.addEventListener('pointerup',soltarJoy); cv.addEventListener('pointercancel',soltarJoy);

// ---------- Ficha y álbum de árboles ----------
const cardOv=$('cardOv'), albumOv=$('albumOv'); let current=null;
const count=()=>ESPECIES.filter(e=>S.found[e.nombre]).length;
function cerrarFichas(){ cardOv.style.display='none'; albumOv.style.display='none'; paused=false; current=null; for(const k in keys) keys[k]=false; }
function openCard(e,altura){ current=e; paused=true; joy=null; albumOv.style.display='none';
  beads(grande(e),$('cardSprite')); $('cardName').textContent=e.nombre.toUpperCase(); $('cardSci').textContent=e.spec.sci||'';
  $('cardFact').textContent=(e.cuantos===1?'Es el único de su especie en el barrio.':'Hay '+e.cuantos+' en el barrio.')+(altura?' Este mide unos '+altura+' m.':'');
  const rec=S.found[e.nombre], img=$('cardPhoto');
  if(rec&&rec.photo){ img.src=rec.photo; img.style.display='block'; } else img.style.display='none';
  $('cardStatus').textContent=rec?'✔ Registrado el '+rec.date:'';
  $('btnFoto').textContent=rec?(rec.photo?'CAMBIAR FOTO':'AÑADIR FOTO'):'REGISTRAR CON FOTO';
  $('btnReg').style.display=rec?'none':'block'; cardOv.style.display='flex'; $('card').scrollTop=0; }
function register(e,photo){ const isNew=!S.found[e.nombre], prev=S.found[e.nombre]||{};
  S.found[e.nombre]={date:prev.date||new Date().toLocaleDateString('es'),photo:photo||prev.photo||null}; persist(); openCard(e);
  if(isNew) toast('🌳 ¡'+e.corto+' registrado! Llevas '+count()+' de '+ESPECIES.length); }
$('btnReg').onclick=()=>current&&register(current,null);
$('btnFoto').onclick=()=>$('file').click();
$('btnClose').onclick=cerrarFichas;
$('file').onchange=ev=>{ const file=ev.target.files[0], e=current; ev.target.value=''; if(!file||!e) return;
  const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=56; const g=c.getContext('2d');
    const s=Math.min(img.width,img.height); g.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,56,56); URL.revokeObjectURL(img.src); register(e,c.toDataURL('image/png')); };
  img.src=URL.createObjectURL(file); };
function openAlbum(){ cardOv.style.display='none'; paused=true; joy=null;
  $('albumSub').textContent=count()+' de '+ESPECIES.length+' especies registradas · toca un árbol en el mapa para verlo';
  const grid=$('grid'); grid.innerHTML='';
  ESPECIES.forEach(e=>{ const ok=!!S.found[e.nombre], d=document.createElement('div'); d.className='cell'+(ok?'':' no');
    if(ok){ const c=document.createElement('canvas'); beads(grande(e),c); d.appendChild(c); d.appendChild(document.createTextNode(e.corto)); d.onclick=()=>openCard(e); }
    else { const q=document.createElement('div'); q.className='q'; q.textContent='?'; d.appendChild(q); d.appendChild(document.createTextNode('???')); }
    const s=document.createElement('small'); s.textContent=e.cuantos+(e.cuantos===1?' árbol':' árboles'); d.appendChild(s); grid.appendChild(d); });
  albumOv.style.display='flex'; }
$('btnAlbum').onclick=openAlbum;
$('btnAlbumClose').onclick=cerrarFichas;

// ---------- Teclado (computador) ----------
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
addEventListener('keydown',e=>{ if(KEYMAP[e.key]){ keys[KEYMAP[e.key]]=true; e.preventDefault(); } else if(e.key==='Escape') cerrarFichas(); });
addEventListener('keyup',e=>{ if(KEYMAP[e.key]) keys[KEYMAP[e.key]]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; joy=null; });
setInterval(persist,4000);
if(S.movido) $('swipe').style.display='none';
hud(); requestAnimationFrame(loop);
