/* =========================================================
   POLICES
   ========================================================= */
const loadedFonts = new Set();
function gfUrl(list){
  return 'https://fonts.googleapis.com/css2?' +
    list.map(f=>'family='+f.f.replace(/ /g,'+')+(f.w?':wght@'+f.w:'')).join('&') + '&display=swap';
}
function ensureFont(name){
  const f = FONTS.find(x=>x.f===name);
  if(!f || f.local || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const l=document.createElement('link'); l.rel='stylesheet'; l.href=gfUrl([f]); document.head.appendChild(l);
}
let previewsLoaded=false;
function loadAllPreviews(){
  if(previewsLoaded) return; previewsLoaded=true;
  const list=FONTS.filter(f=>!f.local && !loadedFonts.has(f.f));
  list.forEach(f=>loadedFonts.add(f.f));
  for(let i=0;i<list.length;i+=14){
    const l=document.createElement('link'); l.rel='stylesheet'; l.href=gfUrl(list.slice(i,i+14));
    document.head.appendChild(l);
  }
}

/* =========================================================
   RENDU DE LA FICHE A4
   ========================================================= */
function fmtDate(iso,lang){
  if(!iso) return '';
  try{
    const d=new Date(iso+'T12:00:00');
    if(isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(LOCALE[lang],{day:'2-digit',month:'long',year:'numeric'});
  }catch(e){ return iso; }
}
function qtyLabel(it,lang){
  const u=UNIT_BY_CODE[it.unit]||UNIT_BY_CODE.g;
  const q=(it.qty==null?'':String(it.qty)).trim();
  if(it.unit==='qs') return u.s[lang];
  if(!q) return '';
  return q+' '+u.s[lang];
}
function styleVars(){
  const st=S.style;
  return '--s-bg:'+st.bg+';--s-ink:'+st.ink+';--s-accent:'+st.accent+';--s-on:'+st.on+
         ';--s-rule:'+st.rule+";--s-title:'"+st.titleFont+"',sans-serif;--s-body:'"+st.textFont+"',sans-serif;"+
         'background:'+st.bg+';color:'+st.ink+';';
}
function sheetHTML(lang){
  const t=L[lang], m=S.meta, st=S.style;
  const dish=tx(m.dish,lang), cat=tx(m.category,lang), season=tx(m.season,lang);

  const ing = S.ing.map(g=>{
    const rows = g.items.filter(i=>tx(i.name,lang).trim()||String(i.qty).trim()).map(i=>
      '<div class="s-ing"><span class="n">'+esc(tx(i.name,lang))+'</span><span class="d"></span>'+
      '<span class="q">'+esc(qtyLabel(i,lang))+'</span></div>').join('');
    const title=tx(g.title,lang).trim();
    if(!rows && !title) return '';
    return (title?'<div class="s-gh">'+esc(title)+'</div>':'')+rows;
  }).join('');

  const prep = S.prep.map(g=>{
    const title=tx(g.title,lang).trim(), body=tx(g.text,lang).trim();
    if(!title && !body) return '';
    return (title?'<div class="s-gh">'+esc(title)+'</div>':'')+
           (body?'<p class="s-step">'+esc(body)+'</p>':'');
  }).join('');

  const hasPh = (S.img.dish || S.img.table) && st.layout!=='quad';
  const photos = hasPh ? '<div class="s-photos">'+
      (S.img.dish ? '<div class="s-ph"><img src="'+S.img.dish+'" alt=""></div>':'')+
      (S.img.table? '<div class="s-ph"><img src="'+S.img.table+'" alt=""></div>':'')+
    '</div>' : '';

  const metaLine = [
    season ? '<span><i>'+esc(t.season)+'</i>'+esc(season)+'</span>':'',
    m.date ? '<span><i>'+esc(t.date)+'</i>'+esc(fmtDate(m.date,lang))+'</span>':''
  ].join('');

  const bg = S.img.bg
    ? '<div class="bgimg" style="background-image:url('+S.img.bg+');opacity:'+st.bgOpacity+'"></div>' : '';

  return bg+
  '<div class="inner">'+
    '<div class="s-top">'+
      (S.img.logo?'<img class="s-logo" src="'+S.img.logo+'" alt="">':'')+
      '<h1 class="s-resto">'+esc(m.restaurant||'Restaurant · Ville')+'</h1>'+
      (metaLine?'<div class="s-meta">'+metaLine+'</div>':'')+
    '</div>'+
    '<div class="s-rule"></div>'+
    '<div class="s-title pos-'+(st.dishPos||'left')+'"><div class="s-titleL">'+
      (cat?'<span class="s-cat">'+esc(cat)+'</span>':'')+
      '<h2 class="s-dish">'+esc(dish||t.dish)+'</h2></div>'+
      (m.chef?'<div class="s-chef">'+esc(t.by)+'<br><b>'+esc(m.chef)+'</b></div>':'')+
    '</div>'+
    (st.layout==='stack'
      ? '<div class="s-cols stack">'+
          '<div class="s-col left"><div class="s-h">'+esc(t.ing)+'</div><div class="s-ingcols">'+(ing||'')+'</div></div>'+
          '<div class="s-col right"><div class="s-h">'+esc(t.prep)+'</div>'+(prep||'')+'</div>'+
        '</div>'
      : st.layout==='quad'
      ? '<div class="s-cols quad">'+
          '<div class="qtop">'+
            '<div class="s-col left"><div class="s-h">'+esc(t.ing)+'</div>'+(ing||'')+'</div>'+
            '<div class="s-col right"><div class="s-h">'+esc(t.prep)+'</div>'+(prep||'')+'</div>'+
          '</div>'+
          ((S.img.dish||S.img.table) ? '<div class="qbot">'+
            (S.img.dish ? '<div class="s-ph"><img src="'+S.img.dish+'" alt=""></div>' : '')+
            (S.img.table? '<div class="s-ph"><img src="'+S.img.table+'" alt=""></div>' : '')+
          '</div>' : '')+
        '</div>'
      : '<div class="s-cols">'+
          '<div class="s-col left"><div class="s-h">'+esc(t.ing)+'</div>'+(ing||'')+'</div>'+
          '<div class="s-col right"><div class="s-h">'+esc(t.prep)+'</div>'+(prep||'')+'</div>'+
        '</div>')+
    photos+
    '<div class="s-foot"><span>'+esc(m.restaurant||'')+'</span>'+
      '<span class="sp">'+esc(m.date?fmtDate(m.date,lang):'')+'</span></div>'+
  '</div>';
}
function renderSheetInto(node,lang){
  node.className='sheet';
  node.setAttribute('style',styleVars());
  node.innerHTML=sheetHTML(lang);
  return autofit(node);
}
function autofit(node){
  const cols=node.querySelector('.s-cols');
  if(!cols) return 1;
  const steps=[1,.96,.92,.88,.84,.8,.76,.72,.68,.64,.6,.56,.52,.48,.44];
  let fit=1;
  for(let i=0;i<steps.length;i++){
    fit=steps[i];
    cols.style.setProperty('--fit',fit);
    const list=Array.prototype.slice.call(cols.querySelectorAll('.s-col'));
    let ok = cols.scrollHeight <= cols.clientHeight+1;
    if(ok) for(const c of list){ if(c.scrollHeight > c.clientHeight+1){ ok=false; break; } }
    if(ok) break;
  }
  return fit;
}
function renderSheet(){
  const sheet=document.getElementById('sheet');
  const fit=renderSheetInto(sheet,LANG);
  document.getElementById('prevLang').textContent=LANGNAME[LANG];
  const w=document.getElementById('warn');
  if(fit<=0.62){
    w.innerHTML='<div class="warn">'+esc(t('fitWarn',{n:Math.round(fit*100)}))+'</div>';
  } else w.innerHTML='';
  fitPreview();
}
function fitPreview(){
  const stage=document.getElementById('stage');
  const scaler=document.getElementById('scaler');
  const wrap=document.getElementById('sheetwrap');
  if(!stage||!scaler) return;
  const avail=Math.max(200, stage.clientWidth-46);
  let k = (ZOOM!=null) ? ZOOM : Math.min(1, avail/794);
  k=Math.max(.18,Math.min(2,k));
  scaler.style.transform='scale('+k+')';
  wrap.style.width=(794*k)+'px';
  wrap.style.height=(1123*k)+'px';
  document.getElementById('zVal').textContent=Math.round(k*100)+' %';
}
