export type Division='FBS'|'FCS'|'DII'|'DIII';
export type Team={id:string;name:string;mascot:string;division:Division;conference:string;color:string;logo?:string};
export type BracketState={title:string;size:number;seedIds:(string|null)[];winners:Record<string,string>;scores:Record<string,[string,string]>;};
export const FORMATS=[4,8,12,16,24,32] as const;
export const nextPow2=(v:number)=>2**Math.ceil(Math.log2(v));
// Seeds are arranged so top seed meets bottom seed within each half of the tree.
export function seedPositions(size:number){let seeds=[1];for(let count=2;count<=nextPow2(size);count*=2){seeds=seeds.flatMap(n=>[n,count+1-n]);}return seeds;}
export type Entry={id:string|null;seed:number|null};
export type Match={id:string;round:number;index:number;entries:[Entry,Entry];winner:string|null;bye:boolean};
export function calculateBracket(state:BracketState):Match[][]{
 const positions=seedPositions(state.size);const teamBySeed=(seed:number):Entry=>({id:seed<=state.size?state.seedIds[seed-1]||null:null,seed:seed<=state.size?seed:null});
 const rounds:Match[][]=[];
 for(let r=0;r<Math.log2(nextPow2(state.size));r++){
  const num=nextPow2(state.size)/(2**(r+1));const round:Match[]=[];
  for(let i=0;i<num;i++){
   const id=`r${r}m${i}`;
   const entries=(r===0?[teamBySeed(positions[i*2]),teamBySeed(positions[i*2+1])]:[rounds[r-1][i*2].winner?winnerEntry(rounds[r-1][i*2]):{id:null,seed:null},rounds[r-1][i*2+1].winner?winnerEntry(rounds[r-1][i*2+1]):{id:null,seed:null}]) as [Entry,Entry];
   const bye=r===0&&entries.filter(e=>e.seed===null).length===1;
   const winner=bye?entries.find(e=>e.seed!==null)?.id||null:(entries[0].id&&entries[1].id&&[entries[0].id,entries[1].id].includes(state.winners[id])?state.winners[id]:null);
   round.push({id,round:r,index:i,entries,winner,bye});
  }
  rounds.push(round);
 }
 return rounds;
}
function winnerEntry(m:Match):Entry{return m.entries.find(e=>e.id===m.winner)||{id:null,seed:null}}
export function initialBracket(ids:string[],size=24):BracketState{return {title:'My Playoff Projection',size,seedIds:Array.from({length:size},(_,i)=>ids[i]||null),winners:{},scores:{}}}
export function cleanState(input:BracketState):BracketState {return {...input,winners:{},scores:{}}}
