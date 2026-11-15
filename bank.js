/* Mathe-Mission 4, 5.0.0. Independent exercises; no copied IBBW artwork.
   Deterministic task generation and pure marking functions, shared with tests. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
'use strict';
const VERSION = '5.0.0';
const GROUPS = ['Zahlen & Rechnen','Muster & Strategien','Raum & Form','Gr\u00f6\u00dfen & Sachaufgaben','Daten & Zufall'];
const LEVELS = ['Grundlagen','Verkn\u00fcpfen','Knobeln'];
const FAMILIES = [
 ['calc','Plus und Minus',0,0,1],['story','Informationen verrechnen',3,0,2],
 ['neighbors','Nachbarzehner',0,0,3],['operations','Mal und Geteilt',0,0,4],
 ['sequence','Wechselnde Zahlenfolgen',1,1,5],['represent','Darstellungen verstehen',1,1,6],
 ['wallmax','Zahlenmauern optimieren',1,2,7],['place','Stellenwerte b\u00fcndeln',0,0,8],
 ['midpoint','Zahlenmitte',0,0,9],['compensate','Rechenwege verbessern',1,1,10],
 ['fit','Figuren zusammensetzen',2,2,11],['area','Fl\u00e4chen vergleichen',2,0,12],
 ['rotate','W\u00fcrfelfiguren drehen',2,2,13],['axes','Spiegelachsen zeichnen',2,1,14],
 ['view','W\u00fcrfelansichten',2,2,15],['net','W\u00fcrfelnetze erg\u00e4nzen',2,2,16],
 ['shopping','Preise und R\u00fcckgeld',3,1,17],['time','Uhrzeit und Zeitdauer',3,0,18],
 ['estimate','Gr\u00f6\u00dfen einsch\u00e4tzen',3,0,19],['distances','Messen und Vergleichen',3,0,20],
 ['certainty','Sicher, m\u00f6glich, unm\u00f6glich',4,0,21],['chance','Gleiche Gewinnchancen',4,2,22],
 ['chart','Diagramme auswerten',4,1,0],['chartbuild','Diagramme vervollst\u00e4ndigen',4,1,0],
 ['units','Gewichte und F\u00fcllmengen',3,1,0],['combinations','M\u00f6glichkeiten finden',4,2,0],
 ['numberline','Zahlenstrahl lesen',0,1,0],['wallback','Zahlenmauern r\u00fcckw\u00e4rts',1,1,0],
 ['error','Rechenfehler erkl\u00e4ren',1,2,0],['mirror','Spiegelbild erg\u00e4nzen',2,1,0],
 ['perimeter','Umfang am Gitter',2,1,0],['planning','Planen mit Rest',3,2,0]
].map(([id,title,group,level,ref])=>({id,title,group,level,ref}));
const EXAM = FAMILIES.slice(0,22).map(f=>f.id);
function rng(seed) { let s=Number(seed)>>>0; return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}; }
function tools(seed){const r=rng(seed);return {int:(a,b)=>a+Math.floor(r()*(b-a+1)),pick:a=>a[Math.floor(r()*a.length)],shuffle:a=>{a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}};}
const fmt=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:3});
const money=c=>(c/100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const time=t=>`${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg=(body,w=420,h=250,label='Mathematische Darstellung')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const text=(x,y,t,size=20)=>`<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" fill="#24385d" text-anchor="middle">${esc(t)}</text>`;
const rect=(x,y,w,h,fill='#dbe6ff')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#526b9a" stroke-width="1.6"/>`;
const key=c=>c.join(',');
const norm2=c=>{const x=Math.min(...c.map(p=>p[0])),y=Math.min(...c.map(p=>p[1]));return c.map(p=>[p[0]-x,p[1]-y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);};
const key2=c=>norm2(c).map(key).join(';');
function rot2(c,n=1){while(n-->0)c=c.map(([x,y])=>[-y,x]);return norm2(c);}
function canonical2(c,reflect=true){let a=[];for(let i=0;i<4;i++){a.push(key2(rot2(c,i)));if(reflect)a.push(key2(rot2(c.map(([x,y])=>[-x,y]),i)));}return a.sort()[0];}
function connected(c){if(!c.length)return false;let set=new Set(c.map(key)),seen=new Set([key(c[0])]),queue=[c[0]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const p of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(set.has(key(p))&&!seen.has(key(p))){seen.add(key(p));queue.push(p);}}return seen.size===set.size;}
const neg=v=>v.map(x=>-x), eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function isCubeNet(cells){
 if(cells.length!==6||new Set(cells.map(key)).size!==6)return false;
 const set=new Set(cells.map(key)), states=new Map([[key(cells[0]),[[1,0,0],[0,1,0],[0,0,1]]]]),queue=[cells[0]];
 for(let i=0;i<queue.length;i++){
   const [x,y]=queue[i],[u,v,n]=states.get(key(queue[i]));
   const dirs=[[[x+1,y],[neg(n),v,u]],[[x-1,y],[n,v,neg(u)]],[[x,y+1],[u,neg(n),v]],[[x,y-1],[u,n,neg(v)]]];
   for(const [p,s] of dirs){const k=key(p);if(!set.has(k))continue;if(states.has(k)){if(!eq(states.get(k),s))return false;}else{states.set(k,s);queue.push(p);}}
 }
 return states.size===6&&new Set([...states.values()].map(s=>key(s[2]))).size===6;
}
let netLibrary;
function allFreePolyominoes(n){let shapes=[[[0,0]]];for(let size=2;size<=n;size++){const next=new Map();for(const c of shapes){const set=new Set(c.map(key));for(const [x,y] of c)for(const p of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(!set.has(key(p))){const s=c.concat([p]);next.set(canonical2(s),norm2(s));}}shapes=[...next.values()];}return shapes;}
function cubeNets(){if(!netLibrary)netLibrary=allFreePolyominoes(6).filter(isCubeNet);return netLibrary;}
function drawCells(cells,opt={}){
 const c=norm2(cells), w=Math.max(...c.map(c=>c[0]))+1,h=Math.max(...c.map(c=>c[1]))+1,s=34,W=300,H=220;
 const px=(W-w*s)/2,py=(H-h*s)/2;
 const body=c.map(([x,y])=>rect(px+x*s,py+y*s,s,s,opt.fill||'#cedcff')).join('');
 return svg(body,W,H,opt.label||'Figur aus gleich gro\u00dfen Quadraten');
}
function drawPolygon(points,label='Figur',grid=false){let body='';if(grid)for(let k=0;k<=8;k++)body+=`<path d="M${20+k*35} 20V300 M20 ${20+k*35}H300" stroke="#d3dced"/>`;body+=`<polygon points="${points.map(([x,y])=>`${20+x*35},${20+y*35}`).join(' ')}" fill="#dce7ff" fill-opacity=".8" stroke="#3c5790" stroke-width="2.5"/>`;return svg(body,320,320,label);}
function numberLine(a,step,count,mark,hide=true){let b='<path d="M30 75H390" stroke="#526b9a" stroke-width="3"/>';for(let i=0;i<=count;i++){const x=30+i*360/count;b+=`<path d="M${x} 65V85" stroke="#526b9a" stroke-width="2"/>`;if(i===0||i===count)b+=text(x,112,fmt(a+i*step),17);if(i===mark)b+=`<path d="M${x} 25V55 M${x-6} 48L${x} 55L${x+6} 48" stroke="#c0580a" stroke-width="3" fill="none"/>`+text(x,19,hide?'?':fmt(a+i*step),18);}return svg(b,420,135,'Zahlenstrahl mit gleich gro\u00dfen Abschnitten');}
function drawWall(a){let b='';const loc=[[25,136],[145,136],[265,136],[85,76],[205,76],[145,16]];a.forEach((t,i)=>{const [x,y]=loc[i];b+=rect(x,y,110,48)+text(x+55,y+31,t==null?'?':t,23);});return svg(b,400,205,'Zahlenmauer');}
function drawBars(values,names,step=2){const top=Math.ceil(Math.max(...values)/step)*step+step, h=190,w=420;let b='';for(let v=0;v<=top;v+=step){const y=210-v/top*h;b+=`<path d="M48 ${y}H408" stroke="#d2daea"/>`+text(25,y+5,v,15);}values.forEach((n,i)=>{const x=75+i*(320/values.length),barW=Math.min(55,240/values.length);b+=rect(x,210-n/top*h,barW,n/top*h,['#90b6ed','#8dd1ba','#c0b0ea','#ecc08c'][i%4])+text(x+barW/2,236,names[i],16);});return svg(b,w,255,'S\u00e4ulendiagramm; Zahlenachse beachten');}
function drawBalls(total,blue){return `<div class="static-balls" aria-label="${blue} blaue und ${total-blue} rote Kugeln">${Array.from({length:total},(_,i)=>`<span class="ball ${i<blue?'blue':'red'}">${i<blue?'B':'R'}</span>`).join('')}</div>`;}
function norm3(c){const mins=[0,1,2].map(i=>Math.min(...c.map(p=>p[i])));return c.map(p=>p.map((v,i)=>v-mins[i])).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const AXES3=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const ROTATIONS=AXES3.flatMap(u=>AXES3.filter(v=>dot(u,v)===0).map(v=>[u,v,cross(u,v)]));
const rotate3=(c,r)=>norm3(c.map(p=>r.map(row=>dot(row,p))));
const canonical3=c=>ROTATIONS.map(r=>rotate3(c,r).map(key).join(';')).sort()[0];
function cubesFromHeights(h){let c=[];h.forEach((row,y)=>row.forEach((v,x)=>{for(let z=0;z<v;z++)c.push([x,y,z]);}));return c;}
function allCubesVisible(cells){
 return cells.every((c,i)=>[[1,.5,.5],[.5,1,.5],[.5,.5,1]].some(face=>{
  const origin=c.map((v,k)=>v+face[k]+1e-7);
  return !cells.some((other,j)=>{if(i===j)return false;let enter=-Infinity,exit=Infinity;for(let k=0;k<3;k++){enter=Math.max(enter,other[k]-origin[k]);exit=Math.min(exit,other[k]+1-origin[k]);}return exit>Math.max(enter,0)+1e-8;});
 }));
}
function drawCubes(cells,labels=false){
 const c=norm3(cells),set=new Set(c.map(key)),s=25;
 const proj=([x,y,z])=>[(x-y)*s,(x+y)*s*.5-z*s];
 const faces=[];for(const [x,y,z] of c){
 const configs=[[[x+1,y,z],[[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]],'#9fb2d3'],[[x,y+1,z],[[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]],'#c6d7f1'],[[x,y,z+1],[[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]],'#e8effb']];
 for(const [next,vs,col] of configs)if(!set.has(key(next)))faces.push({vs:vs.map(proj),col,depth:vs.reduce((s,p)=>s+p[0]+p[1]+p[2],0)/4});
 }
 const points=faces.flatMap(f=>f.vs),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
 let b=faces.sort((a,b)=>a.depth-b.depth).map(f=>`<polygon points="${f.vs.map(p=>`${p[0]-minX+25},${p[1]-minY+20}`).join(' ')}" fill="${f.col}" stroke="#435778" stroke-width="1.1" stroke-linejoin="round"/>`).join('');
 const w=maxX-minX+50,h=maxY-minY+40;if(labels){b+=text(w-42,h+13,'RECHTS',10)+`<path d="M${w-36} ${h-1}l-26 -13m0 0l11 -1m-11 1l6 10" stroke="#b35a07" stroke-width="2" fill="none"/>`+text(40,h+13,'VORNE',10);}
 return svg(b,w,h+(labels?30:0),'W\u00fcrfelfigur'+(labels?' mit beschrifteter Vorder- und rechter Seite':''));
}
function outlineHeights(a){let cells=[];a.forEach((h,x)=>{for(let y=0;y<h;y++)cells.push([x,Math.max(...a)-1-y]);});return drawCells(cells,{label:'Ansicht des W\u00fcrfelgeb\u00e4udes'});}
function tilings(a,b,w,h){
 const out=[];for(let r=0;r<4;r++){const aa=rot2(a,r);for(let x=0;x<w;x++)for(let y=0;y<h;y++){
 const placed=aa.map(([u,v])=>[u+x,v+y]);if(placed.some(([u,v])=>u>=w||v>=h))continue;
 const occupied=new Set(placed.map(key)),rest=[];for(let u=0;u<w;u++)for(let v=0;v<h;v++)if(!occupied.has(key([u,v])))rest.push([u,v]);
 if(rest.length===b.length&&canonical2(rest,false)===canonical2(b,false))out.push({a:placed,b:rest});}}
 return out;
}
function polygonArea(points){return Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;}
function lineKey(p,q){let a=q[1]-p[1],b=p[0]-q[0],c=a*p[0]+b*p[1];if(!a&&!b)return null;const g=gcd(gcd(a,b),c)||1;a/=g;b/=g;c/=g;if(a<0||(a===0&&b<0)){a=-a;b=-b;c=-c;}return [a,b,c].map(v=>Object.is(v,-0)?0:v).join(',');}
function reflectsPolygon(points,line){const [a,b,c]=line.split(',').map(Number),den=a*a+b*b;if(!den)return false;const reflect=points.map(([x,y])=>{const t=(a*x+b*y-c)/den;return [x-2*a*t,y-2*b*t];});return reflect.every(p=>points.some(q=>Math.abs(p[0]-q[0])<1e-7&&Math.abs(p[1]-q[1])<1e-7));}
function parseNumber(value,unit=''){
 if(typeof value==='number')return Number.isFinite(value)?value:NaN;
 if(typeof value!=='string')return NaN;let s=value.trim().replace(/\u2212/g,'-');
 if(unit){const suffix=unit==='Euro'?'(?:\u20ac|euro|eur)':unit.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');s=s.replace(new RegExp('\\s*'+suffix+'\\s*$','i'),'').trim();}
 if(!s)return NaN;
 if(/[\s\u00a0\u202f]/.test(s)){if(!/^[+-]?\d{1,3}(?:[\s\u00a0\u202f]\d{3})+(?:[,.]\d+)?$/.test(s))return NaN;s=s.replace(/[\s\u00a0\u202f]/g,'');}
 if(s.includes(',')){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(s))return NaN;s=s.replace(/\./g,'').replace(',','.');}
 else if(/^[+-]?\d{1,3}(?:\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 if(!/^[+-]?\d+(?:\.\d+)?$/.test(s))return NaN;return Number(s);
}
const num=(key,label,answer,unit='',max=1)=>({key,type:'number',label,answer,unit,max});
function choice(T,key,label,items,answer,max=1){return {key,type:'choice',label,options:T.shuffle(items.map((v,i)=>typeof v==='object'?v:{id:String(i),label:v})),answer:String(answer),max};}
function partResult(p,v){
 const max=p.max||1;let score=0,answered=false,correct=false;
 if(p.type==='number'){answered=String(v==null?'':v).trim()!=='';const n=parseNumber(v,p.unit);correct=Number.isFinite(n)&&Math.abs(n-p.answer)<1e-8;}
 else if(p.type==='choice'){answered=v!==null&&v!==undefined&&v!=='';correct=answered&&String(v)===p.answer;}
 else if(p.type==='operation'){answered=Array.isArray(v)&&v.some(x=>String(x||'').trim());correct=Array.isArray(v)&&v[0]===p.answer[0]&&parseNumber(v[1])===p.answer[1];}
 else if(p.type==='clock'){answered=Array.isArray(v)&&v.some(x=>String(x==null?'':x).trim());const h=Array.isArray(v)?parseNumber(v[0]):NaN,m=Array.isArray(v)?parseNumber(v[1]):NaN;correct=h===Math.floor(p.answer/60)%24&&m===p.answer%60;}
 else if(p.type==='perm'){answered=Array.isArray(v)&&v.some(x=>String(x==null?'':x).trim());const ns=Array.isArray(v)?v.map(x=>parseNumber(x)):[];correct=ns.length===3&&eq(ns.slice().sort((a,b)=>a-b),p.numbers.slice().sort((a,b)=>a-b))&&ns[1]===(p.goal==='max'?Math.max(...ns):Math.min(...ns));}
 else if(p.type==='net'){answered=Array.isArray(v)&&v.length>0;correct=Array.isArray(v)&&v.length===p.needed&&v.every(c=>Array.isArray(c)&&c.length===2&&c.every(Number.isInteger)&&c.every(n=>n>=0&&n<p.size))&&isCubeNet(p.fixed.concat(v));}
 else if(p.type==='axes'){answered=Array.isArray(v)&&v.length>0;const lines=Array.isArray(v)?[...new Set(v.map(s=>Array.isArray(s)&&s.length===2?lineKey(s[0],s[1]):null).filter(Boolean))]:[];correct=lines.length===p.answer.length&&lines.every(l=>p.answer.includes(l));if(!correct&&lines.length>0&&lines.length<p.answer.length&&lines.every(l=>p.answer.includes(l)))score=max/2;}
 else if(p.type==='balls'){answered=Array.isArray(v)&&v.some(x=>x==='B'||x==='R');if(Array.isArray(v)&&v.length===p.total&&v.every(x=>x==='B'||x==='R')){const b=v.filter(x=>x==='B').length;correct=p.rule==='allblue'?b===p.total:p.rule==='noblue'?b===0:p.rule==='someblue'?b>0&&b<p.total:p.rule==='exact'?b===p.target:false;}}
 else if(p.type==='gridset'){answered=Array.isArray(v)&&v.length>0;const cells=Array.isArray(v)?[...new Set(v.map(key))].sort():[];correct=eq(cells,p.answer.map(key).sort());}
 else if(p.type==='list'){answered=typeof v==='string'&&v.trim()!=='';const cells=typeof v==='string'?v.trim().split(/[\s,;]+/).filter(Boolean).map(x=>parseNumber(x)):[];correct=cells.every(Number.isFinite)&&new Set(cells).size===cells.length&&eq(cells.sort((a,b)=>a-b),p.answer.slice().sort((a,b)=>a-b));}
 else if(p.type==='chart'){answered=Array.isArray(v)&&v.some(x=>x!==null&&x!==undefined);const vals=Array.isArray(v)?v:[];score=vals.reduce((s,x,i)=>s+(x!==null&&parseNumber(x)===p.answer[i]?max/p.answer.length:0),0);correct=score===max;}
 if(correct)score=max;return {score,max,correct,answered};
}
function grade(q,response={}){const parts=q.parts.map(p=>({...partResult(p,response[p.key]),key:p.key}));return {parts,score:parts.reduce((s,p)=>s+p.score,0),max:parts.reduce((s,p)=>s+p.max,0),correct:parts.every(p=>p.correct),answered:parts.some(p=>p.answered),complete:q.parts.every(p=>completePart(p,response[p.key]))};}
function completePart(p,v){if(!partResult(p,v).answered)return false;if(['clock','operation','perm'].includes(p.type))return Array.isArray(v)&&v.every(x=>x!==null&&x!==undefined&&String(x).trim()!=='');if(p.type==='balls')return v.length===p.total&&v.every(x=>x==='B'||x==='R');if(p.type==='chart')return v.length===p.answer.length&&v.every(x=>x!==null&&x!==undefined);return true;}
function answerValue(p){if(p.type==='list')return p.answer.join(', ');if(p.example!==undefined)return JSON.parse(JSON.stringify(p.example));if(p.type==='clock')return [String(Math.floor(p.answer/60)%24),String(p.answer%60)];if(p.type==='number')return String(p.answer).replace('.',',');return JSON.parse(JSON.stringify(p.answer));}
function answers(q){return Object.fromEntries(q.parts.map(p=>[p.key,answerValue(p)]));}
function solutionText(p){
 if(p.type==='choice')return p.options.find(x=>x.id===p.answer).label||'Siehe markierte Abbildung.';
 if(p.type==='number')return `${fmt(p.answer)}${p.unit?' '+p.unit:''}`;
 if(p.type==='clock')return time(p.answer)+' Uhr';
 if(p.type==='operation')return p.answer[0]+' '+p.answer[1];
 if(p.type==='perm')return 'Zum Beispiel '+p.example.join(' | ')+'. Die beiden \u00e4u\u00dferen Zahlen d\u00fcrfen vertauscht werden.';
 if(p.type==='net')return 'Eine m\u00f6gliche Erg\u00e4nzung siehst du unten. Andere faltbare Netze sind ebenfalls richtig.';
 if(p.type==='axes')return `${p.answer.length} Spiegelachse${p.answer.length===1?'':'n'} (siehe Zeichnung).`;
 if(p.type==='balls'){const b=p.example.filter(x=>x==='B').length;return p.rule==='someblue'?'Mindestens eine blaue UND mindestens eine rote Kugel. Mehrere F\u00e4rbungen sind richtig.':`${b} blaue und ${p.total-b} rote Kugeln. Die Reihenfolge ist egal.`;}
 if(p.type==='gridset')return 'Die erg\u00e4nzten Felder siehst du unten.';
 if(p.type==='list')return p.answer.join(', ');
 if(p.type==='chart')return p.names.map((n,i)=>n+': '+p.answer[i]).join(' \u00b7 ');
 return '';
}
function make(id,seed,challenge=false){
 const f=FAMILIES.find(x=>x.id===id);if(!f)throw new Error('Unbekannte Aufgabe: '+id);
 const T=tools(seed),{int,pick,shuffle}=T;
 const q={id,seed:seed>>>0,challenge:!!challenge,group:f.group,level:f.level,title:f.title,ref:f.ref,prompt:'',visual:'',parts:[],hints:[],steps:[],data:{}};
 const add=p=>q.parts.push(p);
 switch(id){
 case 'calc':{
 const a=int(1200,3800),b=int(257,989),c=int(1200,2800),d=int(368,997);
 q.prompt='Rechne genau. Du kannst deine Rechnungen auf Papier notieren.';
 add(num('a',`${fmt(a)} + ${fmt(b)} =`,a+b));add(num('b',`${fmt(c)} \u2212 ${fmt(d)} =`,c-d));
 q.hints=['Achte auf Plus und Minus. Schreibe gleiche Stellenwerte untereinander.','Zerlege die zweite Zahl in Hunderter, Zehner und Einer. Kontrolliere danach mit der Umkehraufgabe.'];
 q.steps=[`${fmt(a)} + ${fmt(b)} = ${fmt(a+b)}.`,`${fmt(c)} \u2212 ${fmt(d)} = ${fmt(c-d)}. Probe: ${fmt(c-d)} + ${fmt(d)} = ${fmt(c)}.`];q.data={a,b,c,d};break;}
 case 'story':{
 const total=int(280,780),used=int(112,total-57),s=pick(['In der Bibliothek sollen neue B\u00fccher etikettiert werden.','F\u00fcr das Schulfest werden Eintrittskarten vorbereitet.','Eine Werkstatt beklebt Schachteln.']);
 q.prompt=`${s} Insgesamt sind es ${total} St\u00fcck. ${used} sind schon fertig. Wie viele fehlen noch?`;
 add(num('rest','Es fehlen noch',total-used,'St\u00fcck'));
 q.hints=['Was ist die Gesamtzahl? Was ist davon bereits erledigt?','Die fehlende Anzahl ist der Unterschied zwischen insgesamt und schon fertig.'];
 q.steps=[`${total} \u2212 ${used} = ${total-used}.`,`${used} + ${total-used} = ${total}: Fertige und fehlende St\u00fccke ergeben zusammen die Gesamtzahl.`];q.data={total,used};break;}
 case 'neighbors':{
 const n=int(110,989)*10+int(1,9);q.prompt=`Zwischen welchen beiden Zehnerzahlen liegt ${fmt(n)} direkt?`;
 q.visual=numberLine(Math.floor(n/10)*10,1,10,n%10,false);
 add(num('low','Kleinerer Nachbarzehner',Math.floor(n/10)*10,'',.5));add(num('high','Gr\u00f6\u00dferer Nachbarzehner',Math.floor(n/10)*10+10,'',.5));
 q.visual='';q.hints=['Zehnerzahlen haben an der Einerstelle eine 0.','Gehe zur n\u00e4chsten Zehnerzahl davor und danach, nicht zum n\u00e4chsten Hunderter.'];q.steps=[`${fmt(Math.floor(n/10)*10)} < ${fmt(n)} < ${fmt(Math.floor(n/10)*10+10)}.`,`Die zwei Nachbarzehner liegen genau 10 auseinander.`];q.data={n};break;}
 case 'operations':{
 const a=int(3,8),b=int(14,29),c=int(4,9),d=int(31,49),div=int(3,8),quot=int(12,24);
 q.prompt='Berechne die drei Ergebnisse. Achte auch auf das Geteiltzeichen.';
 add(num('a',`${a} \u00b7 ${b} =`,a*b));add(num('b',`${c} \u00b7 ${d} =`,c*d));add(num('c',`${div*quot} : ${div} =`,quot));
 q.hints=['Beim Malnehmen kannst du Zehner und Einer getrennt berechnen.','Beim Teilen hilft die passende Malaufgabe als Probe.'];q.steps=[`${a} \u00b7 ${b} = ${a} \u00b7 ${Math.floor(b/10)*10} + ${a} \u00b7 ${b%10} = ${a*b}.`,`${c} \u00b7 ${d} = ${c*d}.`,`${div*quot} : ${div} = ${quot}, denn ${quot} \u00b7 ${div} = ${div*quot}.`];q.data={a,b,c,d,div,quot};break;}
 case 'sequence':{
 const start=int(22,54)*10,up=pick([30,40,60,70,80]),down=pick([10,20,25]);let seq=[start];for(let i=0;i<5;i++)seq.push(seq.at(-1)+(i%2?-down:up));
 q.prompt='Die Regel besteht aus zwei Schritten, die sich immer abwechseln. Finde beide Schritte.';
 q.visual=`<div class="sequence">${seq.map(n=>`<span>${n}</span>`).join('<b>\u2192</b>')}</div>`;
 add({key:'a',type:'operation',label:'Erster Schritt',answer:['+',up],max:1});add({key:'b',type:'operation',label:'Zweiter Schritt',answer:['-',down],max:1});
 if(challenge)add(num('next','Welche Zahl folgt als N\u00e4chstes?',seq.at(-1)-down));
 q.hints=['Vergleiche jeweils zwei direkt benachbarte Zahlen.','Pr\u00fcfe: Ist der erste Sprung derselbe wie der dritte und f\u00fcnfte?'];q.steps=[`Die Spr\u00fcnge lauten +${up}, \u2212${down}, +${up}, \u2212${down}, +${up}.`,`Also: erst ${up} dazu, dann ${down} weg. Danach wieder von vorn.`];q.data={start,up,down,seq};break;}
 case 'represent':{
 const groups=int(3,5),each=pick([4,6,7]),jumps=pick([groups,groups+1]),dotGroups=pick([groups-1,groups]),total=groups*each;
 let line='<path d="M25 90H365" stroke="#526b9a" stroke-width="2"/>';
 for(let i=0;i<=jumps;i++){const x=25+i*340/jumps;line+=`<path d="M${x} 83V97" stroke="#526b9a" stroke-width="2"/>`+text(x,120,i*each,17);if(i<jumps){const end=25+(i+1)*340/jumps;line+=`<path d="M${x} 78Q${(x+end)/2} 16 ${end} 78" stroke="#526b9a" fill="none" stroke-width="2"/>`+text((x+end)/2,40,'+'+each,15);}}
 let dots='';for(let g=0;g<dotGroups;g++){const y=20+g*40;dots+=rect(30,y,each*27+20,31,'#eff5ff');for(let d=0;d<each;d++)dots+=`<circle cx="${53+d*27}" cy="${y+15}" r="7" fill="#4269a8"/>`;}
 q.prompt=`${groups} Schalen enthalten jeweils ${each} Murmeln. Entscheide bei jeder Darstellung: Zeigt sie insgesamt genau so viele Murmeln? Es geht um die Gesamtanzahl, nicht um die Aufteilung.`;
 const options=shuffle([{label:`${groups} \u00b7 ${each}`,yes:true},{label:Array(groups).fill(each).join(' + '),yes:true},{label:'Die Spr\u00fcnge auf dem Zahlenstrahl (Start bei 0)',yes:jumps*each===total,visual:svg(line,395,145,'Zahlenstrahl mit Spr\u00fcngen')},{label:'Alle Punkte in den K\u00e4stchen zusammen',yes:dotGroups*each===total,visual:svg(dots,each*27+80,dotGroups*40+30,'Punkte in Gruppen')}]);
 options.forEach((o,i)=>{const p=choice(T,'p'+i,o.label,['Ja','Nein'],o.yes?0:1,.5);p.visual=o.visual||'';add(p);});
 q.hints=['Bestimme zuerst die gesamte Anzahl in den Schalen.','Vergleiche jede Darstellung einzeln: Malaufgabe, Plusaufgabe, Endzahl nach den Spr\u00fcngen und alle Punkte.'];q.steps=[`${groups} \u00b7 ${each} = ${total}.`,`${Array(groups).fill(each).join(' + ')} = ${total}.`,`Der Zahlenstrahl zeigt ${jumps} Spr\u00fcnge um je ${each}, also ${jumps*each}.`,`Die Punkte zeigen ${dotGroups} Gruppen mit je ${each} Punkten, also ${dotGroups*each}.`];q.data={groups,each,jumps,dotGroups,options};break;}
 case 'wallmax':{
 const a=int(7,16)*2,b=a+int(3,8),c=b+int(3,9),ns=shuffle([a,b,c]),goal=challenge&&int(0,1)?'min':'max',middle=goal==='max'?c:a,outer=[a,b,c].filter(n=>n!==middle),cap=outer[0]+2*middle+outer[1];
 q.prompt=`Baue eine Zahlenmauer. Jeder obere Stein ist die Summe der beiden darunter. Verwende ${ns.join(', ')} unten jeweils genau einmal. Der oberste Stein soll m\u00f6glichst ${goal==='max'?'gro\u00df':'klein'} werden.`;
 q.visual=drawWall([null,null,null,null,null,null]);
 add({key:'order',type:'perm',label:'Untere Reihe: links | Mitte | rechts',numbers:ns,goal,example:[outer[0],middle,outer[1]],max:1});
 add(num('top','Gr\u00f6\u00dfter bzw. kleinster erreichbarer Deckstein',cap));
 add(num('change',`Du tauschst jetzt die gr\u00f6\u00dfte und die kleinste Zahl in deiner optimalen unteren Reihe. Um wie viel wird der Deckstein ${goal==='max'?'kleiner':'gr\u00f6\u00dfer'}?`,c-a));
 q.hints=['Probiere zwei verschiedene Zahlen in der Mitte aus.','Verfolge den mittleren unteren Stein: Er steckt in beiden Steinen der zweiten Reihe.'];
 q.steps=[`Zum Beispiel unten ${outer[0]}, ${middle}, ${outer[1]}. Dar\u00fcber stehen ${outer[0]+middle} und ${middle+outer[1]}.`,`Oben: ${outer[0]+middle} + ${middle+outer[1]} = ${cap}.`,`Jede \u00e4u\u00dfere Zahl z\u00e4hlt einmal, die mittlere zweimal. Deshalb geh\u00f6rt die ${goal==='max'?'gr\u00f6\u00dfte':'kleinste'} Zahl in die Mitte. Die \u00e4u\u00dferen Zahlen darfst du tauschen.`];q.steps.push(`Beim Tausch wird die Mitte um ${c-a} ${goal==='max'?'kleiner':'gr\u00f6\u00dfer'}. Die Summe der drei Grundzahlen bleibt gleich. Deshalb wird auch der Deckstein um ${c-a} ${goal==='max'?'kleiner':'gr\u00f6\u00dfer'}.`);q.paper='Erkl\u00e4re mit eigenen Worten, weshalb die Mitte wichtig ist.';q.data={a,b,c,goal,cap};break;}
 case 'place':{
 const h=int(2,7),z=int(11,19),e=int(1,8);q.prompt='In der Tafel stehen Anzahlen von Hundertern, Zehnern und Einern. B\u00fcndele, wenn es n\u00f6tig ist.';
 q.visual=`<table class="math-table"><tr><th>Hunderter</th><th>Zehner</th><th>Einer</th></tr><tr><td>${h}</td><td>${z}</td><td>${e}</td></tr></table>`;
 add(num('number','Welche Zahl ist dargestellt?',100*h+10*z+e));
 if(challenge){add(num('missing',`Wie viele Einer fehlen dieser Zahl bis ${100*(h+2)}?`,100*(h+2)-(100*h+10*z+e)));q.level=1;}
 q.hints=['Die 10 Zehner sind 1 Hunderter wert.','Multipliziere die Anzahlen mit ihrem Stellenwert. Schreibe sie nicht einfach nebeneinander.'];
 q.steps=[`${h} Hunderter = ${100*h}. ${z} Zehner = ${10*z}.`,`${100*h} + ${10*z} + ${e} = ${100*h+10*z+e}.`,`Geb\u00fcndelt: ${h+1} Hunderter, ${z-10} Zehner, ${e} Einer.`];if(challenge)q.steps.push(`${100*(h+2)} \u2212 ${100*h+10*z+e} = ${100*(h+2)-(100*h+10*z+e)} Einer.`);q.data={h,z,e};break;}
 case 'midpoint':{
 const a=int(12,65)*10,da=pick([100,200]),b=int(15,63)*10,db=pick([60,140,180]);q.prompt='Finde jeweils die Zahl, die genau in der Mitte liegt.';
 add(num('a',`Mitte zwischen ${a} und ${a+da}` ,a+da/2));add(num('b',`Mitte zwischen ${b} und ${b+db}`,b+db/2));
 q.hints=['Die gesuchte Zahl ist von beiden Enden gleich weit entfernt.','Berechne den Abstand, halbiere ihn und gehe vom kleineren Ende um diese H\u00e4lfte weiter.'];q.steps=[`${a+da} \u2212 ${a} = ${da}; die H\u00e4lfte ist ${da/2}. Mitte: ${a+da/2}.`,`${b+db} \u2212 ${b} = ${db}; die H\u00e4lfte ist ${db/2}. Mitte: ${b+db/2}.`];q.data={a,da,b,db};break;}
 case 'compensate':{
 const a=int(320,780),k=int(2,8),round=pick([100,200]),op=challenge?pick(['+','-']):'-',target=round-k,inter=op==='-'?a-round:a+round,answer=op==='-'?a-target:a+target,correction=op==='-'?'+':'-';
 q.prompt=`Nuri rechnet ${a} ${op==='-'?'\u2212':'+'} ${target}. Als ersten Schritt rechnet er ${a} ${op==='-'?'\u2212':'+'} ${round} = ${inter}. Wie muss er dieses Zwischenergebnis berichtigen?`;
 add({key:'step',type:'operation',label:`Weiter ab ${inter}: Rechenzeichen und Zahl`,answer:[correction,k],max:1});add(num('result','Endergebnis',answer));
 q.hints=['Wie gro\u00df ist der Unterschied zwischen der runden Zahl und der Zahl aus der Aufgabe?','Wurde zu viel weggenommen oder zu viel hinzugef\u00fcgt? Das muss r\u00fcckg\u00e4ngig gemacht werden.'];
 q.steps=[`${round} ist um ${k} gr\u00f6\u00dfer als ${target}.`,`Es wurden ${k} zu viel ${op==='-'?'abgezogen':'addiert'}. Deshalb ${correction==='+'?'addierst':'subtrahierst'} du nun ${k}.`,`${inter} ${correction==='-'?'\u2212':'+'} ${k} = ${answer}.`];q.data={a,k,round,op,target,inter};break;}
 case 'fit':{
 const w=4,h=3,profiles=shuffle([[1,1,2],[1,2,2],[2,1,1],[3,1,1],[1,3,2],[2,3,1]]),profile=profiles[0];let a=[],b=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)(x<profile[y]?a:b).push([x,y]);
 const options=[{id:'right',label:'Figur',svg:drawCells(rot2(b,int(0,3)))}],bad=[];let tries=0;
 while(options.length<4&&tries++<250){const p=Array.from({length:3},()=>int(1,3)),sum=p.reduce((s,v)=>s+v,0);if(sum!==b.length)continue;let c=[];for(let y=0;y<3;y++)for(let x=0;x<p[y];x++)c.push([x,y]);if(tilings(a,c,w,h).length||bad.includes(canonical2(c,false)))continue;bad.push(canonical2(c,false));options.push({id:'bad'+options.length,label:'Figur',svg:drawCells(rot2(c,int(0,3))),cells:c});}
 if(options.length<4){const c=Array.from({length:b.length},(_,i)=>[i,0]);if(!tilings(a,c,w,h).length)options.push({id:'long',label:'Figur',svg:drawCells(c),cells:c});}
 q.prompt='Welches Teil passt zu diesem Teil? Zusammen sollen sie ein Rechteck aus 4 Spalten und 3 Reihen bilden. Du darfst die Teile drehen, aber nicht spiegeln oder \u00fcberlappen.';
 q.visual=drawCells(rot2(a,int(0,3)));add(choice(T,'piece','W\u00e4hle das passende Erg\u00e4nzungsteil.',options,'right',2));
 q.hints=['Ein gleich gro\u00dfer Fl\u00e4cheninhalt reicht nicht: Auch die Stufen m\u00fcssen zusammenpassen.','Stelle dir das Rechteck mit 4 \u00d7 3 Feldern vor. Welche Felder bleiben neben dem vorhandenen Teil frei?'];
 q.steps=['Drehe das passende Teil gedanklich so, dass seine Stufen die L\u00fccken des anderen Teils genau f\u00fcllen.','Zusammen bedecken die beiden Teile alle 12 Felder des Rechtecks; nichts liegt doppelt und es bleibt kein Loch.'];q.solutionVisual=svg(a.map(([x,y])=>rect(40+42*x,25+42*y,42,42,'#bcd4f6')).join('')+b.map(([x,y])=>rect(40+42*x,25+42*y,42,42,'#f5cf9f')).join(''),250,180,'Zusammengesetztes Rechteck');q.data={a,b,w,h,options};break;}
 case 'area':{
 const target=int(5,8),counts=shuffle([target,target,target-1,target+1]);
 const grow=n=>{let c=[[0,0]];while(c.length<n){const set=new Set(c.map(key)),edge=[];for(const [x,y] of c)for(const v of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(!set.has(key(v))){const test=norm2(c.concat([v]));if(Math.max(...test.map(v=>v[0]))<6&&Math.max(...test.map(v=>v[1]))<6)edge.push(v);}c.push(pick(edge));}return rot2(c,int(0,3));};
 const sets=counts.map(grow);
 q.prompt=`Jedes kleine Quadrat ist gleich gro\u00df. Entscheide f\u00fcr jede Figur, ob ihre Fl\u00e4che genau ${target} solcher Quadrate gro\u00df ist.`;
 sets.forEach((cells,i)=>{const p=choice(T,'p'+i,`Figur ${i+1}: genau ${target} Quadrate Fl\u00e4che?`,['Ja','Nein'],cells.length===target?0:1,.5);p.visual=drawCells(cells);add(p);});
 q.hints=['Z\u00e4hle die gef\u00fcllten Quadrate, nicht den Rand.','Eine lange oder gezackte Figur kann dieselbe Fl\u00e4che wie ein Rechteck haben.'];q.steps=sets.map((c,i)=>`Figur ${i+1} besteht aus ${c.length} Quadraten: ${c.length===target?'ja':'nein'}.`);q.steps.push('Die Form und die L\u00e4nge des Randes sind f\u00fcr die Fl\u00e4che nicht entscheidend.');q.data={target,sets};break;}
 case 'rotate':{
 const bases=[[[0,0,0],[1,0,0],[2,0,0],[0,1,0],[2,0,1]],[[0,0,0],[1,0,0],[2,0,0],[2,1,0],[0,0,1]],[[0,0,0],[1,0,0],[1,1,0],[2,1,0],[0,0,1]],[[0,0,0],[0,1,0],[1,1,0],[2,1,0],[2,1,1]]];
 const rotateVisible=c=>{const v=ROTATIONS.map(r=>rotate3(c,r)).filter(allCubesVisible);if(!v.length)throw new Error('No unambiguous cube view');return pick(v);};const base=rotateVisible(pick(bases)),canon=canonical3(base),correct=rotateVisible(base);let options=[{id:'right',label:'W\u00fcrfelfigur',svg:drawCubes(correct),cells:correct}],seen=new Set([canon]);
 const pool=[...bases,[[0,0,0],[1,0,0],[2,0,0],[1,0,1],[1,0,2]],[[0,0,0],[1,0,0],[2,0,0],[0,0,1],[2,0,1]],[[0,0,0],[1,0,0],[2,0,0],[3,0,0],[0,0,1]],[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1]]];
 for(const c of shuffle(pool)){const k=canonical3(c);if(seen.has(k))continue;seen.add(k);const v=rotateVisible(c);options.push({id:'bad'+options.length,label:'W\u00fcrfelfigur',svg:drawCubes(v),cells:v});if(options.length===4)break;}
 q.prompt='Alle Figuren bestehen aus f\u00fcnf W\u00fcrfeln. Welche W\u00fcrfelfigur ist genau dieselbe wie die Vorlage? Du darfst die ganze Figur drehen und kippen. Die W\u00fcrfel bleiben fest miteinander verbunden.';
 q.visual=drawCubes(base);add(choice(T,'same','W\u00e4hle genau eine Figur.',options,'right',2));q.hints=['Alle Figuren bestehen aus gleich vielen W\u00fcrfeln. Z\u00e4hlen allein reicht hier nicht.','Suche den langen Teil und verfolge, an welchen Enden oder Seiten weitere W\u00fcrfel sitzen. Diese Verbindungen bleiben beim Drehen erhalten.'];q.steps=['Beim Drehen oder Kippen \u00e4ndert sich der Blickwinkel, aber kein W\u00fcrfel wechselt seinen Platz innerhalb der Figur.','Vergleiche die Verbindungen und Richtungswechsel vom einen Ende zum anderen. Die markierte Figur l\u00e4sst sich allein durch eine Drehung in die Vorlage \u00fcberf\u00fchren.'];q.data={base,options};break;}
 case 'axes':{
 const shapes=[{name:'Rechteck',points:[[1,2],[7,2],[7,6],[1,6]],axes:['1,0,4','0,1,4']},{name:'Quadrat',points:[[2,2],[6,2],[6,6],[2,6]],axes:['1,0,4','0,1,4','1,-1,0','1,1,8']},{name:'gleichschenkliges Trapez',points:[[2,2],[6,2],[7,6],[1,6]],axes:['1,0,4']},{name:'Raute',points:[[4,1],[6,4],[4,7],[2,4]],axes:['1,0,4','0,1,4']}];
 const picked=shuffle(shapes).slice(0,2);q.prompt='Zeichne alle Spiegelachsen ein. Tippe f\u00fcr jede Gerade nacheinander zwei Gitterpunkte an. Mit \u201eLetzte Linie entfernen\u201c kannst du korrigieren.';
 const endpoints={'1,0,4':[[4,0],[4,8]],'0,1,4':[[0,4],[8,4]],'1,-1,0':[[0,0],[8,8]],'1,1,8':[[0,8],[8,0]]};
 picked.forEach((s,i)=>add({key:'p'+i,type:'axes',label:`Figur ${i+1}`,points:s.points,answer:s.axes,example:s.axes.map(x=>endpoints[x]),max:1}));q.hints=['Beim Falten entlang einer Spiegelachse m\u00fcssen beide H\u00e4lften genau aufeinanderliegen.','Pr\u00fcfe waagerechte, senkrechte und schr\u00e4ge Geraden. Nicht jede Linie durch die Mitte ist eine Spiegelachse.'];q.steps=picked.map((s,i)=>`Figur ${i+1} (${s.name}) besitzt ${s.axes.length} Spiegelachse${s.axes.length===1?'':'n'}. Entsprechende Ecken liegen jeweils im gleichen Abstand auf beiden Seiten der Achse.`);q.data={picked};break;}
 case 'view':{
 const hs=shuffle([1,2,3]),h=hs.map(v=>{let row=[int(1,v),int(1,v),v];return shuffle(row);}),correct=h.map(row=>Math.max(...row)).reverse(),candidates=[correct,correct.slice().reverse(),[correct[1],correct[0],correct[2]],[correct[0],correct[2],correct[1]],[3,3,3]];
 const unique=[...new Map(candidates.map(a=>[key(a),a])).values()].slice(0,4),options=unique.map((a,i)=>({id:String(i),label:'Ansicht',svg:outlineHeights(a),heights:a}));
 q.prompt='Du schaust von RECHTS auf das W\u00fcrfelgeb\u00e4ude. Welche Ansicht siehst du? In den Antwortbildern ist die vorderste Reihe links und die hinterste rechts.';
 q.visual=drawCubes(cubesFromHeights(h),true);add(choice(T,'view','W\u00e4hle die richtige Seitenansicht.',options,'0',2));q.hints=['Von der Seite verdecken h\u00f6here T\u00fcrme die niedrigeren T\u00fcrme dahinter.','Suche f\u00fcr jede Reihe von vorn nach hinten die gr\u00f6\u00dfte H\u00f6he. Z\u00e4hle die H\u00f6hen nicht zusammen.'];q.steps=[`Von vorn nach hinten sind die h\u00f6chsten T\u00fcrme ${correct.join(', ')} W\u00fcrfel hoch.`,`Genau diese H\u00f6hen erscheinen von links nach rechts in der Seitenansicht. Verdeckte kleinere T\u00fcrme machen die Ansicht nicht h\u00f6her.`];q.data={h,correct,options};break;}
 case 'net':{
 const net=rot2(pick(cubeNets()),int(0,3)),fixedCandidates=[];for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const core=net.filter((_,k)=>k!==i&&k!==j);if(connected(core))fixedCandidates.push({core,removed:[net[i],net[j]]});}
 const sample=pick(fixedCandidates),offX=Math.floor((7-Math.max(...net.map(p=>p[0]))-1)/2),offY=Math.floor((7-Math.max(...net.map(p=>p[1]))-1)/2),shift=c=>c.map(([x,y])=>[x+offX,y+offY]);
 q.prompt='Erg\u00e4nze die vier blauen Quadrate zu einem W\u00fcrfelnetz. Tippe genau zwei weitere Felder an. Alle sechs Fl\u00e4chen sollen sich zu einem geschlossenen W\u00fcrfel falten lassen.';
 add({key:'net',type:'net',label:'Tippen f\u00fcr Hinzuf\u00fcgen oder Entfernen',fixed:shift(sample.core),needed:2,size:7,example:shift(sample.removed),max:2});
 q.hints=['Ein W\u00fcrfel hat genau sechs Fl\u00e4chen. Die Quadrate m\u00fcssen \u00fcber ganze Kanten zusammenh\u00e4ngen.','Stelle dir das Falten vor. Zwei Quadrate d\u00fcrfen dabei nicht dieselbe W\u00fcrfelseite bedecken. Ein 2-mal-2-Block kann kein Teil eines W\u00fcrfelnetzes sein.'];q.steps=['Die gezeigte Erg\u00e4nzung ist eine m\u00f6gliche L\u00f6sung. Alle anderen g\u00fcltigen W\u00fcrfelnetze werden ebenfalls akzeptiert.','Bei einem richtigen Netz wird jedes Quadrat zu einer anderen W\u00fcrfelseite. Es entstehen sechs unterschiedliche Seiten ohne \u00dcberdeckung.'];q.data={net};break;}
 case 'shopping':{
 const price=pick([120,140,160,180,220]),people=pick([4,5]),count=2,pay=5000,n1=2,n2=3,change=pay-people*count*price;
 q.prompt=`Am Schulfest kostet eine kleine Waffel ${money(price)} Euro. Es gibt keinen Mengenrabatt. Erg\u00e4nze die Preise. L\u00f6se anschlie\u00dfend die Einkaufssituation.`;
 q.visual=`<div class="price-tag">Eine Waffel<br><strong>${money(price)} \u20ac</strong></div>`;
 add(num('two','Preis f\u00fcr zwei Waffeln',n1*price/100,'Euro',.5));add(num('three','Preis f\u00fcr drei Waffeln',n2*price/100,'Euro',.5));
 add(num('change',`Zwei Erwachsene und ${people-2} Kinder kaufen jeweils ${count} Waffeln. Sie bezahlen mit 50 Euro. Wie viel R\u00fcckgeld erhalten sie?`,change/100,'Euro',2));
 q.hints=['\u00dcberlege zuerst, wie viele Personen einkaufen und wie viele Waffeln sie zusammen kaufen.','Rechne mit dem Einzelpreis. Ziehe den gesamten Einkaufspreis vom bezahlten Betrag ab.'];q.steps=[`Zwei Waffeln: ${money(n1*price)} Euro. Drei Waffeln: ${money(n2*price)} Euro.`,`${people} Personen kaufen je ${count} Waffeln: ${people*count} Waffeln.`,`${people*count} \u00b7 ${money(price)} Euro = ${money(people*count*price)} Euro.`,`R\u00fcckgeld: 50,00 \u2212 ${money(people*count*price)} = ${money(change)} Euro.`];q.data={price,people,count,pay,n1,n2,change};break;}
 case 'time':{
 const start=int(13,17)*60+int(26,49),duration=pick([35,45,55,75]),end=start+duration,reverse=challenge;
 q.prompt=reverse?`Ein Training endet um ${time(end)} Uhr. Es dauert ${duration} Minuten. Wann hat es begonnen?`:`Ein Training beginnt um ${time(start)} Uhr und dauert ${duration} Minuten. Um wie viel Uhr ist es zu Ende?`;
 add({key:'clock',type:'clock',label:reverse?'Beginn (Stunden : Minuten)':'Ende (Stunden : Minuten)',answer:reverse?start:end,max:1});q.hints=['Eine Stunde hat 60 Minuten, nicht 100.','Rechne zuerst bis zur vollen Stunde. Verrechne danach die noch fehlenden Minuten.'];q.steps=[`Beginn ${time(start)} Uhr; ${duration} Minuten sp\u00e4ter ist es ${time(end)} Uhr.`,`Kontrolle in Minuten: ${start} + ${duration} = ${end}. Eine Stunde enth\u00e4lt 60 Minuten.`];q.data={start,duration,end,reverse};break;}
 case 'estimate':{
 const items=shuffle([{label:'H\u00f6he einer Zimmert\u00fcr',options:['2 cm','2 m','2 km'],answer:1},{label:'Breite eines Schulhefts',options:['21 mm','21 m','21 cm'],answer:2},{label:'Dicke einer Bankkarte',options:['etwa 1 mm','etwa 1 m','etwa 1 km'],answer:0},{label:'Strecke von einem Ort zum n\u00e4chsten',options:['5 mm','5 cm','5 km'],answer:2},{label:'L\u00e4nge eines Buntstifts',options:['18 cm','18 m','18 mm'],answer:0},{label:'L\u00e4nge eines Betts',options:['2 mm','2 m','2 km'],answer:1},{label:'Dicke einer 1-Euro-M\u00fcnze',options:['etwa 2 m','etwa 2 cm','etwa 2 mm'],answer:2},{label:'L\u00e4nge einer Laufbahn-Runde im gro\u00dfen Sportstadion',options:['400 cm','400 m','400 km'],answer:1}]).slice(0,4);
 q.prompt='W\u00e4hle zu jedem Gegenstand die sinnvolle Gr\u00f6\u00dfenangabe. Es geht um ungef\u00e4hre Gr\u00f6\u00dfen.';items.forEach((o,i)=>add(choice(T,'p'+i,o.label,o.options,o.answer,.5)));q.hints=['Stelle dir den Gegenstand vor und vergleiche ihn mit einem Lineal oder deiner K\u00f6rpergr\u00f6\u00dfe.','Millimeter sind sehr klein. Zentimeter passen zu kleinen Gegenst\u00e4nden, Meter zu gr\u00f6\u00dferen Strecken.'];q.steps=items.map(x=>`${x.label}: ${x.options[x.answer]}.`);q.data={items};break;}
 case 'distances':{
 const low=int(160,215),high=low+int(25,95),others=[int(170,290),int(180,310),int(160,250)],rows=shuffle([['Lina',high],['Ben',low],['Oskar',others[0]],['Mira',others[1]],['Toni',others[2]]]);
 q.prompt='Die Tabelle zeigt Sprungweiten. Um wie viele Zentimeter ist Lina weiter gesprungen als Ben?';q.visual=`<table class="math-table"><tr><th>Kind</th><th>Sprungweite</th></tr>${rows.map(([n,v])=>`<tr><td>${n}</td><td>${money(v)} m</td></tr>`).join('')}</table>`;
 add(num('difference','Unterschied',high-low,'cm'));q.hints=['Lies nur die beiden ben\u00f6tigten Werte ab.','Wandle beide Werte in Zentimeter um. Dann kannst du sie subtrahieren.'];q.steps=[`Lina: ${money(high)} m = ${high} cm. Ben: ${money(low)} m = ${low} cm.`,`${high} \u2212 ${low} = ${high-low} cm. Lina ist also ${high-low} cm weiter gesprungen.`];q.data={low,high,rows};break;}
 case 'certainty':{
 const a=int(4,6),b=int(4,6);q.prompt='In jeder Schale sind die Kugeln gleich gro\u00df. Sie werden gemischt; ohne Hinsehen wird eine gezogen. F\u00e4rbe JEDE Kugel blau oder rot, sodass die Aussage stimmt.';
 add({key:'safe',type:'balls',label:'Schale A: Eine blaue Kugel zu ziehen ist sicher.',total:a,rule:'allblue',example:Array(a).fill('B'),max:1});
 add({key:'possible',type:'balls',label:'Schale B: Eine blaue Kugel zu ziehen ist m\u00f6glich, aber nicht sicher.',total:b,rule:'someblue',example:['B',...Array(b-1).fill('R')],max:1});
 q.hints=['Sicher bedeutet: Es kann gar kein anderes Ergebnis eintreten.','M\u00f6glich, aber nicht sicher bedeutet: Eine blaue Kugel kann kommen; eine rote aber auch.'];q.steps=['In Schale A m\u00fcssen alle Kugeln blau sein.','In Schale B muss mindestens eine Kugel blau und mindestens eine rot sein. Jede solche F\u00e4rbung ist richtig.'];break;}
 case 'chance':{
 const total=pick([3,4,5]),blue=int(1,total-1),factor=pick([2,3]),targetTotal=total*factor,target=blue*factor;
 q.prompt='Du gewinnst mit einer blauen Kugel. Die Kugeln werden gut gemischt und blind gezogen; innerhalb jeder Schale sind sie gleich gro\u00df. F\u00e4rbe alle Kugeln in Schale B so, dass die Gewinnchance in beiden Schalen gleich ist.';
 q.visual=`<div class="bag-label">Schale A</div>${drawBalls(total,blue)}`;
 add({key:'same',type:'balls',label:`Schale B: ${targetTotal} Kugeln`,total:targetTotal,rule:'exact',target,example:[...Array(target).fill('B'),...Array(targetTotal-target).fill('R')],max:2});
 if(challenge)add(choice(T,'reason','Warum ist die Chance dann gleich?',['Die Anzahl ALLER Kugeln und die Anzahl blauer Kugeln wurden mit demselben Faktor vervielfacht.','In beiden Schalen m\u00fcssen gleich viele blaue Kugeln liegen.','In der gr\u00f6\u00dferen Schale gewinnt man immer h\u00e4ufiger.'],0));
 q.hints=['Vergleiche nicht nur die Anzahl blauer Kugeln, sondern auch die Gesamtanzahl.','Denke dir die kleine Schale mehrmals nebeneinander: In jeder Kopie bleibt die Farbmischung gleich.'];q.steps=[`Schale A hat ${blue} blaue von ${total} Kugeln.`,`Schale B hat ${factor}-mal so viele Kugeln. Deshalb brauchst du auch ${factor}-mal so viele blaue Kugeln: ${blue} \u00b7 ${factor} = ${target}.`,`Die restlichen ${targetTotal-target} Kugeln sind rot. Die blaue Farbe hat in beiden Schalen denselben Anteil.`];q.data={total,blue,factor,targetTotal,target};break;}
 case 'chart':{
 const step=pick([2,5]),v=shuffle([int(2,4)*step,int(5,7)*step,int(8,10)*step]),names=['A','B','C'],hi=v.indexOf(Math.max(...v)),lo=v.indexOf(Math.min(...v));
 q.prompt='Drei Gruppen sammeln Kastanien. Lies das Diagramm ab. Achte auf die Einteilung der Zahlenachse.';q.visual=drawBars(v,names,step);
 add(num('sum','Wie viele Kastanien sind es insgesamt?',v.reduce((s,n)=>s+n,0)));
 add(num('diff',`Wie viele Kastanien hat Gruppe ${names[hi]} mehr als Gruppe ${names[lo]}?`,v[hi]-v[lo]));
 q.hints=['Nicht jeder Strich an der Zahlenachse bedeutet eine Kastanie.','Lies zuerst alle drei S\u00e4ulenh\u00f6hen ab. Addiere f\u00fcr insgesamt; subtrahiere f\u00fcr den Unterschied.'];q.steps=[`Die S\u00e4ulen zeigen: ${names.map((n,i)=>n+' = '+v[i]).join(', ')}.`,`Insgesamt: ${v.join(' + ')} = ${v.reduce((s,n)=>s+n,0)}.`,`Unterschied: ${v[hi]} \u2212 ${v[lo]} = ${v[hi]-v[lo]}.`];q.data={step,v,hi,lo};break;}
 case 'chartbuild':{
 const values=[int(3,11),int(3,11),int(3,11)],names=['Mo','Di','Mi'];q.prompt='Die Tabelle zeigt, wie viele Kinder mit dem Fahrrad kamen. Stelle f\u00fcr jeden Tag die passende S\u00e4ulenh\u00f6he ein.';q.visual=`<table class="math-table"><tr>${names.map(n=>`<th>${n}</th>`).join('')}</tr><tr>${values.map(n=>`<td>${n}</td>`).join('')}</tr></table>`;
 add({key:'bars',type:'chart',label:'Tippe auf die passende H\u00f6he der S\u00e4ulen.',names,answer:values,max:3,limit:12});q.hints=['Jede S\u00e4ule geh\u00f6rt zu genau einem Tag.','Lies die Zahl in der Tabelle und suche dieselbe H\u00f6he im Diagramm.'];q.steps=names.map((n,i)=>`${n}: Die S\u00e4ule endet bei ${values[i]}.`);q.data={values};break;}
 case 'units':{
 const kg=int(1,4),g=pick([150,250,350,750]),removed=pick([250,500,750]),total=kg*1000+g,kind=pick(['weight','volume']);q.prompt=kind==='weight'?`Ein Beutel enth\u00e4lt ${kg} kg ${g} g Mehl. ${removed} g werden verbraucht.`:`Eine Kanne enth\u00e4lt ${kg} l ${g} ml Saft. ${removed} ml werden ausgeschenkt.`;
 const u=kind==='weight'?'g':'ml';add(num('total','Anfangsmenge',total,u));add(num('rest','Verbleibende Menge',total-removed,u));q.hints=[kind==='weight'?'1 kg = 1000 g.':'1 l = 1000 ml.','Bringe beide Mengen in dieselbe Einheit, bevor du sie verrechnest.'];q.steps=[`${kg} \u00b7 1000 + ${g} = ${total} ${u}.`,`${total} \u2212 ${removed} = ${total-removed} ${u}.`];q.data={kg,g,removed,total};break;}
 case 'combinations':{
 const digits=shuffle([1,2,3,4,5,6,7,8,9]).slice(0,3).sort((a,b)=>a-b),ans=digits.flatMap(a=>digits.filter(b=>b!==a).map(b=>10*a+b)).sort((a,b)=>a-b);
 q.prompt=`Du hast die Ziffernkarten ${digits.join(', ')}. Bilde alle zweistelligen Zahlen. In jeder Zahl darfst du jede Karte nur einmal verwenden. Schreibe jede Zahl genau einmal auf.`;
 add({key:'list',type:'list',label:'Trenne die Zahlen mit Komma oder Leerzeichen.',answer:ans,max:2});q.hints=['Gehe systematisch vor: Beginne mit einer festen Zehnerziffer.','Zu jeder der drei Zehnerziffern passen die beiden anderen Ziffern als Einer.'];q.steps=[`${digits[0]} als Zehner: ${ans.filter(n=>Math.floor(n/10)===digits[0]).join(', ')}.`,`${digits[1]} als Zehner: ${ans.filter(n=>Math.floor(n/10)===digits[1]).join(', ')}.`,`${digits[2]} als Zehner: ${ans.filter(n=>Math.floor(n/10)===digits[2]).join(', ')}.`,`Es gibt 3 \u00b7 2 = 6 M\u00f6glichkeiten.`];q.data={digits};break;}
 case 'numberline':{
 const step=pick([10,20,25,50]),n=8,start=int(5,25)*20,mark=int(2,6);q.prompt='Welche Zahl geh\u00f6rt an den Pfeil? Alle Abschnitte sind gleich gro\u00df.';q.visual=numberLine(start,step,n,mark);add(num('n','Gesuchte Zahl',start+step*mark));q.hints=['Z\u00e4hle die Abst\u00e4nde zwischen den Strichen, nicht die Striche selbst.','Teile den gesamten Zahlenabstand durch die Anzahl gleich gro\u00dfer Abschnitte.'];q.steps=[`Zwischen ${start} und ${start+step*n} liegen ${n} Abschnitte.`,`${step*n} : ${n} = ${step} pro Abschnitt.`,`Der Pfeil liegt ${mark} Abschnitte nach ${start}: ${start} + ${mark} \u00b7 ${step} = ${start+step*mark}.`];q.data={step,n,start,mark};break;}
 case 'wallback':{
 const a=int(12,29),b=int(13,38),c=int(15,34);q.prompt='Finde die fehlenden unteren Steine. Jeder obere Stein ist die Summe der beiden direkt darunter.';q.visual=drawWall([a,null,null,a+b,b+c,null]);add(num('b','Unten in der Mitte',b));add(num('c','Unten rechts',c));add(num('top','Deckstein',a+2*b+c));q.hints=['Wenn ein Summand und die Summe bekannt sind, kannst du den anderen Summanden durch Subtraktion finden.','Beginne mit dem linken Stein der zweiten Reihe.'];q.steps=[`Mitte unten: ${a+b} \u2212 ${a} = ${b}.`,`Rechts unten: ${b+c} \u2212 ${b} = ${c}.`,`Deckstein: ${a+b} + ${b+c} = ${a+2*b+c}.`];q.data={a,b,c};break;}
 case 'error':{
 const a=int(210,650),b=int(105,190),k=pick([10,20,30]),wrong=a-(b+k),ans=a-b;
 q.prompt=`Mila will ${a} \u2212 ${b} rechnen. Sie \u00e4ndert die Aufgabe zu ${a} \u2212 ${b+k} und sagt: \u201eDas Ergebnis bleibt gleich.\u201c`;
 add(choice(T,'reason','Welche Erkl\u00e4rung stimmt?',[`Sie zieht ${k} mehr ab. Ihr Ergebnis wird um ${k} kleiner.`,`Sie zieht ${k} mehr ab. Ihr Ergebnis wird um ${k} gr\u00f6\u00dfer.`,'Bei einer Minusaufgabe darf man die zweite Zahl beliebig ver\u00e4ndern.'],0));
 add(num('fix',`Wie m\u00fcsste sie auch die erste Zahl ver\u00e4ndern, damit die Differenz gleich bleibt? Neue erste Zahl:`,a+k));q.hints=['Probiere die Idee an 10 \u2212 4 und 10 \u2212 6.','Eine Differenz bleibt gleich, wenn beide Zahlen um gleich viel erh\u00f6ht werden.'];q.steps=[`${a} \u2212 ${b} = ${ans}, aber ${a} \u2212 ${b+k} = ${wrong}.`,`Erh\u00f6hst du beide Zahlen um ${k}, gilt ${a+k} \u2212 ${b+k} = ${ans}.`];q.data={a,b,k};break;}
 case 'mirror':{
 const left=pick([[[1,1],[2,1],[2,2],[3,2],[3,3]],[[1,2],[2,2],[2,3],[3,3],[2,4]],[[1,1],[1,2],[2,2],[3,2],[3,3]]]),ans=left.map(([x,y])=>[7-x,y]);q.prompt='Erg\u00e4nze das Spiegelbild rechts von der senkrechten Linie. Tippe die passenden Felder an. Ein zweiter Tipp entfernt eine Markierung.';add({key:'mirror',type:'gridset',label:'Spiegle an der mittleren Linie.',fixed:left,answer:ans,size:8,restrict:'right',max:2});q.hints=['Z\u00e4hle den Abstand eines Feldes zur Spiegelachse.','Das gespiegelte Feld liegt in derselben Reihe und auf der anderen Seite im gleichen Abstand von der Achse.'];q.steps=['Jedes Feld links erh\u00e4lt einen Partner rechts in derselben Reihe.','Die Abst\u00e4nde zur mittleren Spiegelachse stimmen jeweils \u00fcberein.'];q.data={left};break;}
 case 'perimeter':{
 const w=int(3,6),h=int(2,4),cells=[];for(let x=0;x<w;x++)for(let y=0;y<h;y++)cells.push([x,y]);q.prompt='Jede K\u00e4stchenseite ist 1 cm lang. Wie lang ist der gesamte \u00e4u\u00dfere Rand der Figur?';q.visual=drawCells(cells);add(num('p','Umfang',2*(w+h),'cm'));q.hints=['Der Umfang ist die L\u00e4nge des Randes. Die inneren Gitterlinien z\u00e4hlen nicht mit.','Gehe einmal au\u00dfen herum: oben, rechts, unten, links.'];q.steps=[`${w} + ${h} + ${w} + ${h} = ${2*(w+h)} cm.`,`Die ${w*h} Quadrate geben die Fl\u00e4che an, nicht den Umfang.`];q.data={w,h};break;}
 case 'planning':{
 const cap=pick([6,8,9]),groups=int(5,9),rest=int(1,cap-1),people=cap*groups+rest;
 q.prompt=`F\u00fcr ${people} Kinder werden Boote gemietet. In jedes Boot passen h\u00f6chstens ${cap} Kinder. Alle Kinder sollen mitfahren. Wie viele Boote werden mindestens ben\u00f6tigt?`;
 add(num('boats','Mindestanzahl der Boote',groups+1));add(num('empty','Wie viele Pl\u00e4tze bleiben dann insgesamt frei?',cap-rest));q.hints=['Die Division geht nicht ohne Rest auf. \u00dcberlege, was der Rest in dieser Situation bedeutet.','Auch die \u00fcbrig gebliebenen Kinder brauchen einen Platz. Ein nur teilweise besetztes Boot z\u00e4hlt trotzdem.'];q.steps=[`${groups} Boote bieten nur ${groups*cap} Pl\u00e4tze; ${rest} Kinder h\u00e4tten keinen Platz.`,`Darum braucht ihr ${groups+1} Boote. Das sind ${(groups+1)*cap} Pl\u00e4tze.`,`${(groups+1)*cap} \u2212 ${people} = ${cap-rest} Pl\u00e4tze bleiben frei.`];q.data={cap,groups,rest,people};break;}
 }
 if(!q.parts.length)throw new Error('Aufgabe ohne Teilaufgaben');
 q.parts.forEach(p=>{if(!p.max)p.max=1;});
 return q;
}
function makeExam(seed){return EXAM.map((id,i)=>make(id,(seed+Math.imul(i+1,2654435761))>>>0,false));}
return {VERSION,GROUPS,LEVELS,FAMILIES,EXAM,make,makeExam,rng,tools,fmt,money,time,esc,svg,text,rect,drawCells,drawPolygon,drawCubes,drawBalls,drawBars,outlineHeights,drawWall,norm2,rot2,canonical2,connected,isCubeNet,cubeNets,allFreePolyominoes,norm3,rotate3,canonical3,ROTATIONS,cubesFromHeights,tilings,polygonArea,lineKey,reflectsPolygon,parseNumber,partResult,grade,completePart,answerValue,answers,solutionText};
});
