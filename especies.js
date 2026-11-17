// ======================= ESPECIES =======================
// Cada especie del censo se dibuja con una "receta": una flor (F) o un árbol (A).
// Las reglas se prueban en orden contra el nombre común; la primera que coincide gana.
const F=(shape,P,Q,C,sci,x)=>({k:'flor',shape,P,Q,C,sci,...x});
const A=(forma,sci,dots,leaf)=>({k:'arbol',forma,sci,dots,leaf});
const REGLAS=[
  [/jazmin del cabo|laurel huesito/, F('cluster','#ffffff','#d9dfe6','#f2d64b','Pittosporum undulatum')],
  [/sauco/,                 F('cluster','#fff6d6','#e0d2a0','#b8a45a','Sambucus nigra')],
  [/chicala|chirlobirlo/,   F('lily','#ffd23f','#e8a713','#b86e00','Tecoma stans')],
  [/palma (de )?yuca|palmiche/, A('palma','Yucca gigantea','#fffbe6','#4f9a5a')],
  [/guayacan de manizales/, A('hoja','Lafoensia acuminata','#f3e9a6')],
  [/caucho benjamin/,       A('hoja','Ficus benjamina',null,'#3f9d5a')],
  [/caucho sabanero/,       A('hoja','Ficus soatensis',null,'#2f8a4a')],
  [/caucho de la india/,    A('hoja','Ficus elastica',null,'#2e7d4f')],
  [/caucho lira/,           A('hoja','Ficus lyrata',null,'#3a8f3a')],
  [/caucho/,                A('hoja','Ficus sp.',null,'#35904a')],
  [/cayeno/,                F('cayena','#ff5a4d','#c2271f','#ffd23f','Hibiscus rosa-sinensis')],
  [/cerezo/,                A('hoja','Prunus serotina','#8e1b2e')],
  [/araucaria/,             A('pino','Araucaria sp.',null,'#2f7d4a')],
  [/urapan/,                A('hoja','Fraxinus uhdei',null,'#5cb85c')],
  [/eugenia/,               A('hoja','Syzygium paniculatum','#d81b60')],
  [/eucalipto de flor|lavabotella|calistemo/, F('lavanda','#ef4444','#b91c1c','#ef4444','Callistemon sp.')],
  [/acacia morada/,         A('hoja','Acacia baileyana','#ffd23f','#7d8fa3')],
  [/acacia/,                A('hoja','Acacia sp.','#ffd23f','#5a9a5a')],
  [/aliso/,                 A('hoja','Alnus acuminata')],
  [/pino patula/,           A('pino','Pinus patula')],
  [/pino libro/,            A('pino','Platycladus orientalis',null,'#4c9a5a')],
  [/cipres/,                A('pino','Cupressus sp.',null,'#2c6e49')],
  [/pino/,                  A('pino','',null,'#2f7a40')],
  [/sauce/,                 A('hoja','Salix humboldtiana',null,'#8bc34a')],
  [/holly/,                 A('hoja','','#e64a19','#3f8f4a')],
  [/palma payanesa/,        A('palma','Archontophoenix cunninghamiana')],
  [/palma de cera/,         A('palma','Ceroxylon sp.')],
  [/palma fenix/,           A('palma','Phoenix canariensis')],
  [/palma/,                 A('palma','')],
  [/duraznillo/,            A('hoja','Abatia parviflora','#fff3c4')],
  [/durazno/,               A('hoja','Prunus persica','#f8a5c2')],
  [/caballero de la noche|dama de noche/, F('cluster','#f4f7d9','#cfd8a0','#9aa85a','Cestrum nocturnum')],
  [/jazmin/,                F('cluster','#ffffff','#dfe3ea','#f5e79e','')],
  [/roble australiano|grevilea/, A('hoja','Grevillea robusta','#ff9800')],
  [/roble/,                 A('hoja','Quercus humboldtii',null,'#3e8e41')],
  [/sietecueros real/,      F('cayena','#d81b8a','#8e1260','#ffe9f6','Tibouchina lepidota')],
  [/siete ?cueros/,         F('cayena','#8e44ad','#5b2c83','#f1e4ff','Tibouchina urvilleana')],
  [/schefflera/,            A('hoja','Schefflera sp.',null,'#3f9d5a')],
  [/pajarito/,              F('orchid','#e6e24a','#a8a11e','#7a2e12','Crotalaria agathiflora')],
  [/falso pimiento/,        A('hoja','Schinus molle','#f48fb1','#7cb86a')],
  [/pomarroso/,             A('hoja','Syzygium jambos','#fff3c4')],
  [/eucalipto/,             A('hoja','Eucalyptus sp.',null,'#6fa58c')],
  [/ayer, hoy/,             F('cayena','#8c6be0','#4a2fa8','#ffffff','Brunfelsia pauciflora')],
  [/cedro|cedrillo/,        A('hoja','',null,'#4a9a4a')],
  [/abutilon blanco/,       F('cayena','#ffffff','#d9dfe6','#f5c21b','Abutilon sp.')],
  [/abutilon/,              F('calla','#e53935','#b71c1c','#ffd23f','Abutilon megapotamicum')],
  [/arrayan/,               A('hoja','Myrcianthes leucoxyla','#ffffff','#3f8f4a')],
  [/amarrabollo/,           F('cayena','#e0409a','#9c1f66','#ffe082','Meriania nobilis')],
  [/nogal/,                 A('hoja','Juglans neotropica')],
  [/brevo/,                 A('hoja','Ficus carica','#6a3d7a')],
  [/naranjo/,               A('hoja','Citrus × sinensis','#ff9800','#2e7d4f')],
  [/mandarina/,             A('hoja','Citrus reticulata','#ffa726','#2e7d4f')],
  [/limon/,                 A('hoja','Citrus × limon','#ffe14d','#2e7d4f')],
  [/cajeto/,                A('hoja','Citharexylum sp.','#ff8f00')],
  [/fucsia/,                F('lavanda','#e91e63','#9c1450','#e91e63','Fuchsia sp.')],
  [/liquidambar/,           A('hoja','Liquidambar styraciflua',null,'#c9772e')],
  [/feijoa/,                A('hoja','Acca sellowiana','#e53935','#6f9f7a')],
  [/mermelada/,             F('cluster','#ff9a3c','#e0621a','#ffe082','Streptosolen jamesonii')],
  [/magnolio/,              F('lily','#ffffff','#e3dccb','#e8c34a','Magnolia grandiflora')],
  [/higuerillo/,            A('hoja','Ricinus communis','#c62828','#5a8f4a')],
  [/carbonero/,             F('daisy','#e53935','#b71c1c','#7f1010','Calliandra sp.',{big:true})],
  [/alcaparro/,             F('cluster','#ffd23f','#e0a012','#fff3a8','Senna sp.')],
  [/papayuelo/,             A('hoja','Vasconcellea pubescens','#ffd23f')],
  [/cafe/,                  A('hoja','Coffea arabica','#c62828','#2e7d4f')],
  [/guayabo/,               A('hoja','','#e6e27a')],
  [/aguacate/,              A('hoja','Persea americana','#33691e')],
  [/lavanda/,               F('lavanda','#a78bfa','#7c5ad6','#a78bfa','Lavandula sp.')],
  [/arboloco/,              F('daisy','#ffd23f','#e8a713','#8a5a12','Smallanthus pyramidalis')],
  [/azalea/,                F('cayena','#ff7eb6','#d63d82','#fff0f6','Rhododendron sp.')],
  [/borrachero/,            F('calla','#ffffff','#d9dfe6','#f5e79e','Brugmansia sp.')],
  [/manzano/,               A('hoja','Malus domestica','#e53935')],
  [/mirto|tibar/,           A('hoja','','#ffffff')],
  [/raphiolepys/,           A('hoja','Rhaphiolepis sp.','#f8a5c2')],
];
const VERDES=['#4caf50','#43a047','#5cb85c','#3f9d5a','#6aa84f'];
const sinTildes=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const ESPECIES=MAPA.especies.map((e,i)=>{
  const n=sinTildes(e.n), regla=REGLAS.find(r=>r[0].test(n));
  const spec={...(regla?regla[1]:A('hoja',''))};
  if(spec.k==='arbol'&&!spec.leaf){ let h=0; for(const ch of n) h=(h*31+ch.charCodeAt(0))>>>0; spec.leaf=VERDES[h%VERDES.length]; }
  return {i,nombre:e.n,corto:e.n.split(',')[0],cuantos:e.c,spec,hi:null,mini:null};
});

// ---------- Dibujos detallados (32x32) ----------
const hrnd=(x,y)=>{ let n=Math.imul(x*374761393+y*668265263+7,1274126177); return ((n^(n>>>15))>>>0)/4294967296; };
function shade(hex,f){ const n=parseInt(hex.slice(1),16), ch=s=>Math.max(0,Math.min(255,Math.round(((n>>s)&255)*f)));
  return 'rgb('+ch(16)+','+ch(8)+','+ch(0)+')'; }
function genGrande(f){
  const N=32, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d');
  const px=(x,y,col)=>{ g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),1,1); };
  const ell=(cx,cy,rx,ry,deg,fn)=>{ const a=deg*Math.PI/180, co=Math.cos(a), si=Math.sin(a);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const dx=x-cx, dy=y-cy, u=(dx*co+dy*si)/rx, v=(-dx*si+dy*co)/ry;
      if(u*u+v*v<=1){ const col=fn(u,v,x,y); if(col) px(x,y,col); } } };
  const leaf=(cx,cy,rx,ry,deg,base)=>ell(cx,cy,rx,ry,deg,(u,v)=>Math.abs(v)<0.2&&Math.abs(u)<0.8?'#2a7332':v<0?(base||'#5cbd52'):'#43a047');
  const line=(x0,y0,x1,y1,col,w)=>{ const n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2));
    for(let i=0;i<=n;i++){ const t=i/n; for(let k=0;k<(w||1);k++) px(x0+(x1-x0)*t+k,y0+(y1-y0)*t,col); } };
  const polar=(cx,cy,fn)=>{ for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const dx=x-cx, dy=y-cy;
    const col=fn(Math.hypot(dx,dy),Math.atan2(dy,dx),x,y); if(col) px(x,y,col); } };
  const {P,Q,C}=f, cx=15.5, cy=11, STEM='#3a8f3a', PI=Math.PI;
  const stem=top=>line(15,31,15,top,STEM,2);

  if(f.k==='arbol'){ const L=f.leaf;
    if(f.forma==='pino'){
      for(let y=26;y<=31;y++){ px(14,y,'#8d5a2b'); px(15,y,'#7a4a21'); px(16,y,'#7a4a21'); px(17,y,'#5c3515'); }
      for(let y=1;y<=26;y++){ const tier=Math.floor((y-1)/6.5), k=(y-1)-tier*6.5, half=1.5+k*1.25+tier*1.3;
        for(let x=Math.ceil(cx-half);x<=Math.floor(cx+half);x++) px(x,y,k>5.4?shade(L,.62):x<cx-half*.35?shade(L,1.22):hrnd(x,y)<.18?shade(L,.8):L); }
    } else if(f.forma==='palma'){
      for(let y=9;y<=31;y++){ px(15,y,y%3?'#a98556':'#7d5f38'); px(16,y,y%3?'#8f6e45':'#6b5030'); }
      [[-90,7],[-35,9],[-145,9],[8,9],[172,9],[48,7],[132,7]].forEach(([d,len])=>{ const a=d*PI/180;
        ell(cx+Math.cos(a)*len*.55,9+Math.sin(a)*len*.55,len*.64,1.8,d,(u,v)=>Math.abs(v)<.3?shade(L,.7):v<0?shade(L,1.15):L); });
      if(f.dots) ell(cx,3.5,2.2,3.2,0,(u,v,x,y)=>hrnd(x,y)<.75?f.dots:shade(L,1.1));
    } else {
      for(let y=18;y<=31;y++){ px(14,y,'#8d5a2b'); px(15,y,'#7a4a21'); px(16,y,'#7a4a21'); px(17,y,'#5c3515'); }
      polar(cx,cy,(r,t,x,y)=>{ if(r>10.6*(1+.07*Math.cos(6*t+1))) return;
        if(f.dots&&hrnd(x,y)<.13) return f.dots;
        const luz=-(x-cx)*.5-(y-cy)*.6; return luz>3?shade(L,1.22):luz<-3?shade(L,.7):hrnd(x+9,y)<.2?shade(L,.85):L; });
    }
  }
  else if(f.shape==='daisy'){ const n=f.big?14:11, R=f.big?11:10, rc=f.big?4.6:3.6;
    stem(cy+R-2); leaf(9.5,25,5.5,2.6,25); leaf(21.5,22,5.5,2.6,-25);
    polar(cx,cy,(r,t,x,y)=>{ if(r<=rc) return r>rc-1.1?shade(C,.7):hrnd(x,y)<.3?shade(C,1.35):C;
      const k=Math.abs(Math.cos(n*t/2)), lim=rc+(R-rc)*Math.pow(k,.45);
      if(r<=lim) return k<.4||r<rc+1?Q:(r>lim-2&&k>.8?shade(P,1.1):P); });
  }
  else if(f.shape==='rose'){ const R=9.5;
    stem(cy+R-1); leaf(9,25,5.5,2.8,25); leaf(22,22,5.5,2.8,-25);
    ell(10.5,19,3.5,1.6,-30,()=>'#43a047'); ell(20.5,19,3.5,1.6,30,()=>'#43a047');
    polar(cx,cy,(r,t)=>{ if(r>R*(1+.05*Math.cos(5*t))) return; if(r<1.3) return Q;
      let s=(r-2.6*(t+PI)/(2*PI))/2.6; s-=Math.floor(s); return s<.28?Q:s>.72?shade(P,1.18):P; });
  }
  else if(f.shape==='lily'){ const R=11.5;
    stem(cy+3); leaf(10,25,6.5,2,35); leaf(21,23,6.5,2,-35);
    polar(cx,cy,(r,t,x,y)=>{ const k=Math.abs(Math.sin(3*t)), lim=R*(.28+.72*Math.pow(k,1.2)); if(r>lim) return;
      return r<1.6?C:(k>.94&&r>3)?Q:(r<6&&hrnd(x,y)<.3)?shade(Q,.75):(r>lim-2.5?shade(P,1.1):P); });
    for(let i=0;i<6;i++){ const a=i*PI/3, ex=cx+Math.cos(a)*5.6, ey=cy+Math.sin(a)*5.6; line(cx,cy,ex,ey,'#f3e3a0'); px(ex,ey,C); }
  }
  else if(f.shape==='cluster'){ const R=10;
    stem(cy+7); leaf(8.5,25,6.5,3.2,20); leaf(22.5,24,6.5,3.2,-20);
    polar(cx,cy,(r,t,x,y)=>{ if(r>R*(1+.07*Math.cos(8*t))) return; const j=Math.floor(y/4), lx=(x+(j%2)*2)%4, ly=y%4;
      return lx===2&&ly===2?C:(lx===0&&ly!==2)||(ly===0&&lx!==2)?Q:(hrnd(x,y)<.2?shade(P,1.12):P); });
  }
  else if(f.shape==='lavanda'){
    leaf(10,28,6,1.3,40,'#8fbf8a'); leaf(21,28,6,1.3,-40,'#8fbf8a');
    [[8,5],[15.5,1],[23,6]].forEach(([tx,ty])=>{ line(15.5,31,tx+(15.5-tx)*.3,ty+13,STEM);
      for(let s=0;s<=13;s++){ const x=tx+(15.5-tx)*s/44; let hw=s<1?0:s<3?1:2; if(s%4===3) hw-=1;
        for(let d=-hw;d<=hw;d++) px(x+d,ty+s,d===-hw&&hw>1?shade(P,1.15):Math.abs(s+d)%2?P:Q); } });
  }
  else if(f.shape==='calla'){
    stem(18); leaf(8.5,26,7,3.4,30); leaf(23,25,6,3,-35);
    for(let y=1;y<=21;y++){ const v=(y-1)/20, w=8.5*Math.pow(Math.sin(PI*Math.pow(v,.75)),.85), m=15.5+(1-v)*(1-v)*4;
      for(let x=0;x<N;x++){ if(Math.abs(x-m)>w) continue; let col=P;
        const vi=(y-5)/11, wi=vi>0&&vi<1?5*Math.sin(PI*Math.pow(vi,.8)):-1, di=x-(m-.5);
        if(Math.abs(di)<=wi) col=Math.abs(di)<1.1&&y>6&&y<15?C:Q; else if(v>.82) col='#dfe8c8';
        px(x,y,col); } }
  }
  else if(f.shape==='cayena'){ const R=11.5;
    stem(cy+6); leaf(9,26,6,3,25); leaf(22,24,6,3,-25);
    polar(cx,cy,(r,t,x,y)=>{ const k=Math.abs(Math.cos(2.5*(t+PI/2))), lim=R*(.5+.5*Math.pow(k,.6))*(1+.04*Math.cos(13*t)); if(r>lim) return;
      return r<2.6?shade(Q,.55):r<4.6||k<.25?Q:hrnd(x,y)<.14?shade(P,1.15):P; });
    line(cx,cy,21,16,'#ffc4b0'); [[21,16],[22,17],[22,15],[20,17]].forEach(([x,y])=>px(x,y,C));
  }
  else { // orchid
    const sep=shade(P,1.14), pet=(u,v,x,y)=>Math.abs(v)<.14?Q:hrnd(x,y)<.15?sep:P;
    stem(cy+8); leaf(9,28,7,2.2,25); leaf(22,28,7,2.2,-25);
    ell(15.5,4.5,2.3,5,0,()=>sep); ell(8.5,16.5,5.5,2,-35,()=>sep); ell(22.5,16.5,5.5,2,35,()=>sep);
    ell(8.5,9.5,6,4.2,15,pet); ell(22.5,9.5,6,4.2,-15,pet);
    ell(15.5,15,4.3,5.6,0,(u,v)=>u*u+v*v>.6?Q:v<-.15?C:shade(Q,1.3));
    ell(15.5,10,1.6,1.6,0,()=>'#fff3f8');
  }
  // contorno oscuro, como en las figuras de cuentas
  const im=g.getImageData(0,0,N,N), d=im.data, Al=(x,y)=>x<0||y<0||x>=N||y>=N?0:d[(y*N+x)*4+3], edge=[];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(Al(x,y)&&(!Al(x-1,y)||!Al(x+1,y)||!Al(x,y-1)||!Al(x,y+1))) edge.push((y*N+x)*4);
  edge.forEach(k=>{ d[k]*=.5; d[k+1]*=.5; d[k+2]*=.5; }); g.putImageData(im,0,0);
  return c;
}
// ---------- Arbolito para el mapa (16x24) ----------
function genMini(f){
  const c=document.createElement('canvas'); c.width=16; c.height=24; const g=c.getContext('2d');
  const r=(x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(x,y,w,h); };
  const L=f.k==='arbol'?f.leaf:'#3f9d5a', osc=shade(L,.68), cla=shade(L,1.2), punto=f.k==='flor'?f.P:f.dots;
  r(3,21,10,3,'rgba(0,0,0,.2)');
  if(f.forma==='pino'){ r(7,19,2,4,'#7a4a21');
    for(let y=2;y<=19;y++){ const tier=Math.floor((y-2)/6), k=(y-2)%6, half=1+k*.9+tier*.9, x0=Math.round(8-half), w=Math.round(half*2);
      r(x0,y,w,1,k===5?osc:L); r(x0,y,Math.max(1,w>>2),1,cla); }
  } else if(f.forma==='palma'){ r(7,9,2,14,'#9c7a4d'); r(8,9,1,14,'#7d5f38');
    r(5,3,6,3,osc); r(2,5,12,2,osc); r(1,7,3,3,osc); r(12,7,3,3,osc); r(7,1,2,2,osc); r(6,4,4,1,L); r(3,5,4,1,L); r(9,5,4,1,L);
    if(punto){ r(7,2,2,2,punto); }
  } else { r(6,16,4,7,'#7a4a21'); r(6,16,1,7,'#8d5a2b');
    r(3,2,10,15,osc); r(1,5,14,9,osc); r(4,3,7,4,L); r(2,6,6,4,L); r(9,8,4,3,L); r(5,4,3,1,cla); r(3,7,2,1,cla);
    if(punto) [[4,5],[9,4],[12,8],[6,10],[10,12],[3,10],[7,7]].forEach(([x,y])=>r(x,y,2,2,punto));
  }
  return c;
}
ESPECIES.forEach(e=>{ e.mini=genMini(e.spec); });
const grande=e=>e.hi||(e.hi=genGrande(e.spec));

// Dibuja un sprite como si fuera de cuentas (hama beads)
function beads(src,dst){
  const n=src.width, b=8; dst.width=dst.height=n*b;
  const d=src.getContext('2d').getImageData(0,0,n,n).data, g=dst.getContext('2d');
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){ const k=(y*n+x)*4; if(d[k+3]<128) continue;
    const cx=x*b+b/2, cy=y*b+b/2;
    g.fillStyle='rgb('+d[k]+','+d[k+1]+','+d[k+2]+')'; g.beginPath(); g.arc(cx,cy,b*0.56,0,7); g.fill();
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.arc(cx,cy,b*0.2,0,7); g.fill();
    g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(cx-b*0.22,cy-b*0.24,b*0.11,0,7); g.fill(); }
}

