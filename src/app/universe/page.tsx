'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import teamsJson from '@/data/teams.json';
import type {Team} from '@/lib/bracket';
import {computeRatings,simulateWeek,standings,winProbability,type HistoricalGame,type SeasonSimulation,type SimGame} from '@/lib/seasonSim';
import './universe.css';

type Game={id:string;opponentId:string;week:number;date:string;location:'Home'|'Away'|'Neutral';venue:string;ourScore:string;theirScore:string;note:string};
type Saved={teamId:string;season:number;title:string;games:Game[]};
type Hub={year:number;division:'FBS'|'FCS'|'DII'|'DIII';week:number;seed:number;games:SimGame[];ratings:SeasonSimulation['ratings'];syncedAt:number};
type Archive={id:string;name:string;createdAt:number;hub:Hub;rankings:string[];schedules:Record<string,Saved>;manualPoll:unknown;playoff:unknown;conference:unknown};
const teams=teamsJson as Team[];const byId=new Map(teams.map(t=>[t.id,t]));
const HUB='gridiron-lab-universe-v1',ARCHIVE='gridiron-lab-season-archive-v1',SCHEDULES='gridiron-lab-schedules-v1',HISTORY='gridiron-lab-historical-games-v1';
function read<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function logo(id:string){const t=byId.get(id);return t?.logo?<img src={t.logo} alt=""/>:<span>🏈</span>}
function download(name:string,obj:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),400)}
function scheduleGames(year:number,division:Hub['division'],seed:number,source:Record<string,Saved>,history:HistoricalGame[]):Hub{
 const pool=teams.filter(t=>t.division===division);const ratings=computeRatings(pool,history,year);const unique=new Map<string,SimGame>();
 for(const schedule of Object.values(source)){
  if(schedule.season!==year||!byId.has(schedule.teamId))continue;
  for(const g of schedule.games){const homeId=g.location==='Away'?g.opponentId:schedule.teamId,awayId=g.location==='Away'?schedule.teamId:g.opponentId;
   if(homeId===awayId||!byId.has(homeId)||!byId.has(awayId)||!Number.isInteger(g.week)||g.week<1||g.week>40)continue;
   if(byId.get(homeId)?.division!==division||byId.get(awayId)?.division!==division)continue;
   const key=`${g.week}:${[homeId,awayId].sort().join(':')}`;
   const homeScore=g.ourScore.trim()===''||g.theirScore.trim()===''?null:Number(g.location==='Away'?g.theirScore:g.ourScore);
   const awayScore=g.ourScore.trim()===''||g.theirScore.trim()===''?null:Number(g.location==='Away'?g.ourScore:g.theirScore);
   const candidate:SimGame={id:key,week:g.week,homeId,awayId,homeScore:Number.isFinite(homeScore)?homeScore:null,awayScore:Number.isFinite(awayScore)?awayScore:null,homeWinProbability:winProbability(ratings[homeId]?.value??1500,ratings[awayId]?.value??1500)};
   const previous=unique.get(key);if(!previous||(previous.homeScore===null&&candidate.homeScore!==null))unique.set(key,candidate);
  }
 }
 return {year,division,seed,week:0,games:[...unique.values()].sort((a,b)=>a.week-b.week),ratings,syncedAt:Date.now()};
}
export default function SeasonHub(){
 const [hub,setHub]=useState<Hub|null>(null),[archives,setArchives]=useState<Archive[]>([]),[loaded,setLoaded]=useState(false),[year,setYear]=useState(2026),[division,setDivision]=useState<Hub['division']>('FBS'),[seed,setSeed]=useState(26),[notice,setNotice]=useState(''),[tab,setTab]=useState<'season'|'archive'>('season'),[advanced,setAdvanced]=useState(false);
 useEffect(()=>{const h=read<Hub|null>(HUB,null);if(h){setHub(h);setYear(h.year);setDivision(h.division);setSeed(h.seed)}setArchives(read<Archive[]>(ARCHIVE,[]));setLoaded(true)},[]);
 useEffect(()=>{if(loaded&&hub)localStorage.setItem(HUB,JSON.stringify(hub))},[hub,loaded]);
 const sim=hub?{year:hub.year,division:hub.division,week:hub.week,seed:hub.seed,games:hub.games,ratings:hub.ratings}:null;
 const standing=useMemo(()=>sim?standings(sim,teams.filter(t=>t.division===sim.division)):[],[hub]);
 const top=standing.slice(0,25),maxWeek=Math.max(0,...(hub?.games.map(g=>g.week)||[]));
 const current=hub?.games.filter(g=>g.week===hub.week)||[];
 const completed=hub?.games.filter(g=>g.homeScore!==null&&g.awayScore!==null).length||0;
 function importSchedules(){const source=read<Record<string,Saved>>(SCHEDULES,{}),hist=read<HistoricalGame[]>(HISTORY,[]);const created=scheduleGames(year,division,seed,source,hist);
  if(!created.games.length){setNotice(`No ${division} vs ${division} games found for ${year}. Add matchups in Schedule Builder first.`);return}
  if(hub?.games.some(g=>g.homeScore!==null)&&!confirm('Reimporting schedules replaces this active season snapshot. Archive it first if you want to keep its results. Continue?'))return;
  setHub(created);setNotice(`Imported ${created.games.length} unique scheduled matchups. Existing entered scores preserved.`)}
 function updateSchedules(next:Hub){const source=read<Record<string,Saved>>(SCHEDULES,{});for(const saved of Object.values(source)){
  if(saved.season!==next.year)continue;
  for(const g of saved.games){const result=next.games.find(r=>r.week===g.week&&([r.homeId,r.awayId].includes(saved.teamId))&&([r.homeId,r.awayId].includes(g.opponentId)));
   if(!result||result.homeScore===null||result.awayScore===null)continue;
   g.ourScore=String(result.homeId===saved.teamId?result.homeScore:result.awayScore);g.theirScore=String(result.homeId===saved.teamId?result.awayScore:result.homeScore);
  }
 }
 try{localStorage.setItem(SCHEDULES,JSON.stringify(source))}catch{setNotice('Unable to save all schedules: browser storage may be full. Export your data.')}
 }
 function advance(){if(!hub||hub.week>=maxWeek)return;const nextWeek=[...new Set(hub.games.map(g=>g.week))].sort((a,b)=>a-b).find(w=>w>hub.week);if(nextWeek===undefined)return;
  const state:SeasonSimulation={division:hub.division,year:hub.year,week:nextWeek-1,seed:hub.seed,games:hub.games,ratings:hub.ratings};const played=simulateWeek(state);const next={...hub,week:nextWeek,games:played.games};updateSchedules(next);setHub(next);setNotice(`Week ${nextWeek} completed and results saved to scheduled games.`)}
 function saveArchive(){if(!hub)return;const source=read<Record<string,Saved>>(SCHEDULES,{});const snapshot:Archive={id:`${hub.year}-${Date.now()}`,name:`${hub.year} ${hub.division} Season`,createdAt:Date.now(),hub:JSON.parse(JSON.stringify(hub)),rankings:top.map(r=>r.teamId),schedules:Object.fromEntries(Object.entries(source).filter(([,s])=>s.season===hub.year)),manualPoll:read('gridiron-lab-top25-v1',null),playoff:read('gridiron-lab-bracket-v1',null),conference:read('gridiron-conference-studio-v1',null)};
  const updated=[snapshot,...archives];try{localStorage.setItem(ARCHIVE,JSON.stringify(updated));setArchives(updated);setNotice('Season snapshot archived successfully. Download a backup too.') }catch{setNotice('Archive could not be saved; browser storage may be full. Export your season instead.') }}
 function restore(a:Archive){if(!confirm(`Load ${a.name} into the active Season Hub? This replaces the active hub, but does not alter your other editors.`))return;setHub(a.hub);setYear(a.hub.year);setDivision(a.hub.division);setSeed(a.hub.seed);setNotice('Archived season opened in Season Hub; other editors were not overwritten.')}
 function exportArchive(){download('gridiron-season-archive.json',archives)}
 if(!loaded)return <main className="uv">Loading your seasons…</main>;
 const upcomingWeeks=[...new Set(hub?.games.filter(g=>g.week>hub.week).map(g=>g.week)||[])].sort((a,b)=>a-b);
 const nextWeek=upcomingWeeks[0];
 const currentGames=hub?.games.filter(g=>g.week===hub.week)||[];
 const completedAll=!!hub&&hub.games.length>0&&completed===hub.games.length;
 return <main className="uv uv-simple">
   <div className="uv-hero">
     <div><div className="uv-kicker">GRIDIRON LAB / SEASON MANAGER</div><h1>My Football Seasons</h1><p>Make a schedule, simulate each week, and keep your season history in one place.</p></div>
   </div>
   <div className="uv-tabbar" role="tablist" aria-label="Season views">
     <button type="button" role="tab" aria-selected={tab==='season'} className={tab==='season'?'uv-tab-selected':''} onClick={()=>setTab('season')}>Active Season</button>
     <button type="button" role="tab" aria-selected={tab==='archive'} className={tab==='archive'?'uv-tab-selected':''} onClick={()=>setTab('archive')}>Past Seasons <span className="uv-tab-count">{archives.length}</span></button>
   </div>
   {notice&&<div className="uv-alert" role="status">{notice} <button onClick={()=>setNotice('')}>Dismiss</button></div>}
   {tab==='season'?<>
      <section className="uv-box uv-setup">
       <div><div className="uv-step">STEP 1</div><h2>Choose Your Season</h2><p className="uv-small">Already built schedules? Select the matching year and division, then load them.</p></div>
       <div className="uv-fields"><label>Year<select value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:25},(_,i)=>2020+i).map(v=><option key={v}>{v}</option>)}</select></label>
       <label>Division<select value={division} onChange={e=>setDivision(e.target.value as Hub['division'])}>{['FBS','FCS','DII','DIII'].map(v=><option key={v}>{v}</option>)}</select></label></div>
       <div className="uv-primary-actions"><Link className="uv-btn" href="/schedule">Edit Schedules ↗</Link><button className="gold" onClick={importSchedules}>Load My Schedules</button></div>
       <button className="uv-advanced-toggle" onClick={()=>setAdvanced(a=>!a)} aria-expanded={advanced}>{advanced?'Hide':'Show'} advanced settings ▾</button>
       {advanced&&<div className="uv-advanced"><label>Simulation seed (reproducible random results)<input type="number" value={seed} onChange={e=>setSeed(Number(e.target.value)||1)}/></label><button disabled={!hub} onClick={()=>download(`gridiron-${hub?.year}-season.json`,{hub,rankings:top})}>Export Active Season</button><p className="uv-small">Loading schedules makes a new active season. Existing scored games will be preserved. Only games between schools in the selected division are supported here.</p></div>}
      </section>
      <section className="uv-box uv-play">
       <div className="uv-section-title"><div><div className="uv-step">STEP 2</div><h2>Play the Season</h2></div>{hub&&<span className="uv-chip">{hub.year} · {hub.division}</span>}</div>
       {!hub?<div className="uv-empty">No active season yet. Create matchups in <Link href="/schedule">Schedule Builder</Link>, then click <strong>Load My Schedules</strong> above.</div>:<>
        <div className="uv-summary">
          <div><span>Last simulated week</span><strong>{hub.week||'Preseason'}</strong></div>
          <div><span>Games completed</span><strong>{completed} / {hub.games.length}</strong></div>
          <div><span>Next scheduled week</span><strong>{nextWeek??'—'}</strong></div>
        </div>
        <div className="uv-play-actions"><button className="gold uv-sim-button" disabled={upcomingWeeks.length===0} onClick={advance}>{upcomingWeeks.length?`Simulate Week ${nextWeek} →`:'Regular Season Complete ✓'}</button></div>
        <div className="uv-results-head"><h3>{hub.week===0?'Upcoming Games':`Week ${hub.week} Results`}</h3><span>{hub.week===0?'The games waiting to be played':'Scores are saved back to your schedules'}</span></div>
        <div className="uv-games">{(hub.week===0?hub.games.filter(g=>g.week===Math.min(...hub.games.map(x=>x.week))):currentGames).slice(0,12).map(g=><div className="uv-game" key={g.id}>
          <div className="uv-game-state">WEEK {g.week} · {g.homeScore!==null?'FINAL':'UPCOMING'}</div>
          <div className="uv-game-side">{logo(g.awayId)}<span>{byId.get(g.awayId)?.name||g.awayId}</span><strong>{g.awayScore??'—'}</strong></div>
          <div className="uv-game-side">{logo(g.homeId)}<span>{byId.get(g.homeId)?.name||g.homeId}</span><strong>{g.homeScore??'—'}</strong></div>
        </div>)}{hub.games.length===0&&<p>No matching scheduled games.</p>}</div>
        </>}
      </section>
      {hub&&<section className="uv-box"><div className="uv-section-title"><div><div className="uv-step">STEP 3</div><h2>Rankings &amp; Save</h2></div></div>
       <p className="uv-small">These are simulated rankings based on this season; your manually edited Top 25 stays untouched.</p>
       <div className="uv-compact-ranks">{top.slice(0,10).map((r,i)=><div key={r.teamId} className="uv-rank-line"><span className="uv-rank-number">{i+1}</span>{logo(r.teamId)}<span>{byId.get(r.teamId)?.name||r.teamId}</span><strong>{r.wins}-{r.losses}</strong></div>)}</div>
       <div className="uv-archive-prompt"><div><strong>Keep this season for later</strong><p className="uv-small">Save a snapshot to Past Seasons. You can do this anytime, not just at the end.</p></div><button className="gold" onClick={()=>{saveArchive();setTab('archive')}}>Save to Past Seasons</button></div>
      </section>}
   </>:<section className="uv-box uv-history">
    <div className="uv-section-title"><div><h2>Past Seasons</h2><p className="uv-small">Open an earlier season, or download a backup of your records.</p></div>{archives.length>0&&<button onClick={exportArchive}>Download All</button>}</div>
    {!archives.length?<div className="uv-empty">Your season history is empty. Simulate some games, then use <strong>Save to Past Seasons</strong> in Active Season.</div>:<div className="uv-archive-list">{archives.map(a=><div key={a.id} className="uv-history-item"><div><div className="uv-history-title">{a.name}</div><div className="uv-small">{a.hub.games.filter(g=>g.homeScore!==null&&g.awayScore!==null).length} final scores · Saved {new Date(a.createdAt).toLocaleDateString()}</div></div><div className="uv-history-actions"><button onClick={()=>{restore(a);setTab('season')}}>Open Season</button><button onClick={()=>download(`gridiron-${a.id}.json`,a)}>Download</button></div></div>)}</div>}
    <p className="uv-small">Past Seasons are stored in this browser. Download backups before clearing browser data. Opening an archive changes the active Hub view, not your manual bracket or Top 25.</p>
   </section>}
 </main>;
}
