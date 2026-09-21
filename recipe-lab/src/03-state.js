<script>
/* =========================================================
   RECIPE LAB — générateur de fiches techniques
   Tout se passe dans le navigateur : aucune donnée n'est envoyée.
   ========================================================= */
(function(){
"use strict";

const VERSION = "1.2";

/* ---------- Langues & libellés de la fiche ---------- */
const LANGS = ['fr','en','it'];
const LANGNAME = {fr:'Français', en:'English', it:'Italiano'};
const L = {
  fr:{season:'Saison',date:'Date',chef:'Chef',cat:'Catégorie',ing:'Ingrédients',prep:'Préparation',
      sheet:'Fiche technique',ph1:'Plat dressé',ph2:'Art de la table',dish:'Nom du plat',by:'Fiche rédigée par'},
  en:{season:'Season',date:'Date',chef:'Chef',cat:'Category',ing:'Ingredients',prep:'Method',
      sheet:'Technical sheet',ph1:'Plated dish',ph2:'Tableware',dish:'Dish name',by:'Written by'},
  it:{season:'Stagione',date:'Data',chef:'Chef',cat:'Categoria',ing:'Ingredienti',prep:'Preparazione',
      sheet:'Scheda tecnica',ph1:'Piatto finito',ph2:'Arte della tavola',dish:'Nome del piatto',by:'Scheda redatta da'}
};
const LOCALE = {fr:'fr-FR', en:'en-GB', it:'it-IT'};

/* ---------- Unités ---------- */
const UNITS = [
  {c:'g',    n:{fr:'Gramme (g)',fr2:'g',en:'Gram (g)',it:'Grammo (g)'},    s:{fr:'g',en:'g',it:'g'}},
  {c:'kg',   n:{fr:'Kilogramme (kg)',en:'Kilogram (kg)',it:'Chilogrammo (kg)'}, s:{fr:'kg',en:'kg',it:'kg'}},
  {c:'ml',   n:{fr:'Millilitre (ml)',en:'Millilitre (ml)',it:'Millilitro (ml)'}, s:{fr:'ml',en:'ml',it:'ml'}},
  {c:'cl',   n:{fr:'Centilitre (cl)',en:'Centilitre (cl)',it:'Centilitro (cl)'}, s:{fr:'cl',en:'cl',it:'cl'}},
  {c:'l',    n:{fr:'Litre (l)',en:'Litre (l)',it:'Litro (l)'},            s:{fr:'l',en:'l',it:'l'}},
  {c:'qs',   n:{fr:'QS — quantité suffisante',en:'As needed',it:'QB — quanto basta'}, s:{fr:'QS',en:'as needed',it:'QB'}},
  {c:'tsp',  n:{fr:'Cuillère à café',en:'Teaspoon',it:'Cucchiaino'},      s:{fr:'c. à café',en:'tsp',it:'cucchiaino'}},
  {c:'tbsp', n:{fr:'Cuillère à soupe',en:'Tablespoon',it:'Cucchiaio'},    s:{fr:'c. à soupe',en:'tbsp',it:'cucchiaio'}},
  {c:'pinch',n:{fr:'Pincée',en:'Pinch',it:'Pizzico'},                     s:{fr:'pincée',en:'pinch',it:'pizzico'}},
  {c:'pc',   n:{fr:'Pièce',en:'Piece',it:'Pezzo'},                        s:{fr:'pce',en:'pc',it:'pz'}}
];
const UNIT_BY_CODE = Object.fromEntries(UNITS.map(u=>[u.c,u]));

/* ---------- 30 polices libres (SIL OFL / Apache 2.0) + 2 polices maison ---------- */
const FONTS = [
  {f:'Lineal',   w:'', c:'Velvetyne', local:true},
  {f:'Jost',            w:'400;500;700', c:'Géométrique'},
  {f:'Inter',           w:'400;500;700', c:'Sans'},
  {f:'Archivo',         w:'400;500;700', c:'Sans'},
  {f:'Space Grotesk',   w:'400;500;700', c:'Sans'},
  {f:'Work Sans',       w:'400;500;700', c:'Sans'},
  {f:'DM Sans',         w:'400;500;700', c:'Sans'},
  {f:'Manrope',         w:'400;500;700', c:'Sans'},
  {f:'Outfit',          w:'400;500;700', c:'Sans'},
  {f:'Poppins',         w:'400;500;700', c:'Géométrique'},
  {f:'Montserrat',      w:'400;500;700', c:'Géométrique'},
  {f:'Raleway',         w:'400;500;700', c:'Sans'},
  {f:'Libre Franklin',  w:'400;500;700', c:'Sans'},
  {f:'Public Sans',     w:'400;500;700', c:'Sans'},
  {f:'IBM Plex Sans',   w:'400;500;700', c:'Sans'},
  {f:'Syne',            w:'400;600;800', c:'Caractère'},
  {f:'Unbounded',       w:'400;600;800', c:'Caractère'},
  {f:'Oswald',          w:'400;500;700', c:'Condensé'},
  {f:'Anton',           w:'',            c:'Titrage'},
  {f:'Bebas Neue',      w:'',            c:'Titrage'},
  {f:'Archivo Black',   w:'',            c:'Titrage'},
  {f:'Abril Fatface',   w:'',            c:'Titrage'},
  {f:'Playfair Display',w:'400;500;700', c:'Serif'},
  {f:'Libre Baskerville',w:'400;700',    c:'Serif'},
  {f:'EB Garamond',     w:'400;500;700', c:'Serif'},
  {f:'Cormorant Garamond',w:'400;500;700',c:'Serif'},
  {f:'Lora',            w:'400;500;700', c:'Serif'},
  {f:'Source Serif 4',  w:'400;600;700', c:'Serif'},
  {f:'Bitter',          w:'400;500;700', c:'Serif'},
  {f:'Instrument Serif',w:'',            c:'Serif'},
  {f:'JetBrains Mono',  w:'400;700',     c:'Mono'}
];
const PRESET_COLORS = ['#FB511A','#F4EFE2','#F5F099','#1B1614','#FFFFFF','#0E564E','#1F6F63','#C8A24A','#8C1D18','#2B3A67','#E8E2D2','#6B6B6B'];

/* ---------- Petits utilitaires ---------- */
const $  = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));
const uid = ()=> Math.random().toString(36).slice(2,9);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T = v => (v&&typeof v==='object') ? v : {fr:v||'',en:'',it:''};
const tx = (v,lang)=> { v=T(v); return (v[lang]&&v[lang].trim()) ? v[lang] : (v.fr||''); };
function debounce(fn,ms){let t;return function(){clearTimeout(t);const a=arguments;t=setTimeout(()=>fn.apply(null,a),ms);};}

function toast(msg){
  const old=$('.toast'); if(old) old.remove();
  const d=document.createElement('div'); d.className='toast'; d.textContent=msg;
  document.body.appendChild(d); setTimeout(()=>d.remove(),2600);
}
let busyEl=null;
function busy(msg){
  if(!busyEl){ busyEl=document.createElement('div'); busyEl.className='busy';
    busyEl.innerHTML='<div><img class="art" src="'+ART.whisk+'" alt=""><p></p></div>'; document.body.appendChild(busyEl); }
  busyEl.style.display='grid'; $('p',busyEl).textContent=msg||'Un instant…';
}
function unbusy(){ if(busyEl) busyEl.style.display='none'; }

/* ---------- Chargement de scripts (cdnjs, repli jsDelivr) ---------- */
const LIBS = {
  jspdf:{test:()=>window.jspdf&&window.jspdf.jsPDF, urls:[
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js']},
  html2canvas:{test:()=>window.html2canvas, urls:[
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js']},
  xlsx:{test:()=>window.XLSX, urls:[
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']}
};
function loadOne(url){
  return new Promise((res,rej)=>{
    const s=document.createElement('script'); s.src=url; s.async=true;
    s.onload=()=>res(); s.onerror=()=>rej(new Error('load '+url));
    document.head.appendChild(s);
  });
}
async function lib(name){
  const d=LIBS[name]; if(d.test()) return true;
  for(const u of d.urls){ try{ await loadOne(u); if(d.test()) return true; }catch(e){} }
  throw new Error('Impossible de charger '+name);
}

/* ---------- Téléchargement ---------- */
let _dl, _dlAsked=false;
async function getDL(){
  if(_dlAsked) return _dl;
  _dlAsked=true;
  try{ _dl = (window.claude && typeof window.claude.use==='function') ? await window.claude.use('downloads') : null; }
  catch(e){ _dl=null; }
  return _dl;
}
async function saveFile(filename, blob){
  const dl = await getDL();
  if(dl){
    try{ await dl.save({filename, data:blob}); toast('Fichier enregistré'); return true; }
    catch(e){
      if(e && e.code==='declined'){ toast('Enregistrement annulé'); return false; }
      if(e && (e.code==='rejected_extension'||e.code==='bad_request')){ toast('Format refusé : '+filename); return false; }
    }
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  toast('Téléchargement lancé');
  return true;
}

/* ---------- Base64 sûr en UTF-8 ---------- */
function b64encode(str){
  const bytes=new TextEncoder().encode(str);
  let out=''; const CH=0x8000;
  for(let i=0;i<bytes.length;i+=CH) out+=String.fromCharCode.apply(null,bytes.subarray(i,i+CH));
  return btoa(out);
}
function b64decode(b64){
  const bin=atob(b64); const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---------- État ---------- */
function newGroupIng(){ return {id:uid(), title:{fr:'',en:'',it:''}, items:[newItem()]}; }
function newItem(){ return {id:uid(), name:{fr:'',en:'',it:''}, qty:'', unit:'g'}; }
function newGroupPrep(){ return {id:uid(), title:{fr:'',en:'',it:''}, text:{fr:'',en:'',it:''}}; }

function blankState(){
  return {
    v:1,
    meta:{restaurant:'', season:{fr:'',en:'',it:''}, date:'', chef:'',
          category:{fr:'',en:'',it:''}, dish:{fr:'',en:'',it:''}},
    ing:[newGroupIng()],
    prep:[newGroupPrep()],
    img:{logo:null, bg:null, dish:null, table:null},
    style:{bg:'#F4EFE2', ink:'#1B1614', accent:'#FB511A', on:'#F4EFE2', rule:'#1B1614',
           bgOpacity:0.10, titleFont:'Lineal', textFont:'Lineal'}
  };
}
let S = blankState();
let LANG = 'fr';
let ZOOM = null;            // null = ajustement automatique
const OPEN = new Set(['p1','p2','p3']);

/* ---------- Sauvegarde locale (navigateur uniquement) ---------- */
const LSKEY='recipelab.draft.v1';
const persist = debounce(function(){
  try{ localStorage.setItem(LSKEY, JSON.stringify(S)); }catch(e){}
},700);
function restore(){
  try{
    const raw=localStorage.getItem(LSKEY);
    if(raw){ const o=JSON.parse(raw); if(o&&o.meta){ S=migrate(o); return true; } }
  }catch(e){}
  return false;
}
function migrate(o){
  const b=blankState();
  const s=Object.assign(b,o);
  s.meta=Object.assign(b.meta,o.meta||{});
  ['season','category','dish'].forEach(k=>{ s.meta[k]=T(s.meta[k]); });
  s.style=Object.assign(b.style,o.style||{});
  s.img=Object.assign(b.img,o.img||{});
  s.ing=(o.ing&&o.ing.length?o.ing:[newGroupIng()]).map(g=>({
    id:g.id||uid(), title:T(g.title),
    items:(g.items||[]).map(i=>({id:i.id||uid(), name:T(i.name), qty:i.qty==null?'':String(i.qty), unit:i.unit||'g'}))
  }));
  s.prep=(o.prep&&o.prep.length?o.prep:[newGroupPrep()]).map(g=>({id:g.id||uid(), title:T(g.title), text:T(g.text)}));
  return s;
}
