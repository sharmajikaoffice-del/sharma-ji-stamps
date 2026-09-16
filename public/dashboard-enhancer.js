(() => {
  const URL = 'https://dqfaskpnssdosgnluuji.supabase.co';
  const KEY = 'sb_publishable_p7MrqZjsOf5pfZi9aygTWg_gBg-kCl_';
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  let root, overlay, timer, visible = false;
  let state = { entries: [], purchases: [], cash: [], rubbers: [], orders: [] };

  const css = `
    #sjs-modern-dashboard{position:fixed;z-index:9990;background:#F3F6FA;color:#263241;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:auto;inset:0 0 0 210px;padding:24px 28px 34px}
    #sjs-modern-dashboard *{box-sizing:border-box}
    .sjs-wrap{max-width:1420px;margin:0 auto}
    .sjs-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:20px}
    .sjs-kicker{font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#3F7FE8;font-weight:800;margin-bottom:6px}
    .sjs-title{font-size:32px;line-height:1;font-weight:800;letter-spacing:-1px}
    .sjs-sub{font-size:13px;color:#687587;margin-top:8px}
    .sjs-dates{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #D7DEE8;border-radius:14px;padding:10px 12px;box-shadow:0 5px 18px rgba(38,50,65,.05)}
    .sjs-date label{display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#687587;font-weight:800;margin-bottom:4px}
    .sjs-date input{border:0;outline:0;font-size:12px;font-weight:600;color:#263241;background:transparent}
    .sjs-divider{width:1px;height:32px;background:#D7DEE8}
    .sjs-grid5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
    .sjs-card{background:#fff;border:1px solid #D7DEE8;border-radius:16px;box-shadow:0 5px 18px rgba(38,50,65,.05)}
    .sjs-stat{padding:17px 18px;min-height:154px}
    .sjs-icon{width:40px;height:40px;border-radius:12px;background:#EAF2FF;color:#3F7FE8;display:grid;place-items:center;font-size:18px;font-weight:800}
    .sjs-label{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#687587;font-weight:800;margin-top:14px}
    .sjs-value{font-size:26px;font-weight:800;letter-spacing:-.7px;margin-top:4px}
    .sjs-note{font-size:11.5px;color:#687587;margin-top:4px}
    .sjs-main{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.85fr);gap:12px;margin-top:12px}
    .sjs-section{padding:18px}
    .sjs-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px}
    .sjs-section-title{font-size:15px;font-weight:800}
    .sjs-section-sub{font-size:11.5px;color:#687587;margin-top:3px}
    .sjs-pill{font-size:10px;font-weight:800;color:#245FC4;background:#EAF2FF;padding:6px 9px;border-radius:999px;white-space:nowrap}
    .sjs-chart{width:100%;height:210px;display:block}
    .sjs-summary{display:grid;gap:9px}
    .sjs-row{display:flex;justify-content:space-between;align-items:center;padding:12px 13px;background:#F3F6FA;border-radius:11px;font-size:12.5px}
    .sjs-money{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800}
    .sjs-progress{height:8px;border-radius:999px;background:#D7DEE8;overflow:hidden;margin-top:14px}.sjs-progress>i{display:block;height:100%;background:#3F7FE8;border-radius:999px}
    .sjs-bottom{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:12px;margin-top:12px}
    .sjs-list{display:grid}.sjs-item{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #D7DEE8}.sjs-item:first-child{border-top:0}.sjs-item-name{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sjs-item-meta{font-size:9.5px;color:#687587;margin-top:3px}.sjs-bar{height:7px;background:#E8EDF4;border-radius:999px;overflow:hidden;margin-top:6px}.sjs-bar i{display:block;height:100%;background:#3F7FE8;border-radius:999px}.sjs-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}.sjs-mini{padding:18px}.sjs-mini-label{font-size:10px;letter-spacing:1px;color:#687587;font-weight:800}.sjs-mini-value{font-size:28px;font-weight:800;margin-top:6px}.sjs-empty{padding:28px 8px;text-align:center;color:#687587;font-size:12px}
    @media(max-width:899px){#sjs-modern-dashboard{inset:64px 0 66px 0;padding:16px 14px 24px}.sjs-head{align-items:stretch;flex-direction:column;gap:12px}.sjs-title{font-size:27px}.sjs-dates{width:100%}.sjs-date{flex:1;min-width:0}.sjs-date input{width:100%;font-size:11px}.sjs-grid5{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sjs-stat{min-height:132px;padding:14px}.sjs-value{font-size:22px}.sjs-main,.sjs-bottom{grid-template-columns:1fr}.sjs-three{grid-template-columns:1fr}.sjs-chart{height:190px;min-width:560px}.sjs-chart-wrap{overflow-x:auto}.sjs-card{border-radius:14px}}
  `;

  function esc(v){return String(v ?? '').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN');}
  function dateText(d){return d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';}
  async function get(table){const r=await fetch(`${URL}/rest/v1/${table}?select=*`,{headers:H});if(!r.ok)throw new Error(table);return r.json();}
  async function load(){
    try{
      const [entries,purchases,cash,rubbers,orders]=await Promise.all([get('stamp_entries'),get('purchases'),get('cash_manual'),get('rubbers'),get('customer_designs').catch(()=>[])]);
      state={entries,purchases,cash,rubbers,orders};
      render();
    }catch(e){ renderError(); }
  }
  function renderError(){if(!overlay)return;overlay.innerHTML='<div class="sjs-wrap"><div class="sjs-card sjs-section"><b>Dashboard data could not be loaded.</b><div class="sjs-sub">Your existing app is still running normally. Check the Supabase connection if this message remains.</div></div></div>';}
  function inRange(d,a,b){const x=String(d||'').slice(0,10);return x>=a&&x<=b;}
  function render(){
    if(!overlay)return;
    const end=new Date();const start=new Date();start.setDate(start.getDate()-29);
    const oldFrom=overlay.querySelector('#sjs-from')?.value||start.toISOString().slice(0,10);
    const oldTo=overlay.querySelector('#sjs-to')?.value||end.toISOString().slice(0,10);
    const entries=state.entries.filter(e=>inRange(e.date,oldFrom,oldTo));
    const purchases=state.purchases.filter(p=>inRange(p.date,oldFrom,oldTo));
    const cash=state.cash.filter(c=>inRange(c.date,oldFrom,oldTo));
    const sales=entries.reduce((s,e)=>s+Number(e.amount||0),0);
    const purchaseTotal=purchases.reduce((s,p)=>s+Number(p.total??p.amount??(Number(p.qty||0)*Number(p.purchase_rate||0))),0);
    const cashSales=entries.filter(e=>(e.payment_mode||'Cash')==='Cash').reduce((s,e)=>s+Number(e.amount||0),0);
    const bankSales=entries.filter(e=>(e.payment_mode||'Cash')==='Bank').reduce((s,e)=>s+Number(e.amount||0),0);
    const cashPurchases=purchases.filter(p=>(p.payment_mode||'Cash')==='Cash').reduce((s,p)=>s+Number(p.total??p.amount??0),0);
    const bankPurchases=purchases.filter(p=>(p.payment_mode||'Cash')==='Bank').reduce((s,p)=>s+Number(p.total??p.amount??0),0);
    const manualIn=cash.filter(c=>c.type==='in').reduce((s,c)=>s+Number(c.amount||0),0);
    const manualOut=cash.filter(c=>c.type==='out').reduce((s,c)=>s+Number(c.amount||0),0);
    const cashIn=cashSales+manualIn,cashOut=cashPurchases+manualOut,net=cashIn-cashOut;
    const qty=entries.reduce((s,e)=>s+Number(e.qty||1),0);
    const pending=state.orders.filter(o=>!['printed','completed'].includes(o.status||'new')).length;
    const low=state.rubbers.filter(r=>{const pin=state.purchases.filter(p=>p.rubber_id===r.id).reduce((s,p)=>s+Number(p.qty||0),0);const out=state.entries.filter(e=>e.rubber_id===r.id).reduce((s,e)=>s+Number(e.qty||1),0);return Number(r.opening_stock||0)+pin-out<=5}).length;
    const recent=[...entries].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,6);
    const top=state.rubbers.map(r=>({...r,sold:entries.filter(e=>e.rubber_id===r.id).reduce((s,e)=>s+Number(e.qty||1),0)})).filter(r=>r.sold>0).sort((a,b)=>b.sold-a.sold).slice(0,5);
    const max=Math.max(1,...top.map(x=>x.sold));
    const points=[];for(let i=0;i<14;i++){const d=new Date(oldFrom+'T00:00:00');d.setDate(d.getDate()+Math.round(i*29/13));const iso=d.toISOString().slice(0,10);const v=entries.filter(e=>String(e.date||'').slice(0,10)===iso).reduce((s,e)=>s+Number(e.amount||0),0);points.push({iso,label:d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),value:v});}
    const maxChart=Math.max(1,...points.map(x=>x.value));const W=720,Hh=190;const pts=points.map((p,i)=>`${16+i*(W-32)/13},${Hh-28-(p.value/maxChart)*(Hh-54)}`).join(' ');
    overlay.innerHTML=`
      <div class="sjs-wrap">
        <div class="sjs-head"><div><div class="sjs-kicker">Business overview</div><div class="sjs-title">Dashboard</div><div class="sjs-sub">A modern view of stamps, orders, sales and stock.</div></div><div class="sjs-dates"><div class="sjs-date"><label>From</label><input id="sjs-from" type="date" value="${oldFrom}"></div><div class="sjs-divider"></div><div class="sjs-date"><label>To</label><input id="sjs-to" type="date" value="${oldTo}"></div></div></div>
        <div class="sjs-grid5">
          ${stat('✦','Stamps Sold',qty.toLocaleString('en-IN'),`${entries.length} entries`)}
          ${stat('₹','Sales',money(sales),'Stamp sales')}
          ${stat('▣','Purchases',money(purchaseTotal),`${purchases.length} rows`)}
          ${stat('◎','Orders',state.orders.length,`${pending} pending`)}
          ${stat('⚠','Low Stock',low,'Rubbers at 5 or less')}
        </div>
        <div class="sjs-main">
          <div class="sjs-card sjs-section"><div class="sjs-section-head"><div><div class="sjs-section-title">Sales activity</div><div class="sjs-section-sub">Revenue from stamp entries</div></div><span class="sjs-pill">${money(sales)}</span></div><div class="sjs-chart-wrap"><svg class="sjs-chart" viewBox="0 0 ${W} ${Hh}">${[0,1,2,3].map(i=>`<line x1="16" x2="704" y1="${Hh-28-i*((Hh-54)/3)}" y2="${Hh-28-i*((Hh-54)/3)}" stroke="#D7DEE8"/>`).join('')}<polyline points="${pts}" fill="none" stroke="#3F7FE8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map((p,i)=>{const x=16+i*(W-32)/13,y=Hh-28-(p.value/maxChart)*(Hh-54);return `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#3F7FE8" stroke-width="2"/><text x="${x}" y="${Hh-8}" text-anchor="middle" font-size="9" fill="#687587">${p.label}</text>`}).join('')}</svg></div></div>
          <div class="sjs-card sjs-section"><div class="sjs-section-title">Cash summary</div><div class="sjs-section-sub">Selected period</div><div class="sjs-summary" style="margin-top:15px">${summary('Cash In',cashIn,'#2D7A4A')}${summary('Cash Out',cashOut,'#3F7FE8')}${summary('Net Position',net,net>=0?'#2D7A4A':'#C2413A')}</div><div class="sjs-progress"><i style="width:${Math.min(100,cashIn+cashOut?cashIn/(cashIn+cashOut)*100:0)}%"></i></div></div>
        </div>
        <div class="sjs-bottom">
          <div class="sjs-card sjs-section"><div class="sjs-section-head"><div><div class="sjs-section-title">Recent stamp entries</div><div class="sjs-section-sub">Latest activity in this date range</div></div><span class="sjs-pill">${entries.length} total</span></div><div class="sjs-list">${recent.length?recent.map(e=>{const r=state.rubbers.find(x=>x.id===e.rubber_id);return `<div class="sjs-item"><div style="min-width:0"><div class="sjs-item-name">${esc(r?.name||'Stamp')}</div><div class="sjs-item-meta">${dateText(e.date)} · ${esc(e.mobile||'No mobile')} · ${esc(e.payment_mode||'Cash')}</div></div><b class="sjs-money" style="color:#2D7A4A">${money(e.amount)}</b></div>`}).join(''):'<div class="sjs-empty">No stamp entries in this period.</div>'}</div></div>
          <div class="sjs-card sjs-section"><div class="sjs-section-title">Top stamp sizes</div><div class="sjs-section-sub">Most used rubbers</div><div style="margin-top:14px">${top.length?top.map(r=>`<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700"><span>${esc(r.name)}</span><span class="sjs-money">${r.sold}</span></div><div class="sjs-bar"><i style="width:${Math.max(8,r.sold/max*100)}%"></i></div></div>`).join(''):'<div class="sjs-empty">No sales data for this period.</div>'}</div></div>
        </div>
        <div class="sjs-three"><div class="sjs-card sjs-mini"><div class="sjs-mini-label">PENDING ORDERS</div><div class="sjs-mini-value">${pending}</div><div class="sjs-note">Need review / processing</div></div><div class="sjs-card sjs-mini"><div class="sjs-mini-label">LOW STOCK</div><div class="sjs-mini-value">${low}</div><div class="sjs-note">Rubber items at 5 or less</div></div><div class="sjs-card sjs-mini"><div class="sjs-mini-label">PERIOD NET</div><div class="sjs-mini-value" style="color:${net>=0?'#2D7A4A':'#C2413A'}">${money(net)}</div><div class="sjs-note">Sales less purchases and cash out</div></div></div>
      </div>`;
    overlay.querySelector('#sjs-from').addEventListener('change',render);overlay.querySelector('#sjs-to').addEventListener('change',render);
  }
  function stat(icon,label,value,note){return `<div class="sjs-card sjs-stat"><div class="sjs-icon">${icon}</div><div class="sjs-label">${label}</div><div class="sjs-value">${value}</div><div class="sjs-note">${note}</div></div>`}
  function summary(label,value,color){return `<div class="sjs-row"><span>${label}</span><b class="sjs-money" style="color:${color}">${money(value)}</b></div>`}
  function show(){if(visible)return;visible=true;if(!document.getElementById('sjs-modern-style')){const s=document.createElement('style');s.id='sjs-modern-style';s.textContent=css;document.head.appendChild(s)}overlay=document.createElement('div');overlay.id='sjs-modern-dashboard';document.body.appendChild(overlay);load();clearInterval(timer);timer=setInterval(load,30000)}
  function hide(){if(!visible)return;visible=false;clearInterval(timer);timer=null;overlay?.remove();overlay=null}
  function dashboardButton(){return [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Dashboard')}
  function bind(){root=document.getElementById('root');if(!root)return;document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;const t=b.textContent.trim();if(t==='Dashboard')show();else if(['Stamp Entry','Create Stamp','Orders','Register','Stock','Rubber','Purchase','Cash Register','Users','More'].includes(t))hide()});let tries=0;const poll=()=>{if(dashboardButton()&&dashboardButton().getAttribute('data-sjs-bound')!=='1'){dashboardButton().setAttribute('data-sjs-bound','1');show()}if(++tries<120)setTimeout(poll,250)};poll()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
