/* Shared canvas chat UI + hourly 2-minute anomaly */
(function(){
  const c = document.getElementById('canvas');
  const ctx = c ? c.getContext('2d') : null;
  const input = document.getElementById('input');
  const send  = document.getElementById('send');

  const BOT = window.BOT || { name:"Veyra", preface:"You are Veyra…", max:200 };

  let lines = [
    `${BOT.name}: The page remembers more than we do.`,
  ];

  function fit(){
    if(!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio||1);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = Math.floor(w*dpr); c.height = Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.font = '18px "Courier New", Courier, monospace';
    ctx.textBaseline = 'top';
  }
  if (ctx){ window.addEventListener('resize', fit); requestAnimationFrame(fit); }

  function render(){
    if(!ctx) return;
    ctx.clearRect(0,0,c.width,c.height);
    const lh = 30, pad = 22, baseY = 36;
    const vis = Math.max(1, Math.floor((c.height/(window.devicePixelRatio||1)-20)/lh));
    const slice = lines.slice(-vis);
    slice.forEach((t,i)=>{
      const age = (slice.length-1-i)/Math.max(1,slice.length-1);
      const alpha = 1 - age*0.3;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur=4; ctx.shadowOffsetX=1; ctx.shadowOffsetY=1;
      ctx.fillStyle = '#e6d7c3';
      ctx.fillText(t, pad, baseY + i*lh);
    });
    ctx.globalAlpha = 1;
    // random ⟳ glyphs
    if (Math.random()<0.004){
      const x = Math.random()*c.width/(window.devicePixelRatio||1);
      const y = Math.random()*c.height/(window.devicePixelRatio||1);
      ctx.globalAlpha=.15; ctx.fillStyle='#c9a961'; ctx.font='20px "Courier New", Courier, monospace';
      ctx.fillText('⟳', x, y); ctx.font='18px "Courier New", Courier, monospace'; ctx.globalAlpha=1;
    }
    requestAnimationFrame(render);
  }
  if (ctx) render();

  function append(text, who='You'){
    text.split(/\n+/).forEach(part=>{
      if (part.trim()) lines.push(`${who}: ${part.trim()}`);
    });
  }

  async function sendMsg(msg){
    if (!window.Poe || !window.Poe.sendUserMessage){
      append("⚠ Archive offline. The Codex will answer later.", "System");
      return;
    }
    send.disabled = true;
    append(msg,'You');
    let full = '';
    window.Poe.registerHandler(({text,is_finished})=>{
      if (text) full = text;
      if (is_finished){ append(full||'[silence]', BOT.name); send.disabled = false; }
    });
    const prompt = `${BOT.preface}\nUser: ${msg}\n${BOT.name}:`;
    window.Poe.sendUserMessage(prompt);
  }

  if (send && input){
    send.addEventListener('click', ()=>{
      const v=input.value.trim(); if(!v) return; input.value=''; sendMsg(v);
    });
    input.addEventListener('keydown', e=>{
      if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send.click(); }
    });
  }

  /* Hourly 2-minute anomaly window */
  let start=null; const WINDOW=2*60*1000;
  function pick(){ const n=new Date(); const hour=new Date(n); hour.setMinutes(0,0,0);
    start=new Date(hour.getTime()+Math.floor(Math.random()*60)*60000 + Math.floor(Math.random()*60)*1000); }
  function check(){
    const now=new Date();
    if(!start || now.getHours()!==start.getHours()) pick();
    const active = now - start >= 0 && now - start < WINDOW;
    document.body.classList.toggle('anomaly', active);
    // subtle effects during anomaly
    if (active && Math.random()<0.08) lines.push(`${BOT.name}: It moved when you looked away.`);
  }
  pick(); setInterval(check,1000);
})();
