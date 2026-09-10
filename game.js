'use strict';
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const TAU = Math.PI * 2, keys = new Set();
const tracks = [
  {name:'Palm Bay',ground:'#52a995',edge:'#e9d9a1',road:'#45596b',line:'#91a0a7',points:[[270,155],[560,125],[890,165],[1030,320],[910,500],[720,580],[460,560],[200,590],[130,410],[175,260]]},
  {name:'Sunset Mesa',ground:'#bf795d',edge:'#f2c58d',road:'#695a64',line:'#bca1a4',points:[[260,150],[560,145],[915,140],[1020,300],[820,365],[985,560],[690,610],[505,435],[265,580],[130,425],[165,265]]},
  {name:'Midnight Loop',ground:'#25364f',edge:'#596081',road:'#39475f',line:'#8496b9',points:[[230,175],[510,130],[900,155],[1030,310],[900,555],[670,590],[635,385],[440,380],[425,595],[170,540],[120,330]]}
];
let track, path=[], length=0, racers=[], boxes=[], pads=[], particles=[], state='menu', countdown=3, elapsed=0, last=0, toastTime=0, selected=0, sound=false, audio;
const player=()=>racers[0];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function makePath(index){
  track=tracks[index]; path=[]; length=0;
  const p=track.points;
  for(let i=0;i<p.length;i++)for(let j=0;j<32;j++){
    const t=j/32,t2=t*t,t3=t2*t,a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length],d=p[(i+2)%p.length];
    const v=k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3);
    path.push({x:v(0),y:v(1),s:0});
  }
  for(let i=0;i<path.length;i++){const a=path[i],b=path[(i+1)%path.length];a.s=length;a.len=Math.hypot(b.x-a.x,b.y-a.y);a.angle=Math.atan2(b.y-a.y,b.x-a.x);length+=a.len;}
}
function sample(s,offset=0){s=((s%length)+length)%length;let a=path.find((p,i)=>s>=p.s&&(i===path.length-1||s<path[i+1].s))||path[0];const f=(s-a.s)/a.len,b=path[(path.indexOf(a)+1)%path.length];return{x:a.x+(b.x-a.x)*f-Math.sin(a.angle)*offset,y:a.y+(b.y-a.y)*f+Math.cos(a.angle)*offset,angle:a.angle};}
function nearest(x,y){let best={distance:Infinity,s:0};for(let i=0;i<path.length;i++){const a=path[i],b=path[(i+1)%path.length],dx=b.x-a.x,dy=b.y-a.y,t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(a.len*a.len),0,1),dist=Math.hypot(x-a.x-dx*t,y-a.y-dy*t);if(dist<best.distance)best={distance:dist,s:a.s+t*a.len};}return best;}
function setup(){selected=+$('track').value;makePath(selected);elapsed=0;countdown=3;particles=[];boxes=[.15,.36,.58,.8].map(f=>({...sample(length*f),cool:0}));pads=[.25,.68].map(f=>({...sample(length*f),s:length*f}));const colors=[$('color').value,'#ff779a','#68dcff','#ffce63','#b6a0ff','#f4f5e8'];racers=colors.map((color,i)=>{let s=-i*24;return{...sample(s,(i%2?1:-1)*16),s,total:s,start:s,speed:0,color,name:['You','Pip','Nova','Mango','Violet','Ghost'][i],boost:0,stun:0,shield:0,drift:0,item:null,finish:null,padCool:0,hitCool:0,lane:(i%3-1)*22};});updateBest();updateHUD();}
function beep(freq=440,duration=.08){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function announce(text,duration=1.5){$('toast').textContent=text;toastTime=duration;}
function format(t){return Math.floor(t/60)+':'+(t%60).toFixed(1).padStart(4,'0');}
function bestKey(){return 'turbo-trails-best-'+selected+'-'+$('difficulty').value;}
function updateBest(){try{const best=localStorage.getItem(bestKey());$('best').textContent=best?'PERSONAL BEST · '+format(+best):'A fresh track. Set your first personal best.';}catch{$('best').textContent='';}}
function start(){setup();state='countdown';$('menu').hidden=true;$('results').hidden=true;$('paused').hidden=true;keys.clear();announce('3',1);beep(440);}
function pause(){if(state==='race'||state==='countdown'){state=state==='race'?'pausedRace':'pausedCountdown';keys.clear();$('paused').hidden=false;}else if(state.startsWith('paused')){state=state==='pausedRace'?'race':'countdown';$('paused').hidden=true;}}
function menu(){state='menu';keys.clear();$('menu').hidden=false;$('paused').hidden=true;$('results').hidden=true;$('toast').textContent='';setup();}
function useItem(){const p=player();if(state!=='race'||!p.item)return;const item=p.item;p.item=null;if(item==='Boost'){p.boost=2.2;announce('TURBO BOOST!');beep(880);}if(item==='Shield'){p.shield=6;announce('SHIELD UP');beep(660);}if(item==='Pulse'){const targets=racers.slice(1).filter(r=>r.total>p.total&&r.total-p.total<650&&!r.finish).sort((a,b)=>a.total-b.total);if(targets.length){targets[0].stun=2;announce('PULSE HIT · '+targets[0].name);}else announce('PULSE · No rival in range');beep(180,.2);}updateHUD();}
function updateHUD(){const p=player();if(!p)return;const order=[...racers].sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:b.total-a.total);$('position').textContent=(order.indexOf(p)+1)+' / 6';$('lap').textContent=clamp(Math.floor(p.total/length)+1,1,3)+' / 3';$('time').textContent=format(elapsed);$('speed').textContent=Math.round(p.speed*.7);$('item').textContent=p.item||'—';$('drift').style.width=(p.drift/1.3*100)+'%';}
function finish(){state='finished';const p=player();const order=[...racers].sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:b.total-a.total),place=order.indexOf(p)+1;$('resultTitle').textContent=place===1?'You take the gold!':'Finished '+place+(['st','nd','rd'][place-1]||'th')+'!';$('resultTime').textContent=track.name+' · '+format(elapsed);$('standings').replaceChildren(...order.map(r=>{const li=document.createElement('li');li.textContent=r.name+' — '+(r.finish!==null?format(r.finish):'still racing');return li;}));$('results').hidden=false;try{const prev=+localStorage.getItem(bestKey());if(!prev||elapsed<prev)localStorage.setItem(bestKey(),elapsed);}catch{}beep(880,.4);keys.clear();}
function update(dt){
  if(state==='countdown'){const before=Math.ceil(countdown);countdown-=dt;if(countdown<=0){state='race';announce('GO!',1);beep(880,.2);}else if(Math.ceil(countdown)!==before){announce(String(Math.ceil(countdown)),1);beep(440);}return;}
  if(state!=='race')return;elapsed+=dt;toastTime-=dt;if(toastTime<=0)$('toast').textContent='';for(const b of boxes)b.cool=Math.max(0,b.cool-dt);
  for(let i=0;i<racers.length;i++){
    const r=racers[i];if(r.finish!==null)continue;for(const k of ['boost','stun','shield','padCool','hitCool'])r[k]=Math.max(0,r[k]-dt);
    const n=nearest(r.x,r.y),off=n.distance>48;let gas=true,brake=false,steer=0,drifting=false;
    if(i===0){gas=keys.has('w')||keys.has('arrowup');brake=keys.has('s')||keys.has('arrowdown');steer=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);drifting=keys.has('shift')&&steer!==0&&r.speed>90&&!off;}
    else{const aim=sample(r.s+75+r.speed*.16,r.lane);steer=clamp(angleDiff(Math.atan2(aim.y-r.y,aim.x-r.x),r.angle)*2.8,-1,1);}
    let max=i===0?235:187+(+$('difficulty').value)*19+i*2;max*=off?.44:1;if(r.boost>0)max*=1.52;if(r.stun>0)max*=.26;
    r.speed=clamp(r.speed+(gas?125:-85)*dt-(brake?255*dt:0),0,360);if(r.speed>max)r.speed=Math.max(max,r.speed-210*dt);
    r.angle+=steer*(drifting?2.75:2.2)*clamp(r.speed/95,0,1)*dt;
    if(drifting){r.drift=Math.min(1.3,r.drift+dt);if(Math.random()<.5)particles.push({x:r.x,y:r.y,life:.35,color:r.drift>=1?'#b9ff66':'#68dcff'});}else{if(r.drift>=1){r.boost=1.1;if(i===0){announce('DRIFT BOOST',.8);beep(740);}}r.drift=0;}
    r.x=clamp(r.x+Math.cos(r.angle)*r.speed*dt,25,1175);r.y=clamp(r.y+Math.sin(r.angle)*r.speed*dt,25,735);
    const fresh=nearest(r.x,r.y);let delta=fresh.s-r.s;if(delta>length/2)delta-=length;if(delta<-length/2)delta+=length;
    // Only credit continuous movement on the circuit, preventing infield shortcuts.
    if(fresh.distance<75&&n.distance<75&&Math.abs(delta)<r.speed*dt+20)r.total+=delta;r.s=fresh.s;
    for(const pad of pads)if(!r.padCool&&Math.hypot(r.x-pad.x,r.y-pad.y)<32){r.boost=1;r.padCool=2;if(i===0)beep(700);}
    if(i===0)for(const b of boxes)if(!r.item&&b.cool<=0&&Math.hypot(r.x-b.x,r.y-b.y)<31){r.item=['Boost','Shield','Pulse'][Math.floor(Math.random()*3)];b.cool=5;announce(r.item.toUpperCase()+' · SPACE',1.5);beep(950);}
    if(r.total>=3*length){r.finish=elapsed;if(i===0){finish();break;}}
  }
  for(let i=0;i<racers.length;i++)for(let j=i+1;j<racers.length;j++){const a=racers[i],b=racers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<21&&!a.finish&&!b.finish){const push=(21-d)/2;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;if(!a.hitCool&&!b.hitCool){if(!a.shield)a.speed*=.78;if(!b.shield)b.speed*=.78;a.hitCool=b.hitCool=.6;}}}
  particles=particles.filter(p=>(p.life-=dt)>0);updateHUD();
}
function line(width,color,dash=[]){ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.lineJoin='round';ctx.stroke();ctx.setLineDash([]);}
function drawKart(r){ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.angle);if(r.shield>0){ctx.strokeStyle='#80eeff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,23,0,TAU);ctx.stroke();}if(r.boost>0){ctx.fillStyle='#ffcb62';ctx.beginPath();ctx.moveTo(-15,-6);ctx.lineTo(-30-Math.random()*15,0);ctx.lineTo(-15,6);ctx.fill();}ctx.fillStyle='#0004';ctx.fillRect(-12,-9,31,24);ctx.fillStyle='#192332';for(const x of [-10,9])for(const y of [-12,7])ctx.fillRect(x-4,y,9,6);ctx.fillStyle=r.color;ctx.beginPath();ctx.roundRect(-16,-9,33,18,5);ctx.fill();ctx.fillStyle='#22354b';ctx.fillRect(-3,-6,9,12);ctx.fillStyle='#fff4e0';ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();ctx.fillStyle='#ffffffaa';ctx.fillRect(12,-7,3,4);ctx.fillRect(12,3,3,4);ctx.restore();if(r===player()){ctx.fillStyle='#fff';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('YOU',r.x,r.y-23);}}
function draw(){
 ctx.fillStyle=track.ground;ctx.fillRect(0,0,1200,760);
 // Fixed procedural scenery is inexpensive and needs no image downloads.
 for(let i=0;i<65;i++){const x=(i*173+47)%1180,y=(i*137+29)%740;if(nearest(x,y).distance<88)continue;ctx.fillStyle=selected===2?'#354e6b':selected===1?'#a96350':'#389987';ctx.beginPath();ctx.arc(x,y,12+(i%4)*5,0,TAU);ctx.fill();ctx.fillStyle=selected===1?'#dfae79':selected===2?'#68a4b055':'#7ccc9c';ctx.beginPath();ctx.arc(x-4,y-5,9+(i%4)*4,0,TAU);ctx.fill();}
 line(130,'#00000015');line(116,track.edge);line(106,'#f2ede0',[15,15]);line(106,selected===2?'#b096ed':'#ed8b77',[15,15]);line(94,track.road);line(2,track.line,[14,20]);
 ctx.save();const start=sample(0);ctx.translate(start.x,start.y);ctx.rotate(start.angle);for(let x=0;x<3;x++)for(let y=0;y<10;y++){ctx.fillStyle=(x+y)%2?'#eef1dc':'#253448';ctx.fillRect(x*7-10,y*9-45,7,9);}ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#ffffff24';ctx.font='900 42px system-ui';ctx.fillText('TURBO',590,280);ctx.font='800 17px system-ui';ctx.fillText('T R A I L S',590,307);
 for(const p of pads){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#b9ff6644';ctx.fillRect(-23,-30,46,60);ctx.strokeStyle='#caff83';ctx.lineWidth=4;for(let x=-15;x<=15;x+=15){ctx.beginPath();ctx.moveTo(x-5,-20);ctx.lineTo(x+5,0);ctx.lineTo(x-5,20);ctx.stroke();}ctx.restore();}
 for(const b of boxes)if(!b.cool){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.sin(performance.now()/700)*.15);ctx.fillStyle='#c49bff';ctx.strokeStyle='#f2dbff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-13,-13,26,26,6);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 21px system-ui';ctx.fillText('?',0,8);ctx.restore();}
 for(const p of particles){ctx.globalAlpha=p.life/.35;ctx.fillStyle=p.color;ctx.fillRect(p.x-3,p.y-3,6,6);}ctx.globalAlpha=1;for(const r of racers)drawKart(r);
}
function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);draw();requestAnimationFrame(frame);}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName))return;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(!e.repeat){if(k==='p'||k==='escape')pause();if(k===' ')useItem();}keys.add(k);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(state==='race'||state==='countdown')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='race'||state==='countdown'))pause();});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
$('start').onclick=()=>{start();$('start').blur();};$('again').onclick=()=>{start();$('again').blur();};$('pause').onclick=()=>{pause();$('pause').blur();};$('resume').onclick=()=>{pause();$('resume').blur();};$('quit').onclick=menu;$('change').onclick=menu;$('track').onchange=setup;$('color').onchange=setup;$('difficulty').onchange=updateBest;$('touchItem').onclick=()=>{useItem();$('touchItem').blur();};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));beep();$('sound').blur();};
setup();requestAnimationFrame(frame);
