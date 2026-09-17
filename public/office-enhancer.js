(() => {
  const css = `
    [role="listbox"]{z-index:10050!important;max-height:min(280px,45vh)!important;overflow:auto!important}
    [role="option"]{scroll-margin:6px}
    .sjs-dropdown-focus{outline:2px solid #3F7FE8!important;outline-offset:-2px;background:#EAF2FF!important}
    .sjs-responsive-table{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
    @media(max-width:899px){
      #root table{min-width:0!important}
      #root .sjs-responsive-table{margin-right:-2px}
      #root .sjs-responsive-table table{min-width:0!important}

      /* Stock report: the JSX table has an explicit 720px desktop width.
         On phones remove the desktop colgroup widths and turn each row into
         a full-width readable card. */
      #root table[style*="min-width: 720px"]{
        display:block!important;
        width:100%!important;min-width:0!important;max-width:100%!important;
        table-layout:auto!important;border-collapse:separate!important;border-spacing:0!important;
      }
      #root table[style*="min-width: 720px"] colgroup{display:none!important}
      #root table[style*="min-width: 720px"] thead{display:none!important}
      #root table[style*="min-width: 720px"] tbody{display:block!important;width:100%!important}
      #root table[style*="min-width: 720px"] tbody tr{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 10px;
        width:100%!important;max-width:100%!important;margin:0 0 10px!important;padding:10px!important;
        border:1px solid #e2e8f0!important;border-radius:12px!important;
        background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.04);
      }
      #root table[style*="min-width: 720px"] tbody tr:last-child{margin-bottom:0!important}
      #root table[style*="min-width: 720px"] tbody td{
        display:flex!important;align-items:center;justify-content:space-between;
        min-width:0!important;width:100%!important;padding:8px 2px!important;
        border:0!important;white-space:normal!important;overflow:visible!important;
      }
      #root table[style*="min-width: 720px"] tbody td:first-child{
        grid-column:1/-1!important;padding-bottom:10px!important;
        border-bottom:1px solid #eef2f7!important;margin-bottom:3px;
      }
      #root table[style*="min-width: 720px"] tbody td:nth-child(2)::before{content:"Rate";color:#64748b;font:600 10px/1.2 'IBM Plex Mono',monospace;margin-right:8px}
      #root table[style*="min-width: 720px"] tbody td:nth-child(3)::before{content:"In";color:#64748b;font:600 10px/1.2 'IBM Plex Mono',monospace;margin-right:8px}
      #root table[style*="min-width: 720px"] tbody td:nth-child(4)::before{content:"Out";color:#64748b;font:600 10px/1.2 'IBM Plex Mono',monospace;margin-right:8px}
      #root table[style*="min-width: 720px"] tbody td:nth-child(5)::before{content:"Close";color:#64748b;font:600 10px/1.2 'IBM Plex Mono',monospace;margin-right:8px}
      #root table[style*="min-width: 720px"] tbody td:nth-child(2),
      #root table[style*="min-width: 720px"] tbody td:nth-child(3),
      #root table[style*="min-width: 720px"] tbody td:nth-child(4),
      #root table[style*="min-width: 720px"] tbody td:nth-child(5){text-align:right!important}
    }
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  // Keyboard navigation for accessible custom dropdowns already rendered by React.
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
