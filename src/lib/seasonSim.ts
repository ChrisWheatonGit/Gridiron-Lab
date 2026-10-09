import type {Team,Division} from './bracket';
export type HistoricalGame={year:number;home:string;away:string;homeScore:number;awayScore:number};
export type Rating={value:number;games:number;source:'historical'|'estimated'};
export type SimGame={id:string;week:number;homeId:string;awayId:string;homeScore:number|null;awayScore:number|null;homeWinProbability:number;};
export type SeasonSimulation={division:Division;year:number;week:number;seed:number;games:SimGame[];ratings:Record<string,Rating>;};
export type RecordRow={teamId:string;wins:number;losses:number;pointsFor:number;pointsAgainst:number;rating:number;};
const clamp=(n:number,low:number,high:number)=>Math.max(low,Math.min(high,n));
export const norm=(s:string)=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
export function makeRng(seed:number){let a=seed>>>0;return ()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function computeRatings(teams:Team[],history:HistoricalGame[],season=2026):Record<string,Rating>{
 const index=new Map<string,string>();for(const t of teams){index.set(norm(t.name),t.id);index.set(norm(`${t.name} ${t.mascot}`),t.id)}
 const values:Record<string,Rating>={};for(const t of teams)values[t.id]={value:1500,games:0,source:'estimated'};
 for(const g of [...history].filter(g=>g.year<season&&g.year>=season-8).sort((a,b)=>a.year-b.year)){
 const h=index.get(norm(g.home)),a=index.get(norm(g.away));if(!h||!a||h===a)continue;
 if(!Number.isFinite(g.homeScore)||!Number.isFinite(g.awayScore))continue;
 const rh=values[h],ra=values[a];const expected=1/(1+10**((ra.value-rh.value-55)/400));
 const margin=g.homeScore-g.awayScore;const actual=margin>0?1:margin<0?0:0.5;
 const magnitude=clamp(Math.log2(Math.abs(margin)+1)/3,0.65,1.6);
 // Recent seasons matter more, and schedule strength emerges from opponent Elo.
 const age=season-g.year;
 const change=30*Math.pow(0.86,Math.max(0,age-1))*magnitude*(actual-expected);
 rh.value=clamp(rh.value+change,1100,1900);ra.value=clamp(ra.value-change,1100,1900);
 rh.games++;ra.games++;rh.source='historical';ra.source='historical';
 }
 return values;
}
export function generateSchedule(teams:Team[],ratings:Record<string,Rating>,year:number,seed=42,weeks=12):SeasonSimulation{
 const rng=makeRng(seed);const ids=teams.map(t=>t.id).sort();
 // Rotate a shuffled pool each week. This generates unique matchups and one game per school per week.
 for(let i=ids.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
 const pool=ids.length%2?[...ids,'BYE']:[...ids];const n=pool.length;const games:SimGame[]=[];
 const used=new Set<string>();const rounds=Math.min(weeks,n-1);
 for(let w=1;w<=rounds;w++){
  for(let j=0;j<n/2;j++){
   const left=pool[j],right=pool[n-j-1];if(left==='BYE'||right==='BYE')continue;
   const home=(w+j)%2?left:right,away=home===left?right:left;
   const prob=winProbability(ratings[home]?.value??1500,ratings[away]?.value??1500);
   const key=[home,away].sort().join('|');if(used.has(key))continue;used.add(key);
   games.push({id:`${year}-${seed}-${w}-${j}`,week:w,homeId:home,awayId:away,homeScore:null,awayScore:null,homeWinProbability:prob});
  }
  pool.splice(1,0,pool.pop()!);
 }
 return {division:teams[0]?.division||'FBS',year,week:0,seed,games,ratings};
}
export function winProbability(home:number,away:number){return clamp(1/(1+10**((away-home-55)/400)),0.04,0.96)}
function normal(rng:()=>number){return Math.sqrt(-2*Math.log(Math.max(1e-8,rng())))*Math.cos(2*Math.PI*rng())}
export function simulateWeek(state:SeasonSimulation):SeasonSimulation{
 const week=state.week+1;if(!state.games.some(g=>g.week===week))return state;
 const next={...state,week,games:state.games.map(g=>({...g}))};
 for(const g of next.games.filter(g=>g.week===week&&g.homeScore===null)){
  const a=state.ratings[g.homeId]?.value??1500,b=state.ratings[g.awayId]?.value??1500;
  const seed=[...g.id].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,state.seed>>>0);const rng=makeRng(seed);
  // Determine the winner using the SAME probability reported by the UI.
  // This prevents the scoring noise from contradicting the projected upset rate.
  const p=winProbability(a,b),homeWins=rng()<p;
  const favoriteGap=Math.abs(a-b);
  const margin=clamp(Math.round(3+favoriteGap/32+Math.abs(normal(rng))*7),1,48);
  const total=clamp(Math.round(47+(a+b-3000)/45+normal(rng)*10),24,90);
  const high=Math.round((total+margin)/2),low=Math.max(0,Math.round((total-margin)/2));
  g.homeScore=homeWins?high:low;
  g.awayScore=homeWins?low:high;
  if(g.homeScore===g.awayScore){if(homeWins)g.homeScore++;else g.awayScore++;}
 }
 return next;
}
export function standings(state:SeasonSimulation,teams:Team[]):RecordRow[]{
 const map=new Map(teams.map(t=>[t.id,{teamId:t.id,wins:0,losses:0,pointsFor:0,pointsAgainst:0,rating:state.ratings[t.id]?.value??1500}]));
 for(const g of state.games){if(g.homeScore===null||g.awayScore===null)continue;const a=map.get(g.homeId),b=map.get(g.awayId);if(!a||!b)continue;
 a.pointsFor+=g.homeScore;a.pointsAgainst+=g.awayScore;b.pointsFor+=g.awayScore;b.pointsAgainst+=g.homeScore;
 if(g.homeScore>g.awayScore){a.wins++;b.losses++;}else{b.wins++;a.losses++;}
 }
 // A single surprise win should not erase years of evidence.
 // Estimated teams are deliberately NOT treated as top-25 caliber without data.
 const score=(r:RecordRow)=>{
  const evidence=state.ratings[r.teamId]?.games??0;
  const played=r.wins+r.losses;
  const winPct=played?r.wins/played:0.5;
  const pointMargin=played?(r.pointsFor-r.pointsAgainst)/played:0;
  const priorReliability=clamp(evidence/18,0,1);
  const baseline=1500+(r.rating-1500)*priorReliability;
  // Bayesian-style small sample shrinkage on in-season performance.
  const performance=(winPct-0.5)*130*(played/(played+9));
  const cappedMargin=clamp(pointMargin,-21,21)*1.1*(played/(played+9));
  const unknownPenalty=evidence===0?145:evidence<4?70:0;
  return baseline+performance+cappedMargin-unknownPenalty;
 };
 return [...map.values()].sort((a,b)=>score(b)-score(a));
}
export function historicalCsv(text:string):HistoricalGame[]{
 const rows=text.replace(/\r/g,'').split('\n').filter(Boolean);if(rows.length<2)return [];
 function parse(line:string){return (line.match(/(?:"(?:[^"]|"")*"|[^,])+/g)||[]).map(s=>s.trim().replace(/^"|"$/g,'').replace(/""/g,'"'))}
 const h=parse(rows[0]).map(norm);const col=(aliases:string[])=>aliases.map(norm).map(x=>h.indexOf(x)).find(i=>i>=0)??-1;
 const y=col(['year','season']),ho=col(['home_team','homeTeam','home']),aw=col(['away_team','awayTeam','away']),hs=col(['home_points','homeScore','home_score']),as=col(['away_points','awayScore','away_score']);
 if([y,ho,aw,hs,as].some(x=>x<0))throw new Error('CSV requires year, home_team, away_team, home_points, away_points columns.');
 return rows.slice(1).map(parse).map(v=>({year:Number(v[y]),home:v[ho],away:v[aw],homeScore:Number(v[hs]),awayScore:Number(v[as])})).filter(g=>g.year>1900&&g.home&&g.away&&Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore));
}
