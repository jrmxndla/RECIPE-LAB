/* =========================================================
   COULEUR — roue chromatique
   ========================================================= */
function hex2rgb(h){
  h=String(h||'').replace('#','').trim();
  if(h.length===3) h=h.split('').map(c=>c+c).join('');
  if(!/^[0-9a-fA-F]{6}$/.test(h)) return [0,0,0];
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function rgb2hex(r,g,b){
  return '#'+[r,g,b].map(v=>{
    const n=Math.round(Math.max(0,Math.min(255,v))).toString(16);
    return n.length<2?'0'+n:n;
  }).join('').toUpperCase();
}
function rgb2hsv(r,g,b){
  r/=255;g/=255;b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  let h=0;
  if(d){
    if(mx===r) h=60*(((g-b)/d)%6);
    else if(mx===g) h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
  }
  if(h<0)h+=360;
  return [h, mx?d/mx:0, mx];
}
function hsv2rgb(h,s,v){
  const c=v*s, x=c*(1-Math.abs(((h/60)%2)-1)), m=v-c;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
  return [(r+m)*255,(g+m)*255,(b+m)*255];
}
const COLORVAR={bg:'--s-bg',ink:'--s-ink',accent:'--s-accent',on:'--s-on',rule:'--s-rule'};
function applyLiveColor(key,val){
  S.style[key]=val;
  const sh=document.getElementById('sheet');
  sh.style.setProperty(COLORVAR[key],val);
  if(key==='bg') sh.style.background=val;
  if(key==='ink') sh.style.color=val;
  const dot=document.querySelector('.sw[data-key="'+key+'"] .dot');
  if(dot) dot.style.background=val;
}
let picker=null;
function closePicker(){
  if(!picker) return;
  picker.remove(); picker=null;
  document.removeEventListener('pointerdown',pickerOutside,true);
  persist();
}
function pickerOutside(e){ if(picker && !picker.contains(e.target)) closePicker(); }

function openColorPicker(anchor,key){
  closePicker();
  const p=document.createElement('div'); p.className='pop';
  p.innerHTML='<div class="wheelwrap"><canvas id="wheel" width="150" height="150"></canvas>'+
      '<div class="vslider" id="vsl"><div class="vknob" id="vkn"></div></div></div>'+
      '<div class="hexrow"><input class="inp" id="hexIn" maxlength="7" spellcheck="false"></div>'+
      '<div class="presets">'+PRESET_COLORS.map(c=>'<button type="button" data-c="'+c+'" style="background:'+c+'" title="'+c+'"></button>').join('')+'</div>';
  document.body.appendChild(p); picker=p;

  const r=anchor.getBoundingClientRect();
  let left=Math.min(r.left, window.innerWidth-258), top=r.bottom+6;
  if(top+300>window.innerHeight-8) top=Math.max(8,r.top-306);
  p.style.left=Math.max(8,left)+'px'; p.style.top=top+'px';

  const cv=p.querySelector('#wheel'), ctx=cv.getContext('2d');
  const vsl=p.querySelector('#vsl'), vkn=p.querySelector('#vkn'), hexIn=p.querySelector('#hexIn');
  let hsv=rgb2hsv.apply(null,hex2rgb(S.style[key]));

  function drawWheel(){
    const N=150, R=75, img=ctx.createImageData(N,N), d=img.data;
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const dx=x-R+.5, dy=y-R+.5, dist=Math.sqrt(dx*dx+dy*dy), i=(y*N+x)*4;
      if(dist>R){ d[i+3]=0; continue; }
      let h=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
      const c=hsv2rgb(h,Math.min(1,dist/R),hsv[2]);
      d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2];
      d[i+3]= dist>R-1.2 ? Math.round(255*Math.max(0,(R-dist)/1.2)) : 255;
    }
    ctx.putImageData(img,0,0);
    const a=hsv[0]*Math.PI/180, rr=hsv[1]*R;
    ctx.beginPath(); ctx.arc(R+Math.cos(a)*rr, R+Math.sin(a)*rr, 6, 0, 6.3);
    ctx.lineWidth=2.5; ctx.strokeStyle='#fff'; ctx.stroke();
    ctx.lineWidth=1; ctx.strokeStyle='#000'; ctx.stroke();
  }
  function paintSlider(){
    const full=rgb2hex.apply(null,hsv2rgb(hsv[0],hsv[1],1));
    vsl.style.background='linear-gradient(to top,#000,'+full+')';
    vkn.style.top=((1-hsv[2])*100)+'%';
  }
  function push(){
    const hx=rgb2hex.apply(null,hsv2rgb(hsv[0],hsv[1],hsv[2]));
    hexIn.value=hx; applyLiveColor(key,hx);
  }
  function refresh(){ drawWheel(); paintSlider(); push(); }
  refresh();

  function wheelAt(e){
    const b=cv.getBoundingClientRect();
    const dx=e.clientX-b.left-75, dy=e.clientY-b.top-75;
    hsv[0]=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
    hsv[1]=Math.min(1,Math.sqrt(dx*dx+dy*dy)/75);
    drawWheel(); paintSlider(); push();
  }
  cv.addEventListener('pointerdown',e=>{ cv.setPointerCapture(e.pointerId); wheelAt(e); });
  cv.addEventListener('pointermove',e=>{ if(e.buttons) wheelAt(e); });
  function sliderAt(e){
    const b=vsl.getBoundingClientRect();
    hsv[2]=Math.max(0,Math.min(1,1-(e.clientY-b.top)/b.height));
    refresh();
  }
  vsl.addEventListener('pointerdown',e=>{ vsl.setPointerCapture(e.pointerId); sliderAt(e); });
  vsl.addEventListener('pointermove',e=>{ if(e.buttons) sliderAt(e); });
  hexIn.addEventListener('input',()=>{
    let v=hexIn.value.trim(); if(v[0]!=='#') v='#'+v;
    if(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)){
      hsv=rgb2hsv.apply(null,hex2rgb(v)); drawWheel(); paintSlider(); applyLiveColor(key,rgb2hex.apply(null,hex2rgb(v)));
    }
  });
  p.querySelectorAll('.presets button').forEach(b=>b.addEventListener('click',()=>{
    hsv=rgb2hsv.apply(null,hex2rgb(b.dataset.c)); refresh();
  }));
  setTimeout(()=>document.addEventListener('pointerdown',pickerOutside,true),0);
}

/* =========================================================
   SÉLECTEUR DE POLICE
   ========================================================= */
function closeFontList(){
  const l=document.querySelector('.fontlist');
  if(l) l.remove();
  document.removeEventListener('pointerdown',fontOutside,true);
}
function fontOutside(e){
  const l=document.querySelector('.fontlist');
  if(l && !l.parentElement.contains(e.target)) closeFontList();
}
function openFontPicker(anchor,key){
  const existing=document.querySelector('.fontlist');
  closeFontList();
  if(existing && existing.dataset.key===key) return;
  loadAllPreviews();
  const list=document.createElement('div');
  list.className='fontlist'; list.dataset.key=key;
  list.innerHTML=FONTS.map(f=>
    '<button type="button" data-f="'+esc(f.f)+'" class="'+(f.f===S.style[key]?'sel':'')+'">'+
      '<span class="A" style="font-family:\''+esc(f.f)+'\',sans-serif">A</span>'+
      '<span class="nm" style="font-family:\''+esc(f.f)+'\',sans-serif">'+esc(f.f)+'</span>'+
      '<span class="cat">'+esc(f.c)+'</span></button>').join('');
  anchor.parentElement.appendChild(list);
  list.addEventListener('click',e=>{
    const b=e.target.closest('button[data-f]'); if(!b) return;
    S.style[key]=b.dataset.f; ensureFont(b.dataset.f);
    closeFontList(); renderEditor(); renderSheet(); persist();
  });
  setTimeout(()=>document.addEventListener('pointerdown',fontOutside,true),0);
}

/* =========================================================
   IMAGES
   ========================================================= */
function processImage(file,maxDim){
  return new Promise((resolve,reject)=>{
    if(!file){ reject(); return; }
    const fr=new FileReader();
    fr.onerror=()=>reject();
    fr.onload=()=>{
      const data=fr.result;
      if(/svg/i.test(file.type)){ resolve(data); return; }
      const im=new Image();
      im.onload=()=>{
        let {width:w,height:h}=im;
        const k=Math.min(1,maxDim/Math.max(w,h));
        w=Math.round(w*k); h=Math.round(h*k);
        const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        const cx=cv.getContext('2d');
        const keepAlpha=/png|webp/i.test(file.type);
        if(!keepAlpha){ cx.fillStyle='#fff'; cx.fillRect(0,0,w,h); }
        cx.drawImage(im,0,0,w,h);
        resolve(keepAlpha ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg',0.88));
      };
      im.onerror=()=>reject();
      im.src=data;
    };
    fr.readAsDataURL(file);
  });
}
const MAXDIM={logo:760, bg:1600, dish:1400, table:1400};
async function setImage(key,file){
  try{
    const data=await processImage(file, MAXDIM[key]||1200);
    S.img[key]=data; renderEditor(); renderSheet(); persist();
    toast('Image ajoutée');
  }catch(e){ toast('Image illisible'); }
}

/* =========================================================
   EXPORTS
   ========================================================= */
function slug(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40) || 'fiche';
}
function fileBase(){
  return 'FT_'+slug(S.meta.restaurant)+'_'+slug(tx(S.meta.dish,'fr'))+(S.meta.date?'_'+S.meta.date:'');
}
async function exportPDF(){
  try{
    busy('Mise en page des 3 langues…');
    await lib('jspdf'); await lib('html2canvas');
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    const jsPDF=window.jspdf.jsPDF;
    const doc=new jsPDF({unit:'pt',format:'a4',orientation:'portrait',compress:true});
    const W=595.28,H=841.89;
    const off=document.getElementById('offscreen');
    for(let i=0;i<LANGS.length;i++){
      busy('Page '+(i+1)+'/3 — '+LANGNAME[LANGS[i]]);
      const node=document.createElement('div');
      off.appendChild(node);
      renderSheetInto(node,LANGS[i]);
      await new Promise(r=>setTimeout(r,80));
      const canvas=await window.html2canvas(node,{
        scale:2, backgroundColor:S.style.bg, useCORS:true, logging:false, imageTimeout:0
      });
      const img=canvas.toDataURL('image/jpeg',0.93);
      if(i>0) doc.addPage();
      doc.addImage(img,'JPEG',0,0,W,H,undefined,'FAST');
      node.remove();
    }
    doc.setProperties({
      title:(tx(S.meta.dish,'fr')||'Fiche technique')+' — '+(S.meta.restaurant||''),
      subject:'Fiche technique — Recipe Lab',
      author:S.meta.chef||'', creator:'Recipe Lab by Giraudi'
    });
    const buf=doc.output('arraybuffer');
    const tail=new TextEncoder().encode('\n%RECIPELAB1:'+b64encode(JSON.stringify(S))+':ENDRECIPELAB\n');
    const blob=new Blob([new Uint8Array(buf),tail],{type:'application/pdf'});
    unbusy();
    await saveFile(fileBase()+'.pdf',blob);
  }catch(e){ unbusy(); console.error(e); toast('Export PDF impossible'); }
}
function xlsxRows(){
  const m=S.meta;
  const rows=[['SECTION','RÉF','FRANÇAIS','ENGLISH','ITALIANO','QUANTITÉ','UNITÉ']];
  rows.push(['META','restaurant',m.restaurant||'','','','','']);
  rows.push(['META','date',m.date||'','','','','']);
  rows.push(['META','chef',m.chef||'','','','','']);
  ['season','category','dish'].forEach(k=>{
    const o=T(m[k]); rows.push(['META',k,o.fr||'',o.en||'',o.it||'','','']);
  });
  rows.push(['','','','','','','']);
  S.ing.forEach((g,gi)=>{
    const t=T(g.title);
    rows.push(['ING_TITRE',gi+1,t.fr||'',t.en||'',t.it||'','','']);
    g.items.forEach(it=>{
      const n=T(it.name);
      rows.push(['ING',gi+1,n.fr||'',n.en||'',n.it||'',it.qty||'',it.unit||'g']);
    });
  });
  rows.push(['','','','','','','']);
  S.prep.forEach((g,gi)=>{
    const t=T(g.title), x=T(g.text);
    rows.push(['PREP_TITRE',gi+1,t.fr||'',t.en||'',t.it||'','','']);
    rows.push(['PREP',gi+1,x.fr||'',x.en||'',x.it||'','','']);
  });
  return rows;
}
async function exportXLSX(){
  try{
    busy('Construction du classeur…');
    await lib('xlsx');
    const XLSX=window.XLSX;
    const ws=XLSX.utils.aoa_to_sheet(xlsxRows());
    ws['!cols']=[{wch:12},{wch:8},{wch:52},{wch:52},{wch:52},{wch:11},{wch:9}];
    const readme=[
      ['RECIPE LAB — FICHE TECHNIQUE'],
      ['Ce classeur se remodifie puis se recharge dans l’outil : onglet « Modifier une fiche existante ».'],
      [''],
      ['Règles'],
      ['Ne renommez pas l’onglet FICHE, ne changez pas la ligne d’en-tête, ne touchez pas aux colonnes SECTION et RÉF.'],
      ['Ajoutez autant de lignes ING ou PREP que nécessaire : recopiez la valeur RÉF du bloc auquel elles appartiennent.'],
      ['Une colonne de langue laissée vide reprend le français à l’impression.'],
      [''],
      ['Codes SECTION'],
      ['META','en-tête de la fiche'],
      ['ING_TITRE','sous-titre d’un bloc d’ingrédients'],
      ['ING','une ligne d’ingrédient'],
      ['PREP_TITRE','sous-titre d’un bloc de préparation'],
      ['PREP','le texte des étapes de ce bloc'],
      [''],
      ['Codes UNITÉ']
    ].concat(UNITS.map(u=>[u.c,u.n.fr+' · '+u.n.en+' · '+u.n.it]))
     .concat([[''],['Images, couleurs et polices ne circulent pas par Excel : utilisez le PDF ou la sauvegarde .json.']]);
    const ws2=XLSX.utils.aoa_to_sheet(readme);
    ws2['!cols']=[{wch:16},{wch:96}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'FICHE');
    XLSX.utils.book_append_sheet(wb,ws2,'LISEZ-MOI');
    const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    unbusy();
    await saveFile(fileBase()+'.xlsx',new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }catch(e){ unbusy(); console.error(e); toast('Export Excel impossible'); }
}
async function exportTemplate(){
  try{
    busy('Préparation du modèle…');
    await lib('xlsx');
    const XLSX=window.XLSX;
    const rows=[
      ['SECTION','RÉF','FRANÇAIS','ENGLISH','ITALIANO','QUANTITÉ','UNITÉ'],
      ['META','restaurant','BEEFBAR MONACO','','','',''],
      ['META','date','2026-10-15','','','',''],
      ['META','chef','Thierry Paludetto','','','',''],
      ['META','season','Automne Hiver 2026','Autumn Winter 2026','Autunno Inverno 2026','',''],
      ['META','category','Entrées','Starters','Antipasti','',''],
      ['META','dish','Nom du plat','Dish name','Nome del piatto','',''],
      ['','','','','','',''],
      ['ING_TITRE',1,'Base','Base','Base','',''],
      ['ING',1,'Premier produit','First product','Primo prodotto',100,'g'],
      ['ING',1,'Deuxième produit','Second product','Secondo prodotto',2,'tbsp'],
      ['ING',1,'Sel','Salt','Sale','','qs'],
      ['ING_TITRE',2,'Sauce','Sauce','Salsa','',''],
      ['ING',2,'Produit de la sauce','Sauce product','Prodotto della salsa',50,'ml'],
      ['','','','','','',''],
      ['PREP_TITRE',1,'Étape 1','Step 1','Fase 1','',''],
      ['PREP',1,'Une étape par ligne.\nTempératures, temps, tours de main.','One step per line.','Una fase per riga.','',''],
      ['PREP_TITRE',2,'Dressage','Plating','Impiattamento','',''],
      ['PREP',2,'Décrivez le dressage.','Describe the plating.','Descrivi l’impiattamento.','','']
    ];
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:12},{wch:8},{wch:52},{wch:52},{wch:52},{wch:11},{wch:9}];
    const readme=[
      ['RECIPE LAB — MODÈLE DE FICHE TECHNIQUE'],
      ['Remplissez l’onglet FICHE, enregistrez, puis déposez ce fichier dans « Modifier une fiche technique ».'],
      [''],
      ['Règles'],
      ['Ne renommez pas l’onglet FICHE et ne touchez ni à la ligne d’en-tête ni aux colonnes SECTION et RÉF.'],
      ['Ajoutez autant de lignes ING ou PREP que nécessaire : recopiez la valeur RÉF du bloc auquel elles appartiennent.'],
      ['Une colonne de langue laissée vide reprend le français à l’impression.'],
      [''],
      ['Codes SECTION'],
      ['META','en-tête de la fiche'],
      ['ING_TITRE','titre d’un bloc d’ingrédients'],
      ['ING','une ligne d’ingrédient de ce bloc'],
      ['PREP_TITRE','titre d’un bloc de préparation'],
      ['PREP','le texte des étapes de ce bloc'],
      [''],
      ['Codes UNITÉ']
    ].concat(UNITS.map(u=>[u.c,u.n.fr+' · '+u.n.en+' · '+u.n.it]))
     .concat([[''],['Images, couleurs et polices ne circulent pas par Excel : utilisez le PDF ou la sauvegarde .json.']]);
    const ws2=XLSX.utils.aoa_to_sheet(readme);
    ws2['!cols']=[{wch:16},{wch:96}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'FICHE');
    XLSX.utils.book_append_sheet(wb,ws2,'LISEZ-MOI');
    const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    unbusy();
    await saveFile('Recipe-Lab_modele-fiche-technique.xlsx',
      new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }catch(e){ unbusy(); console.error(e); toast('Modèle indisponible'); }
}
async function exportJSON(){
  const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});
  await saveFile(fileBase()+'.json',blob);
}

/* =========================================================
   IMPORTS
   ========================================================= */
function applyProject(obj){
  S=migrate(obj);
  ensureFont(S.style.titleFont); ensureFont(S.style.textFont);
  renderEditor(); renderSheet(); persist();
}
function applyRows(rows){
  const m={restaurant:S.meta.restaurant,date:S.meta.date,chef:S.meta.chef,
           season:T(''),category:T(''),dish:T('')};
  const ing=[], prep=[], gi={}, pi={};
  rows.forEach(r=>{
    const sec=String(r[0]||'').trim().toUpperCase();
    if(!sec||sec==='SECTION') return;
    const ref=String(r[1]==null?'':r[1]).trim();
    const fr=String(r[2]==null?'':r[2]), en=String(r[3]==null?'':r[3]), it=String(r[4]==null?'':r[4]);
    if(sec==='META'){
      const k=String(r[1]||'').trim();
      if(k==='restaurant') m.restaurant=fr;
      else if(k==='date') m.date=fr;
      else if(k==='chef') m.chef=fr;
      else if(k==='season'||k==='category'||k==='dish') m[k]={fr:fr,en:en,it:it};
    } else if(sec==='ING_TITRE'){
      if(!gi[ref]){ gi[ref]={id:uid(),title:{fr:fr,en:en,it:it},items:[]}; ing.push(gi[ref]); }
      else gi[ref].title={fr:fr,en:en,it:it};
    } else if(sec==='ING'){
      if(!gi[ref]){ gi[ref]={id:uid(),title:T(''),items:[]}; ing.push(gi[ref]); }
      gi[ref].items.push({id:uid(),name:{fr:fr,en:en,it:it},
        qty:String(r[5]==null?'':r[5]).trim(), unit:(String(r[6]||'g').trim().toLowerCase()in UNIT_BY_CODE)?String(r[6]).trim().toLowerCase():'g'});
    } else if(sec==='PREP_TITRE'){
      if(!pi[ref]){ pi[ref]={id:uid(),title:{fr:fr,en:en,it:it},text:T('')}; prep.push(pi[ref]); }
      else pi[ref].title={fr:fr,en:en,it:it};
    } else if(sec==='PREP'){
      if(!pi[ref]){ pi[ref]={id:uid(),title:T(''),text:T('')}; prep.push(pi[ref]); }
      pi[ref].text={fr:fr,en:en,it:it};
    }
  });
  S.meta=m;
  S.ing=ing.length?ing:[newGroupIng()];
  S.prep=prep.length?prep:[newGroupPrep()];
  renderEditor(); renderSheet(); persist();
}
async function importFile(file){
  if(!file) return;
  const name=(file.name||'').toLowerCase();
  try{
    if(name.endsWith('.json')){
      const txt=await file.text();
      applyProject(JSON.parse(txt));
      toast('Fiche rechargée'); return;
    }
    if(name.endsWith('.pdf')){
      busy('Lecture du PDF…');
      const buf=await file.arrayBuffer();
      const txt=new TextDecoder('latin1').decode(new Uint8Array(buf));
      const mm=txt.match(/%RECIPELAB1:([A-Za-z0-9+/=]+):ENDRECIPELAB/);
      unbusy();
      if(!mm){ toast('Ce PDF ne vient pas de Recipe Lab'); return; }
      applyProject(JSON.parse(b64decode(mm[1])));
      toast('Fiche rechargée depuis le PDF'); return;
    }
    if(name.endsWith('.xlsx')||name.endsWith('.xls')){
      busy('Lecture du classeur…');
      await lib('xlsx');
      const buf=await file.arrayBuffer();
      const wb=window.XLSX.read(new Uint8Array(buf),{type:'array'});
      const ws=wb.Sheets['FICHE']||wb.Sheets[wb.SheetNames[0]];
      const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
      unbusy();
      applyRows(rows);
      toast('Textes importés depuis Excel'); return;
    }
    toast('Formats acceptés : PDF, XLSX, JSON');
  }catch(e){ unbusy(); console.error(e); toast('Fichier illisible'); }
}

/* =========================================================
   CRÉDITS
   ========================================================= */
function openCredits(){
  const y=new Date().getFullYear();
  const v=document.createElement('div'); v.className='veil';
  v.innerHTML='<div class="modal" role="dialog" aria-label="Crédits et mentions légales">'+
    '<div class="mh">Crédits &amp; mentions légales<button class="chip" data-close="1" style="margin-left:auto;background:#fff;color:#FF521A">Fermer</button></div>'+
    '<div class="mb">'+
      '<h4>Vos données</h4>'+
      '<p>Recipe Lab fonctionne entièrement dans votre navigateur. Rien n’est envoyé, stocké ni analysé sur un serveur : ni vos recettes, ni vos images, ni vos polices. Le brouillon en cours est conservé dans la mémoire locale de ce navigateur, sur cet appareil uniquement, pour que vous le retrouviez à la réouverture ; « Nouvelle fiche vierge » l’efface. Les PDF, classeurs Excel et sauvegardes sont fabriqués sur votre machine et n’existent que là où vous les enregistrez.</p>'+
      '<h4>Polices de caractères</h4>'+
      '<p><b>Lineal</b>, dessinée par Frank Adebiaye avec Anton Moglia et Ariel Martín Pérez, publiée par la <a href="https://velvetyne.fr/fonts/lineal/" target="_blank" rel="noopener">Velvetyne Type Foundry</a> sous <b>SIL Open Font License 1.1</b>, est intégrée à cet outil en quatre graisses. L’OFL autorise cette redistribution au sein d’un document ou d’un logiciel, y compris pour un usage commercial, tant que la police n’est pas vendue seule et conserve son nom.</p>'+
      '<p>Les 30 autres familles sont elles aussi libres de droit, publiées sous <b>SIL Open Font License 1.1</b> ou <b>Apache License 2.0</b> et servies par Google Fonts : Jost, Inter, Archivo, Space Grotesk, Work Sans, DM Sans, Manrope, Outfit, Poppins, Montserrat, Raleway, Libre Franklin, Public Sans, IBM Plex Sans, Syne, Unbounded, Oswald, Anton, Bebas Neue, Archivo Black, Abril Fatface, Playfair Display, Libre Baskerville, EB Garamond, Cormorant Garamond, Lora, Source Serif 4, Bitter, Instrument Serif, JetBrains Mono. Elles restent la propriété de leurs auteurs ; l’usage commercial, y compris sur documents imprimés, est autorisé par ces licences. Appeler une police via Google Fonts déclenche une requête vers les serveurs de Google, qui reçoit alors votre adresse IP ; charger vos propres fichiers dans « Polices maison » évite cet appel.</p>'+
      '<h4>Bibliothèques</h4>'+
      '<ul><li>jsPDF — licence MIT — génération du PDF</li>'+
      '<li>html2canvas — licence MIT — rendu des pages</li>'+
      '<li>SheetJS (xlsx) — licence Apache 2.0 — lecture et écriture des classeurs</li></ul>'+
      '<h4>Marque et illustrations</h4>'+
      '<p>Logo Recipe Lab, personnages et univers graphique © '+y+' Giraudi. Les logos, photographies et contenus de recettes que vous déposez restent votre propriété.</p>'+
      '<p>© '+y+' <a href="https://www.giraudi.com/" target="_blank" rel="noopener">By Giraudi</a></p>'+
      '<div class="crew"><img class="art" src="'+ART.steak+'" alt=""><img class="art" src="'+ART.sushi+'" alt=""><img class="art" src="'+ART.carrot+'" alt=""><img class="art" src="'+ART.brioche+'" alt=""></div>'+
    '</div></div>';
  v.addEventListener('click',e=>{ if(e.target===v||e.target.dataset.close) v.remove(); });
  document.body.appendChild(v);
}

/* =========================================================
   ÉCRAN D'ACCUEIL & COLORIS
   ========================================================= */
const SKINS=['creme','jaune','orange'];
const SKINKEY='recipelab.skin';
function setSkin(name,save){
  if(SKINS.indexOf(name)<0) name='creme';
  document.documentElement.setAttribute('data-skin',name);
  document.querySelectorAll('.skinbtn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skin===name)));
  if(save!==false){ try{ localStorage.setItem(SKINKEY,name); }catch(e){} }
}
function initSkin(){
  let s=null;
  try{ s=localStorage.getItem(SKINKEY); }catch(e){}
  if(!s) s = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'orange' : 'creme';
  setSkin(s,false);
}
const ART_ROTATION=['brioche','steak','sushi','carrot','pizza','waiter','baker','pasta','cake','chop','coffee','whisk','taste','barista'];
let artIndex=0, artTimer=null;
function buildArt(){
  const box=document.getElementById('mart');
  box.innerHTML=ART_ROTATION.map((k,i)=>'<img src="'+ART[k]+'" alt="" class="art '+(i===0?'on':'')+'">').join('');
  artIndex=0;
}
function rotateArt(){
  const imgs=document.querySelectorAll('#mart img');
  if(!imgs.length) return;
  imgs[artIndex].classList.remove('on');
  artIndex=(artIndex+1)%imgs.length;
  imgs[artIndex].classList.add('on');
}
function startArt(){
  if(artTimer) clearInterval(artTimer);
  artTimer=setInterval(rotateArt,15000);
}
function showMenu(){
  document.body.dataset.screen='menu';
  const btn=document.getElementById('mResume');
  btn.hidden = !hasDraft();
  startArt();
}
function showTool(){
  document.body.dataset.screen='tool';
  if(artTimer){ clearInterval(artTimer); artTimer=null; }
  setTimeout(()=>{ renderSheet(); },20);
}
function hasDraft(){
  const m=S.meta;
  if(m.restaurant || tx(m.dish,'fr') || m.chef) return true;
  return S.ing.some(g=>g.items.some(i=>tx(i.name,'fr'))) || S.prep.some(g=>tx(g.text,'fr'));
}

function ask(msg,yesLabel,onYes){
  const v=document.createElement('div'); v.className='veil';
  v.innerHTML='<div class="modal" style="max-width:430px"><div class="mh">Confirmer</div>'+
    '<div class="mb"><p>'+esc(msg)+'</p>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">'+
      '<button class="btn" data-no="1">Annuler</button>'+
      '<button class="btn solid" data-yes="1">'+esc(yesLabel)+'</button></div></div></div>';
  v.addEventListener('click',e=>{
    if(e.target===v || e.target.closest('[data-no]')){ v.remove(); return; }
    if(e.target.closest('[data-yes]')){ v.remove(); onYes(); }
  });
  document.body.appendChild(v);
}

/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */
const scheduleRender=debounce(function(){ renderSheet(); persist(); },140);

function onEdit(e){
  const el=e.target, d=el.dataset; let touched=true;
  if(d.b){ setPath(d.b, el.value); }
  else if(d.bl){ const o=T(getPath(d.bl)); o[LANG]=el.value; setPath(d.bl,o); }
  else if(d.bg){
    const g=S.ing.find(x=>x.id===d.bg); if(!g) return;
    if(d.bi){
      const it=g.items.find(x=>x.id===d.bi); if(!it) return;
      if(d.k==='name'){ it.name=T(it.name); it.name[LANG]=el.value; }
      else it[d.k]=el.value;
    } else { g.title=T(g.title); g.title[LANG]=el.value; }
  }
  else if(d.bp){
    const g=S.prep.find(x=>x.id===d.bp); if(!g) return;
    g[d.k]=T(g[d.k]); g[d.k][LANG]=el.value;
  }
  else if(d.style){
    S.style[d.style] = (el.type==='range') ? parseFloat(el.value) : el.value;
    if(d.style==='bgOpacity'){
      const sp=el.closest('label').querySelector('span');
      if(sp) sp.textContent='Intensité du fond — '+Math.round(S.style.bgOpacity*100)+' %';
    }
  }
  else touched=false;
  if(touched) scheduleRender();
}
const THEMES={
  cantine:{bg:'#F4EFE2',ink:'#1B1614',accent:'#FB511A',on:'#F4EFE2',rule:'#1B1614'},
  zeffirino:{bg:'#0E564E',ink:'#F4EFE2',accent:'#C8A24A',on:'#0E564E',rule:'#F4EFE2'},
  mono:{bg:'#FFFFFF',ink:'#111111',accent:'#111111',on:'#FFFFFF',rule:'#111111'}
};
function onClick(e){
  const b=e.target.closest('[data-act]');
  if(!b) return;
  const a=b.dataset.act, id=b.dataset.id;
  if(a==='clearImg'){ e.preventDefault(); e.stopPropagation(); S.img[b.dataset.key]=null; renderEditor(); renderSheet(); persist(); return; }
  e.preventDefault();
  switch(a){
    case 'addIng': S.ing.push(newGroupIng()); renderEditor(); renderSheet(); persist(); focusLast('.group:last-of-type .irow input'); break;
    case 'delIng': S.ing=S.ing.filter(g=>g.id!==id); renderEditor(); renderSheet(); persist(); break;
    case 'moveIng': move(S.ing,id,+b.dataset.dir); renderEditor(); renderSheet(); persist(); break;
    case 'addItem': {
      const g=S.ing.find(x=>x.id===id); if(g) g.items.push(newItem());
      renderEditor(); renderSheet(); persist();
      const rows=document.querySelectorAll('[data-bg="'+id+'"][data-k="name"]');
      if(rows.length) rows[rows.length-1].focus();
      break; }
    case 'delItem': {
      const g=S.ing.find(x=>x.id===id); if(g) g.items=g.items.filter(i=>i.id!==b.dataset.iid);
      renderEditor(); renderSheet(); persist(); break; }
    case 'addPrep': S.prep.push(newGroupPrep()); renderEditor(); renderSheet(); persist(); focusLast('textarea[data-bp]'); break;
    case 'delPrep': S.prep=S.prep.filter(g=>g.id!==id); renderEditor(); renderSheet(); persist(); break;
    case 'movePrep': move(S.prep,id,+b.dataset.dir); renderEditor(); renderSheet(); persist(); break;
    case 'numPrep': {
      const idx=S.prep.findIndex(x=>x.id===id); if(idx<0) break;
      const g=S.prep[idx], n=idx+1;
      g.title={fr:'Étape '+n, en:'Step '+n, it:'Fase '+n};
      renderEditor(); renderSheet(); persist(); break; }
    case 'pickColor': openColorPicker(b,b.dataset.key); break;
    case 'pickFont': openFontPicker(b,b.dataset.key); break;
    case 'theme': Object.assign(S.style,THEMES[b.dataset.t]); renderEditor(); renderSheet(); persist(); break;
    case 'expPdf': exportPDF(); break;
    case 'expXlsx': exportXLSX(); break;
    case 'expJson': exportJSON(); break;
    case 'expModel': exportTemplate(); break;
    case 'reset':
      ask('Effacer la fiche en cours et repartir d’une page vierge ?','Tout effacer',()=>{
        S=blankState(); S.ing[0].items=[newItem(),newItem(),newItem()];
        try{localStorage.removeItem(LSKEY);}catch(err){}
        renderEditor(); renderSheet();
      });
      break;
  }
}
function move(arr,id,dir){
  const i=arr.findIndex(x=>x.id===id); if(i<0) return;
  const j=i+dir; if(j<0||j>=arr.length) return;
  const t=arr[i]; arr[i]=arr[j]; arr[j]=t;
}
function focusLast(sel){ const n=document.querySelectorAll(sel); if(n.length) n[n.length-1].focus(); }

function setLang(l){
  LANG=l;
  document.querySelectorAll('#langtabs .chip').forEach(c=>c.setAttribute('aria-pressed', String(c.dataset.lang===l)));
  renderEditor(); renderSheet();
}
function setView(v){
  document.getElementById('main').dataset.view=v;
  document.querySelectorAll('.viewtabs .chip').forEach(c=>c.setAttribute('aria-pressed', String(c.dataset.view===v)));
  if(v==='prev') setTimeout(fitPreview,30);
}
function openPanel(pid){
  OPEN.add(pid);
  setView('edit');
  const d=document.getElementById(pid);
  if(d){ d.open=true; if(d.scrollIntoView) setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),40); }
}

/* =========================================================
   DÉMARRAGE
   ========================================================= */
function init(){
  initSkin();
  document.getElementById('brandLogo').src=ART.logo;
  document.getElementById('menuLogo').src=ART.logo;
  document.getElementById('footChar1').src=ART.coffee;
  const yr=String(new Date().getFullYear());
  document.querySelectorAll('.yr').forEach(e=>e.textContent=yr);
  document.querySelectorAll('.ver').forEach(e=>e.textContent='Version '+VERSION);
  buildArt();

  const had=restore();
  if(!had){
    S.meta.restaurant='';
    S.ing[0].items=[newItem(),newItem(),newItem()];
  }
  ensureFont(S.style.titleFont); ensureFont(S.style.textFont);
  renderEditor();
  renderSheet();

  const ed=document.getElementById('editor');
  ed.addEventListener('input',onEdit);
  ed.addEventListener('change',onEdit);
  ed.addEventListener('click',onClick);
  ed.addEventListener('toggle',e=>{
    if(e.target.classList && e.target.classList.contains('panel')){
      if(e.target.open) OPEN.add(e.target.id); else OPEN.delete(e.target.id);
    }
  },true);

  // fichiers
  ed.addEventListener('change',e=>{
    const el=e.target;
    if(el.dataset.img && el.files && el.files[0]){ setImage(el.dataset.img, el.files[0]); el.value=''; }
    else if(el.dataset.import && el.files && el.files[0]){ importFile(el.files[0]); el.value=''; }
  });
  ed.addEventListener('keydown',e=>{
    const d2=e.target.closest('.drop');
    if(d2 && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); const i=d2.querySelector('input[type=file]'); if(i) i.click(); }
  });
  // glisser-déposer
  ed.addEventListener('dragover',e=>{ const d=e.target.closest('.drop'); if(d){ e.preventDefault(); d.classList.add('over'); } });
  ed.addEventListener('dragleave',e=>{ const d=e.target.closest('.drop'); if(d) d.classList.remove('over'); });
  ed.addEventListener('drop',e=>{
    const d=e.target.closest('.drop'); if(!d) return;
    e.preventDefault(); d.classList.remove('over');
    const f=e.dataTransfer.files && e.dataTransfer.files[0]; if(!f) return;
    const key=d.dataset.drop;
    if(key==='file') importFile(f); else if(key) setImage(key,f);
  });

  document.getElementById('langtabs').addEventListener('click',e=>{
    const c=e.target.closest('[data-lang]'); if(c) setLang(c.dataset.lang);
  });
  document.querySelector('.viewtabs').addEventListener('click',e=>{
    const c=e.target.closest('[data-view]'); if(c) setView(c.dataset.view);
  });
  document.getElementById('goExport').addEventListener('click',()=>openPanel('p6'));
  document.getElementById('goImport').addEventListener('click',()=>openPanel('p7'));
  document.querySelectorAll('.credits').forEach(b=>b.addEventListener('click',openCredits));

  // menu principal
  showMenu();
  function startBlank(){
    S=blankState(); S.ing[0].items=[newItem(),newItem(),newItem()];
    try{localStorage.removeItem(LSKEY);}catch(e){}
    OPEN.clear(); ['p1','p2','p3'].forEach(p=>OPEN.add(p));
    renderEditor(); showTool();
  }
  document.getElementById('mCreate').addEventListener('click',()=>{
    if(hasDraft()) ask('Une fiche est déjà en cours. La remplacer par une fiche vierge ?','Nouvelle fiche',startBlank);
    else startBlank();
  });
  document.getElementById('mEdit').addEventListener('click',()=>{
    OPEN.add('p7'); renderEditor(); showTool(); setTimeout(()=>openPanel('p7'),60);
  });
  document.getElementById('mResume').addEventListener('click',()=>{ renderEditor(); showTool(); });
  document.getElementById('mOptions').addEventListener('click',e=>{
    const box=document.getElementById('mopts');
    const open=box.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded',String(open));
  });
  document.getElementById('mopts').addEventListener('click',e=>{
    const b=e.target.closest('[data-skin]'); if(b) setSkin(b.dataset.skin);
  });
  document.getElementById('goHome').addEventListener('click',showMenu);
  document.getElementById('zIn').addEventListener('click',()=>{
    const cur=parseFloat(document.getElementById('zVal').textContent)/100;
    ZOOM=Math.min(2,cur+0.1); fitPreview();
  });
  document.getElementById('zOut').addEventListener('click',()=>{
    const cur=parseFloat(document.getElementById('zVal').textContent)/100;
    ZOOM=Math.max(.2,cur-0.1); fitPreview();
  });

  if(window.ResizeObserver){
    new ResizeObserver(()=>fitPreview()).observe(document.getElementById('stage'));
  } else window.addEventListener('resize',fitPreview);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){ closePicker(); closeFontList(); const v=document.querySelector('.veil'); if(v) v.remove(); }
  });
  window.addEventListener('beforeunload',()=>{ try{ localStorage.setItem(LSKEY,JSON.stringify(S)); }catch(e){} });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
</script>
</body>
</html>
