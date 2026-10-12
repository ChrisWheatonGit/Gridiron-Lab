export const KEYS={archive:'gridiron-manual-archives-v1',active:'gridiron-active-save-slot-v1',schedules:'gridiron-lab-schedules-v1',bracket:'gridiron-lab-v1',rankings:'gridiron-lab-top25-v1',conferences:'gridiron-conference-studio-v1',bowls:'gridiron-manual-bowls-v1',statistics:'gridiron-lab-statistics-v1'} as const;
export type Snapshot={id:string;name:string;year:string;createdAt:string;teamSchedules:Record<string,unknown>;bracket:unknown;rankings:unknown;conferences:unknown;bowls?:unknown;statistics?:unknown};
export const parse=(s:string|null):any=>{try{return s?JSON.parse(s):null}catch{return null}};
const uid=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function capture(name:string,year:string,id=uid()):Snapshot{return {id,name,year,createdAt:new Date().toISOString(),teamSchedules:parse(localStorage.getItem(KEYS.schedules))||{},bracket:parse(localStorage.getItem(KEYS.bracket)),rankings:parse(localStorage.getItem(KEYS.rankings)),conferences:parse(localStorage.getItem(KEYS.conferences)),bowls:parse(localStorage.getItem(KEYS.bowls)),statistics:parse(localStorage.getItem(KEYS.statistics))};}
export function saveWorkspace():{message:string;slot:Snapshot}{
 const stored=parse(localStorage.getItem(KEYS.archive));const all:Snapshot[]=Array.isArray(stored)?stored:[];
 const id=localStorage.getItem(KEYS.active);const previous=all.find(s=>s.id===id);
 const slot=capture(previous?.name||'My Football Season',previous?.year||String(new Date().getFullYear()),previous?.id||uid());
 const updated=previous?all.map(s=>s.id===previous.id?slot:s):[slot,...all];
 localStorage.setItem(KEYS.archive,JSON.stringify(updated));localStorage.setItem(KEYS.active,slot.id);
 window.dispatchEvent(new Event('gridiron-workspace-saved'));
 return {message:previous?`Saved to ${slot.name}`:`Created save slot: ${slot.name}`,slot};
}
