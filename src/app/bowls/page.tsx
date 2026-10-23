'use client';
import {useEffect,useMemo,useState} from 'react';
import {Plus,Trash2,Trophy,Save} from 'lucide-react';
import teams from '@/data/teams.json';
import styles from './bowls.module.css';
import {calculateBracket, type BracketState, type Match} from '@/lib/bracket';

type Bowl={id:string;name:string;logo:string;home:string;away:string;homeScore:string;awayScore:string;date:string;notes:string;linkMatchId?:string};
const KEY='gridiron-manual-bowls-v1';
const BRACKET_KEY='gridiron-lab-v1';
const roundLabel=(r:number,total:number)=>r===total-1?'National Championship':r===total-2?'Semifinals':r===total-3?'Quarterfinals':r===total-4?'Round of 16':r===0?'First Round':`Round ${r+1}`;
const NAMES=['Rose Bowl','Sugar Bowl','Orange Bowl','Cotton Bowl Classic','Fiesta Bowl','Peach Bowl','Citrus Bowl','Alamo Bowl','Gator Bowl','Pop-Tarts Bowl','Sun Bowl','Music City Bowl','Liberty Bowl','Birmingham Bowl','Texas Bowl','ReliaQuest Bowl','Holiday Bowl','Duke’s Mayo Bowl','Pinstripe Bowl','Military Bowl','Fenway Bowl','Independence Bowl','Armed Forces Bowl','Las Vegas Bowl','Arizona Bowl','Hawaii Bowl','New Orleans Bowl','Boca Raton Bowl','Gasparilla Bowl','Celebration Bowl','Other / Custom'];
const BUILTIN_BOWL_LOGOS:Record<string,string>={
  'rose bowl':'/bowl-logos/rose-bowl.png',
  'sugar bowl':'/bowl-logos/sugar-bowl.png',
  'orange bowl':'/bowl-logos/orange-bowl.png',
  'cotton bowl':'/bowl-logos/cotton-bowl.png',
  'fiesta bowl':'/bowl-logos/fiesta-bowl.png',
  'peach bowl':'/bowl-logos/peach-bowl.png',
  'citrus bowl':'/bowl-logos/citrus-bowl.png',
  'alamo bowl':'/bowl-logos/alamo-bowl.png',
  'gator bowl':'/bowl-logos/gator-bowl.png',
  'pop tarts bowl':'/bowl-logos/pop-tarts-bowl.png',
  'sun bowl':'/bowl-logos/sun-bowl.png',
  'music city bowl':'/bowl-logos/music-city-bowl.png',
  'liberty bowl':'/bowl-logos/liberty-bowl.png',
  'holiday bowl':'/bowl-logos/holiday-bowl.png',
  'pinstripe bowl':'/bowl-logos/pinstripe-bowl.png',
  'military bowl':'/bowl-logos/military-bowl.png',
  'fenway bowl':'/bowl-logos/fenway-bowl.png',
  'independence bowl':'/bowl-logos/independence-bowl.png',
  'armed forces bowl':'/bowl-logos/armed-forces-bowl.png',
  'las vegas bowl':'/bowl-logos/las-vegas-bowl.png',
  'arizona bowl':'/bowl-logos/arizona-bowl.png',
  'new orleans bowl':'/bowl-logos/new-orleans-bowl.png',
  'boca raton bowl':'/bowl-logos/boca-raton-bowl.png',
  'gasparilla bowl':'/bowl-logos/gasparilla-bowl.png',
  'celebration bowl':'/bowl-logos/celebration-bowl.png',
};
const schools=(teams as {id:string;name:string;logo?:string;division:string;conference?:string}[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalize=(value:string)=>value.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const builtinLogoFor=(name:string)=>{
  const normalized=normalize(name);
  return Object.entries(BUILTIN_BOWL_LOGOS).find(([key])=>normalized.includes(key))?.[1]||'';
};
export default function BowlGames(){
 const [ready,setReady]=useState(false),[year,setYear]=useState('2026'),[bowls,setBowls]=useState<Bowl[]>([]);
 const [name,setName]=useState(NAMES[0]);
 const [bracket,setBracket]=useState<BracketState|null>(null);
 const [customTeams,setCustomTeams]=useState<typeof schools>([]);
 const [bowlFilters,setBowlFilters]=useState<Record<string,{division:string;conference:string}>>({});
 const [lastDeleted,setLastDeleted]=useState<{bowl:Bowl;index:number}|null>(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){setYear(String(saved.year||'2026'));if(Array.isArray(saved.bowls))setBowls(saved.bowls)}}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify({year,bowls}))},[year,bowls,ready]);
 useEffect(()=>{const reload=()=>{try{const current=JSON.parse(localStorage.getItem(BRACKET_KEY)||'null');setBracket(current?.bracket?.seedIds?current.bracket:null);setCustomTeams(Array.isArray(current?.customTeams)?current.customTeams:[])}catch{setBracket(null);setCustomTeams([])}};reload();window.addEventListener('focus',reload);window.addEventListener('storage',reload);return()=>{window.removeEventListener('focus',reload);window.removeEventListener('storage',reload)}},[]);
 const bracketRounds=useMemo(()=>bracket?calculateBracket(bracket):[],[bracket]);
 const bracketMatches=useMemo(()=>bracketRounds.flat(),[bracketRounds]);
 const bracketMap=useMemo(()=>new Map([...schools,...customTeams].map(t=>[t.id,t])),[customTeams]);

 const teamMap=useMemo(()=>new Map(schools.map(t=>[t.id,t])),[]);
 const divisions=useMemo(()=>Array.from(new Set(schools.map(t=>t.division).filter(Boolean))).sort(),[]);
 const changeBowlFilter=(id:string, patch:Partial<{division:string;conference:string}>)=>setBowlFilters(current=>({ ...current, [id]:{division:'All',conference:'All',...current[id],...patch} }));
 const update=(id:string,patch:Partial<Bowl>)=>setBowls(a=>a.map(b=>b.id===id?{...b,...patch}:b));
 function add(){setBowls(a=>[...a,{id:uid(),name:name==='Other / Custom'?'Custom Bowl':name,logo:'',home:'',away:'',homeScore:'',awayScore:'',date:'',notes:''}]);}
 function removeBowl(id:string){
  const index=bowls.findIndex(b=>b.id===id);
  if(index<0)return;
  setLastDeleted({bowl:bowls[index],index});
  setBowls(current=>current.filter(b=>b.id!==id));
  setBowlFilters(current=>{const next={...current};delete next[id];return next;});
 }
 function undoDelete(){
  if(!lastDeleted)return;
  const {bowl,index}=lastDeleted;
  setBowls(current=>current.some(b=>b.id===bowl.id)?current:[...current.slice(0,Math.min(index,current.length)),bowl,...current.slice(Math.min(index,current.length))]);
  setLastDeleted(null);
 }
 return <main className={styles.page}><div className={styles.shell}><div className={styles.kicker}>GRIDIRON LAB / MANUAL POSTSEASON</div><h1>Bowl <em>Games</em></h1><p>Built-in bowl logos are now included automatically for supported bowls, so you can create matchups right away without uploading logos yourself.</p>
 <div className={styles.actions}><label>Season <input className={styles.year} value={year} onChange={e=>setYear(e.target.value)} maxLength={12}/></label><label>Add bowl <select value={name} onChange={e=>setName(e.target.value)}>{NAMES.map(n=><option key={n}>{n}</option>)}</select></label><button onClick={add}><Plus size={16}/> Add Bowl</button></div>
 <div className={styles.grid}>{bowls.map(b=>{const bowlLogo=builtinLogoFor(b.name);
 const filters=bowlFilters[b.id]||{division:'All',conference:'All'};
 const conferences=Array.from(new Set(schools.filter(t=>filters.division==='All'||t.division===filters.division).map(t=>t.conference||'Independent'))).sort();
 const linked=b.linkMatchId?bracketMatches.find(m=>m.id===b.linkMatchId):undefined;
 const linkedAway=linked?.entries[0]?.id||'';const linkedHome=linked?.entries[1]?.id||'';
 const filteredSchools=schools.filter(t=>(filters.division==='All'||t.division===filters.division)&&(filters.conference==='All'||(t.conference||'Independent')===filters.conference));
 return <article key={b.id} className={styles.card}><div className={styles.cardTop}><div className={styles.emblem}>{bowlLogo?<img src={bowlLogo} alt={`${b.name} logo`}/>:<Trophy size={30}/>}</div><div className={styles.titleArea}><input aria-label="Bowl name" value={b.name} onChange={e=>update(b.id,{name:e.target.value})}/>{bowlLogo?<div className={styles.builtinTag}>Built-in logo included</div>:<div className={styles.builtinTagMuted}>No built-in logo for this bowl yet</div>}</div><button className={styles.delete} title="Remove bowl" aria-label={`Remove ${b.name}`} type="button" onClick={()=>removeBowl(b.id)}><Trash2 size={17}/></button></div>

 <section className={styles.cardFilters} aria-label={`${b.name} team filters`}>
 <div className={styles.cardFilterTitle}>Filter teams <span>{filteredSchools.length} available</span></div>
 <div className={styles.cardFilterInputs}>
 <label>Division<select aria-label={`${b.name} division filter`} value={filters.division} onChange={e=>changeBowlFilter(b.id,{division:e.target.value,conference:'All'})}><option value="All">All divisions</option>{divisions.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
 <label>Conference<select aria-label={`${b.name} conference filter`} value={filters.conference} onChange={e=>changeBowlFilter(b.id,{conference:e.target.value})}><option value="All">All conferences</option>{conferences.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
 </div></section>
 <section className={styles.bracketLink} aria-label={`${b.name} bracket assignment`}>
 <label>Matchup source<select value={b.linkMatchId?'bracket':'manual'} onChange={e=>update(b.id,{linkMatchId:e.target.value==='manual'?'':bracketMatches[0]?.id||''})}><option value="manual">Manual bowl teams</option><option value="bracket" disabled={!bracketMatches.length}>Link playoff bracket</option></select></label>
 {b.linkMatchId&&<><label>Playoff matchup<select value={b.linkMatchId} onChange={e=>update(b.id,{linkMatchId:e.target.value})}>{!bracketMatches.some(m=>m.id===b.linkMatchId)&&<option value={b.linkMatchId}>Previous matchup unavailable — reassign below</option>}{bracketRounds.flatMap((round,r)=>round.filter(m=>!m.bye).map(m=><option key={m.id} value={m.id}>{roundLabel(r,bracketRounds.length)} · Game {m.index+1}</option>))}</select></label><div className={styles.linkNote}>{linked?`Bracket-linked • ${linked.winner?'Winner decided':'Awaiting manual bracket results'}`:'The linked game no longer exists in the current bracket. Choose a new matchup.'} <a href="/">Edit bracket ↗</a></div></>}
 {b.linkMatchId&&bowls.some(other=>other.id!==b.id&&other.linkMatchId===b.linkMatchId)&&<div className={styles.linkWarning}>Another bowl is linked to the same playoff matchup.</div>}
 </section>
 <div className={styles.match}>{(['away','home'] as const).map(side=><div className={styles.teamLine} key={side}>{(b.linkMatchId?(side==='away'?linkedAway:linkedHome):b[side])&&bracketMap.get(b.linkMatchId?(side==='away'?linkedAway:linkedHome):b[side])?.logo?<img src={bracketMap.get(b.linkMatchId?(side==='away'?linkedAway:linkedHome):b[side])?.logo} alt=""/>:<span className={styles.teamIcon}>—</span>}<select aria-label={`${side} team`} disabled={!!b.linkMatchId} value={b.linkMatchId?(side==='away'?linkedAway:linkedHome):b[side]} onChange={e=>update(b.id,{[side]:e.target.value})}><option value="">{b.linkMatchId?'TBD / Bye':`Select ${side} team`}</option>{(b.linkMatchId?[...bracketMap.values()]:filteredSchools.concat(b[side]&&!filteredSchools.some(s=>s.id===b[side])&&teamMap.has(b[side])?[teamMap.get(b[side])!]:[])).map(s=><option key={s.id} value={s.id}>{s.name} ({s.division}{s.conference?` · ${s.conference}`:''})</option>)}</select><input className={styles.score} aria-label={`${side} score`} type="text" inputMode="numeric" maxLength={3} placeholder="—" disabled={!!b.linkMatchId} value={b.linkMatchId?(linked&&bracket?.scores?.[linked.id]?.[side==='away'?0:1]||''):b[side==='away'?'awayScore':'homeScore']} onChange={e=>update(b.id,{[side==='away'?'awayScore':'homeScore']:e.target.value.replace(/\D/g,'')})}/></div>)}</div>
 <div className={styles.extra}><label>Date <input type="date" value={b.date} onChange={e=>update(b.id,{date:e.target.value})}/></label><label>Notes <input placeholder="Location, sponsor, etc." value={b.notes} onChange={e=>update(b.id,{notes:e.target.value})}/></label></div></article>})}</div>
 {lastDeleted&&<div role="status" style={{marginTop:16,padding:"12px 16px",border:"1px solid #42536a",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><span>Removed {lastDeleted.bowl.name}.</span><button type="button" onClick={undoDelete} style={{cursor:"pointer",border:"1px solid #e5be74",borderRadius:8,padding:"7px 14px",background:"transparent",color:"#e5be74"}}>Undo Delete</button></div>}
 {bowls.length===0?<div className={styles.empty}>No bowls yet. Choose a bowl above and click <strong>Add Bowl</strong> to create your first matchup.</div>:null}
 <div className={styles.tip}><Save size={16}/> Changes save automatically in this browser. To preserve bowls with a season, use <a href="/library">Saved Seasons</a>.</div></div></main>
}
