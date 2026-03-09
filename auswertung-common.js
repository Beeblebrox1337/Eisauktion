(function(){
  const STORAGE_KEYS = {
    questionnaire: 'eisauktion_questionnaire',
    meta: 'eisauktion_meta',
    roundsU: 'eisauktion_unternehmen_rounds',
    roundsK: 'eisauktion_kaeufer_rounds',
    stateV2: 'eisauktion_state_v2'
  };

  function safeParse(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(_e){
      return fallback;
    }
  }

  function num(v){
    const n = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  function getAllData(){
    const questionnaire = safeParse(STORAGE_KEYS.questionnaire, null);
    const meta = safeParse(STORAGE_KEYS.meta, {});
    const roundsU = safeParse(STORAGE_KEYS.roundsU, []);
    const roundsK = safeParse(STORAGE_KEYS.roundsK, []);
    const stateV2 = safeParse(STORAGE_KEYS.stateV2, {});
    return { questionnaire, meta, roundsU, roundsK, stateV2 };
  }

  function splitRounds(all){
    const round1U = all.roundsU.filter((r)=>Number(r.round) === 1);
    const round1K = all.roundsK.filter((r)=>Number(r.round) === 1);
    const round2U = all.roundsU.filter((r)=>Number(r.round) >= 2);
    const round2K = all.roundsK.filter((r)=>Number(r.round) >= 2);
    return { round1U, round1K, round2U, round2K };
  }

  function aggregateByRound(roundsU, roundsK){
    const map = new Map();
    function ensure(r){
      const key = Number(r);
      if(!map.has(key)){
        map.set(key, {
          round: key,
          planned: 0,
          sold: 0,
          demandQty: 0,
          sellerPrices: [],
          buyerPrices: [],
          buyerSpent: 0,
          sellerProfit: 0,
          successfulSales: 0
        });
      }
      return map.get(key);
    }

    roundsU.forEach((r)=>{
      const a = ensure(r.round);
      a.planned += num(r.planned);
      a.sold += num(r.sold);
      a.sellerProfit += num(r.profit);
      const p = num(r.price);
      if(p > 0) a.sellerPrices.push(p);
      if(num(r.sold) > 0) a.successfulSales += 1;
    });

    roundsK.forEach((r)=>{
      const a = ensure(r.round);
      a.demandQty += num(r.qty != null ? r.qty : r.totalQty);
      a.buyerSpent += num(r.spent);
      const p = num(r.payPrice != null ? r.payPrice : (Array.isArray(r.purchases)&&r.purchases.length ? r.purchases[0].price : 0));
      if(p > 0) a.buyerPrices.push(p);
    });

    return Array.from(map.values()).sort((a,b)=>a.round-b.round).map((r)=>{
      const basePrices = r.sellerPrices.length ? r.sellerPrices : r.buyerPrices;
      const avgPrice = basePrices.length ? basePrices.reduce((s,v)=>s+v,0)/basePrices.length : 0;
      const min = basePrices.length ? Math.min(...basePrices) : 0;
      const max = basePrices.length ? Math.max(...basePrices) : 0;
      return {
        ...r,
        avgPrice,
        priceSpread: max - min,
        excess: r.demandQty - r.planned
      };
    });
  }

  function drawLineChart(canvasId, labels, values, color){
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 600;
    const height = Number(canvas.getAttribute('height') || 260);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const pad = { l: 40, r: 16, t: 16, b: 32 };
    const w = width - pad.l - pad.r;
    const h = height - pad.t - pad.b;
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(pad.l, pad.t, w, h);

    const pts = [];
    for(let i=0;i<labels.length;i++){
      if(Number.isFinite(values[i])) pts.push({ x: labels[i], y: values[i] });
    }
    if(!pts.length){
      ctx.fillStyle = '#64748b';
      ctx.fillText('Keine Daten vorhanden.', pad.l + 8, pad.t + 20);
      return;
    }

    const xs = pts.map((p)=>p.x);
    const ys = pts.map((p)=>p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    const yPad = (yMax - yMin) * 0.15 || 1;
    yMin -= yPad; yMax += yPad;

    const xScale = (x)=> pad.l + ((x - xMin) / (xMax - xMin || 1)) * w;
    const yScale = (y)=> pad.t + (1 - (y - yMin) / (yMax - yMin || 1)) * h;

    ctx.strokeStyle = color || '#1f4e79';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p,i)=>{
      const X = xScale(p.x); const Y = yScale(p.y);
      if(i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
    });
    ctx.stroke();

    ctx.fillStyle = color || '#1f4e79';
    pts.forEach((p)=>{
      ctx.beginPath();
      ctx.arc(xScale(p.x), yScale(p.y), 3.5, 0, Math.PI*2);
      ctx.fill();
    });
  }

  function renderTable(tbodyId, rows, cols){
    const tbody = document.getElementById(tbodyId);
    if(!tbody) return;
    tbody.innerHTML = rows.length ? rows.map((row)=>`<tr>${cols.map((c)=>`<td>${c.render(row)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}">Keine Daten gespeichert.</td></tr>`;
  }

  window.EisAuswertung = {
    STORAGE_KEYS,
    safeParse,
    num,
    getAllData,
    splitRounds,
    aggregateByRound,
    drawLineChart,
    renderTable
  };
})();
