(() => {
  const css = `
    [role="listbox"]{z-index:10050!important;max-height:min(280px,45vh)!important;overflow:auto!important}
    [role="option"]{scroll-margin:6px}
    .sjs-dropdown-focus{outline:2px solid #3F7FE8!important;outline-offset:-2px;background:#EAF2FF!important}
    .sjs-responsive-table{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
    @media(max-width:899px){table{min-width:620px}.sjs-responsive-table{margin-right:-2px}.sjs-responsive-table table{min-width:620px}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  // Keyboard navigation for accessible custom dropdowns already rendered by React.
  // ArrowUp/ArrowDown changes the highlighted option, Enter selects it, Escape closes it.
  document.addEventListener('keydown',e=>{
    const input=e.target?.closest?.('input,[role="combobox"]');
    if(!input)return;
    const id=input.getAttribute('aria-controls');
    const box=(id&&document.getElementById(id))||input.parentElement?.querySelector('[role="listbox"]');
    if(!box)return;
    const opts=[...box.querySelectorAll('[role="option"]')].filter(x=>x.offsetParent!==null);
    if(!opts.length)return;
    let idx=opts.findIndex(x=>x.classList.contains('sjs-dropdown-focus'));
    if(idx<0)idx=opts.findIndex(x=>x.getAttribute('aria-selected')==='true');
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();
      idx=(idx+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length;
      opts.forEach(x=>x.classList.remove('sjs-dropdown-focus'));
      opts[idx].classList.add('sjs-dropdown-focus');
      opts[idx].scrollIntoView({block:'nearest'});
    }else if(e.key==='Enter'&&idx>=0){
      e.preventDefault();
      opts[idx].click();
    }else if(e.key==='Escape'){
      input.blur();
    }
  },true);

  // Keep long data tables inside their page instead of creating clipped/off-screen content.
  function wrapTables(){
    document.querySelectorAll('table').forEach(table=>{
      if(table.parentElement?.classList.contains('sjs-responsive-table'))return;
      const wrap=document.createElement('div');wrap.className='sjs-responsive-table';
      table.parentNode.insertBefore(wrap,table);wrap.appendChild(table);
    });
  }
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(wrapTables,60)});
  observer.observe(document.body,{subtree:true,childList:true});
  setTimeout(wrapTables,400);
})();
