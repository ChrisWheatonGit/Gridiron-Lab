'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Archive,Download,FolderOpen,Save,Trash2,CalendarDays,Trophy,ListOrdered,Shield,Upload} from 'lucide-react';
import teams from '@/data/teams.json';
import styles from './saved-seasons.module.css';

type Snapshot={id:string;name:string;year:string;createdAt:string;teamSchedules:Record<string,unknown>;bracket:unknown;rankings:unknown;conferences:unknown;bowls?:unknown};
const ARCHIVE='gridiron-manual-archives-v1';
const SCHEDULES='gridiron-lab-schedules-v1';
const BRACKET='gridiron-lab-v1';
const RANKINGS='gridiron-lab-top25-v1';
const CONFERENCES='gridiron-conference-studio-v1';
const BOWLS='gridiron-manual-bowls-v1';
const teamNames=new Map((teams as {id:string;name:string}[]).map(t=>[String(t.id),t.name]));
const safeParse=(s:string|null):any=>{try{return s?JSON.parse(s):null}catch{return null}};
const makeId=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function download(name:string, contents:string){const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),800)}
function validSnap(x:any):x is Snapshot{return x&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.year==='string'&&x.teamSchedules&&typeof x.teamSchedules==='object'&&!Array.isArray(x.teamSchedules)}

export default function SavedSeasons(){
 const [ready,setReady]=useState(false);const [archives,setArchives]=useState<Snapshot[]>([]);const [name,setName]=useState('My Football Season');const [year,setYear]=useState('2026');const [notice,setNotice]=useState('');const [openId,setOpenId]=useState<string|null>(null);
 useEffect(()=>{const all=safeParse(localStorage.getItem(ARCHIVE));setArchives(Array.isArray(all)?all.filter(validSnap):[]);setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(ARCHIVE,JSON.stringify(archives))},[archives,ready]);
 function capture():Snapshot{return {id:makeId(),name:name.trim()||`${year} Season`,year:year.trim()||'2026',createdAt:new Date().toISOString(),teamSchedules:safeParse(localStorage.getItem(SCHEDULES))||{},bracket:safeParse(localStorage.getItem(BRACKET)),rankings:safeParse(localStorage.getItem(RANKINGS)),conferences:safeParse(localStorage.getItem(CONFERENCES)),bowls:safeParse(localStorage.getItem(BOWLS))};}
 function save(){const snap=capture();setArchives(a=>[snap,...a]);setOpenId(snap.id);setNotice('Season saved. You can reopen it any time in this browser.')}
 function restore(snapshot:Snapshot){if(!window.confirm(`Open “${snapshot.name}”? This replaces your currently active schedules, bracket, rankings, and conferences. Save your current work first.`))return;
  // Keep a recoverable snapshot of active data before switching.
  const backup=capture();backup.name=`Automatic backup before opening ${snapshot.name}`;
  const next=[backup,...archives];setArchives(next);
  localStorage.setItem(SCHEDULES,JSON.stringify(snapshot.teamSchedules));
  if(snapshot.bracket!==null&&snapshot.bracket!==undefined)localStorage.setItem(BRACKET,JSON.stringify(snapshot.bracket));else localStorage.removeItem(BRACKET);
  if(snapshot.rankings!==null&&snapshot.rankings!==undefined)localStorage.setItem(RANKINGS,JSON.stringify(snapshot.rankings));else localStorage.removeItem(RANKINGS);
  if(snapshot.conferences!==null&&snapshot.conferences!==undefined)localStorage.setItem(CONFERENCES,JSON.stringify(snapshot.conferences));else localStorage.removeItem(CONFERENCES);
  if(snapshot.bowls!==undefined){if(snapshot.bowls!==null)localStorage.setItem(BOWLS,JSON.stringify(snapshot.bowls));else localStorage.removeItem(BOWLS);}
  const firstScheduleKey=Object.keys(snapshot.teamSchedules||{})[0];
  if(firstScheduleKey)localStorage.setItem('gridiron-lab-schedule-last',firstScheduleKey);else localStorage.removeItem('gridiron-lab-schedule-last');
  setNotice(`Opened “${snapshot.name}”. Go to a builder page to view or edit it.`);
 }
 function importArchive(file:File){file.text().then(text=>{try{const obj=JSON.parse(text);if(!validSnap(obj))throw Error('invalid');const fresh={...obj,id:makeId(),name:String(obj.name).slice(0,100),year:String(obj.year).slice(0,12)};setArchives(a=>[fresh,...a]);setNotice('Saved season imported. Choose Open to load it.')}catch{setNotice('That file is not a valid Gridiron Lab saved season.')}})}
 const sorted=useMemo(()=>[...archives].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[archives]);
 return <main className={styles.page}>
  <div className={styles.shell}>
   <div className={styles.eyebrow}><Archive size={16}/> GRIDIRON LAB / YOUR LIBRARY</div>
   <h1>Saved <em>Seasons</em></h1>
   <p className={styles.lead}>No simulations. You control the scores, rankings, and playoffs. Save your work here and open it again whenever you want.</p>
   <section className={styles.grid}>
    <div className={styles.panel}>
     <h2><Save size={20}/> Save current work</h2>
     <p>Capture your schedules, bracket, Top 25, bowl games, and conference setup together.</p>
     <label>Season name<input value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="e.g. 2026 College Football"/></label>
     <label>Season year<input value={year} maxLength={12} onChange={e=>setYear(e.target.value)} placeholder="2026"/></label>
     <button className={styles.gold} onClick={save}><Save size={17}/> Save Season</button>
     <p className={styles.note}>Your existing editors still autosave their active work. Saving here creates a separate snapshot you can revisit.</p>
    </div>
    <div className={styles.panel}>
     <h2><FolderOpen size={20}/> Your saved seasons</h2>
     <p>Choose a season to review, reopen, or export a backup.</p>
     <label className={styles.importBtn}><Upload size={17}/> Import a saved season (JSON)<input hidden type="file" accept=".json,application/json" onChange={e=>{if(e.target.files?.[0])importArchive(e.target.files[0]);e.target.value=''}}/></label>
     {sorted.length===0?<div className={styles.empty}>No saved seasons yet. Finish editing a schedule or bracket, then click “Save Season.”</div>:sorted.map(s=>{
      const schedules=Object.values(s.teamSchedules||{}) as {games?:unknown[]}[];
      const games=schedules.reduce((n,d)=>n+(Array.isArray(d?.games)?d.games.length:0),0);
      const opened=openId===s.id;
      return <article key={s.id} className={styles.archive}>
       <button className={styles.archiveTitle} onClick={()=>setOpenId(opened?null:s.id)}><span><strong>{s.name}</strong><small>{s.year} · {new Date(s.createdAt).toLocaleDateString()} · {schedules.length} schedules · {games} games</small></span><span>{opened?'−':'+'}</span></button>
       {opened&&<div className={styles.detail}>
        <div className={styles.tags}><span><CalendarDays size={14}/> {schedules.length} schedules</span><span><Trophy size={14}/> {s.bracket?'Bracket saved':'No bracket'}</span><span><ListOrdered size={14}/> {s.rankings?'Top 25 saved':'No rankings'}</span><span><Shield size={14}/> {s.conferences?'Conferences saved':'No conferences'}</span><span><Trophy size={14}/> {Array.isArray((s.bowls as {bowls?:unknown[]}|null)?.bowls)?(s.bowls as {bowls:unknown[]}).bowls.length:0} bowls</span></div>
        {schedules.length>0&&<div className={styles.scheduleList}>{schedules.slice(0,12).map((d:any,i)=><span key={i}>{teamNames.get(String(d.teamId))||'Team'} · {d.season||s.year} · {d.games?.length||0} games</span>)}{schedules.length>12&&<span>+{schedules.length-12} more schedules</span>}</div>}
        <div className={styles.actions}><button onClick={()=>restore(s)}><FolderOpen size={15}/> Open Season</button><button onClick={()=>download(`gridiron-${s.year}-${s.id}.json`,JSON.stringify(s,null,2))}><Download size={15}/> Export</button><button className={styles.danger} onClick={()=>{if(confirm(`Delete saved snapshot “${s.name}”?`))setArchives(a=>a.filter(x=>x.id!==s.id))}}><Trash2 size={15}/> Delete</button></div>
       </div>}
      </article>
     })}
    </div>
   </section>
   <div className={styles.quick}><span>CONTINUE EDITING</span><Link href="/schedule">Schedules →</Link><Link href="/top-25">Top 25 →</Link><Link href="/">Playoffs →</Link><Link href="/conferences">Conferences →</Link><Link href="/bowls">Bowl Games →</Link></div>
   {notice&&<div role="status" className={styles.notice}>{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></div>}
  </div>
 </main>
}
