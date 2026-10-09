'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import teamsData from '@/data/teams.json';
import './conference-studio.css';

type Team = { id?: string | number; name?: string; school?: string; shortName?: string; abbreviation?: string; conference?: string; division?: string; subdivision?: string; color?: string; primaryColor?: string; alternateColor?: string; secondaryColor?: string; logo?: string; logos?: string[] };
type Member = Team & { uid: string };
type Conference = { id: string; name: string; subdivision: string; hasDivisions: boolean; divisions: { north: Member[]; south: Member[] }; teams: Member[]; championship: { enabled: boolean; name: string; site: string; autoQualifiers: number } };
type Bucket = 'teams' | 'north' | 'south';
const STORAGE_KEY = 'gridiron-conference-studio-v1';
const getName = (t: Team) => t.school || t.name || t.shortName || t.abbreviation || 'Unknown School';
const getId = (t: Team) => String(t.id ?? `${t.division || t.subdivision}-${getName(t)}`).toLowerCase();
const getDivision = (t: Team) => (t.subdivision || t.division || 'FBS').toUpperCase();
const getLogo = (t: Team) => t.logo || t.logos?.[0] || '';
const asMember = (t: Team): Member => ({ ...t, uid: getId(t) });
const catalog = teamsData as Team[];
const counts = (c: Conference) => c.teams.length + c.divisions.north.length + c.divisions.south.length;
const allMembers = (c: Conference) => [...c.teams, ...c.divisions.north, ...c.divisions.south];
const templates = [ ['sec','SEC'], ['big-ten','Big Ten'], ['big-12','Big 12'], ['acc','ACC'], ['pac-12','Pac-12'], ['aac','American'], ['sun-belt','Sun Belt'], ['mwc','Mountain West'], ['cusa','Conference USA'], ['mac','MAC'] ];
function fresh(): Conference[] {
  return templates.map(([id,name]) => ({ id, name, subdivision:'FBS', hasDivisions:false, divisions:{ north:[],south:[] }, teams: catalog.filter(t => getDivision(t)==='FBS' && (t.conference||'').toLowerCase() === name.toLowerCase()).map(asMember), championship:{enabled:true,name:`${name} Championship`,site:'',autoQualifiers:2} }));
}
function Logo({ team, big=false }: { team: Team; big?: boolean }) {
  const [failed,setFailed] = useState(false);
  const logo = getLogo(team);
  useEffect(()=>setFailed(false),[logo]);
  return <span className={`cs-logo ${big?'cs-logo-big':''}`}>
    {logo && !failed ? <img src={logo} alt="" draggable={false} onError={()=>setFailed(true)}/> : <span>{getName(team).slice(0,2).toUpperCase()}</span>}
  </span>;
}
function TeamCard({team,onDragStart,onAdd,onRemove,assigned=false}: {team:Member;onDragStart:(t:Member)=>void;onAdd?:()=>void;onRemove?:()=>void;assigned?:boolean}) {
  return <div className="cs-team" draggable onDragStart={e=>{ e.dataTransfer.setData('text/plain',team.uid); e.dataTransfer.effectAllowed='move'; onDragStart(team); }} style={{'--school-color':`#${(team.color||team.primaryColor||'#96511d').replace(/^#/,'')}`} as React.CSSProperties}>
    <Logo team={team} big/><div className="cs-team-content"><strong>{getName(team)}</strong><small>{getDivision(team)}{assigned?' · Conference member':` · ${team.conference || 'Independent'}`}</small></div>
    {onAdd ? <button type="button" className="cs-add" draggable={false} onClick={onAdd} aria-label={`Add ${getName(team)} to conference`} title="Add team to conference">+</button> : onRemove ? <button type="button" className="cs-remove" draggable={false} onClick={e=>{e.stopPropagation();onRemove()}} aria-label={`Remove ${getName(team)} from conference`} title="Remove from conference and return to team library">×</button> : <span className="cs-grip" aria-label="Drag team">⠿</span>}
  </div>;
}
function DropArea({label,children,onMove}: {label:string;children:React.ReactNode;onMove:(id:string)=>void}) {
  const [over,setOver]=useState(false);
  return <div className={`cs-drop ${over?'cs-drop-over':''}`} onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)}} onDrop={e=>{e.preventDefault();setOver(false);const uid=e.dataTransfer.getData('text/plain');if(uid)onMove(uid)}}>
    <div className="cs-drop-title">{label}<span>Drop a school here</span></div><div className="cs-team-list">{children}</div>
  </div>;
}
export default function ConferenceStudioPage(){
 const [conferences,setConferences]=useState<Conference[]>([]);
 const [selected,setSelected]=useState('sec');
 const [division,setDivision]=useState('FBS');
 const [search,setSearch]=useState('');
 const [newName,setNewName]=useState('');
 const [loaded,setLoaded]=useState(false);
 const pending=useRef<Member|null>(null);
 useEffect(()=>{let data=fresh();try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))data=parsed.map((c:Conference)=>({...c,teams:c.teams||[],divisions:{north:c.divisions?.north||[],south:c.divisions?.south||[]},championship:c.championship||{enabled:true,name:`${c.name} Championship`,site:'',autoQualifiers:2}}));}}catch{}setConferences(data);setSelected(data[0]?.id||'');setLoaded(true)},[]);
 useEffect(()=>{if(loaded)localStorage.setItem(STORAGE_KEY,JSON.stringify(conferences))},[conferences,loaded]);
 const active=conferences.find(c=>c.id===selected)||conferences[0];
 const owned=useMemo(()=>new Set(conferences.flatMap(c=>allMembers(c).map(getId))),[conferences]);
 const available=useMemo(()=>catalog.filter(t=>getDivision(t)===division&&!owned.has(getId(t))&&getName(t).toLowerCase().includes(search.toLowerCase())).map(asMember),[division,search,owned]);
 function change(updates:Partial<Conference>){if(!active)return;setConferences(prev=>prev.map(c=>c.id===active.id?{...c,...updates}:c))}
 function assign(member:Member,dest:string,bucket:Bucket){setConferences(prev=>prev.map(c=>{const teams=c.teams.filter(t=>getId(t)!==getId(member));const north=c.divisions.north.filter(t=>getId(t)!==getId(member));const south=c.divisions.south.filter(t=>getId(t)!==getId(member));if(c.id!==dest)return{...c,teams,divisions:{north,south}};if(bucket==='teams')teams.push(member);else if(bucket==='north')north.push(member);else south.push(member);return{...c,teams,divisions:{north,south}};}))}
 function removeTeam(member:Member){
   setConferences(prev=>prev.map(c=>({
     ...c,
     teams:c.teams.filter(t=>getId(t)!==getId(member)),
     divisions:{
       north:c.divisions.north.filter(t=>getId(t)!==getId(member)),
       south:c.divisions.south.filter(t=>getId(t)!==getId(member))
     }
   })));
   pending.current=null;
 }
 function move(uid:string,dest:string,bucket:Bucket){const found=pending.current&&getId(pending.current)===uid?pending.current:conferences.flatMap(allMembers).find(m=>getId(m)===uid)||catalog.find(t=>getId(t)===uid);if(found)assign(asMember(found),dest,bucket);pending.current=null}
 function switchDivisions(enabled:boolean){if(!active)return;const everyone=allMembers(active);change({hasDivisions:enabled,teams:enabled?[]:everyone,divisions:enabled?{north:everyone,south:[]}:{north:[],south:[]}})}
 function addConference(){const name=newName.trim();if(!name)return;const id=`custom-${Date.now()}`;const entry:Conference={id,name,subdivision:division,hasDivisions:false,teams:[],divisions:{north:[],south:[]},championship:{enabled:true,name:`${name} Championship`,site:'',autoQualifiers:2}};setConferences(prev=>[...prev,entry]);setSelected(id);setNewName('')}
 function exportJson(){const blob=new Blob([JSON.stringify(conferences,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='gridiron-conferences.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <main className="cs-root"><div className="cs-wrap">
  <header className="cs-hero"><span className="cs-eyebrow">GRIDIRON LAB / REALIGNMENT STUDIO</span><div className="cs-hero-row"><div><h1>BUILD YOUR <em>OWN CONFERENCES</em></h1><p>Custom leagues. Real school logos. Your college football universe.</p></div><div className="cs-hero-actions"><button className="cs-btn" onClick={exportJson}>Export setup ↓</button><button className="cs-btn cs-btn-outline" onClick={()=>{if(confirm('Reset conference realignment to the original team directory?')){const original=fresh();setConferences(original);setSelected(original[0]?.id||'')}}}>Reset</button></div></div></header>
  <div className="cs-layout"><aside className="cs-panel"><div className="cs-section-heading"><span>CONFERENCES</span><b>{conferences.length}</b></div><div className="cs-conference-list">{conferences.map(c=><button key={c.id} className={`cs-conference ${active?.id===c.id?'cs-active':''}`} onClick={()=>setSelected(c.id)}><span><strong>{c.name}</strong><small>{c.subdivision} · {counts(c)} teams</small></span><span>›</span></button>)}</div>
   <div className="cs-section-heading cs-mt">CREATE LEAGUE</div><input className="cs-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New conference name"/><button className="cs-btn cs-full cs-space" onClick={addConference}>+ Create conference</button>
   {active&&<><div className="cs-section-heading cs-mt">LEAGUE SETTINGS</div><label className="cs-label">Conference name</label><input className="cs-input" value={active.name} onChange={e=>change({name:e.target.value})}/><label className="cs-label">Division classification</label><select className="cs-input" value={active.subdivision} onChange={e=>change({subdivision:e.target.value})}>{['FBS','FCS','DII','DIII'].map(x=><option key={x}>{x}</option>)}</select><label className="cs-switch"><input type="checkbox" checked={active.hasDivisions} onChange={e=>switchDivisions(e.target.checked)}/> Split into North / South</label></>}
  </aside>
  <section className="cs-main">{active&&<><div className="cs-main-header"><span className="cs-eyebrow">ACTIVE CONFERENCE</span><h2>{active.name}</h2><p>{active.subdivision} <span>◆</span> {counts(active)} PROGRAMS <span>◆</span> {active.hasDivisions?'TWO DIVISIONS':'SINGLE LEAGUE'}</p></div>
  {active.hasDivisions?<div className="cs-division-grid"><DropArea label="NORTH DIVISION" onMove={id=>move(id,active.id,'north')}>{active.divisions.north.map(t=><TeamCard key={getId(t)} team={t} onDragStart={m=>pending.current=m} onRemove={()=>removeTeam(t)} assigned/>)}</DropArea><DropArea label="SOUTH DIVISION" onMove={id=>move(id,active.id,'south')}>{active.divisions.south.map(t=><TeamCard key={getId(t)} team={t} onDragStart={m=>pending.current=m} onRemove={()=>removeTeam(t)} assigned/>)}</DropArea></div>:<DropArea label="CONFERENCE MEMBERS" onMove={id=>move(id,active.id,'teams')}>{active.teams.map(t=><TeamCard key={getId(t)} team={t} onDragStart={m=>pending.current=m} onRemove={()=>removeTeam(t)} assigned/>)}</DropArea>}
   <div className="cs-champ"><div className="cs-section-heading">★ CHAMPIONSHIP SETTINGS</div><label className="cs-switch"><input type="checkbox" checked={active.championship.enabled} onChange={e=>change({championship:{...active.championship,enabled:e.target.checked}})}/> Championship game enabled</label><div className="cs-champ-grid"><label>Championship name<input className="cs-input" value={active.championship.name} onChange={e=>change({championship:{...active.championship,name:e.target.value}})}/></label><label>Location / site<input className="cs-input" placeholder="Mercedes-Benz Stadium" value={active.championship.site} onChange={e=>change({championship:{...active.championship,site:e.target.value}})}/></label><label>Qualifying teams<select className="cs-input" value={active.championship.autoQualifiers} onChange={e=>change({championship:{...active.championship,autoQualifiers:Number(e.target.value)}})}>{[2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div><p className="cs-footnote">Saved conference rules are editable here. Automatic schedule and championship generation will require integration with the Season Simulator.</p></div>
  </>}</section>
  <aside className="cs-panel cs-library"><div className="cs-section-heading">TEAM LIBRARY <b>{available.length}</b></div><input className="cs-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for a school..."/><select className="cs-input cs-space" value={division} onChange={e=>setDivision(e.target.value)}>{['FBS','FCS','DII','DIII'].map(d=><option key={d}>{d}</option>)}</select><div className="cs-pool">{available.map(t=><TeamCard key={getId(t)} team={t} onDragStart={m=>pending.current=m} onAdd={()=>active&&assign(t,active.id,active.hasDivisions?'north':'teams')}/>)}</div><p className="cs-footnote">Click + to add a school, or drag its card into the conference. Assigned schools are removed from the available pool.</p></aside>
  </div></div></main>
}
