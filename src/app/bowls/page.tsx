'use client';
import {useEffect,useMemo,useState} from 'react';
import {Plus,Trash2,Trophy,Save} from 'lucide-react';
import teams from '@/data/teams.json';
import styles from './bowls.module.css';

type Bowl={id:string;name:string;logo:string;home:string;away:string;homeScore:string;awayScore:string;date:string;notes:string};
const KEY='gridiron-manual-bowls-v1';
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
const schools=(teams as {id:string;name:string;logo?:string;division:string}[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalize=(value:string)=>value.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const builtinLogoFor=(name:string)=>{
  const normalized=normalize(name);
  return Object.entries(BUILTIN_BOWL_LOGOS).find(([key])=>normalized.includes(key))?.[1]||'';
};
export default function BowlGames(){
 const [ready,setReady]=useState(false),[year,setYear]=useState('2026'),[bowls,setBowls]=useState<Bowl[]>([]);
 const [name,setName]=useState(NAMES[0]);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){setYear(String(saved.year||'2026'));if(Array.isArray(saved.bowls))setBowls(saved.bowls)}}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify({year,bowls}))},[year,bowls,ready]);
 const teamMap=useMemo(()=>new Map(schools.map(t=>[t.id,t])),[]);
 const update=(id:string,patch:Partial<Bowl>)=>setBowls(a=>a.map(b=>b.id===id?{...b,...patch}:b));
 function add(){setBowls(a=>[...a,{id:uid(),name:name==='Other / Custom'?'Custom Bowl':name,logo:'',home:'',away:'',homeScore:'',awayScore:'',date:'',notes:''}]);}
 return <main className={styles.page}><div className={styles.shell}><div className={styles.kicker}>GRIDIRON LAB / MANUAL POSTSEASON</div><h1>Bowl <em>Games</em></h1><p>Built-in bowl logos are now included automatically for supported bowls, so you can create matchups right away without uploading logos yourself.</p>
 <div className={styles.actions}><label>Season <input className={styles.year} value={year} onChange={e=>setYear(e.target.value)} maxLength={12}/></label><label>Add bowl <select value={name} onChange={e=>setName(e.target.value)}>{NAMES.map(n=><option key={n}>{n}</option>)}</select></label><button onClick={add}><Plus size={16}/> Add Bowl</button></div>
 <div className={styles.grid}>{bowls.map(b=>{const bowlLogo=builtinLogoFor(b.name);return <article key={b.id} className={styles.card}><div className={styles.cardTop}><div className={styles.emblem}>{bowlLogo?<img src={bowlLogo} alt={`${b.name} logo`}/>:<Trophy size={30}/>}</div><div className={styles.titleArea}><input aria-label="Bowl name" value={b.name} onChange={e=>update(b.id,{name:e.target.value})}/>{bowlLogo?<div className={styles.builtinTag}>Built-in logo included</div>:<div className={styles.builtinTagMuted}>No built-in logo for this bowl yet</div>}</div><button className={styles.delete} title="Remove bowl" aria-label={`Remove ${b.name}`} onClick={()=>{if(confirm(`Remove ${b.name}?`))setBowls(x=>x.filter(v=>v.id!==b.id))}}><Trash2 size={17}/></button></div>
 <div className={styles.match}>{(['away','home'] as const).map(side=><div className={styles.teamLine} key={side}>{b[side]&&teamMap.get(b[side])?.logo?<img src={teamMap.get(b[side])?.logo} alt=""/>:<span className={styles.teamIcon}>—</span>}<select aria-label={`${side} team`} value={b[side]} onChange={e=>update(b.id,{[side]:e.target.value})}><option value="">Select {side} team</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name} ({s.division})</option>)}</select><input className={styles.score} aria-label={`${side} score`} type="text" inputMode="numeric" maxLength={3} placeholder="—" value={b[side==='away'?'awayScore':'homeScore']} onChange={e=>update(b.id,{[side==='away'?'awayScore':'homeScore']:e.target.value.replace(/\D/g,'')})}/></div>)}</div>
 <div className={styles.extra}><label>Date <input type="date" value={b.date} onChange={e=>update(b.id,{date:e.target.value})}/></label><label>Notes <input placeholder="Location, sponsor, etc." value={b.notes} onChange={e=>update(b.id,{notes:e.target.value})}/></label></div></article>})}</div>
 {bowls.length===0?<div className={styles.empty}>No bowls yet. Choose a bowl above and click <strong>Add Bowl</strong> to create your first matchup.</div>:null}
 <div className={styles.tip}><Save size={16}/> Changes save automatically in this browser. To preserve bowls with a season, use <a href="/library">Saved Seasons</a>.</div></div></main>
}
