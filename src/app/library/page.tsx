'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Archive,Download,FolderOpen,Save,Trash2,CalendarDays,Trophy,ListOrdered,Shield,Upload} from 'lucide-react';
import teams from '@/data/teams.json';
import styles from './saved-seasons.module.css';

type Snapshot={id:string;name:string;year:string;createdAt:string;teamSchedules:Record<string,unknown>;bracket:unknown;fcsBracket?:unknown;rankings:unknown;fcsRankings?:unknown;conferences:unknown;bowls?:unknown;statistics?:unknown};
const ARCHIVE='gridiron-manual-archives-v1';
const ACTIVE='gridiron-active-save-slot-v1';
const SCHEDULES='gridiron-lab-schedules-v1';
const BRACKET='gridiron-lab-v1';
const FCS_BRACKET='gridiron-lab-fcs-v1';
const RANKINGS='gridiron-lab-top25-v1';
const FCS_RANKINGS='gridiron-lab-fcs-top25-v1';
const CONFERENCES='gridiron-conference-studio-v1';
const BOWLS='gridiron-manual-bowls-v1';
const STATS='gridiron-lab-statistics-v1';
const teamNames=new Map((teams as {id:string;name:string}[]).map(t=>[String(t.id),t.name]));
const safeParse=(s:string|null):any=>{try{return s?JSON.parse(s):null}catch{return null}};
const makeId=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function download(name:string, contents:string){const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),800)}
function validSnap(x:any):x is Snapshot{return x&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.year==='string'&&x.teamSchedules&&typeof x.teamSchedules==='object'&&!Array.isArray(x.teamSchedules)}

export default function SavedSeasons(){
 const [activeId,setActiveId]=useState<string|null>(null);const [ready,setReady]=useState(false);const [archives,setArchives]=useState<Snapshot[]>([]);const [name,setName]=useState('My Football Season');const [year,setYear]=useState('2026');const [notice,setNotice]=useState('');const [openId,setOpenId]=useState<string|null>(null);
 useEffect(()=>{const all=safeParse(localStorage.getItem(ARCHIVE));setArchives(Array.isArray(all)?all.filter(validSnap):[]);const a=localStorage.getItem(ACTIVE);if(a){setActiveId(a);const existing=Array.isArray(all)?all.find((x:Snapshot)=>x.id===a):null;if(existing){setName(existing.name);setYear(existing.year)}}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(ARCHIVE,JSON.stringify(archives))},[archives,ready]);
 function capture():Snapshot{return {id:makeId(),name:name.trim()||`${year} Season`,year:year.trim()||'2026',createdAt:new Date().toISOString(),teamSchedules:safeParse(localStorage.getItem(SCHEDULES))||{},bracket:safeParse(localStorage.getItem(BRACKET)),fcsBracket:safeParse(localStorage.getItem(FCS_BRACKET)),rankings:safeParse(localStorage.getItem(RANKINGS)),fcsRankings:safeParse(localStorage.getItem(FCS_RANKINGS)),conferences:safeParse(localStorage.getItem(CONFERENCES)),bowls:safeParse(localStorage.getItem(BOWLS)),statistics:safeParse(localStorage.getItem(STATS))};}
 function save(){
  const snap=capture();
  // Save repeatedly to the current slot, instead of creating duplicates.
  if(activeId&&archives.some(a=>a.id===activeId)){
   snap.id=activeId;
   setArchives(a=>a.map(old=>old.id===activeId?snap:old));
   setOpenId(activeId);
   setNotice('Progress saved to your active season. Continue editing whenever you like.');
  }else{
   setArchives(a=>[snap,...a]);setActiveId(snap.id);localStorage.setItem(ACTIVE,snap.id);
   setOpenId(snap.id);setNotice('New season saved. You can resume it later.');
  }
 }
 function saveNew(){const snap=capture();setArchives(a=>[snap,...a]);setActiveId(snap.id);localStorage.setItem(ACTIVE,snap.id);setOpenId(snap.id);setNotice('Saved as a new season slot.');}

 function restore(snapshot:Snapshot){if(!window.confirm(`Open “${snapshot.name}”? This replaces your currently active schedules, bracket, rankings, and conferences. Save your current work first.`))return;
  // Keep a recoverable snapshot of active data before switching.
  const backup=capture();backup.name=`Recovery backup before opening ${snapshot.name}`;
  const next=[backup,...archives];setArchives(next);
  // Recovery backup is always a distinct slot so nothing is lost when switching.

  localStorage.setItem(SCHEDULES,JSON.stringify(snapshot.teamSchedules));
  if(snapshot.bracket!==null&&snapshot.bracket!==undefined)localStorage.setItem(BRACKET,JSON.stringify(snapshot.bracket));else localStorage.removeItem(BRACKET);
  if(snapshot.fcsBracket!==undefined){if(snapshot.fcsBracket!==null)localStorage.setItem(FCS_BRACKET,JSON.stringify(snapshot.fcsBracket));else localStorage.removeItem(FCS_BRACKET);}
  if(snapshot.rankings!==null&&snapshot.rankings!==undefined)localStorage.setItem(RANKINGS,JSON.stringify(snapshot.rankings));else localStorage.removeItem(RANKINGS);
  if(snapshot.fcsRankings!==undefined){if(snapshot.fcsRankings!==null)localStorage.setItem(FCS_RANKINGS,JSON.stringify(snapshot.fcsRankings));else localStorage.removeItem(FCS_RANKINGS);}
  if(snapshot.conferences!==null&&snapshot.conferences!==undefined)localStorage.setItem(CONFERENCES,JSON.stringify(snapshot.conferences));else localStorage.removeItem(CONFERENCES);
  if(snapshot.bowls!==undefined){if(snapshot.bowls!==null)localStorage.setItem(BOWLS,JSON.stringify(snapshot.bowls));else localStorage.removeItem(BOWLS);}
  if(snapshot.statistics!==undefined){if(snapshot.statistics!==null)localStorage.setItem(STATS,JSON.stringify(snapshot.statistics));else localStorage.removeItem(STATS);}
  const firstScheduleKey=Object.keys(snapshot.teamSchedules||{})[0];
  if(firstScheduleKey)localStorage.setItem('gridiron-lab-schedule-last',firstScheduleKey);else localStorage.removeItem('gridiron-lab-schedule-last');
  localStorage.setItem(ACTIVE,snapshot.id);setActiveId(snapshot.id);setName(snapshot.name);setYear(snapshot.year);setOpenId(snapshot.id);
  setNotice(`Now working on “${snapshot.name}”. Open any editor below to continue. Use Save Progress here when you return.`);
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
     <p>One save slot keeps your schedules, playoffs, Top 25, conferences, bowl results, and statistics together. Save again to update that slot.</p>
     <label>Season name<input value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="e.g. 2026 College Football"/></label>
     <label>Season year<input value={year} maxLength={12} onChange={e=>setYear(e.target.value)} placeholder="2026"/></label>
     {activeId&&<p className={styles.note}>Active save slot: <strong>{archives.find(s=>s.id===activeId)?.name||'New season'}</strong></p>}
     <button className={styles.gold} onClick={save}><Save size={17}/> {activeId?'Save Progress':'Create Save Slot'}</button>
     {activeId&&<button onClick={saveNew} style={{marginTop:10,padding:'11px 14px',border:'1px solid #607089',borderRadius:8,background:'#18283b',color:'#f6d28c',cursor:'pointer',fontWeight:700}}>Save as New Slot</button>}
     <p className={styles.note}>Your editors autosave in this browser. Use Save Progress to update the active slot, and reopen the slot from this page later. Export JSON for a backup or a different device.</p>
    </div>
    <div className={styles.panel}>
     <h2><FolderOpen size={20}/> Your save slots</h2>
     <p>Choose Resume to load an old project into all your editors. Switching creates a recovery backup first.</p>
     <label className={styles.importBtn}><Upload size={17}/> Import a saved season (JSON)<input hidden type="file" accept=".json,application/json" onChange={e=>{if(e.target.files?.[0])importArchive(e.target.files[0]);e.target.value=''}}/></label>
     {sorted.length===0?<div className={styles.empty}>No saved seasons yet. Finish editing a schedule or bracket, then click “Save Season.”</div>:sorted.map(s=>{
      const schedules=Object.values(s.teamSchedules||{}) as {games?:unknown[]}[];
      const games=schedules.reduce((n,d)=>n+(Array.isArray(d?.games)?d.games.length:0),0);
      const opened=openId===s.id;
      return <article key={s.id} className={styles.archive}>
       <button className={styles.archiveTitle} onClick={()=>setOpenId(opened?null:s.id)}><span><strong>{s.name}{activeId===s.id?' · ACTIVE':''}</strong><small>{s.year} · {new Date(s.createdAt).toLocaleDateString()} · {schedules.length} schedules · {games} games</small></span><span>{opened?'−':'+'}</span></button>
       {opened&&<div className={styles.detail}>
        <div className={styles.tags}><span><CalendarDays size={14}/> {schedules.length} schedules</span><span><Trophy size={14}/> {s.bracket?'Bracket saved':'No bracket'}</span><span><ListOrdered size={14}/> {s.rankings?'FBS Top 25 saved':'No FBS rankings'}</span><span><ListOrdered size={14}/> {s.fcsRankings?'FCS Top 25 saved':'No FCS rankings'}</span><span><Shield size={14}/> {s.conferences?'Conferences saved':'No conferences'}</span><span>{s.statistics?'Statistics saved':'No statistics'}</span><span><Trophy size={14}/> {Array.isArray((s.bowls as {bowls?:unknown[]}|null)?.bowls)?(s.bowls as {bowls:unknown[]}).bowls.length:0} bowls</span></div>
        {schedules.length>0&&<div className={styles.scheduleList}>{schedules.slice(0,12).map((d:any,i)=><span key={i}>{teamNames.get(String(d.teamId))||'Team'} · {d.season||s.year} · {d.games?.length||0} games</span>)}{schedules.length>12&&<span>+{schedules.length-12} more schedules</span>}</div>}
        <div className={styles.actions}><button onClick={()=>restore(s)}><FolderOpen size={15}/> {activeId===s.id?'Reload Slot':'Resume'}</button><button onClick={()=>download(`gridiron-${s.year}-${s.id}.json`,JSON.stringify(s,null,2))}><Download size={15}/> Export</button><button className={styles.danger} onClick={()=>{if(confirm(`Delete saved slot “${s.name}”?`)){setArchives(a=>a.filter(x=>x.id!==s.id));if(activeId===s.id){localStorage.removeItem(ACTIVE);setActiveId(null)}}}}><Trash2 size={15}/> Delete</button></div>
       </div>}
      </article>
     })}
    </div>
   </section>
   <div className={styles.quick}><span>CONTINUE EDITING</span><Link href="/schedule">Schedules →</Link><Link href="/top-25">Top 25 →</Link><Link href="/">Playoffs →</Link><Link href="/conferences">Conferences →</Link><Link href="/bowls">Bowl Games →</Link><Link href="/stats">Statistics →</Link></div>
   {notice&&<div role="status" className={styles.notice}>{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss">×</button></div>}
  </div>
 </main>
}
