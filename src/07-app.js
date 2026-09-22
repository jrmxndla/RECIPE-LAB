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
    toast(t('tImg'));
  }catch(e){ toast(t('tImgErr')); }
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
    busy(t('busyPdf'));
    await lib('jspdf'); await lib('html2canvas');
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    const jsPDF=window.jspdf.jsPDF;
    const doc=new jsPDF({unit:'pt',format:'a4',orientation:'portrait',compress:true});
    const W=595.28,H=841.89;
    const off=document.getElementById('offscreen');
    for(let i=0;i<LANGS.length;i++){
      busy(t('busyPage')+' '+(i+1)+'/3 — '+LANGNAME[LANGS[i]]);
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
  }catch(e){ unbusy(); console.error(e); toast(t('tPdfErr')); }
}
/* ---------- Classeur : un onglet par langue, colonnes par bloc ---------- */
const XL_ORANGE='FB511A', XL_YELLOW='F5F099';
function xlBd(c){ return {style:'thin',color:{rgb:c||'E2DDCE'}}; }
function xlStyles(){
  return {
    resto:{font:{bold:true,sz:16,color:{rgb:XL_ORANGE}}},
    meta:{font:{sz:11,color:{rgb:'6B6259'}}},
    dish:{font:{bold:true,sz:13}},
    head:{font:{bold:true,sz:11,color:{rgb:XL_ORANGE}},fill:{fgColor:{rgb:XL_YELLOW}},
          alignment:{vertical:'center'},
          border:{top:xlBd(XL_ORANGE),bottom:xlBd(XL_ORANGE),left:xlBd(XL_ORANGE),right:xlBd(XL_ORANGE)}},
    name:{border:{bottom:xlBd()},alignment:{vertical:'center'}},
    qty:{border:{bottom:xlBd()},alignment:{horizontal:'right',vertical:'center'},font:{bold:true}},
    prepHead:{font:{bold:true,sz:12,color:{rgb:XL_ORANGE}},fill:{fgColor:{rgb:XL_YELLOW}},
              border:{top:xlBd(XL_ORANGE),bottom:xlBd(XL_ORANGE),left:xlBd(XL_ORANGE),right:xlBd(XL_ORANGE)}},
    prepTitle:{font:{bold:true,sz:11}},
    prepText:{alignment:{wrapText:true,vertical:'top'},
              border:{top:xlBd(),bottom:xlBd(),left:xlBd(),right:xlBd()}}
  };
}
function buildLangSheet(XLSX, data, lang){
  const t=XL_T[lang], ST=xlStyles();
  const blocks=data.ing.length?data.ing:[{title:{},items:[]}];
  const nCols=Math.max(2, blocks.length*2);
  const maxItems=Math.max(1, ...blocks.map(b=>b.items.length));
  const aoa=[], merges=[], rowh=[];
  const blank=()=>new Array(nCols).fill('');

  const r0=blank(); r0[0]=data.meta.restaurant||''; r0[1]=tx(data.meta.season,lang);
  const r1=blank(); r1[0]=data.meta.date||'';       r1[1]=data.meta.chef||'';
  const r2=blank(); r2[0]=tx(data.meta.dish,lang);  r2[1]=tx(data.meta.category,lang);
  aoa.push(r0,r1,r2,blank());

  const hr=blank();
  blocks.forEach((b,i)=>{ hr[i*2]=tx(b.title,lang)||(t.block+' '+(i+1)); hr[i*2+1]=t.qty; });
  aoa.push(hr);

  for(let i=0;i<maxItems;i++){
    const row=blank();
    blocks.forEach((b,bi)=>{
      const it=b.items[i];
      if(it){ row[bi*2]=tx(it.name,lang); row[bi*2+1]=qtyLabel(it,lang); }
    });
    aoa.push(row);
  }
  aoa.push(blank());

  const prepRow=aoa.length;
  const ph=blank(); ph[0]=t.prep; aoa.push(ph);
  merges.push({s:{r:prepRow,c:0},e:{r:prepRow,c:nCols-1}});

  const preps=data.prep.length?data.prep:[{title:{},text:{}}];
  preps.forEach(g=>{
    const title=tx(g.title,lang), text=tx(g.text,lang);
    const tr=blank(); tr[0]=title; aoa.push(tr);
    merges.push({s:{r:aoa.length-1,c:0},e:{r:aoa.length-1,c:nCols-1}});
    const xr=blank(); xr[0]=text; aoa.push(xr);
    merges.push({s:{r:aoa.length-1,c:0},e:{r:aoa.length-1,c:nCols-1}});
    const lines=Math.max(4,(text.match(/\n/g)||[]).length+1+Math.floor(text.length/95));
    rowh[aoa.length-1]={hpt:Math.min(430,lines*15+8)};
  });

  const ws=XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges']=merges;
  ws['!cols']=[];
  for(let c=0;c<nCols;c++) ws['!cols'].push(c%2?{wch:14}:{wch:38});
  rowh[0]={hpt:24}; rowh[2]={hpt:20}; rowh[4]={hpt:22};
  ws['!rows']=[];
  for(let i=0;i<aoa.length;i++) ws['!rows'].push(rowh[i]||{});

  const set=(r,c,s)=>{
    const ref=XLSX.utils.encode_cell({r:r,c:c});
    if(!ws[ref]) ws[ref]={t:'s',v:''};
    ws[ref].s=s;
  };
  set(0,0,ST.resto); set(0,1,ST.meta);
  set(1,0,ST.meta);  set(1,1,ST.meta);
  set(2,0,ST.dish);  set(2,1,ST.meta);
  for(let c=0;c<nCols;c++) set(4,c,ST.head);
  for(let i=0;i<maxItems;i++) for(let c=0;c<nCols;c++) set(5+i,c,c%2?ST.qty:ST.name);
  for(let c=0;c<nCols;c++) set(prepRow,c,ST.prepHead);
  for(let r=prepRow+1;r<aoa.length;r++){
    const isText=!!(rowh[r]&&rowh[r].hpt);
    for(let c=0;c<nCols;c++) set(r,c,isText?ST.prepText:ST.prepTitle);
  }
  return ws;
}
function readmeSheet(XLSX){
  const rows=[
    ['RECIPE LAB — FICHE TECHNIQUE'],
    ['Trois onglets : FR, EN, IT. Même disposition dans les trois, même nombre de lignes et de colonnes.'],
    ['Remplis, enregistre, puis dépose le fichier dans « Modifier une fiche technique ».'],
    [''],
    ['Disposition d’un onglet'],
    ['A1','nom du restaurant'],
    ['B1','saison'],
    ['A2','date (AAAA-MM-JJ)'],
    ['B2','chef qui rédige'],
    ['A3','nom du plat'],
    ['B3','catégorie'],
    ['Ligne 5','en-têtes : un bloc par paire de colonnes — titre du bloc puis « Quantité »'],
    ['À partir de la ligne 6','les ingrédients de chaque bloc, dans sa paire de colonnes'],
    ['Ligne « PRÉPARATION »','ouvre la zone des étapes'],
    ['En dessous','pour chaque bloc : une ligne de titre, puis une ligne de texte'],
    [''],
    ['Pour ajouter un bloc d’ingrédients : deux colonnes de plus à droite, titre puis « Quantité » en ligne 5.'],
    ['Pour ajouter un ingrédient : une ligne de plus, dans la colonne du bloc concerné.'],
    ['Une case de langue laissée vide reprend le français à l’impression.'],
    [''],
    ['Quantités'],
    ['Écris-les comme tu veux : 600 g, 600GR, 1 PC, 100 ml, QS, PM, QB, 2 c. à soupe.'],
    ['Sans unité reconnue, l’outil retient le gramme ; sans chiffre, il retient QS.'],
    [''],
    ['Images, couleurs et polices ne passent pas par Excel : pour ça, utilise le PDF ou la sauvegarde .json.']
  ];
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:26},{wch:92}];
  return ws;
}
function buildWorkbook(XLSX, data){
  const wb=XLSX.utils.book_new();
  LANGS.forEach(l=>XLSX.utils.book_append_sheet(wb, buildLangSheet(XLSX,data,l), XL_SHEET[l]));
  XLSX.utils.book_append_sheet(wb, readmeSheet(XLSX), 'LISEZ-MOI');
  return wb;
}
async function exportXLSX(){
  try{
    busy(t('busyXls'));
    await lib('xlsx');
    const out=window.XLSX.write(buildWorkbook(window.XLSX,S),{bookType:'xlsx',type:'array'});
    unbusy();
    await saveFile(fileBase()+'.xlsx',
      new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }catch(e){ unbusy(); console.error(e); toast(t('tXlsErr')); }
}
async function exportTemplate(){
  try{
    busy(t('busyModel'));
    await lib('xlsx');
    const demo={
      meta:{restaurant:'BEEFBAR MONACO', date:new Date().toISOString().slice(0,10),
            chef:'', season:{fr:'Automne Hiver 2026',en:'Autumn Winter 2026',it:'Autunno Inverno 2026'},
            category:{fr:'Entrées',en:'Starters',it:'Antipasti'},
            dish:{fr:'Nom du plat',en:'Dish name',it:'Nome del piatto'}},
      ing:[
        {title:{fr:'Base',en:'Base',it:'Base'},items:[
          {name:{fr:'Premier produit',en:'First product',it:'Primo prodotto'},qty:'600',unit:'g'},
          {name:{fr:'Deuxième produit',en:'Second product',it:'Secondo prodotto'},qty:'1',unit:'pc'},
          {name:{fr:'Sel, poivre',en:'Salt, pepper',it:'Sale, pepe'},qty:'',unit:'qs'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'}]},
        {title:{fr:'Garniture',en:'Garnish',it:'Guarnizione'},items:[
          {name:{fr:'Huile d’olive',en:'Olive oil',it:'Olio d’oliva'},qty:'',unit:'qs'},
          {name:{fr:'Herbes fraîches',en:'Fresh herbs',it:'Erbe fresche'},qty:'',unit:'qs'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'},
          {name:{fr:'',en:'',it:''},qty:'',unit:'g'}]}],
      prep:[
        {title:{fr:'Étape 1',en:'Step 1',it:'Fase 1'},
         text:{fr:'1. Une étape par ligne.\n2. Températures, temps, tours de main.\n3. Ajoutez autant de lignes que nécessaire.',
               en:'1. One step per line.',it:'1. Una fase per riga.'}},
        {title:{fr:'Dressage',en:'Plating',it:'Impiattamento'},
         text:{fr:'Décrivez le dressage.',en:'Describe the plating.',it:'Descrivi l’impiattamento.'}}]
    };
    const out=window.XLSX.write(buildWorkbook(window.XLSX,demo),{bookType:'xlsx',type:'array'});
    unbusy();
    await saveFile('Recipe-Lab_modele-fiche-technique.xlsx',
      new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }catch(e){ unbusy(); console.error(e); toast(t('tModelErr')); }
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
function parseLangSheet(rows){
  const cell=(r,c)=>{ const row=rows[r]||[]; return String(row[c]==null?'':row[c]).replace(/\r\n/g,'\n').trim(); };
  const isLong=v=> v.indexOf('\n')>=0 || v.length>120;
  const width=rows.reduce((m,r)=>Math.max(m,r?r.length:0),0) || 2;

  const meta={restaurant:cell(0,0), season:cell(0,1), date:cell(1,0), chef:cell(1,1),
              dish:cell(2,0), category:cell(2,1)};

  let hr=-1;
  for(let r=1;r<Math.min(rows.length,14) && hr<0;r++)
    for(let c=1;c<width;c++) if(QTY_RE.test(cell(r,c))){ hr=r; break; }
  if(hr<0) hr=4;

  const pairs=[];
  for(let c=1;c<width;c++) if(QTY_RE.test(cell(hr,c))) pairs.push({n:c-1,q:c,title:cell(hr,c-1)});
  if(!pairs.length) pairs.push({n:0,q:1,title:cell(hr,0)});

  let pr=-1;
  for(let r=hr+1;r<rows.length;r++) if(PREP_RE.test(cell(r,0))){ pr=r; break; }
  const lastIng=(pr<0?rows.length:pr);

  // textes longs hors zone préparation : ce sont des étapes
  const loose=[];
  for(let r=hr+1;r<lastIng;r++)
    for(let c=0;c<width;c++){ const v=cell(r,c); if(v && isLong(v)) loose.push({r:r,c:c,v:v}); }
  const isLoose=(r,c)=>loose.some(x=>x.r===r&&x.c===c);

  const blocks=[];
  pairs.forEach(p=>{
    let cur={title:p.title, items:[]};
    blocks.push(cur);
    for(let r=hr+1;r<lastIng;r++){
      const n=cell(r,p.n), q=cell(r,p.q);
      if(!n && !q) continue;
      if(PREP_RE.test(n)) continue;
      if(isLoose(r,p.n) || isLoose(r,p.q)) continue;
      if(n && !q){
        let more=false;
        for(let r2=r+1;r2<lastIng;r2++) if(cell(r2,p.q)){ more=true; break; }
        if(more){ cur={title:n, items:[]}; blocks.push(cur); continue; }
      }
      cur.items.push({name:n, qtyStr:q});
    }
  });

  const prep=[];
  if(pr<0) loose.forEach(x=>prep.push({title:'',text:x.v}));
  else {
    let pending=null;
    for(let r=pr+1;r<rows.length;r++){
      let v=cell(r,0);
      if(!v) for(let c=1;c<width;c++){ if(cell(r,c)){ v=cell(r,c); break; } }
      if(!v) continue;
      if(isLong(v)){ prep.push({title:pending||'', text:v}); pending=null; }
      else if(pending===null) pending=v;
      else { prep.push({title:pending, text:v}); pending=null; }
    }
    if(pending) prep.push({title:pending, text:''});
  }
  return {meta:meta, blocks:blocks.filter(b=>b.title||b.items.length), prep:prep};
}
function applyWorkbook(XLSX, wb){
  const rowsOf=ws=>XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
  const P={};
  LANGS.forEach(l=>{
    const name=(wb.SheetNames||[]).find(n=>n.trim().toUpperCase()===XL_SHEET[l]);
    if(name) P[l]=parseLangSheet(rowsOf(wb.Sheets[name]));
  });
  if(!P.fr){
    const first=(wb.SheetNames||[]).find(n=>!/lisez|read\s*me/i.test(n)) || wb.SheetNames[0];
    P.fr=parseLangSheet(rowsOf(wb.Sheets[first]));
  }
  const base=P.fr;
  const at=(l,fn,fb)=>{ try{ const v=P[l]?fn(P[l]):''; return v==null?'':v; }catch(e){ return fb||''; } };

  S.meta={
    restaurant: base.meta.restaurant,
    date: normDate(base.meta.date),
    chef: base.meta.chef,
    season:{fr:base.meta.season, en:at('en',x=>x.meta.season), it:at('it',x=>x.meta.season)},
    category:{fr:base.meta.category, en:at('en',x=>x.meta.category), it:at('it',x=>x.meta.category)},
    dish:{fr:base.meta.dish, en:at('en',x=>x.meta.dish), it:at('it',x=>x.meta.dish)}
  };
  S.ing = base.blocks.map((b,bi)=>({
    id:uid(),
    title:{fr:b.title, en:at('en',x=>(x.blocks[bi]||{}).title), it:at('it',x=>(x.blocks[bi]||{}).title)},
    items: b.items.map((it,ii)=>{
      const p=parseQty(it.qtyStr);
      return {id:uid(),
        name:{fr:it.name,
              en:at('en',x=>((x.blocks[bi]||{items:[]}).items[ii]||{}).name),
              it:at('it',x=>((x.blocks[bi]||{items:[]}).items[ii]||{}).name)},
        qty:p.qty, unit:p.unit};
    })
  }));
  if(!S.ing.length) S.ing=[newGroupIng()];
  S.prep = base.prep.map((g,gi)=>({
    id:uid(),
    title:{fr:g.title, en:at('en',x=>(x.prep[gi]||{}).title), it:at('it',x=>(x.prep[gi]||{}).title)},
    text:{fr:g.text,  en:at('en',x=>(x.prep[gi]||{}).text),  it:at('it',x=>(x.prep[gi]||{}).text)}
  }));
  if(!S.prep.length) S.prep=[newGroupPrep()];
  renderEditor(); renderSheet(); persist();
}
/* ancien format à colonnes SECTION / RÉF — conservé pour les fichiers déjà en circulation */
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
        qty:String(r[5]==null?'':r[5]).trim(),
        unit:(String(r[6]||'g').trim().toLowerCase() in UNIT_BY_CODE)?String(r[6]).trim().toLowerCase():'g'});
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
function afterImport(msg){
  toast(msg);
  if(document.body.dataset.screen!=='tool') showTool();
}
async function importFile(file){
  if(!file) return;
  const name=(file.name||'').toLowerCase();
  try{
    if(name.endsWith('.json')){
      const txt=await file.text();
      applyProject(JSON.parse(txt));
      afterImport(t('tLoaded')); return;
    }
    if(name.endsWith('.pdf')){
      busy(t('busyRead'));
      const buf=await file.arrayBuffer();
      const txt=new TextDecoder('latin1').decode(new Uint8Array(buf));
      const mm=txt.match(/%RECIPELAB1:([A-Za-z0-9+/=]+):ENDRECIPELAB/);
      unbusy();
      if(!mm){ toast(t('tNotOurs')); return; }
      applyProject(JSON.parse(b64decode(mm[1])));
      afterImport(t('tLoadedPdf')); return;
    }
    if(name.endsWith('.xlsx')||name.endsWith('.xls')||name.endsWith('.xlsm')){
      busy(t('busyRead'));
      await lib('xlsx');
      const buf=await file.arrayBuffer();
      const wb=window.XLSX.read(new Uint8Array(buf),{type:'array'});
      unbusy();
      if(wb.Sheets['FICHE']){
        applyRows(window.XLSX.utils.sheet_to_json(wb.Sheets['FICHE'],{header:1,raw:false,defval:''}));
      } else {
        applyWorkbook(window.XLSX, wb);
      }
      afterImport(t('tLoadedXls')); return;
    }
    toast(t('tFormats'));
  }catch(e){ unbusy(); console.error(e); toast(t('tFileErr')); }
}

/* =========================================================
   CRÉDITS
   ========================================================= */
function openCredits(){
  const y=new Date().getFullYear();
  const v=document.createElement('div'); v.className='veil';
  v.innerHTML='<div class="modal" role="dialog"><div class="mh">'+esc(t('credits'))+
    '<button class="chip" data-close="1">'+esc(t('close'))+'</button></div>'+
    '<div class="mb">'+
      '<h4>'+esc(t('credDataH'))+'</h4><p>'+esc(t('credData'))+'</p>'+
      '<h4>'+esc(t('credFontsH'))+'</h4><p>'+t('credFonts1')+'</p><p>'+t('credFonts2')+'</p>'+
      '<h4>'+esc(t('credLibsH'))+'</h4><ul>'+t('credLibs')+'</ul>'+
      '<h4>'+esc(t('credBrandH'))+'</h4><p>'+esc(t('credBrand',{y:y}))+'</p>'+
      '<p>© '+y+' <a href="https://www.giraudi.com/" target="_blank" rel="noopener">By Giraudi</a></p>'+
      '<div class="crew"><img class="art" src="'+ART.steak+'" alt=""><img class="art" src="'+ART.sushi+
        '" alt=""><img class="art" src="'+ART.carrot+'" alt=""><img class="art" src="'+ART.brioche+'" alt=""></div>'+
    '</div></div>';
  v.addEventListener('click',e=>{ if(e.target===v||e.target.dataset.close) v.remove(); });
  document.body.appendChild(v);
}

/* ---------- Langue de l'interface ---------- */
const UILKEY='recipelab.uilang';
function setUILang(l,save){
  UILANG = (['fr','en','it'].indexOf(l)>=0) ? l : 'fr';
  document.documentElement.lang=UILANG;
  if(save!==false){ try{ localStorage.setItem(UILKEY,UILANG); }catch(e){} }
  applyUI();
  renderEditor();
  renderSheet();
}
function applyUI(){
  document.querySelectorAll('[data-t]').forEach(el=>{
    const k=el.getAttribute('data-t');
    if(UI[k]) el.textContent=t(k);
  });
  document.querySelectorAll('.ver').forEach(e=>e.textContent=t('version')+' '+VERSION);
  document.querySelectorAll('#uilangs [data-uilang]').forEach(b=>
    b.setAttribute('aria-pressed', String(b.dataset.uilang===UILANG)));
  const zi=document.getElementById('zIn'), zo=document.getElementById('zOut');
  if(zi) zi.title=t('zoomIn');
  if(zo) zo.title=t('zoomOut');
  const tc=document.getElementById('tipClose'); if(tc) tc.title=t('close');
}

/* =========================================================
   ÉCRAN D'ACCUEIL & COLORIS
   ========================================================= */
const SKINS=['poussin','creme','jaune','orange'];
const SKINKEY='recipelab.skin';
function setSkin(name,save){
  if(SKINS.indexOf(name)<0) name='poussin';
  document.documentElement.setAttribute('data-skin',name);
  document.querySelectorAll('.skinbtn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skin===name)));
  if(save!==false){ try{ localStorage.setItem(SKINKEY,name); }catch(e){} }
}
function initSkin(){
  let s=null;
  try{ s=localStorage.getItem(SKINKEY); }catch(e){}
  if(!s) s='poussin';
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
function showImport(){
  document.body.dataset.screen='import';
  if(artTimer){ clearInterval(artTimer); artTimer=null; }
}
function showTool(){
  document.body.dataset.screen='tool';
  if(artTimer){ clearInterval(artTimer); artTimer=null; }
  setTimeout(()=>{ renderSheet(); showTip('pStyle'); },20);
}

/* ---------- Conseils ---------- */
let tipsMuted=false;
function showTip(panelId){
  const box=document.getElementById('tipbox');
  const tp=TIPS[panelId];
  if(!box) return;
  if(!tp || tipsMuted){ box.hidden=true; return; }
  document.getElementById('tipArt').src=ART[tp.art];
  document.getElementById('tipText').textContent=t(tp.k);
  box.hidden=false;
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
      '<button class="btn" data-no="1">'+esc(t('cancel'))+'</button>'+
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
    case 'layout': S.style.layout=b.dataset.v; renderEditor(); renderSheet(); persist(); break;
    case 'dishPos': S.style.dishPos=b.dataset.v; renderEditor(); renderSheet(); persist(); break;
    case 'expPdf': exportPDF(); break;
    case 'expXlsx': exportXLSX(); break;
    case 'expJson': exportJSON(); break;
    case 'expModel': exportTemplate(); break;
    case 'reset':
      ask(t('confReset'),t('confResetYes'),()=>{
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
  let ul=null; try{ ul=localStorage.getItem(UILKEY); }catch(e){}
  if(!ul){
    const nav=(navigator.language||'fr').slice(0,2).toLowerCase();
    ul = (nav==='it'||nav==='en') ? nav : 'fr';
  }
  UILANG=(['fr','en','it'].indexOf(ul)>=0)?ul:'fr';
  document.documentElement.lang=UILANG;
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
  applyUI();
  renderEditor();
  renderSheet();

  const ed=document.getElementById('editor');
  ed.addEventListener('input',onEdit);
  ed.addEventListener('change',onEdit);
  ed.addEventListener('click',onClick);
  ed.addEventListener('toggle',e=>{
    if(e.target.classList && e.target.classList.contains('panel')){
      if(e.target.open){ OPEN.add(e.target.id); tipsMuted=false; showTip(e.target.id); }
      else OPEN.delete(e.target.id);
    }
  },true);
  ed.addEventListener('focusin',e=>{
    const pan=e.target.closest('.panel');
    if(pan && !tipsMuted) showTip(pan.id);
  });

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
  document.getElementById('goExport').addEventListener('click',()=>openPanel('pExport'));
  document.getElementById('goImport').addEventListener('click',showImport);
  document.querySelectorAll('.credits').forEach(b=>b.addEventListener('click',openCredits));

  // menu principal
  showMenu();
  function startBlank(){
    S=blankState(); S.ing[0].items=[newItem(),newItem(),newItem()];
    try{localStorage.removeItem(LSKEY);}catch(e){}
    OPEN.clear(); ['pStyle','pHead','pIng'].forEach(p=>OPEN.add(p));
    renderEditor(); showTool();
  }
  document.getElementById('mCreate').addEventListener('click',()=>{
    if(hasDraft()) ask(t('confNew'),t('confNewYes'),startBlank);
    else startBlank();
  });
  document.getElementById('mEdit').addEventListener('click',showImport);
  document.getElementById('mResume').addEventListener('click',()=>{ renderEditor(); showTool(); });
  document.getElementById('mOptions').addEventListener('click',e=>{
    const box=document.getElementById('mopts');
    const open=box.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded',String(open));
  });
  document.getElementById('mopts').addEventListener('click',e=>{
    const l=e.target.closest('[data-uilang]'); if(l){ setUILang(l.dataset.uilang); return; }
    const s=e.target.closest('.skinbtn[data-skin]'); if(s) setSkin(s.dataset.skin);
  });
  document.getElementById('goHome').addEventListener('click',showMenu);
  document.getElementById('importLogo').src=ART.logo;
  document.getElementById('importChar').src=ART.brioche;
  document.getElementById('importBack').addEventListener('click',showMenu);
  const iDrop=document.getElementById('importDrop'), iInput=document.getElementById('importInput');
  iInput.addEventListener('change',()=>{ if(iInput.files&&iInput.files[0]){ importFile(iInput.files[0]); iInput.value=''; } });
  iDrop.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); iInput.click(); } });
  iDrop.addEventListener('dragover',e=>{ e.preventDefault(); iDrop.classList.add('over'); });
  iDrop.addEventListener('dragleave',()=>iDrop.classList.remove('over'));
  iDrop.addEventListener('drop',e=>{
    e.preventDefault(); iDrop.classList.remove('over');
    const f=e.dataTransfer.files && e.dataTransfer.files[0]; if(f) importFile(f);
  });
  document.getElementById('pageImport').addEventListener('click',e=>{
    const b=e.target.closest('[data-act="expModel"]'); if(b){ e.preventDefault(); exportTemplate(); }
  });

  // conseils
  document.getElementById('tipClose').addEventListener('click',()=>{
    tipsMuted=true; document.getElementById('tipbox').hidden=true;
  });
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
