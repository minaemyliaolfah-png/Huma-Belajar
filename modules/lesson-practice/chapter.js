(function(root){
  function shuffle(values, random=Math.random){
    const a=[...values];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function sample(subs, parse, previous=[], random=Math.random){
    if(!subs.length || subs.length>20)throw new Error('Latihan bab membutuhkan 1–20 subbab.');
    const pools=subs.map(s=>{
      const bank=parse(s.soal_json);
      if(!bank?.soal.length)throw new Error('Lengkapi soal subbab: '+s.judul);
      return {id:s.id_subbab,title:s.judul,questions:bank.soal.map(q=>({...q,source_key:JSON.stringify([s.id_subbab,q.id]),source_title:s.judul,bacaan:[bank.bacaan,q.bacaan].filter(Boolean).join('\n\n')}))};
    });
    if(pools.reduce((n,p)=>n+p.questions.length,0)<20)throw new Error('Bank soal bab belum mencapai 20 soal. Lengkapi soal pada subbab terlebih dahulu.');
    let selected=[];
    const signature=a=>a.map(q=>q.source_key).sort().join('|');
    for(let attempt=0;attempt<8;attempt++){
      const queues=shuffle(pools,random).map(p=>shuffle(p.questions,random));
      selected=[];
      while(selected.length<20)for(const q of queues){if(q.length && selected.length<20)selected.push(q.pop());}
      if(signature(selected)!==signature(previous))break;
    }
    if(signature(selected)===signature(previous)){
      const keys=new Set(selected.map(q=>q.source_key));
      for(const pool of pools){
        const alternative=pool.questions.find(q=>!keys.has(q.source_key));
        const index=selected.findIndex(q=>pool.questions.some(p=>p.source_key===q.source_key));
        if(alternative&&index>=0){selected[index]=alternative;break;}
      }
    }
    return shuffle(selected,random).map((q,i)=>({...q,id:String(i+1)}));
  }
  const cache=new Map();
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function item(chapter,subs,user,fresh=false){
    const key='huma-chapter:'+user+':'+chapter.id_bab;
    const source=JSON.stringify(subs.map(s=>[s.id_subbab,s.judul,s.soal_json]));
    let old=cache.get(key);
    if(!old){try{old=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}}
    if(!fresh&&old?.source===source){cache.set(key,old);return old.item;}
    const questions=sample(subs,root.HumaLessonQuizCore.parse,old?.item?.quiz_bank?.soal||[]);
    const bank={tipe:"bab",judul:'Latihan Akhir '+chapter.nama,petunjuk:'20 soal acak dari seluruh subbab. Pembagian dibuat semerata mungkin; selisih jumlah maksimal satu soal jika bank setiap subbab mencukupi. Setiap percobaan baru mengacak pilihan soal dan urutannya.',soal:questions};
    const value={source,item:{id_subbab:'chapter:'+chapter.id_bab,soal_json:JSON.stringify(bank),quiz_bank:bank}};
    cache.set(key,value);try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}
    return value.item;
  }
  function html(chapter,subs,user){
    try{return '<a class="text-link" href="#bab/'+encodeURIComponent(chapter.id_bab)+'">← Kembali ke bab</a>'+root.HumaLessonPractice.html(item(chapter,subs,user),user);}
    catch(e){return '<section class="paper"><h2>Latihan bab belum tersedia</h2><p>'+escape(e.message)+'</p></section>';}
  }
  function mount(container,chapter,subs,user,rerender){
    if(!container.querySelector('#lesson-quiz'))return;
    root.HumaLessonPractice.mount(container,item(chapter,subs,user),user,()=>{item(chapter,subs,user,true);rerender();});
  }
  const api={sample,html,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.HumaChapterPractice=api;
})(typeof window!=='undefined'?window:globalThis);
