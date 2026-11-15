/* Mathe-Mission 4 5.0.0: offline-first UI; no external libraries or requests. */
(()=>{
'use strict';
const M=window.MM,$=id=>document.getElementById(id),E=M.esc;
const scope=location.pathname.replace(/[^/]*$/,''),DATA_KEY='mm4-5-progress:'+scope,SESSION_KEY='mm4-5-session:'+scope;
let memory={},storageOK=true,screen='home',mode='train',group='all',family='all',session=null,questions=[],pendingPoints={},palette={},modalResolve=null,lastFocused=null;
const emptyProgress=()=>({schema:5,stars:0,stats:{},runs:[],legacyStars:0});
function read(key,fallback){try{const s=localStorage.getItem(key);return s?JSON.parse(s):fallback;}catch{return memory[key]||fallback;}}
function write(key,val){memory[key]=val;try{localStorage.setItem(key,JSON.stringify(val));storageOK=true;}catch{storageOK=false;$('saveWarning').classList.remove('hidden');$('saveWarning').textContent='Dein Browser kann den Fortschritt gerade nicht speichern. Die Aufgaben funktionieren, aber beim Schlie\u00dfen k\u00f6nnten Antworten verloren gehen. Nutze keinen privaten Browsermodus und sichere den Fortschritt bei Bedarf unter \u201eF\u00fcr Eltern\u201c.';}}
function remove(key){delete memory[key];try{localStorage.removeItem(key);}catch{}}
let progress=read(DATA_KEY,null);
if(!progress||progress.schema!==5){progress=emptyProgress();const old=read('mission4',null);if(old&&Number.isFinite(old.stars)){progress.stars=Math.max(0,Math.floor(old.stars));progress.legacyStars=progress.stars;}write(DATA_KEY,progress);}
function seed(){const a=new Uint32Array(1);if(window.crypto&&crypto.getRandomValues){crypto.getRandomValues(a);return a[0];}return (Date.now()^Math.floor(Math.random()*1e8))>>>0;}
const descriptor=q=>({id:q.id,seed:q.seed,challenge:q.challenge});
const blankMeta=()=>({tries:0,hints:0,done:false,shown:false,first:null,firstResponse:null,firstIndependent:false,recorded:false,retry:false});
function saveSession(){if(session)write(SESSION_KEY,session);}
function hydrate(s){if(!s||s.version!==M.VERSION||!Array.isArray(s.tasks)||s.tasks.length>100||!s.tasks.every(d=>M.FAMILIES.some(f=>f.id===d.id)))return false;try{questions=s.tasks.map(d=>M.make(d.id,d.seed,d.challenge));session=s;session.index=Math.min(Math.max(0,s.index||0),questions.length-1);session.responses=session.responses||questions.map(()=>({}));session.meta=session.meta||questions.map(blankMeta);return true;}catch{return false;}}
hydrate(read(SESSION_KEY,null));
const current=()=>questions[session.index],meta=()=>session.meta[session.index],response=()=>session.responses[session.index];
function show(id){screen=id;['home','setup','play','result','info'].forEach(s=>$(s).classList.toggle('hidden',s!==id));document.body.classList.toggle('exam-mode',id==='play'&&session&&session.mode==='exam');if(id==='home')renderHome();if(id==='info')renderInfo();window.scrollTo(0,0);}
function ask(title,message,yes='Ja',no='Zur\u00fcck'){
 if(modalResolve){modalResolve(false);modalResolve=null;}
 lastFocused=document.activeElement;$('modalTitle').textContent=title;$('modalText').textContent=message;
 $('modalActions').innerHTML=`<button class="secondary" data-action="modalNo">${E(no)}</button><button data-action="modalYes">${E(yes)}</button>`;
 $('modal').classList.remove('hidden');setTimeout(()=>$('modalActions').firstElementChild.focus(),0);
 return new Promise(resolve=>modalResolve=resolve);
}
function closeModal(value){$('modal').classList.add('hidden');const r=modalResolve;modalResolve=null;if(lastFocused&&lastFocused.isConnected)lastFocused.focus();if(r)r(value);}
function renderHome(){
 $('stars').textContent='\u2b50 '+M.fmt(progress.stars)+' Sterne';
 const stats=Object.values(progress.stats),attempts=stats.reduce((s,v)=>s+(v.seen||0),0),ind=stats.reduce((s,v)=>s+(v.independent||0),0),open=stats.filter(v=>v.need>0).length;
 $('stats').innerHTML=`<div class="stat"><strong>${attempts}</strong><span>Aufgaben bearbeitet</span></div><div class="stat"><strong>${ind}</strong><span>selbstst\u00e4ndig ganz richtig</span></div><div class="stat"><strong>${open}</strong><span>Themen zum Wiederholen</span></div>`;
 const last=progress.runs.slice(-3).reverse();$('history').textContent=last.length?last.map(r=>`${r.mode==='exam'?'Probepr\u00fcfung':'Training'}: ${M.fmt(r.score)} / ${M.fmt(r.max)} Punkte (${r.date})`).join(' \u00b7 '):'Deine neuen \u00dcbungsergebnisse erscheinen hier.';
 const weak=M.FAMILIES.filter(f=>progress.stats[f.id]&&progress.stats[f.id].need>0).slice(0,5);
 $('topicProgress').innerHTML=weak.map(f=>`<div class="progress-topic"><div><strong>${E(f.title)}</strong><small>Eine neue Aufgabe ohne Hilfe probieren.</small></div><button class="secondary" data-action="singleFamily" data-family="${f.id}">\u00dcben</button></div>`).join('');
 $('resume').classList.toggle('hidden',!session||session.finished);
 if(session&&!session.finished)$('resume').innerHTML=`<h2>${session.mode==='exam'?'Deine Probepr\u00fcfung l\u00e4uft':'Deine Runde ist gespeichert'}</h2><p>Aufgabe ${session.index+1} von ${questions.length}.${session.mode==='exam'?' Die Pr\u00fcfungszeit l\u00e4uft weiter.':''}</p><button data-action="resume">Fortsetzen \u2192</button>`;
}
function renderInfo(){const adaptations={wallmax:'Anordnung und strukturierte Begr\u00fcndung',fit:'Passendes Erg\u00e4nzungsteil ausw\u00e4hlen',area:'Fl\u00e4chen in Gitterquadraten vergleichen',rotate:'R\u00e4umliche Figur unter Drehung erkennen',axes:'Geraden durch zwei Gitterpunkte setzen',net:'Zwei Quadrate erg\u00e4nzen; alle g\u00fcltigen L\u00f6sungen',certainty:'Kugeln mit B/R f\u00e4rben',chance:'Gleichen Anteil durch F\u00e4rben herstellen'};
 $('coverage').innerHTML='<table class="math-table"><tr><th>2025 Nr.</th><th>Kompetenz in dieser App</th><th>Digitale Umsetzung</th></tr>'+M.FAMILIES.filter(f=>f.ref).map(f=>`<tr><td>${f.ref}</td><td>${E(f.title)}</td><td>${E(adaptations[f.id]||'Eigene Varianten mit Eingaben / Entscheidungen')}</td></tr>`).join('')+'</table>';
}
function choose(m,chosenGroup='all',chosenFamily='all'){
 mode=m;group=chosenGroup;family=chosenFamily;
 $('setupTitle').textContent=m==='exam'?'\ud83d\udcdd Deine Probepr\u00fcfung':'\ud83c\udfae Dein Training';
 $('setupDesc').textContent=m==='exam'?'Bearbeite die Aufgaben in Ruhe und zeige, was du selbstst\u00e4ndig kannst.':'Erst selbst probieren, dann bei Bedarf Hilfe holen. Bei Fehlern k\u00f6nnen bis zu drei passende Wiederholungsaufgaben dazukommen.';
 $('trainingSetup').classList.toggle('hidden',m==='exam');$('examSetup').classList.toggle('hidden',m!=='exam');
 $('levelSelect').value='all';renderSetup();show('setup');
}
function renderSetup(){
 $('topicButtons').innerHTML=[['all','\ud83e\udde9 Alle Themen'],...M.GROUPS.map((t,i)=>[String(i),t]),['mistakes','\ud83c\udfaf Fehlertraining']].map(([id,t])=>`<button class="${String(group)===id?'selected':''}" data-action="group" data-group="${id}" aria-pressed="${String(group)===id}">${E(t)}</button>`).join('');
 let pool=M.FAMILIES.filter(f=>group==='all'||group==='mistakes'||f.group===Number(group));
 $('familySelect').innerHTML='<option value="all">Abwechslungsreiche Mischung</option>'+pool.map(f=>`<option value="${f.id}">${E(f.title)}</option>`).join('');$('familySelect').value=family;if(!$('familySelect').value){family='all';$('familySelect').value='all';}
}
function taskPool(){let p=M.FAMILIES.slice();if(group==='mistakes')p=p.filter(f=>progress.stats[f.id]&&progress.stats[f.id].need>0);else if(group!=='all')p=p.filter(f=>f.group===Number(group));if(family!=='all')p=p.filter(f=>f.id===family);const lev=$('levelSelect').value;if(lev==='think')p=p.filter(f=>f.level>0);if(lev==='base')p=p.filter(f=>f.level===0);return p;}
async function start(){
 if(session&&!session.finished&&session.mode!=='tutorial'&&!await ask('Gespeicherte Runde ersetzen?','Deine noch offene Runde wird beendet und durch die neue Runde ersetzt.','Neue Runde starten','Alte Runde behalten'))return;
 const s=seed();let list;
 if(mode==='exam'){const v=$('paperSelect').value;list=M.makeExam(v==='new'?s:Number(v));}
 else {
 let pool=taskPool();if(!pool.length){await ask('Keine passenden Aufgaben','In dieser Auswahl gibt es gerade keine Aufgaben. W\u00e4hle bitte alle Anforderungen oder eine andere Themenmischung.','Verstanden','Zur\u00fcck');return;}
 const n=Number($('lengthSelect').value),T=M.tools(s);let ids=[];
 if(group==='all'&&family==='all'&&$('levelSelect').value==='all'){
 const targets=[0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0];
 for(let i=0;i<n;i++){let sub=pool.filter(f=>f.level===targets[i]);let fresh=sub.filter(f=>!ids.includes(f.id));if(fresh.length)sub=fresh;const priority=f=>(progress.stats[f.id]?.need||0)*5-(progress.stats[f.id]?.seen||0)*.2;const best=Math.max(...sub.map(priority));ids.push(T.pick(sub.filter(f=>priority(f)===best)).id);}
 }else{let order=T.shuffle(pool).sort((a,b)=>(progress.stats[b.id]?.need||0)-(progress.stats[a.id]?.need||0));for(let i=0;i<n;i++)ids.push(order[i%order.length].id);}
 list=ids.map((id,i)=>M.make(id,(s+Math.imul(i+1,1597334677))>>>0,$('levelSelect').value==='think'));
 }
 launch(mode,list,s);
}
function launch(m,list,s){questions=list;session={version:M.VERSION,id:Date.now()+'-'+s,mode:m,seed:s,tasks:list.map(descriptor),index:0,responses:list.map(()=>({})),meta:list.map(blankMeta),flags:list.map(()=>false),notes:list.map(()=>''),started:Date.now(),end:m==='exam'?Date.now()+45*60*1000:null,finished:false,retries:0,awarded:0};palette={};pendingPoints={};saveSession();renderTask();show('play');tick();}
function resume(){if(!session||session.finished)return;if(session.mode==='exam'&&Date.now()>=session.end){finish(true);return;}renderTask();show('play');tick();}
const disabled=(locked)=>locked?' disabled':'';
function renderControl(p,value,locked=false,solution=false){
 const k=p.key,v=value==null?null:value,dis=disabled(locked),data=`data-key="${k}"`;
 if(p.type==='number')return `<div class="answer-row"><input type="text" inputmode="decimal" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="${E(p.label)}" ${data} data-input="number" value="${E(v==null?'':v)}" placeholder="Deine Zahl"${dis}><span class="unit">${E(p.unit||'')}</span></div>`;
 if(p.type==='list')return `<textarea ${data} data-input="list" aria-label="${E(p.label)}" placeholder="Zum Beispiel: 12, 13, ..."${dis}>${E(v||'')}</textarea>`;
 if(p.type==='choice')return `<div class="choices ${p.options.some(o=>o.svg)?'graphic-choices':''}">${p.options.map((o,i)=>`<button type="button" class="${o.svg?'graphic ':''}${v===o.id?'selected':''}" data-action="answerChoice" ${data} data-value="${E(o.id)}" aria-pressed="${v===o.id}"${dis}>${o.svg?`<span class="choice-letter">${String.fromCharCode(65+i)}</span>${o.svg}`:E(o.label)}</button>`).join('')}</div>`;
 if(p.type==='operation'){const a=Array.isArray(v)?v:['',''];return `<div class="answer-row"><div class="sign-buttons">${['+','-'].map(sign=>`<button class="secondary ${a[0]===sign?'selected':''}" data-action="sign" ${data} data-value="${sign}" aria-label="${sign==='+'?'Plus':'Minus'}" aria-pressed="${a[0]===sign}"${dis}>${sign==='-'?'\u2212':'+'}</button>`).join('')}</div><input class="short" type="text" inputmode="numeric" aria-label="Zahl des Rechenschritts" ${data} data-input="array" data-index="1" value="${E(a[1]||'')}" placeholder="Zahl" autocomplete="off"${dis}></div>`;}
 if(p.type==='clock'){const a=Array.isArray(v)?v:['',''];return `<div class="answer-row"><input class="short" type="text" inputmode="numeric" maxlength="2" aria-label="Stunde" ${data} data-input="array" data-index="0" value="${E(a[0]??'')}" placeholder="Std."${dis}><strong>:</strong><input class="short" type="text" inputmode="numeric" maxlength="2" aria-label="Minuten" ${data} data-input="array" data-index="1" value="${E(a[1]??'')}" placeholder="Min."${dis}><span>Uhr</span></div>`;}
 if(p.type==='perm'){const a=Array.isArray(v)?v:['','',''];return `<div class="answer-row">${['Links','Mitte','Rechts'].map((label,i)=>`<input class="short" type="text" inputmode="numeric" aria-label="${label}" ${data} data-input="array" data-index="${i}" value="${E(a[i]??'')}" placeholder="${label}"${dis}>`).join('')}</div>`;}
 if(p.type==='balls'){const a=Array.isArray(v)?v:Array(p.total).fill(null),col=palette[k]||'B';return `${locked?'':`<div class="palette"><button class="blue ${col==='B'?'active':''}" data-action="palette" ${data} data-value="B" aria-pressed="${col==='B'}">Blau (B)</button><button class="red ${col==='R'?'active':''}" data-action="palette" ${data} data-value="R" aria-pressed="${col==='R'}">Rot (R)</button></div><small>Farbe w\u00e4hlen, dann die Kugeln antippen. Leere Kugeln m\u00fcssen noch gef\u00e4rbt werden.</small>`}<div class="ball-grid">${a.map((c,i)=>`<button class="ball ${c==='B'?'blue':c==='R'?'red':''}" data-action="ball" ${data} data-index="${i}" aria-label="Kugel ${i+1}: ${c==='B'?'blau':c==='R'?'rot':'noch nicht gef\u00e4rbt'}"${dis}>${c||'?'}</button>`).join('')}</div>`;}
 if(p.type==='net'||p.type==='gridset'){
 const arr=Array.isArray(v)?v:[],set=new Set(arr.map(c=>c.join(','))),fixed=new Set(p.fixed.map(c=>c.join(','))),size=p.size;
 return `<div class="grid-wrap"><div class="cell-grid" style="grid-template-columns:repeat(${size},1fr)">${Array.from({length:size*size},(_,i)=>{const x=i%size,y=Math.floor(i/size),id=x+','+y,fix=fixed.has(id),active=set.has(id),blocked=p.restrict==='right'&&x<size/2;if(fix||blocked)return `<span class="cell ${fix?'fixed':'blocked'}" aria-label="${fix?'Vorgegebenes Feld':'Nicht bearbeitbar'}"></span>`;return `<button data-action="cell" ${data} data-x="${x}" data-y="${y}" class="${active?'selected':''}" aria-label="Spalte ${x+1}, Reihe ${y+1}" aria-pressed="${active}"${dis}>${active?'\u2713':''}</button>`;}).join('')}</div>${p.restrict==='right'?'<div class="mirror-axis"></div>':''}</div>${p.type==='net'?`<p class="end-note">${arr.length} von ${p.needed} zus\u00e4tzlichen Feldern ausgew\u00e4hlt.</p>`:''}`;
 }
 if(p.type==='axes')return axesControl(p,Array.isArray(v)?v:[],locked,solution);
 if(p.type==='chart'){
 const arr=Array.isArray(v)?v:Array(p.names.length).fill(null);let b='';for(let n=0;n<=p.limit;n++){let y=240-n*16;b+=`<path d="M45 ${y}H410" stroke="#d4deec"/>`+M.text(23,y+5,n,14);}p.names.forEach((name,i)=>{const x=75+i*112,h=(arr[i]||0)*16;b+=M.rect(x,240-h,55,h,'#a7c9ee')+M.text(x+27,265,name,17);if(!locked)for(let n=0;n<=p.limit;n++){b+=`<rect x="${x-12}" y="${240-n*16-8}" width="80" height="16" fill="transparent" data-action="bar" ${data} data-index="${i}" data-value="${n}"/>`;}});
 return `<div class="chart-editor">${M.svg(b,430,280,'Einstellbares S\u00e4ulendiagramm')}<div class="chart-controls">${p.names.map((name,i)=>`<label>${name}<select ${data} data-input="chart" data-index="${i}" aria-label="S\u00e4ulenh\u00f6he ${name}"${dis}><option value="" ${arr[i]===null?'selected':''}>H\u00f6he</option>${Array.from({length:p.limit+1},(_,n)=>`<option value="${n}" ${arr[i]===n?'selected':''}>${n}</option>`).join('')}</select></label>`).join('')}</div></div>`;
 }
 return '';
}
function axesControl(p,lines,locked,solution){
 let b='';for(let i=0;i<=8;i++)b+=`<path d="M${20+i*40} 20V340 M20 ${20+i*40}H340" stroke="#d8e0ee" stroke-width="1"/>`;
 b+=`<polygon points="${p.points.map(([x,y])=>`${20+x*40},${20+y*40}`).join(' ')}" fill="#d5e3ff" fill-opacity=".85" stroke="#435e94" stroke-width="2.5"/>`;
 for(const ends of lines){const l=M.lineKey(ends[0],ends[1]);if(!l)continue;const [a,bb,c]=l.split(',').map(Number),pts=[];if(bb!==0){for(const x of [0,8]){const y=(c-a*x)/bb;if(y>=0&&y<=8)pts.push([x,y]);}}if(a!==0){for(const y of [0,8]){const x=(c-bb*y)/a;if(x>=0&&x<=8)pts.push([x,y]);}}const unique=[...new Map(pts.map(x=>[x.join(','),x])).values()];if(unique.length>=2)b+=`<path d="M${20+unique[0][0]*40} ${20+unique[0][1]*40}L${20+unique[1][0]*40} ${20+unique[1][1]*40}" stroke="#b66c08" stroke-width="3.5" stroke-dasharray="8 4"/>`;}
 const pending=!locked?pendingPoints[p.key]:null;
 for(let y=0;y<=8;y++)for(let x=0;x<=8;x++){
 const selected=pending&&pending[0]===x&&pending[1]===y;b+=`<circle cx="${20+x*40}" cy="${20+y*40}" r="${selected?7:3}" fill="${selected?'#c67508':'#8397b6'}"/>`;
 if(!locked)b+=`<circle class="axis-dot" cx="${20+x*40}" cy="${20+y*40}" r="17" fill="transparent" tabindex="0" role="button" aria-label="Gitterpunkt ${x+1}, ${y+1}" data-action="axisPoint" data-key="${p.key}" data-x="${x}" data-y="${y}"/>`;
 }
 return `<div class="axis-editor">${M.svg(b,360,360,'Spiegelachsen zeichnen')}</div>${locked?'':`<p class="end-note" aria-live="polite">${pending?'Erster Punkt gesetzt. Tippe jetzt den zweiten Punkt an.':lines.length+' Gerade(n) eingezeichnet. Tippe zwei Gitterpunkte f\u00fcr eine weitere Gerade an.'}</p><div class="axes-controls"><button class="secondary" data-action="axisUndo" data-key="${p.key}">Letzte Linie entfernen</button><button class="secondary" data-action="axisClear" data-key="${p.key}">Alle Linien entfernen</button></div>`}`;
}
function renderPart(p){const node=$('part-'+p.key);if(!node)return;node.innerHTML=`<label class="part-label">${E(p.label)}<span class="part-meta">${M.fmt(p.max)} ${p.max===1?'Punkt':'Punkte'}</span></label>${p.visual?`<div class="part-visual">${p.visual}</div>`:''}${renderControl(p,response()[p.key],session.mode!=='exam'&&meta().done)}`;}
function renderNav(){if(!session||session.mode!=='exam')return;$('examNav').innerHTML=questions.map((q,i)=>{const g=M.grade(q,session.responses[i]);return `<button data-action="goto" data-index="${i}" class="${session.index===i?'current ':''}${g.complete?'answered ':''}${session.flags[i]?'flagged':''}" aria-label="Aufgabe ${i+1}${g.complete?', bearbeitet':''}${session.flags[i]?', gemerkt':''}" ${session.index===i?'aria-current="step"':''}>${i+1}</button>`;}).join('');}
function renderTask(focus=false){
 const q=current(),m=meta(),exam=session.mode==='exam',tutorial=session.mode==='tutorial';
 $('counter').textContent=`${tutorial?'Bedienung':'Aufgabe'} ${session.index+1} von ${questions.length}`;
 $('topicLabel').textContent=`${M.GROUPS[q.group]}${exam?'':' \u00b7 '+M.LEVELS[q.level]}${m.retry?' \u00b7 Neue Variante zum Wiederholen':''}`;
 $('bar').style.width=100*(session.index+1)/questions.length+'%';$('taskTitle').textContent=q.title;$('question').textContent=q.prompt;$('visual').innerHTML=q.visual||'';
 $('paperNote').classList.toggle('hidden',!q.paper);$('paperNote').textContent=q.paper||'';
 $('parts').innerHTML=q.parts.map(p=>`<div class="part" id="part-${p.key}"></div>`).join('');q.parts.forEach(renderPart);
 $('scratch').value=session.notes[session.index]||'';
 $('examNav').classList.toggle('hidden',!exam);$('navLegend').classList.toggle('hidden',!exam);renderNav();
 $('prev').disabled=session.index===0;$('check').classList.toggle('hidden',exam||m.done);$('hint').classList.toggle('hidden',exam||m.done);$('hint').disabled=m.hints>=q.hints.length;
 $('reveal').classList.toggle('hidden',exam||m.done);$('next').classList.toggle('hidden',!exam&&!m.done);$('next').textContent=session.index===questions.length-1?(exam?'Zur Abgabe\u2026':'Zur Auswertung \u2192'):(exam?'Weiter / auslassen \u2192':'Weiter \u2192');
 $('finish').classList.toggle('hidden',!exam);$('flag').classList.toggle('hidden',!exam);$('flag').textContent=session.flags[session.index]?'Markierung entfernen':'F\u00fcr sp\u00e4ter merken';
 $('leave').textContent=exam?'Verlassen (Zeit l\u00e4uft weiter)':'Unterbrechen und speichern';
 renderFeedback();tick();if(focus){$('taskTitle').focus({preventScroll:true});window.scrollTo(0,0);}
}
function solutionHTML(q){let s='<div class="solution-box"><h3>So kannst du es l\u00f6sen</h3><ol>'+q.steps.map(x=>`<li>${E(x)}</li>`).join('')+'</ol>';
 if(q.solutionVisual)s+=`<div class="visual">${q.solutionVisual}</div>`;
 for(const p of q.parts){const visualTypes=['net','axes','balls','gridset','chart'];const opt=p.type==='choice'?p.options.find(o=>o.id===p.answer):null;
 s+=`<div class="solution-part"><strong>${E(p.label)}</strong><br>${E(M.solutionText(p))}${opt&&opt.svg?opt.svg:''}${visualTypes.includes(p.type)?renderControl(p,M.answerValue(p),true,true):''}</div>`;
 }
 return s+'</div>';
}
function renderFeedback(){
 const q=current(),m=meta(),exam=session.mode==='exam';$('hints').classList.toggle('hidden',exam||m.hints===0);$('hints').innerHTML=m.hints?'<strong>\ud83d\udca1 Denkhinweis</strong>'+q.hints.slice(0,m.hints).map(h=>'<p>'+E(h)+'</p>').join(''):'';
 $('feedback').classList.toggle('hidden',exam||(!m.done&&!m.tries));$('solution').classList.toggle('hidden',exam||!m.done);
 if(exam){$('feedback').innerHTML='';$('solution').innerHTML='';return;}
 const g=M.grade(q,response());
 if(m.done){$('feedback').classList.toggle('bad',m.shown);const independent=m.firstIndependent&&m.first&&m.first.correct;
 $('feedback').innerHTML=m.shown?'<strong>\ud83e\udd8a Schau dir den Weg in Ruhe an.</strong><br>Diese Aufgabe bleibt zum Wiederholen vorgemerkt. Bei einer neuen Variante probierst du es wieder selbst.':independent?'<strong>\u2b50 Selbstst\u00e4ndig gel\u00f6st!</strong><br>Alle Teile sind richtig. Unten findest du den L\u00f6sungsweg zur Kontrolle.':'<strong>\u2713 Jetzt stimmt es!</strong><br>Du hast den Fehler verbessert. Eine neue Variante ohne Hilfe zeigt sp\u00e4ter, ob der Weg schon sicher sitzt.';
 $('solution').innerHTML=solutionHTML(q);
 }else if(m.tries){$('feedback').classList.add('bad');const wrong=g.parts.filter(p=>!p.correct).map(p=>q.parts.find(x=>x.key===p.key).label);$('feedback').innerHTML=`<strong>Schon ${M.fmt(g.score)} von ${M.fmt(g.max)} Punkten richtig.</strong><br>Pr\u00fcfe noch: ${wrong.map(E).join(' \u00b7 ')}.<br>Du kannst verbessern oder dir den L\u00f6sungsweg zeigen lassen.`;$('solution').innerHTML='';}
}
function setValue(p,v,redraw=true){if(!session||session.finished||(session.mode!=='exam'&&meta().done))return;response()[p.key]=v;saveSession();if(redraw)renderPart(p);renderNav();}
function handleInput(event){const t=event.target;if(!session||screen!=='play')return;if(t.id==='scratch'){session.notes[session.index]=t.value;saveSession();return;}if(!t.dataset.input)return;const p=current().parts.find(p=>p.key===t.dataset.key);if(!p)return;
 if(t.dataset.input==='array'){const len=p.type==='perm'?3:2,arr=Array.isArray(response()[p.key])?response()[p.key].slice():Array(len).fill('');arr[Number(t.dataset.index)]=t.value;setValue(p,arr,false);}
 else if(t.dataset.input==='chart'){const arr=Array.isArray(response()[p.key])?response()[p.key].slice():Array(p.names.length).fill(null);arr[Number(t.dataset.index)]=t.value===''?null:Number(t.value);setValue(p,arr,true);}
 else setValue(p,t.value,false);
}
function recordTraining(){const q=current(),m=meta();if(m.recorded||session.mode==='tutorial')return;m.recorded=true;const st=progress.stats[q.id]||(progress.stats[q.id]={seen:0,independent:0,assisted:0,need:0,firstPoints:0,totalPoints:0});st.seen++;
 const independent=m.firstIndependent&&m.first&&m.first.correct;
 if(independent){st.independent++;st.need=Math.max(0,st.need-1);}else{st.assisted++;st.need=2;}
 st.firstPoints+=(m.firstIndependent&&m.first?m.first.score:0);st.totalPoints+=M.grade(q,{}).max;st.lastSeed=q.seed;
 const stars=independent?2:!m.shown?1:0;progress.stars+=stars;session.awarded+=stars;
 if(!independent&&session.retries<3&&!m.retry){const at=Math.min(questions.length,session.index+3),newQ=M.make(q.id,seed(),q.challenge),nm=blankMeta();nm.retry=true;questions.splice(at,0,newQ);session.tasks.splice(at,0,descriptor(newQ));session.responses.splice(at,0,{});session.meta.splice(at,0,nm);session.flags.splice(at,0,false);session.notes.splice(at,0,'');session.retries++;}
 write(DATA_KEY,progress);$('stars').textContent='\u2b50 '+progress.stars+' Sterne';
}
function firstResult(){const m=meta();if(!m.first){m.first=M.grade(current(),response());m.firstResponse=JSON.parse(JSON.stringify(response()));m.firstIndependent=m.hints===0&&!m.shown;}}
function check(){if(session.mode==='exam'||meta().done)return;const g=M.grade(current(),response());if(!g.answered){$('feedback').classList.remove('hidden');$('feedback').classList.add('bad');$('feedback').textContent='Probiere zuerst eine Antwort. Wenn du nicht weiterwei\u00dft, hilft dir der Tipp oder der L\u00f6sungsweg.';return;}
 firstResult();meta().tries++;if(g.correct){meta().done=true;recordTraining();}else{meta().hints=Math.min(current().hints.length,meta().hints+1);}
 saveSession();renderTask();$('feedback').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function hint(){if(session.mode==='exam'||meta().done)return;meta().hints=Math.min(current().hints.length,meta().hints+1);saveSession();renderFeedback();$('hint').disabled=meta().hints>=current().hints.length;$('hints').scrollIntoView({block:'nearest',behavior:'smooth'});}
async function reveal(){if(session.mode==='exam'||meta().done)return;if(!await ask('L\u00f6sungsweg ansehen?','Du bekommst die Erkl\u00e4rung und eine richtige L\u00f6sung. Diese Aufgabe z\u00e4hlt dann nicht als selbstst\u00e4ndig gel\u00f6st.','Erkl\u00e4rung zeigen','Weiter probieren'))return;
 firstResult();meta().shown=true;meta().firstIndependent=false;meta().done=true;recordTraining();saveSession();renderTask();$('solution').scrollIntoView({block:'start',behavior:'smooth'});
}
function go(i){if(i<0||i>=questions.length)return;pendingPoints={};session.index=i;saveSession();renderTask(true);}
async function next(){if(session.mode!=='exam'&&!meta().done)return;if(session.index===questions.length-1){if(session.mode==='exam')confirmFinish();else finish();}else go(session.index+1);}
async function confirmFinish(){if(!session||session.finished)return;const missing=questions.filter((q,i)=>!M.grade(q,session.responses[i]).complete).length,marked=session.flags.filter(Boolean).length;
 if(await ask('Pr\u00fcfung abgeben?',`${missing?missing+' Aufgaben sind noch nicht vollst\u00e4ndig bearbeitet. ':'Alle Aufgaben sind bearbeitet. '}${marked?marked+' Aufgaben sind noch gemerkt. ':''}Nach der Abgabe kannst du die Antworten nicht mehr \u00e4ndern. Die L\u00f6sungswege werden dann sichtbar.`, 'Jetzt abgeben','Noch kontrollieren'))finish();
}
function finish(timeout=false){if(!session||session.finished)return;session.finished=true;session.ended=Date.now();session.timeout=timeout;
 if(modalResolve)closeModal(false);
 const graded=questions.map((q,i)=>session.mode==='exam'?M.grade(q,session.responses[i]):session.meta[i].first||M.grade(q,{}));
 const score=graded.reduce((s,g)=>s+g.score,0),max=graded.reduce((s,g)=>s+g.max,0);
 if(session.mode==='exam'){
 questions.forEach((q,i)=>{const st=progress.stats[q.id]||(progress.stats[q.id]={seen:0,independent:0,assisted:0,need:0,firstPoints:0,totalPoints:0});st.seen++;st.firstPoints+=graded[i].score;st.totalPoints+=graded[i].max;if(graded[i].correct){st.independent++;st.need=Math.max(0,st.need-1);}else st.need=2;});
 }
 if(session.mode!=='tutorial'){progress.runs.push({mode:session.mode,score,max,independent:session.meta.filter(m=>m.firstIndependent&&m.first&&m.first.correct).length,totalTasks:questions.length,date:new Date().toLocaleDateString('de-DE'),seed:session.seed});progress.runs=progress.runs.slice(-30);write(DATA_KEY,progress);}
 saveSession();renderResult();show('result');
}
function responseText(p,v){if(v==null||v===''||(Array.isArray(v)&&!v.length))return 'Nicht beantwortet';if(p.type==='choice'){const o=p.options.find(o=>o.id===v);if(o&&o.svg)return 'Abbildung '+String.fromCharCode(65+p.options.indexOf(o));return o?o.label:'Keine Auswahl';}if(p.type==='balls')return `${v.filter(x=>x==='B').length} blau, ${v.filter(x=>x==='R').length} rot, ${v.filter(x=>!x).length} leer`;if(p.type==='net'||p.type==='gridset')return v.length+' Felder markiert';if(p.type==='axes')return v.length+' Linie(n) gezeichnet';if(p.type==='clock')return v.map(x=>x||'?').join(':')+' Uhr';if(Array.isArray(v))return v.map(x=>x==null?'?':x).join(' | ');return String(v);}
function renderResult(){
 const exam=session.mode==='exam',tutorial=session.mode==='tutorial',grades=questions.map((q,i)=>exam?M.grade(q,session.responses[i]):session.meta[i].first||M.grade(q,{})),score=grades.reduce((s,g)=>s+g.score,0),max=grades.reduce((s,g)=>s+g.max,0),unassisted=session.meta.filter(m=>m.firstIndependent&&m.first&&m.first.correct).length;
 $('resultTitle').textContent=tutorial?'\ud83d\udc4d Bedienung ausprobiert':exam?'\ud83d\udcdd Deine Probepr\u00fcfung':'\ud83e\udd8a Deine Lernrunde';
 $('resultText').innerHTML=tutorial?'<p>Du kennst jetzt die besonderen Eingaben. Im Training kannst du jederzeit Tipps holen.</p>':exam?`<div class="score-hero">${M.fmt(score)} / ${M.fmt(max)} Punkte</div><p>Ergebnis deiner abgegebenen Antworten: ${Math.round(score/max*100)} %.</p>${session.timeout?'<p class="status-note">Die 45 Minuten sind abgelaufen. Deine gespeicherten Antworten wurden abgegeben.</p>':''}<p class="status-note">Dies ist eine \u00dcbungsauswertung, keine Kompass-4-Note oder Schulformprognose. Auch viele Punkte ersetzen nicht das sichere L\u00f6sen neuer Aufgaben.</p>`:`<div class="score-hero">${unassisted} / ${questions.length}</div><p><strong>Aufgaben beim ersten Versuch ohne Hilfe ganz richtig.</strong></p><p>+${session.awarded} Sterne f\u00fcr diese Runde. Aufgaben mit Tipps oder angeschautem L\u00f6sungsweg z\u00e4hlen oben nicht als selbstst\u00e4ndig gel\u00f6st.</p><p>Erste Antworten, gegebenenfalls mit Hilfe: ${M.fmt(score)} / ${M.fmt(max)} Punkte. In der Auswertung findest du die erkl\u00e4rten L\u00f6sungen.</p><p class="status-note">Eine neue Variante ohne Hilfe zeigt, ob du den Weg schon sicher kannst. Die Zahlen hier sind keine Kompass-4-Note.</p>`;
 $('resultGroups').innerHTML=tutorial?'':M.GROUPS.map((name,g)=>{const gs=grades.filter((_,i)=>questions[i].group===g),s=gs.reduce((n,v)=>n+v.score,0),m=gs.reduce((n,v)=>n+v.max,0);return m?`<div class="progress-topic"><strong>${E(name)}</strong><span>${M.fmt(s)} / ${M.fmt(m)} Punkte</span></div>`:'';}).join('');
 $('review').innerHTML=questions.map((q,i)=>{const g=grades[i],r=exam?session.responses[i]:session.meta[i].firstResponse||{};return `<details class="review-item"><summary><span class="${g.correct?'score-good':'score-partial'}">${g.correct?'\u2713':'\u2192'}</span> ${i+1}. ${E(q.title)} \u00b7 ${M.fmt(g.score)} / ${M.fmt(g.max)}</summary><div class="review-body"><div class="question">${E(q.prompt)}</div>${q.visual?`<div class="visual">${q.visual}</div>`:''}${q.parts.map((p,j)=>`<div class="review-answer"><strong>${E(p.label)}</strong><br>Deine ${exam?'':'erste '}Antwort: ${E(responseText(p,r[p.key]))} \u00b7 ${M.fmt(g.parts[j].score)} / ${M.fmt(g.parts[j].max)} Punkte${p.visual?`<div class="part-visual">${p.visual}</div>`:''}${['net','axes','gridset','balls','chart'].includes(p.type)&&r[p.key]?renderControl(p,r[p.key],true):''}</div>`).join('')}${solutionHTML(q)}</div></details>`;}).join('');
}
function tick(){if(!session||session.finished||session.mode!=='exam'){if(screen==='play')$('timer').textContent=session?.mode==='tutorial'?'Ohne Punkte':'Ohne Zeitdruck';return;}const remaining=Math.max(0,Math.ceil((session.end-Date.now())/1000));if(screen==='play')$('timer').textContent=`\u23f1 ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;if(remaining===0)finish(true);}
async function leave(){if(session.mode==='exam'&&!await ask('Pr\u00fcfung unterbrechen?','Du kannst zur Startseite gehen. Die 45 Minuten laufen trotzdem weiter, auch wenn du die App schlie\u00dft.','Zur Startseite','Weiterarbeiten'))return;saveSession();show('home');}
async function backup(){const blob=new Blob([JSON.stringify({app:'Mathe-Mission-4',version:5,progress,session},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Mathe-Mission-Fortschritt.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function restoreFile(file){try{if(!file||file.size>3e6)throw new Error('Die Datei ist zu gro\u00df.');const d=JSON.parse(await file.text());if(d.app!=='Mathe-Mission-4'||d.version!==5||d.progress?.schema!==5||!Number.isFinite(d.progress.stars)||!Array.isArray(d.progress.runs)||typeof d.progress.stats!=='object')throw new Error('Keine passende Sicherungsdatei.');if(await ask('Sicherung einlesen?','Der aktuelle Fortschritt dieses Ger\u00e4ts wird durch die Sicherung ersetzt.','Sicherung verwenden','Abbrechen')){progress=d.progress;write(DATA_KEY,progress);if(!hydrate(d.session)){session=null;questions=[];remove(SESSION_KEY);}else saveSession();show('home');}}catch(e){await ask('Sicherung nicht eingelesen',e.message,'Verstanden','Zur\u00fcck');}}
async function action(e){const t=e.target.closest('[data-action]');if(!t||t.disabled)return;const a=t.dataset.action,k=t.dataset.key,p=session&&screen==='play'?current().parts.find(p=>p.key===k):null;
 if(a==='modalYes')return closeModal(true);if(a==='modalNo')return closeModal(false);
 if(a==='home'){if(screen==='play')return leave();show('home');return;}
 if(a==='choose')return choose(t.dataset.mode);if(a==='group'){group=t.dataset.group;family='all';renderSetup();return;}
 if(a==='start')return start();if(a==='resume')return resume();if(a==='info'){show('info');return;}
 if(a==='mistakes'||a==='resultTrain')return choose('train','mistakes');if(a==='singleFamily')return choose('train','all',t.dataset.family);
 if(a==='tutorial'){if(session&&!session.finished&&!await ask('Bedienung starten?','Die noch offene Runde wird durch das Bedienungstraining ersetzt.','Starten','Zur\u00fcck'))return;const s=seed();return launch('tutorial',['axes','net','certainty'].map((id,i)=>M.make(id,s+i)),s);}
 if(a==='backup')return backup();if(a==='restore')return $('restoreFile').click();
 if(a==='reset'){if(await ask('Fortschritt l\u00f6schen?','Sterne, Lernverlauf und die gespeicherte Runde dieses Ger\u00e4ts werden gel\u00f6scht.','Wirklich l\u00f6schen','Behalten')){progress=emptyProgress();write(DATA_KEY,progress);session=null;questions=[];remove(SESSION_KEY);show('home');}return;}
 if(!session||session.finished||screen!=='play')return;
 if(a==='next')return next();if(a==='prev')return go(session.index-1);if(a==='goto')return go(Number(t.dataset.index));if(a==='check')return check();if(a==='hint')return hint();if(a==='reveal')return reveal();if(a==='finish')return confirmFinish();if(a==='leave')return leave();
 if(a==='flag'){session.flags[session.index]=!session.flags[session.index];saveSession();renderTask();return;}
 if(!p||(session.mode!=='exam'&&meta().done))return;
 if(a==='answerChoice')return setValue(p,t.dataset.value);
 if(a==='sign'){const v=Array.isArray(response()[k])?response()[k].slice():['',''];v[0]=t.dataset.value;return setValue(p,v);}
 if(a==='palette'){palette[k]=t.dataset.value;return renderPart(p);}
 if(a==='ball'){const v=Array.isArray(response()[k])?response()[k].slice():Array(p.total).fill(null);v[Number(t.dataset.index)]=palette[k]||'B';return setValue(p,v);}
 if(a==='cell'){const v=Array.isArray(response()[k])?response()[k].slice():[],x=Number(t.dataset.x),y=Number(t.dataset.y),found=v.findIndex(c=>c[0]===x&&c[1]===y);if(found>=0)v.splice(found,1);else{if(p.type==='net'&&v.length>=p.needed){$('feedback').classList.remove('hidden');$('feedback').textContent='Du hast schon zwei zus\u00e4tzliche Felder markiert. Entferne zuerst eines, um ein anderes zu w\u00e4hlen.';return;}v.push([x,y]);}return setValue(p,v);}
 if(a==='axisPoint'){const point=[Number(t.dataset.x),Number(t.dataset.y)],pending=pendingPoints[k];if(!pending){pendingPoints[k]=point;return renderPart(p);}if(pending[0]===point[0]&&pending[1]===point[1]){delete pendingPoints[k];return renderPart(p);}const v=Array.isArray(response()[k])?response()[k].slice():[],l=M.lineKey(pending,point);if(!v.some(v=>M.lineKey(v[0],v[1])===l))v.push([pending,point]);delete pendingPoints[k];return setValue(p,v);}
 if(a==='axisUndo'){delete pendingPoints[k];const v=Array.isArray(response()[k])?response()[k].slice():[];v.pop();return setValue(p,v);}
 if(a==='axisClear'){delete pendingPoints[k];return setValue(p,[]);}
 if(a==='bar'){const v=Array.isArray(response()[k])?response()[k].slice():Array(p.names.length).fill(null);v[Number(t.dataset.index)]=Number(t.dataset.value);return setValue(p,v);}
}
document.addEventListener('click',e=>{Promise.resolve(action(e)).catch(reportError);});
document.addEventListener('input',handleInput);
document.addEventListener('change',e=>{if(e.target.id==='familySelect')family=e.target.value;if(e.target.dataset.input==='chart')handleInput(e);if(e.target.id==='restoreFile'){restoreFile(e.target.files[0]);e.target.value='';}});
document.addEventListener('keydown',e=>{
 if(!$('modal').classList.contains('hidden')){if(e.key==='Escape'){e.preventDefault();closeModal(false);}if(e.key==='Tab'){const buttons=[...$('modal').querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
 if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('axis-dot')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
 if(e.key==='Enter'&&!e.isComposing&&e.target.tagName==='INPUT'&&screen==='play'&&session?.mode!=='exam'){e.preventDefault();if(!meta().done)check();}
});
function reportError(e){console.error(e);$('error').classList.remove('hidden');$('error').textContent='Die App konnte diese Aktion nicht abschlie\u00dfen. Deine zuletzt gespeicherten Antworten bleiben erhalten. Lade die Seite neu. Fehler: '+(e.message||e);}
window.addEventListener('error',e=>reportError(e.error||e));
window.addEventListener('unhandledrejection',e=>reportError(e.reason||e));
window.addEventListener('pagehide',saveSession);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();saveSession();});setInterval(tick,1000);
async function offlineStatus(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext){$('offlineStatus').textContent='Im Browser nutzbar. Offline-Installation ben\u00f6tigt die HTTPS-Webadresse.';return;}
 try{
 const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await reg.update().catch(()=>{});
 const check=()=>{const worker=navigator.serviceWorker.controller||reg.active;if(!worker){$('offlineStatus').textContent='Offline-Dateien werden gespeichert.';return;}
 const channel=new MessageChannel();channel.port1.onmessage=e=>{if(e.data?.type==='STATUS'){$('offlineStatus').textContent=e.data.ready?'\u2713 Offline bereit \u00b7 Version '+e.data.version:'Offline-Speicherung noch nicht vollst\u00e4ndig.';if(e.data.version!==M.VERSION){$('offlineStatus').innerHTML='Neue App-Version verf\u00fcgbar. <a href="./aktualisieren.html">Jetzt aktualisieren</a>';}}};worker.postMessage({type:'STATUS'},[channel.port2]);};
 navigator.serviceWorker.addEventListener('controllerchange',check);check();navigator.serviceWorker.ready.then(check);window.addEventListener('online',()=>{reg.update().catch(()=>{});check();});
 }catch{$('offlineStatus').textContent='Offline-Speicherung konnte gerade nicht gepr\u00fcft werden. Bei Internetverbindung neu \u00f6ffnen.';}
}
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')window.MMTest={load:(id,s=23,m='train',challenge=false)=>{launch(m,[M.make(id,s,challenge)],s);},launchExam:s=>launch('exam',M.makeExam(s),s),snapshot:()=>({session,questions,progress,screen}),setEnd:t=>{session.end=t;saveSession();tick();},makeResult:()=>finish(),go:i=>go(i)};
show('home');offlineStatus();tick();
})();
