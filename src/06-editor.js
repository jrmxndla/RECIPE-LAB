/* =========================================================
   ÉDITEUR
   ========================================================= */
function getPath(p){ return p.split('.').reduce((o,k)=>o[k], S); }
function setPath(p,v){ const ks=p.split('.'); const last=ks.pop(); ks.reduce((o,k)=>o[k],S)[last]=v; }

const ICO_TRASH='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

const PANELS=['pStyle','pHead','pIng','pPrep','pPhoto','pExport'];
const TIPS={
  pStyle:{art:'barista',k:'tipStyle'},
  pHead:{art:'waiter',k:'tipHead'},
  pIng:{art:'chop',k:'tipIng'},
  pPrep:{art:'pasta',k:'tipPrep'},
  pPhoto:{art:'cake',k:'tipPhoto'},
  pExport:{art:'whisk',k:'tipExport'}
};
function tipHTML(id){
  const tp=TIPS[id];
  return tp ? '<p class="hint tip">'+esc(t(tp.k))+'</p>' : '';
}
function panel(id,num,title,body){
  return '<details class="panel" id="'+id+'"'+(OPEN.has(id)?' open':'')+'>'+
    '<summary><span class="num">'+num+'</span>'+esc(title)+'</summary>'+
    '<div class="pbody">'+tipHTML(id)+body+'</div></details>';
}
function pf(label,path,placeholder,type){
  const v=getPath(path)||'';
  return '<label class="f"><span>'+esc(label)+'</span><input class="inp" type="'+(type||'text')+
    '" data-b="'+path+'" value="'+esc(v)+'" placeholder="'+esc(placeholder||'')+'"></label>';
}
function lfield(label,path,placeholder){
  const o=T(getPath(path));
  const ph = LANG==='fr' ? (placeholder||'') : (o.fr ? 'FR · '+o.fr : (placeholder||''));
  return '<label class="f"><span>'+esc(label)+' · '+LANG.toUpperCase()+'</span><input class="inp" data-bl="'+path+
    '" value="'+esc(o[LANG]||'')+'" placeholder="'+esc(ph)+'"></label>';
}
function emptyHTML(art,txt){
  return '<div class="empty"><img class="art" src="'+ART[art]+'" alt=""><span>'+esc(txt)+'</span></div>';
}
function dropHTML(key,label,hint){
  const v=S.img[key];
  return '<div class="f"><span>'+esc(label)+'</span>'+
    '<label class="drop" tabindex="0" role="button" data-drop="'+key+'">'+
      (v ? '<img class="thumb" src="'+esc(v)+'" alt="">'
         : '<span class="k">'+esc(hint)+'</span><span class="k sub">'+esc(t('dropHint'))+'</span>')+
      '<input type="file" accept="image/*" hidden data-img="'+key+'">'+
      (v ? '<button class="x" type="button" data-act="clearImg" data-key="'+key+'">'+esc(t('removeImg'))+'</button>' : '')+
    '</label></div>';
}
function swHTML(key,name,desc){
  return '<button class="sw" data-act="pickColor" data-key="'+key+'">'+
    '<span class="dot" style="background:'+esc(S.style[key])+'"></span>'+
    '<span class="t"><b>'+esc(name)+'</b>'+esc(desc)+'</span></button>';
}
function fontFieldHTML(key,label){
  const cur=S.style[key];
  const f=FONTS.find(x=>x.f===cur)||FONTS[1];
  return '<div class="f"><span>'+esc(label)+'</span><div class="fontsel">'+
    '<button class="fontbtn" data-act="pickFont" data-key="'+key+'">'+
      '<span class="A" style="font-family:\''+esc(cur)+'\',sans-serif">A</span>'+
      '<span class="nm">'+esc(cur)+'</span><span class="cat">'+esc(f.c)+'</span>'+
    '</button></div></div>';
}
function choiceHTML(act,field,opts){
  const cur=S.style[field];
  return '<div class="row3">'+opts.map(o=>
    '<button class="btn'+(cur===o.v?' solid':'')+'" data-act="'+act+'" data-v="'+o.v+
    '" style="box-shadow:none">'+esc(o.l)+'</button>').join('')+'</div>';
}

/* ---------- 1 · le style ---------- */
function styleHTML(){
  return '<div class="f"><span>'+esc(t('layout'))+'</span>'+
      choiceHTML('layout','layout',[{v:'cols',l:t('layoutCols')},{v:'stack',l:t('layoutStack')},{v:'quad',l:t('layoutQuad')}])+
    '</div>'+
    '<p class="hint" style="margin-top:0">'+esc(t('layoutHint'))+'</p>'+
    '<div class="f"><span>'+esc(t('dishPos'))+'</span>'+
      choiceHTML('dishPos','dishPos',[{v:'left',l:t('posLeft')},{v:'center',l:t('posCenter')},{v:'right',l:t('posRight')}])+
    '</div>'+
    dropHTML('bg',t('bgImg'),t('bgImgHint'))+
    '<label class="f"><span>'+esc(t('bgOpacity'))+' — '+Math.round(S.style.bgOpacity*100)+' %</span>'+
      '<input type="range" min="0" max="1" step="0.02" value="'+S.style.bgOpacity+'" data-style="bgOpacity" style="width:100%"></label>'+
    '<div class="f"><span>'+esc(t('colors'))+'</span><div class="swatches">'+
      swHTML('bg',t('cBg'),t('cBgD'))+
      swHTML('ink',t('cInk'),t('cInkD'))+
      swHTML('accent',t('cAccent'),t('cAccentD'))+
      swHTML('on',t('cOn'),t('cOnD'))+
      swHTML('rule',t('cRule'),t('cRuleD'))+
    '</div></div>'+
    '<div class="f"><span>'+esc(t('themes'))+'</span><div class="row3">'+
      '<button class="btn" data-act="theme" data-t="cantine" style="box-shadow:none">'+esc(t('themeCantine'))+'</button>'+
      '<button class="btn" data-act="theme" data-t="zeffirino" style="box-shadow:none">'+esc(t('themeZeff'))+'</button>'+
      '<button class="btn" data-act="theme" data-t="mono" style="box-shadow:none">'+esc(t('themeMono'))+'</button>'+
    '</div></div>'+
    fontFieldHTML('titleFont',t('fontTitles'))+
    fontFieldHTML('textFont',t('fontText'))+
    '<p class="hint">'+esc(t('fontHint'))+'</p>'+
    emptyHTML('barista',t('emptyStyle'));
}

/* ---------- 2 · l'en-tête ---------- */
function headHTML(){
  return pf(t('restaurant'),'meta.restaurant',t('exResto')) +
    dropHTML('logo',t('logo'),t('logoHint')) +
    lfield(t('season'),'meta.season',t('exSeason')) +
    pf(t('dateL'),'meta.date','','date') +
    pf(t('chefL'),'meta.chef',t('exChef')) +
    lfield(t('categoryL'),'meta.category',t('exCat')) +
    lfield(t('dishL'),'meta.dish',t('exDish'));
}

/* ---------- 3 · les ingrédients ---------- */
function unitOptions(sel){
  return UNITS.map(u=>'<option value="'+u.c+'"'+(u.c===sel?' selected':'')+'>'+esc(u.n[LANG]||u.n.fr)+'</option>').join('');
}
function ingHTML(){
  let h='<datalist id="denomIng">'+
    ['Base','Sauce','Marinade','Pâte','Crème','Garniture','Assaisonnement','Finition','Dressage']
      .map(x=>'<option value="'+x+'">').join('')+'</datalist>';
  if(!S.ing.length) h+=emptyHTML('chop',t('emptyIng'));
  S.ing.forEach((g,gi)=>{
    const gt=T(g.title);
    h+='<div class="group"><div class="ghead">'+
      '<span class="gnum">'+esc(t('blockN'))+' '+(gi+1)+(gt.fr?' — '+esc(gt.fr):'')+'</span>'+
      '<button class="ico" data-act="moveIng" data-id="'+g.id+'" data-dir="-1" title="'+esc(t('up'))+'">↑</button>'+
      '<button class="ico" data-act="moveIng" data-id="'+g.id+'" data-dir="1" title="'+esc(t('down'))+'">↓</button>'+
      '<button class="ico" data-act="delIng" data-id="'+g.id+'" title="'+esc(t('delBlock'))+'">'+ICO_TRASH+'</button>'+
      '</div><div class="gbody">'+
      '<label class="f"><span>'+esc(t('blockTitle'))+' · '+LANG.toUpperCase()+'</span>'+
        '<input class="inp" list="denomIng" data-bg="'+g.id+'" data-k="title" value="'+esc(gt[LANG]||'')+
        '" placeholder="'+esc(LANG==='fr' ? t('exSauce') : (gt.fr ? 'FR · '+gt.fr : t('blockTitle')))+'"></label>';
    if(!g.items.length) h+='<p class="hint" style="margin:0 0 10px">'+esc(t('blockEmpty'))+'</p>';
    g.items.forEach(it=>{
      const nm=T(it.name);
      h+='<div class="irow">'+
        '<input class="inp iname" data-bg="'+g.id+'" data-bi="'+it.id+'" data-k="name" value="'+esc(nm[LANG]||'')+
          '" placeholder="'+esc(LANG==='fr'?t('product'):(nm.fr?'FR · '+nm.fr:t('product')))+'">'+
        '<div class="iqty">'+
          '<input class="inp" inputmode="decimal" data-bg="'+g.id+'" data-bi="'+it.id+'" data-k="qty" value="'+
            esc(it.qty)+'" placeholder="'+esc(t('qtyPh'))+'">'+
          '<select class="inp" data-bg="'+g.id+'" data-bi="'+it.id+'" data-k="unit">'+unitOptions(it.unit)+'</select>'+
          '<button class="ico" data-act="delItem" data-id="'+g.id+'" data-iid="'+it.id+'" title="'+esc(t('delItem'))+'">'+ICO_TRASH+'</button>'+
        '</div>'+
      '</div>';
    });
    h+='<button class="addrow" data-act="addItem" data-id="'+g.id+'">'+esc(t('addItem'))+'</button>'+
       '</div></div>';
  });
  h+='<button class="addrow" data-act="addIng">'+esc(t('addIngBlock'))+'</button>';
  return h;
}

/* ---------- 4 · la préparation ---------- */
function prepHTML(){
  let h='<datalist id="denomPrep">'+
    [t('stepBtn')+' 1',t('stepBtn')+' 2','Sauce','Marinade','Cuisson','Dressage']
      .map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>';
  if(!S.prep.length) h+=emptyHTML('pasta',t('emptyPrep'));
  S.prep.forEach((g,gi)=>{
    const gt=T(g.title), tt=T(g.text);
    h+='<div class="group"><div class="ghead">'+
      '<span class="gnum">'+esc(t('blockN'))+' '+(gi+1)+(gt.fr?' — '+esc(gt.fr):'')+'</span>'+
      '<button class="tbtn" data-act="numPrep" data-id="'+g.id+'" title="'+esc(t('autoName'))+'">'+esc(t('stepBtn'))+' '+(gi+1)+'</button>'+
      '<button class="ico" data-act="movePrep" data-id="'+g.id+'" data-dir="-1" title="'+esc(t('up'))+'">↑</button>'+
      '<button class="ico" data-act="movePrep" data-id="'+g.id+'" data-dir="1" title="'+esc(t('down'))+'">↓</button>'+
      '<button class="ico" data-act="delPrep" data-id="'+g.id+'" title="'+esc(t('delBlock'))+'">'+ICO_TRASH+'</button>'+
      '</div><div class="gbody">'+
      '<label class="f"><span>'+esc(t('blockTitle'))+' · '+LANG.toUpperCase()+'</span>'+
        '<input class="inp" list="denomPrep" data-bp="'+g.id+'" data-k="title" value="'+esc(gt[LANG]||'')+
        '" placeholder="'+esc(LANG==='fr'?t('exStepTitle'):(gt.fr?'FR · '+gt.fr:t('blockTitle')))+'"></label>'+
      '<label class="f" style="margin-bottom:0"><span>'+esc(t('stepsL'))+' · '+LANG.toUpperCase()+'</span>'+
      '<textarea class="inp" data-bp="'+g.id+'" data-k="text" placeholder="'+
        esc(LANG==='fr'?t('stepsPh'):(tt.fr?'FR · '+tt.fr.slice(0,80)+'…':t('stepsPh')))+
        '">'+esc(tt[LANG]||'')+'</textarea></label>'+
      '</div></div>';
  });
  h+='<button class="addrow" data-act="addPrep">'+esc(t('addPrepBlock'))+'</button>';
  return h;
}

/* ---------- 5 · les photos ---------- */
function photoHTML(){
  return dropHTML('dish',t('photoDish'),t('photoDishHint'))+
    dropHTML('table',t('photoTable'),t('photoTableHint'))+
    (S.img.dish||S.img.table ? '' : emptyHTML('cake',t('emptyPhoto')));
}

/* ---------- 6 · exporter ---------- */
function exportHTML(){
  return '<div class="f"><button class="btn solid" data-act="expPdf">'+esc(t('expPdf'))+'</button></div>'+
    '<div class="f"><button class="btn" data-act="expXlsx">'+esc(t('expXlsx'))+'</button></div>'+
    '<div class="f"><button class="btn" data-act="expJson">'+esc(t('expJson'))+'</button></div>'+
    '<div class="f"><button class="btn" data-act="expModel" style="box-shadow:none;border-style:dashed">'+esc(t('expModel'))+'</button></div>'+
    '<p class="hint">'+esc(t('expHint'))+'</p>'+
    '<div class="f"><button class="btn" data-act="reset" style="box-shadow:none;border-style:dashed">'+esc(t('reset'))+'</button></div>'+
    emptyHTML('waiter',t('emptyExport'));
}

function renderEditor(){
  const ed=document.getElementById('editor');
  const scroll=ed.scrollTop;
  ed.innerHTML =
    panel('pStyle','1',t('pStyle'),styleHTML())+
    panel('pHead','2',t('pHead'),headHTML())+
    panel('pIng','3',t('pIng'),ingHTML())+
    panel('pPrep','4',t('pPrep'),prepHTML())+
    panel('pPhoto','5',t('pPhoto'),photoHTML())+
    panel('pExport','6',t('pExport'),exportHTML());
  ed.scrollTop=scroll;
}
