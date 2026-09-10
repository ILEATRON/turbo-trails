'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),S=require('./sim.js');
const circuits=S.tracks.map((_,i)=>S.circuit(i));
function createServer(){
const rooms=new Map(),limits=new Map();
const send=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
const view=room=>({code:room.code,host:room.host,game:{...room.game,racers:room.game.racers.map(({input,...r})=>r)}});
function leave(room,id){room.members.delete(id);if(room.game.phase==='lobby'){room.game.racers=room.game.racers.filter(r=>r.id!==id);}else{const r=room.game.racers.find(r=>r.id===id);if(r){r.bot=true;r.name+=' (AI)';r.input={};}}if(room.host===id)room.host=room.members.keys().next().value;if(!room.members.size)rooms.delete(room.code);}
const server=http.createServer(async(req,res)=>{
let url;try{url=new URL(req.url,'http://localhost');}catch{return send(res,400,{error:'Invalid URL'});}
if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{ok:true});
if(url.pathname==='/api'){
if(req.method!=='POST')return send(res,405,{error:'Use POST'});
if(req.headers.origin&&req.headers.origin!==`https://${req.headers.host}`&&req.headers.origin!==`http://${req.headers.host}`)return send(res,403,{error:'Origin not allowed'});
let body='';try{for await(const chunk of req){body+=chunk;if(body.length>4096){send(res,413,{error:'Request too large'});req.destroy();return;}}const b=JSON.parse(body),action=b.action;
if(action==='create'||action==='join'){
const ip=req.socket.remoteAddress,now=Date.now(),limit=limits.get(ip)||{count:0,until:now+60000};if(now>limit.until){limit.count=0;limit.until=now+60000;}limits.set(ip,limit);if(++limit.count>30)return send(res,429,{error:'Please wait a minute before making more rooms.'});
}
let room;
if(action==='create'){if(rooms.size>=100)return send(res,503,{error:'Server full. Try again shortly.'});let code;do{code=crypto.randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));room={code,host:null,members:new Map(),game:S.create(Number.isInteger(b.track)&&b.track>=0&&b.track<3?b.track:0,1),created:Date.now()};rooms.set(code,room);}else room=rooms.get(String(b.code||'').toUpperCase());
if(!room)return send(res,404,{error:'Room not found. Ask your friend for a new code.'});
if(action==='create'||action==='join'){
if(room.game.phase!=='lobby')return send(res,409,{error:'This race already started. Join the next room.'});if(room.members.size>=6)return send(res,409,{error:'Room is full (6 players).'});
const id=crypto.randomBytes(8).toString('hex'),token=crypto.randomBytes(24).toString('hex');room.members.set(id,{token,seen:Date.now()});room.host??=id;const name=String(b.name||'Racer').replace(/[\x00-\x1f]/g,'').trim().slice(0,18)||'Racer';room.game.racers.push(S.racer(circuits[room.game.track],id,name,room.game.racers.length));return send(res,200,{...view(room),id,token});
}
const member=room.members.get(b.id);if(!member||typeof b.token!=='string'||member.token!==b.token)return send(res,403,{error:'Session expired. Join a new room.'});member.seen=Date.now();
if(action==='leave'){leave(room,b.id);return send(res,200,{ok:true});}
if(action==='start'){
if(room.host!==b.id)return send(res,403,{error:'Only the host can start.'});if(room.game.phase!=='lobby')return send(res,409,{error:'Race already started.'});
while(room.game.racers.length<6){const i=room.game.racers.length;room.game.racers.push(S.racer(circuits[room.game.track],'bot'+i,['Pip','Nova','Mango','Violet','Ghost','Bolt'][i],i,true));}S.start(room.game,circuits[room.game.track]);
}else if(action==='sync'){
const r=room.game.racers.find(r=>r.id===b.id),input=b.input||{};if(r)r.input={gas:input.gas===true,brake:input.brake===true,steer:Number.isFinite(input.steer)?Math.max(-1,Math.min(1,input.steer)):0,drift:input.drift===true,item:input.item===true||(r.input&&r.input.item===true)};
}else return send(res,400,{error:'Unknown action'});
return send(res,200,view(room));
}catch{return send(res,400,{error:'Invalid request'});}
}
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/game.js':'game.js','/sim.js':'sim.js'};const file=files[url.pathname];if(!file||!['GET','HEAD'].includes(req.method)){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript');res.setHeader('X-Content-Type-Options','nosniff');if(req.method==='HEAD')return res.end();fs.createReadStream(path.join(__dirname,file)).pipe(res);
});
let last=performance.now();const timer=setInterval(()=>{const now=performance.now(),dt=Math.min((now-last)/1000,.1);last=now;for(const room of rooms.values()){
for(const [id,m]of room.members){if(Date.now()-m.seen>30000){leave(room,id);continue;}if(Date.now()-m.seen>1500){const r=room.game.racers.find(r=>r.id===id);if(r)r.input={};}}
S.step(room.game,circuits[room.game.track],dt);if(Date.now()-room.created>7200000)rooms.delete(room.code);
}for(const [ip,l]of limits)if(Date.now()>l.until)limits.delete(ip);},1000/30);timer.unref();server.on('close',()=>clearInterval(timer));return server;
}
if(require.main===module)createServer().listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Turbo Trails 3D is ready'));
module.exports={createServer};
