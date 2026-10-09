// Audio original generado en el navegador (Web Audio): sin archivos ni derechos de autor.
// Si existe audio/musica.mp3 se usa como música de fondo en lugar de la generada.
(function(){
  const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
  let ac=null,master=null,mg=null,muted=LS('mute')==='1',musicOn=false,timer=null,step=0,nextT=0,fileAudio=null,fileChecked=false;
  const N={C2:65.41,F2:87.31,G2:98,A2:110,C3:130.81,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880};
  function ctx(){
    if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
      ac=new C();master=ac.createGain();master.gain.value=muted?0:.9;master.connect(ac.destination);
      mg=ac.createGain();mg.gain.value=.3;mg.connect(master)}
    if(ac.state==='suspended')ac.resume();return ac}
  function tone(f,t,d,type='sine',v=.3,dest){const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+.05)}
  function sweep(f1,f2,t,d,type='sine',v=.3){const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05)}
  function noise(t,d,v,f,type='bandpass',dest,f2){const a=ctx();if(!a)return;const n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);
    for(let i=0;i<n;i++)x[i]=Math.random()*2-1;
    const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+d);
    const g=a.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(dest||master);s.start(t);s.stop(t+d+.05)}
  // Música: progresión C – G – Am – F, marimba suave y bajo
  const CH=[{r:N.C3,t:[N.C4,N.E4,N.G4,N.C5]},{r:N.G2,t:[N.B3,N.D4,N.G4,N.B4]},{r:N.A2,t:[N.A3,N.C4,N.E4,N.A4]},{r:N.F2,t:[N.A3,N.C4,N.F4,N.A4]}];
  const PAT=[0,1,2,3,2,1,2,1];
  function sched(){
    const a=ac;if(!a||!musicOn)return;const E=.3;
    while(nextT<a.currentTime+.6){
      const bar=Math.floor(step/8)%4,k=step%8,c=CH[bar];
      let t=nextT;
      const note=c.t[PAT[k]]*(bar%2&&k>=4?2:1);
      tone(note,t,.5,'triangle',.22,mg);tone(note*2,t,.18,'sine',.06,mg);
      if(k===0||k===4)tone(c.r,t,.7,'sine',.34,mg);
      if(k%2===1)noise(t,.05,.05,6000,'highpass',mg);
      step++;nextT+=E}
  }
  function startFile(){if(!fileAudio)return false;fileAudio.volume=muted?0:.6;fileAudio.play().catch(()=>{});return true}
  function btn(){
    if(document.getElementById('sfxbtn'))return;
    const b=document.createElement('button');b.id='sfxbtn';
    b.style.cssText='position:fixed;top:10px;right:10px;z-index:99;width:46px;height:46px;border-radius:50%;border:0;background:#0007;color:#fff;font-size:22px;cursor:pointer';
    const set=()=>{b.textContent=muted?'🔇':'🔊';b.setAttribute('aria-label',muted?'Activar sonido':'Silenciar')};set();
    b.onclick=e=>{e.stopPropagation();muted=!muted;LS('mute',muted?'1':'0');if(master)master.gain.value=muted?0:.9;if(fileAudio)fileAudio.volume=muted?0:.6;set()};
    document.body.appendChild(b)}
  window.SFX={
    init(){ctx();btn();
      if(!fileChecked){fileChecked=true;fetch('audio/musica.mp3',{method:'HEAD'}).then(r=>{if(r.ok){fileAudio=new Audio('audio/musica.mp3');fileAudio.loop=true;if(musicOn)startFile()}}).catch(()=>{})}},
    music(on){const a=ctx();musicOn=on;
      if(on){if(startFile())return;if(!a)return;nextT=a.currentTime+.1;step=0;clearInterval(timer);timer=setInterval(sched,120)}
      else{clearInterval(timer);if(fileAudio)fileAudio.pause()}},
    tick(n){const a=ctx();if(!a)return;const t=a.currentTime;
      if(n>0)tone([0,659,587,523][n],t,.3,'sine',.4);
      else{noise(t,.05,.5,3000,'highpass');tone(1200,t,.08,'square',.12);noise(t+.07,.08,.35,1500,'highpass')}},
    clap(){const a=ctx();if(!a)return;const t=a.currentTime;noise(t,.09,.6,1800);noise(t+.03,.12,.5,2200)},
    kiss(){const a=ctx();if(!a)return;const t=a.currentTime;sweep(700,1500,t,.07,'sine',.35);noise(t+.07,.04,.25,2500,'highpass')},
    boing(){const a=ctx();if(!a)return;sweep(180,520,a.currentTime,.28,'sine',.4)},
    whoosh(){const a=ctx();if(!a)return;noise(a.currentTime,.5,.35,300,'lowpass',null,3000)},
    sparkle(){const a=ctx();if(!a)return;const t=a.currentTime;[1318,1568,2093].forEach((f,i)=>tone(f,t+i*.06,.25,'triangle',.18))},
    hug(){const a=ctx();if(!a)return;const t=a.currentTime;[N.C4,N.E4,N.G4].forEach(f=>tone(f,t,1.1,'sine',.18))},
    hello(){const a=ctx();if(!a)return;const t=a.currentTime;tone(N.G4,t,.2,'triangle',.3);tone(N.C5,t+.15,.3,'triangle',.3)},
    flex(){const a=ctx();if(!a)return;sweep(110,260,a.currentTime,.35,'sawtooth',.18)},
    start(){const a=ctx();if(!a)return;const t=a.currentTime;[N.C4,N.E4,N.G4,N.C5].forEach((f,i)=>tone(f,t+i*.09,.3,'triangle',.25))},
    done(){const a=ctx();if(!a)return;const t=a.currentTime;[N.C5,N.E5,N.G5,N.C5*2].forEach((f,i)=>tone(f,t+i*.1,.45,'triangle',.28))}
  };
  document.addEventListener('DOMContentLoaded',btn);
})();
