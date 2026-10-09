/**
 * Build the football-only directory from a season-tagged SportsDataverse CSV.
 * NOT from ESPN site.api `groups=` (that endpoint ignores group filters).
 * Run: npm run sync:teams  (requires internet)
 *      npm run sync:teams -- --season=2025
 *      npm run sync:teams -- --source=C:\\path\\teams.csv  (for testing)
 *      npm run sync:teams -- --cache-logos  (optional downloads)
 *
 * Source: https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_cfb_teams
 * ESPN classification is imperfect for lower divisions. Rows not distinguishable
 * between DII and DIII are written to a review report rather than invented.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'src/data/teams.json');
const season=Number(process.argv.find(x=>x.startsWith('--season='))?.split('=')[1]||2026);
const source=process.argv.find(x=>x.startsWith('--source='))?.slice('--source='.length);
const cacheLogos=process.argv.includes('--cache-logos');
if(!Number.isInteger(season)||season<2001||season>2100)throw Error('Invalid season');
const url=`https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_cfb_teams/cfb_teams_${season}.csv`;

function parseCSV(input){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(quoted){if(c==='"'&&input[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}
    else if(c==='"')quoted=true;
    else if(c===','){row.push(field);field=''}
    else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}
    else field+=c;
  }
  if(field.length||row.length){row.push(field);rows.push(row)}
  const headers=rows.shift()?.map(x=>x.replace(/^\ufeff/,''))||[];
  if(!['team_id','division','location'].every(k=>headers.includes(k)))throw Error('CSV has wrong schema: '+headers.join(','));
  return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
const divisionMap={fbs:'FBS',fcs:'FCS',d2:'DII',d3:'DIII'};
function classify(t){
  const espn=(t.division||'').trim().toLowerCase();
  const cfbd=(t.classification||'').trim().toLowerCase().replace(/[\s_-]/g,'');
  const independent={fbs:'FBS',fcs:'FCS',d2:'DII',dii:'DII',divisionii:'DII',d3:'DIII',diii:'DIII',divisioniii:'DIII'}[cfbd];
  const explicit=divisionMap[espn];
  // Disagreement is not enough evidence to silently pick one side.
  if(explicit&&independent&&explicit!==independent)return {division:null,reason:`conflict (${espn} vs ${cfbd})`};
  if(explicit)return {division:explicit,reason:'ESPN classified'};
  if(independent)return {division:independent,reason:'CFBD classified'};
  return {division:null,reason:`unclassified (${espn||'missing'} / ${cfbd||'missing'})`};
}
function color(v){const x=(v||'').replace(/^#/,'');return /^[a-f\d]{6}$/i.test(x)?'#'+x:'#64748b'}
const text=(...v)=>v.find(x=>x&&x.trim()&&x.trim().toLowerCase()!=='na')?.trim()||'';
async function fetchRemote(u){const r=await fetch(u,{headers:{'User-Agent':'GridironLab/3.0','Accept':'text/csv'}});if(!r.ok)throw Error(`HTTP ${r.status} downloading ${u}`);return r.text()}
async function downloadLogos(teams){
  const dir=path.join(root,'public/logos');await fs.mkdir(dir,{recursive:true});
  let success=0,failed=0,skipped=0;let pos=0;
  const worker=async()=>{while(pos<teams.length){const t=teams[pos++];if(!t.logo){skipped++;continue}
    try{
      const r=await fetch(t.logo,{signal:AbortSignal.timeout(12000)});
      if(!r.ok)throw Error(`HTTP ${r.status}`);
      const typ=(r.headers.get('content-type')||'').toLowerCase();
      const ext=typ.includes('png')?'png':typ.includes('jpeg')?'jpg':typ.includes('webp')?'webp':typ.includes('svg')?'svg':null;
      const buf=Buffer.from(await r.arrayBuffer());
      if(!ext||buf.length<100||buf.length>2000000)throw Error('Not a valid/supported image');
      const name=`${t.id}.${ext}`;await fs.writeFile(path.join(dir,name),buf);t.logo='/logos/'+name;success++;
    }catch{failed++}
  }};
  await Promise.all(Array.from({length:8},worker));
  console.log(`Logo downloads: ${success} saved, ${failed} unavailable, ${skipped} no source URL. Remote URLs retained if download fails.`);
}
async function main(){
  console.log(`Reading ${season} season team catalog from ${source||url}`);
  const csv=source?await fs.readFile(path.resolve(source),'utf8'):await fetchRemote(url);
  const records=parseCSV(csv);const found=new Map(),review=[];
  for(const t of records){
    const id=text(t.team_id);if(!/^\d+$/.test(id))continue;
    if(String(t.is_exhibition).toLowerCase()==='true'||String(t.is_all_star).toLowerCase()==='true')continue;
    const {division,reason}=classify(t);
    if(!division){review.push({id,name:text(t.location,t.school,t.short_display_name),reason});continue}
    const name=text(t.location,t.school,t.short_display_name,t.nickname);
    if(!name)continue;
    if(found.has(id))throw Error(`Duplicate team ID ${id} in source! No files changed.`);
    const logo=text(t.team_logo,t.team_logo_dark);
    const row={id:`${division.toLowerCase()}-${id}`,name,mascot:text(t.mascot,t.name,'Football')||'Football',division,conference:text(t.conference_short_name,t.cfbd_conference,t.conference_name)||'Unassigned',color:color(t.color),...(logo?{logo}:{})};
    found.set(id,row);
  }
  const teams=[...found.values()].sort((a,b)=>['FBS','FCS','DII','DIII'].indexOf(a.division)-['FBS','FCS','DII','DIII'].indexOf(b.division)||a.name.localeCompare(b.name));
  const counts=Object.fromEntries(['FBS','FCS','DII','DIII'].map(d=>[d,teams.filter(x=>x.division===d).length]));
  console.table(counts);
  const collisions=new Set();for(const t of teams){if(collisions.has(t.name.toLowerCase()+'|'+t.division))console.warn('Potential duplicate name:',t.name);collisions.add(t.name.toLowerCase()+'|'+t.division)}
  console.log(`${review.length} source rows were unclassified/conflicting and will NOT be assigned to a made-up division.`);
  // The thresholds are safety alarms, NOT official NCAA division counts.
  const floors={FBS:120,FCS:90,DII:80,DIII:100};
  const tooSmall=Object.entries(floors).filter(([d,min])=>counts[d]<min).map(([d])=>d);
  // Report is safe to write even when refusing the catalog update.
  await fs.writeFile(path.join(root,'division-sync-report.json'),JSON.stringify({season,source:source||url,counts,unclassified:review},null,2)+'\n');
  if(tooSmall.length){console.error(`ABORT: Suspiciously low division coverage: ${tooSmall.join(', ')}. src/data/teams.json untouched.`);process.exitCode=1;return}
  if(cacheLogos)await downloadLogos(teams);
  const backup=path.join(root,`teams-before-sync-${Date.now()}.json`);
  await fs.copyFile(output,backup);
  const temp=output+'.tmp';await fs.writeFile(temp,JSON.stringify(teams,null,2)+'\n');await fs.rename(temp,output);
  console.log(`Saved ${teams.length} uniquely classified teams. Backup: ${backup}`);
  console.log('Remaining unclassified schools are in division-sync-report.json. Restart npm run dev.');
}
main().catch(e=>{console.error('SYNC FAILED:',e.message,'\nNo catalog changes were committed.');process.exitCode=1});
