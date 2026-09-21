/* =========================================================
   ÉDITEUR
   ========================================================= */
function getPath(p){ return p.split('.').reduce((o,k)=>o[k], S); }
function setPath(p,v){ const ks=p.split('.'); const last=ks.pop(); ks.reduce((o,k)=>o[k],S)[last]=v; }

function panel(id,num,title,body){
  return '<details class="panel" id="'+id+'"'+(OPEN.has(id)?' open':'')+'>'+
    '<summary><span class="num">'+num+'</span>'+title+'</summary>'+
    '<div class="pbody">'+body+'</div></details>';
}
function pf(label,path,placeholder,type){   // champ commun aux 3 langues
  const v=getPath(path)||'';
  return '<label class="f"><span>'+label+'</span><input class="inp" type="'+(type||'text')+
    '" data-b="'+path+'" value="'+esc(v)+'" placeholder="'+esc(placeholder||'')+'"></label>';
}
function lfield(label,path,placeholder){    // champ traduit
  const o=T(getPath(path));
  const ph = LANG==='fr' ? (placeholder||'') : (o.fr ? 'FR · '+o.fr : (placeholder||''));
  return '<label class="f"><span>'+label+' · '+LANG.toUpperCase()+'</span><input class="inp" data-bl="'+path+
    '" value="'+esc(o[LANG]||'')+'" placeholder="'+esc(ph)+'"></label>';
}
function emptyHTML(art,txt){
  return '<div class="empty"><img class="art" src="'+ART[art]+'" alt=""><span>'+txt+'</span></div>';
}
function dropHTML(key,label,hint){
  const v=S.img[key];
  return '<div class="f"><span>'+label+'</span>'+
    '<label class="drop" tabindex="0" role="button" data-drop="'+key+'">'+
      (v ? '<img class="thumb" src="'+esc(v)+'" alt="">'
         : '<span class="k">'+hint+'</span><span class="k sub">glissez un fichier ou cliquez</span>')+
      '<input type="file" accept="image/*" hidden data-img="'+key+'">'+
      (v ? '<button class="x" type="button" data-act="clearImg" data-key="'+key+'">Retirer l’image</button>' : '')+
    '</label></div>';
}
function swHTML(key,name,desc){
  return '<button class="sw" data-act="pickColor" data-key="'+key+'">'+
    '<span class="dot" style="background:'+esc(S.style[key])+'"></span>'+
    '<span class="t"><b>'+name+'</b>'+desc+'</span></button>';
}
function fontFieldHTML(key,label){
  const cur=S.style[key];
  const f=FONTS.find(x=>x.f===cur)||FONTS[2];
  return '<div class="f"><span>'+label+'</span><div class="fontsel">'+
    '<button class="fontbtn" data-act="pickFont" data-key="'+key+'">'+
      '<span class="A" style="font-family:\''+esc(cur)+'\',sans-serif">A</span>'+
      '<span class="nm">'+esc(cur)+'</span><span class="cat">'+esc(f.c)+'</span>'+
    '</button></div></div>';
}

/* ---------- Panneau 1 : en-tête ---------- */
function headHTML(){
  return pf('Restaurant + ville','meta.restaurant','ex. ZEFFIRINO MONACO') +
    dropHTML('logo','Logo du restaurant','Logo du restaurant') +
    '<div class="row2">'+ lfield('Saison','meta.season','ex. Automne Hiver 2026') +
      pf('Date','meta.date','','date') + '</div>' +
    pf('Chef qui rédige la fiche','meta.chef','ex. Thierry Paludetto') +
    '<div class="row2">'+ lfield('Catégorie','meta.category','ex. Entrées') +
      lfield('Nom du plat','meta.dish','ex. Millet, poivrons, pamplemousse') + '</div>' +
    '<p class="hint">Restaurant, date et chef sont communs aux trois langues. Saison, catégorie et nom du plat se traduisent : changez de langue en haut de l’écran pour saisir l’anglais et l’italien. Un champ laissé vide reprend le français.</p>';
}

/* ---------- Panneau 2 : ingrédients ---------- */
function unitOptions(sel){
  return UNITS.map(u=>'<option value="'+u.c+'"'+(u.c===sel?' selected':'')+'>'+esc(u.n[LANG]||u.n.fr)+'</option>').join('');
}
function ingHTML(){
  let h='<datalist id="denomIng">'+
    ['Base','Sauce','Marinade','Pâte','Crème','Garniture','Assaisonnement','Finition','Dressage']
      .map(x=>'<option value="'+x+'">').join('')+'</datalist>';
  if(!S.ing.length) h+=emptyHTML('chop','Créez un premier bloc : donnez-lui un titre, puis ajoutez ses ingrédients.');
  S.ing.forEach((g,gi)=>{
    const gt=T(g.title);
    h+='<div class="group"><div class="ghead">'+
      '<span class="gnum">Bloc '+(gi+1)+(gt.fr?' — '+esc(gt.fr):'')+'</span>'+
      '<button class="ico" data-act="moveIng" data-id="'+g.id+'" data-dir="-1" title="Monter">↑</button>'+
      '<button class="ico" data-act="moveIng" data-id="'+g.id+'" data-dir="1" title="Descendre">↓</button>'+
      '<button class="ico" data-act="delIng" data-id="'+g.id+'" title="Supprimer ce bloc">✕</button>'+
      '</div><div class="gbody">'+
      '<label class="f"><span>Titre du bloc · '+LANG.toUpperCase()+'</span>'+
        '<input class="inp" list="denomIng" data-bg="'+g.id+'" data-k="title" value="'+esc(gt[LANG]||'')+
        '" placeholder="'+esc(LANG==='fr'?'ex. Sauce':(gt.fr?'FR · '+gt.fr:'Title'))+'"></label>';
    if(!g.items.length) h+='<p class="hint" style="margin:0 0 8px">Ce bloc est vide : ajoutez ses ingrédients ci-dessous.</p>';
    g.items.forEach(it=>{
      const nm=T(it.name);
      h+='<div class="irow">'+
        '<input class="inp" data-bg="'+g.id+'" data-bi="'+it.id+'" data-k="name" value="'+esc(nm[LANG]||'')+
          '" placeholder="'+esc(LANG==='fr'?'Produit brut':(nm.fr?'FR · '+nm.fr:'Product'))+'">'+
        '<input class="inp" inputmode="decimal" data-bg="'+g.id+'" data-bi="'+it.id+'" data-k="qty" value="'+
          esc(it.qty)+'" placeholder="0">'+
        '<select class="inp" data-bg="'+g.id+'" data-bi="'+it.id+'" data-k="unit">'+unitOptions(it.unit)+'</select>'+
        '<button class="ico" data-act="delItem" data-id="'+g.id+'" data-iid="'+it.id+'" title="Supprimer la ligne">✕</button>'+
      '</div>';
    });
    h+='<button class="addrow" data-act="addItem" data-id="'+g.id+'">+ ingrédient dans ce bloc</button>'+
       '</div></div>';
  });
  h+='<button class="addrow" data-act="addIng">+ nouveau bloc d’ingrédients</button>';
  return h;
}

/* ---------- Panneau 3 : préparation ---------- */
function prepHTML(){
  let h='<datalist id="denomPrep">'+
    ['Étape 1','Étape 2','Préparation','Sauce','Marinade','Cuisson','Montage','Dressage','Conservation']
      .map(x=>'<option value="'+x+'">').join('')+'</datalist>';
  if(!S.prep.length) h+=emptyHTML('pasta','Décrivez les étapes, bloc par bloc.');
  S.prep.forEach((g,gi)=>{
    const gt=T(g.title), tt=T(g.text);
    h+='<div class="group"><div class="ghead">'+
      '<span class="gnum">Bloc '+(gi+1)+(gt.fr?' — '+esc(gt.fr):'')+'</span>'+
      '<button class="tbtn" data-act="numPrep" data-id="'+g.id+'" title="Nommer automatiquement">Étape '+(gi+1)+'</button>'+
      '<button class="ico" data-act="movePrep" data-id="'+g.id+'" data-dir="-1" title="Monter">↑</button>'+
      '<button class="ico" data-act="movePrep" data-id="'+g.id+'" data-dir="1" title="Descendre">↓</button>'+
      '<button class="ico" data-act="delPrep" data-id="'+g.id+'" title="Supprimer ce bloc">✕</button>'+
      '</div><div class="gbody">'+
      '<label class="f"><span>Titre du bloc · '+LANG.toUpperCase()+'</span>'+
        '<input class="inp" list="denomPrep" data-bp="'+g.id+'" data-k="title" value="'+esc(gt[LANG]||'')+
        '" placeholder="'+esc(LANG==='fr'?'ex. Étape 1, Cuisson, Dressage…':(gt.fr?'FR · '+gt.fr:'Title'))+'"></label>'+
      '<label class="f" style="margin-bottom:0"><span>Étapes · '+LANG.toUpperCase()+'</span>'+
      '<textarea class="inp" data-bp="'+g.id+'" data-k="text" placeholder="'+
        esc(LANG==='fr'?'Une étape par ligne. Températures, temps, tours de main…':(tt.fr?'FR · '+tt.fr.slice(0,80)+'…':'Steps'))+
        '">'+esc(tt[LANG]||'')+'</textarea></label>'+
      '</div></div>';
  });
  h+='<button class="addrow" data-act="addPrep">+ nouveau bloc de préparation</button>';
  return h;
}

/* ---------- Panneau 4 : photos ---------- */
function photoHTML(){
  return '<div class="row2">'+dropHTML('dish','Photo du plat fini','Plat dressé')+
         dropHTML('table','Art de la table','Assiette, couvert, verre…')+'</div>'+
    '<p class="hint">Les deux photos sont facultatives. Elles apparaissent en bas de la fiche, dans les trois langues.</p>'+
    (S.img.dish||S.img.table ? '' : emptyHTML('cake','Une fiche sans photo reste parfaitement valable.'));
}

/* ---------- Panneau 5 : style ---------- */
function styleHTML(){
  return dropHTML('bg','Fond de page','Texture, papier, photo…')+
    '<label class="f"><span>Intensité du fond — '+Math.round(S.style.bgOpacity*100)+' %</span>'+
      '<input type="range" min="0" max="1" step="0.02" value="'+S.style.bgOpacity+'" data-style="bgOpacity" style="width:100%"></label>'+
    '<div class="f"><span>Couleurs</span><div class="swatches">'+
      swHTML('bg','Fond','papier de la fiche')+
      swHTML('ink','Texte','encre principale')+
      swHTML('accent','Accent','damier, titres, pastille')+
      swHTML('on','Texte sur accent','pastille catégorie')+
      swHTML('rule','Filets','traits et encadrés')+
    '</div></div>'+
    '<div class="f"><span>Thèmes rapides</span><div class="row3">'+
      '<button class="btn" data-act="theme" data-t="cantine" style="box-shadow:none">Cantine</button>'+
      '<button class="btn" data-act="theme" data-t="zeffirino" style="box-shadow:none">Vert sapin</button>'+
      '<button class="btn" data-act="theme" data-t="mono" style="box-shadow:none">Noir &amp; blanc</button>'+
    '</div></div>'+
    fontFieldHTML('titleFont','Police des titres')+
    fontFieldHTML('textFont','Police du texte')+
    '<p class="hint">Lineal, dessinée par Frank Adebiaye et l’équipe Velvetyne, est embarquée dans l’outil : elle sert à l’interface et reste disponible pour les fiches. Les 30 autres familles sont libres de droit et chargées depuis Google Fonts.</p>'+
    emptyHTML('barista','Un style, trois langues : la mise en page suit partout.');
}

/* ---------- Panneau 6 : export ---------- */
function exportHTML(){
  return '<p class="hint" style="margin-top:0">Chaque export contient les trois langues : français, anglais, italien.</p>'+
    '<div class="f"><button class="btn dark" data-act="expPdf" style="width:100%">PDF — 3 pages, 3 langues</button></div>'+
    '<div class="f"><button class="btn" data-act="expXlsx" style="width:100%">Excel modifiable (.xlsx)</button></div>'+
    '<div class="f"><button class="btn" data-act="expJson" style="width:100%">Sauvegarde complète (.json)</button></div>'+
    '<div class="f"><button class="btn" data-act="expModel" style="width:100%;box-shadow:none;border-style:dashed">Modèle Excel vierge</button></div>'+
    '<p class="hint">Le PDF embarque la fiche complète : en le rechargeant dans l’outil vous récupérez textes, couleurs, polices et images. L’Excel ne contient que le texte et les quantités, en trois colonnes de langue — parfait pour le relire ou le faire traduire à plusieurs.</p>'+
    '<div class="f"><button class="btn" data-act="reset" style="width:100%;box-shadow:none;border-style:dashed">Nouvelle fiche vierge</button></div>'+
    emptyHTML('waiter','Prêt à passer en cuisine.');
}

/* ---------- Panneau 7 : import ---------- */
function importHTML(){
  return '<label class="drop" tabindex="0" role="button" data-drop="file" style="padding:20px">'+
      '<img class="art" src="'+ART.brioche+'" alt="" style="height:110px">'+
      '<span class="k">Déposez un PDF, un Excel ou une sauvegarde</span>'+
      '<span class="k sub">.pdf&nbsp;&nbsp;·&nbsp;&nbsp;.xlsx&nbsp;&nbsp;·&nbsp;&nbsp;.json</span>'+
      '<input type="file" accept=".pdf,.xlsx,.xls,.json,application/pdf" hidden data-import="1">'+
    '</label>'+
    '<p class="hint">PDF ou .json exportés d’ici : tout revient, mise en page comprise.<br>Excel : les textes et quantités remplacent ceux de la fiche ouverte, le style en place est conservé.</p>'+
    '<div class="f"><button class="btn" data-act="expModel" style="width:100%;box-shadow:none;border-style:dashed">Télécharger le modèle Excel vierge</button></div>';
}

function renderEditor(){
  const ed=document.getElementById('editor');
  const scroll=ed.scrollTop;
  ed.innerHTML =
    panel('p1','1','En-tête de fiche',headHTML())+
    panel('p2','2','Ingrédients',ingHTML())+
    panel('p3','3','Étapes de préparation',prepHTML())+
    panel('p4','4','Photos',photoHTML())+
    panel('p5','5','Style &amp; identité',styleHTML())+
    panel('p6','6','Exporter',exportHTML())+
    panel('p7','7','Modifier une fiche existante',importHTML());
  ed.scrollTop=scroll;
}
