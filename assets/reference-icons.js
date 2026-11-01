/* Ikon SVG lokal untuk desain referensi; mencakup konten yang dirender ulang. */
(() => {
  'use strict';
  const drawings = {
    home: '<path d="m3 10 9-7 9 7v10H15v-6H9v6H3Z"/>',
    book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
    books: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="8" y="3" width="5" height="18" rx="1"/><path d="m14 5 4-1 4 16-4 1ZM4 7h3m2 9h3"/>',
    pencil: '<path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15ZM4 20h16"/>',
    game: '<path d="M7 7h10c3 0 5 9 4 11s-3 1-6-2H9c-3 3-5 4-6 2S4 7 7 7Z"/><path d="M7 10v5m-2-2.5h4m7-1h.01m2 3h.01"/>',
    settings: '<path d="m10 3-.5 2-2 .9-2-.5-2 3.4 1.5 1.5v3.4L3.5 15l2 3.4 2-.5 2 .9.5 2h4l.5-2 2-.9 2 .5 2-3.4-1.5-1.5v-3.4L21 8.6l-2-3.4-2 .5-2-.9L14 3Z"/><circle cx="12" cy="12" r="3"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
    cap: '<path d="m2 8 10-5 10 5-10 5Zm4 2v7c4 3 8 3 12 0v-7m4-2v8"/>',
    wave: '<path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v9c0 8-10 9-13 4l-4-5a2 2 0 0 1 3-3l2 2"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    volume: '<path d="M4 9h4l5-4v14l-5-4H4Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    users: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3c0-6 14-6 14 0v3M16 4c5 0 5 6 0 6m2 3c4 0 4 4 4 8"/>',
    chart: '<path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 10 6-4v12l-6-4Z"/>',
    file: '<path d="M14 2H5v20h14V7Zm0 0v5h5M8 12h8m-8 4h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    pin: '<path d="m9 3 9 3-2 5 2 4-5-1-4 5-4-4 5-4ZM8 17l-5 5"/>',
    save: '<path d="M3 3h15l3 3v15H3Zm4 0v7h10V3M7 21v-7h10v7"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-6-6 3-3m0 6 3-3"/>',
    teacher: '<path d="M10 3h12v13H12m3-9h4m-4 4h4"/><circle cx="5" cy="10" r="3"/><path d="M1 22v-4c0-4 8-4 8 0v4"/>',
    exit: '<path d="M10 3H3v18h7m-2-9h14m-5-5 5 5-5 5"/>',
    warning: '<path d="M12 3 2 21h20ZM12 9v5m0 3h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
    cross: '<circle cx="12" cy="12" r="9"/><path d="m8 8 8 8m-8 0 8-8"/>',
    eye: '<path d="M2 12c5-9 15-9 20 0-5 9-15 9-20 0Z"/><circle cx="12" cy="12" r="3"/>',
    school: '<path d="m6 9 6-6 6 6v12H6ZM2 21V10h4m12 0h4v11M10 21v-6h4v6"/><circle cx="12" cy="9" r="1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
    bulb: '<path d="M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8Zm0 3h8m-6 3h4"/>',
    trophy: '<path d="M7 3h10v6c0 7-10 7-10 0ZM7 5H3v3c0 4 4 4 5 4m9-7h4v3c0 4-4 4-5 4m-4 2v6m-5 1h10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01"/>'
  };
  const aliases = {
    '🏠':['home','Beranda'], '📚':['books','Materi'], '📝':['pencil','Latihan'],
    '🎮':['game','Game'], '📖':['book','Kamus'], '⚙':['settings','Pengaturan'],
    '✨':['spark','Informasi'], '⚡':['bolt','Pratinjau'], '🎓':['cap','Belajar'],
    '👋':['wave','Halo'], '🔍':['search','Cari'], '🔊':['volume','Dengarkan'],
    '➕':['plus','Tambah'], '🎯':['target','Target'], '👥':['users','Pengguna'],
    '📊':['chart','Progres'], '🎥':['video','Video'], '📄':['file','Dokumen'],
    '🕹':['game','Interaktif'], '🌐':['globe','Web'], '📌':['pin','Rangkuman'],
    '💾':['save','Simpan'], '🔒':['lock','Terkunci'], '🔑':['key','Masuk'],
    '🧑‍🎓':['cap','Siswa'], '👩‍🏫':['teacher','Guru'], '🚪':['exit','Keluar'],
    '⚠':['warning','Perhatian'], '🎉':['spark','Berhasil'], '✅':['check','Selesai'],
    '❌':['cross','Gagal'], '👀':['eye','Lihat'], '🏫':['school','Sekolah'],
    '⏳':['clock','Menunggu'], '▶':['play','Putar'], '💡':['bulb','Tips'],
    '🏆':['trophy','Pencapaian'], 'ℹ':['info','Informasi'], '🤔':['help','Pertanyaan']
  };
  const pattern = new RegExp('('+Object.keys(aliases).sort((a,b)=>b.length-a.length).join('|')+')\\uFE0F?', 'gu');
  const excluded = 'script,style,textarea,option,title,svg,[data-huma-icon],[contenteditable="true"]';
  function replaceText(node) {
    const parent=node.parentElement;
    if(!parent || parent.closest(excluded)) return;
    const value=node.nodeValue;
    pattern.lastIndex=0;
    if(!pattern.test(value))return;
    pattern.lastIndex=0;
    const fragment=document.createDocumentFragment();
    let last=0;
    for(const match of value.matchAll(pattern)) {
      fragment.append(document.createTextNode(value.slice(last,match.index)));
      const [name,label]=aliases[match[1]];
      const span=document.createElement('span');
      span.className='huma-icon';
      span.dataset.humaIcon=name;
      span.setAttribute('aria-hidden','true');
      span.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+drawings[name]+'</svg>';
      fragment.append(span);
      const control=parent.closest('button,a');
      if(control && control.textContent.trim()===match[0] && !control.getAttribute('aria-label'))control.setAttribute('aria-label',label);
      last=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(value.slice(last)));
    node.replaceWith(fragment);
  }
  function refresh(root) {
    if(root.nodeType===Node.TEXT_NODE){replaceText(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE || root.closest(excluded))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(replaceText);
  }
  function start() {
    refresh(document.body);
    const observer=new MutationObserver(records=>{
      observer.disconnect();
      try { for(const record of records) {
        if(record.type==='characterData')refresh(record.target);
        else record.addedNodes.forEach(refresh);
      }} finally {observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
