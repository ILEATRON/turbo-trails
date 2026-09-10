(function(root){
'use strict';
const tracks=[
{name:'Palm Bay',sky:'#8dd5e9',ground:'#51a886',road:'#405365',edge:'#fff1c4',points:[[270,155],[560,125],[890,165],[1030,320],[910,500],[720,580],[460,560],[200,590],[130,410],[175,260]]},
{name:'Sunset Mesa',sky:'#efb0a0',ground:'#bc7655',road:'#665967',edge:'#ffd99c',points:[[260,150],[560,145],[915,140],[1020,300],[820,365],[985,560],[690,610],[505,435],[265,580],[130,425],[165,265]]},
{name:'Midnight Loop',sky:'#16243f',ground:'#293c53',road:'#414f6b',edge:'#bca3ff',points:[[230,175],[510,130],[900,155],[1030,310],[900,555],[670,590],[635,385],[440,380],[425,595],[170,540],[120,330]]}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),diff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function circuit(index){const config=tracks[index]||tracks[0],p=config.points,path=[];let length=0;for(let i=0;i<p.length;i++)for(let j=0;j<24;j++){let t=j/24,a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length],d=p[(i+2)%p.length];const v=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);path.push({x:v(0),y:v(1)});}for(let i=0;i<path.length;i++){let a=path[i],b=path[(i+1)%path.length];a.s=length;a.len=Math.hypot(b.x-a.x,b.y-a.y);a.angle=Math.atan2(b.y-a.y,b.x-a.x);length+=a.len;}return{...config,path,length};}
function sample(t,s,lane=0){s=(s%t.length+t.length)%t.length;let i=t.path.findIndex((a,i)=>s>=a.s&&(i===t.path.length-1||s<t.path[i+1].s)),a=t.path[i],b=t.path[(i+1)%t.path.length],f=(s-a.s)/a.len;return{x:a.x+(b.x-a.x)*f-Math.sin(a.angle)*lane,y:a.y+(b.y-a.y)*f+Math.cos(a.angle)*lane,angle:a.angle};}
function nearest(t,x,y){let best={distance:Infinity,s:0};for(let i=0;i<t.path.length;i++){const a=t.path[i],b=t.path[(i+1)%t.path.length],dx=b.x-a.x,dy=b.y-a.y,f=clamp(((x-a.x)*dx+(y-a.y)*dy)/(a.len*a.len),0,1),distance=Math.hypot(x-a.x-dx*f,y-a.y-dy*f);if(distance<best.distance)best={distance,s:a.s+f*a.len};}return best;}
const colors=['#b9ff66','#ff779a','#68dcff','#ffce63','#b6a0ff','#f4f5e8'];
function racer(t,id,name,i,bot=false){const total=-25-i*25;return{...sample(t,total,(i%2?1:-1)*17),id,name,color:colors[i%6],bot,total,s:(total%t.length+t.length)%t.length,speed:0,boost:0,shield:0,stun:0,drift:0,item:null,finish:null,penalty:0,offTime:0,resetNotice:0,safe:total,padCool:0,hitCool:0,input:{},lane:(i%3-1)*20};}
function create(index=0,difficulty=1){return{track:index,difficulty,elapsed:0,countdown:3,phase:'lobby',racers:[],boxes:[0,0,0,0]};}
function start(g,t){g.racers=g.racers.map((r,i)=>({...racer(t,r.id,r.name,i,r.bot),color:r.color}));g.elapsed=0;g.countdown=3;g.boxes=[0,0,0,0];g.phase='countdown';}
function use(g,r){if(!r.item||g.phase!=='race'||r.finish!==null)return;const item=r.item;r.item=null;if(item==='Boost')r.boost=2.2;if(item==='Shield')r.shield=6;if(item==='Pulse'){const target=g.racers.filter(a=>a.id!==r.id&&a.total>r.total&&a.total-r.total<650&&a.finish===null).sort((a,b)=>a.total-b.total)[0];if(target&&!target.shield)target.stun=2;}}
function reset(t,r){r.total=r.safe;Object.assign(r,sample(t,r.safe));r.s=(r.safe%t.length+t.length)%t.length;r.speed=0;r.boost=0;r.drift=0;r.penalty+=3;r.offTime=0;r.resetNotice=2.5;}
function step(g,t,dt){if(g.phase==='countdown'){g.countdown-=dt;if(g.countdown<=0)g.phase='race';return;}if(g.phase!=='race')return;g.elapsed+=dt;g.boxes=g.boxes.map(b=>Math.max(0,b-dt));
for(const r of g.racers){if(r.finish!==null)continue;for(const k of ['boost','shield','stun','padCool','hitCool','resetNotice'])r[k]=Math.max(0,r[k]-dt);let n=nearest(t,r.x,r.y),off=n.distance>46,input=r.input||{},steer=clamp(Number(input.steer)||0,-1,1),gas=!!input.gas,brake=!!input.brake;
if(r.bot){gas=true;const aim=sample(t,r.s+70+r.speed*.12,r.lane);steer=clamp(diff(Math.atan2(aim.y-r.y,aim.x-r.x),r.angle)*2.8,-1,1);}
if(input.item){use(g,r);input.item=false;}
if(off){r.offTime+=dt;r.boost=0;r.drift=0;}else{r.offTime=0;}
if(n.distance>110||r.offTime>2.5){reset(t,r);continue;}
let max=r.bot?188+g.difficulty*18:240;if(off)max=60;if(r.boost>0)max*=1.5;if(r.stun>0)max*=.25;
r.speed=clamp(r.speed+(gas?130:-95)*dt-(brake?255*dt:0),0,365);if(r.speed>max)r.speed=Math.max(max,r.speed-(off?550:220)*dt);
const drifting=input.drift&&Math.abs(steer)>.1&&r.speed>90&&!off;r.angle+=steer*(drifting?2.7:2.15)*clamp(r.speed/95,0,1)*dt;
if(drifting)r.drift=Math.min(1.3,r.drift+dt);else{if(r.drift>=1)r.boost=1.1;r.drift=0;}
r.x+=Math.cos(r.angle)*r.speed*dt;r.y+=Math.sin(r.angle)*r.speed*dt;const fresh=nearest(t,r.x,r.y);let delta=fresh.s-r.s;if(delta>t.length/2)delta-=t.length;if(delta<-t.length/2)delta+=t.length;
// Ignore discontinuous progress and restore the last on-road checkpoint on recovery.
if(n.distance<=52&&fresh.distance<=52&&Math.abs(delta)<r.speed*dt+15){r.total+=delta;if(fresh.distance<=46)r.safe=r.total;}r.s=fresh.s;
for(const f of [.25,.68]){let p=sample(t,t.length*f);if(!r.padCool&&!off&&Math.hypot(r.x-p.x,r.y-p.y)<30){r.boost=1;r.padCool=2;}}
for(let i=0;i<4;i++){let p=sample(t,t.length*[.15,.36,.58,.8][i]);if(!r.item&&!g.boxes[i]&&Math.hypot(r.x-p.x,r.y-p.y)<30){r.item=['Boost','Shield','Pulse'][Math.floor(Math.random()*3)];g.boxes[i]=4;}}
if(r.bot&&r.item&&Math.random()<dt*.7)use(g,r);
if(r.total>=t.length*3)r.finish=g.elapsed+r.penalty;
}
for(let i=0;i<g.racers.length;i++)for(let j=i+1;j<g.racers.length;j++){const a=g.racers[i],b=g.racers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<21&&a.finish===null&&b.finish===null){let push=(21-d)/2;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;if(!a.hitCool&&!b.hitCool){if(!a.shield)a.speed*=.8;if(!b.shield)b.speed*=.8;a.hitCool=b.hitCool=.6;}}}
if(g.racers.every(r=>r.finish!==null)||g.elapsed>600)g.phase='finished';}
function order(g){return [...g.racers].sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:a.finish!==null?-1:b.finish!==null?1:b.total-a.total);}
const api={tracks,circuit,sample,nearest,racer,create,start,step,use,reset,order,colors};if(typeof module!=='undefined')module.exports=api;root.RaceSim=api;
})(typeof globalThis!=='undefined'?globalThis:this);
