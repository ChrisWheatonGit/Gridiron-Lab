param([string]$Project = 'C:\Github Projects\cfp-studio')
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$page=Join-Path $Project 'src\app\page.tsx'
$nav=Join-Path $Project 'src\components\StudioNav.tsx'
$library=Join-Path $Project 'src\app\library\page.tsx'
if(-not (Test-Path $page) -or -not (Test-Path $nav)){throw 'Could not find the Gridiron Lab project files. Set -Project to your project folder.'}
$backup=Join-Path $Project ('rankings-bowls-backup-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach($p in @('src\app\page.tsx','src\components\StudioNav.tsx','src\app\library\page.tsx','src\app\bowls')){$path=Join-Path $Project $p;if(Test-Path $path){$out=Join-Path $backup $p;New-Item -ItemType Directory -Path (Split-Path $out) -Force | Out-Null;Copy-Item -LiteralPath $path -Destination $out -Recurse -Force}}

# Only alter the Playoff Builder's display and an optional manual seeding action.
$p=Get-Content -LiteralPath $page -Raw
if($p -notmatch 'gridiron-lab-top25-v1'){
 $anchor=' const map=useMemo('
 $insert=@'
 const [rankingIds,setRankingIds]=useState<string[]>([]);
 useEffect(()=>{const read=()=>{try{const data=JSON.parse(localStorage.getItem('gridiron-lab-top25-v1')||'null');setRankingIds(Array.isArray(data?.ids)?data.ids.filter((id:unknown):id is string=>typeof id==='string'):[])}catch{setRankingIds([])}};read();window.addEventListener('focus',read);window.addEventListener('storage',read);return ()=>{window.removeEventListener('focus',read);window.removeEventListener('storage',read)}},[]);
 function seedFromTop25(){const valid=rankingIds.filter(id=>teams.some(t=>t.id===id)).slice(0,bracket.size);if(!valid.length){status('Create your Top 25 rankings first.');return}if(!window.confirm('Use your manual Top 25 order to replace the current playoff seeds? Current winners and scores may be reset.'))return;setBracket(prev=>cleanState({...prev,seedIds:Array.from({length:prev.size},(_,i)=>valid[i]||null),winners:{},scores:{}}));status('Playoff seeds updated from your manual Top 25')}
'@
 if(-not $p.Contains($anchor)){throw 'Playoff page structure changed; no files installed. Please upload your current page.tsx.'}
 $p=$p.Replace($anchor,$insert+"`r`n"+$anchor)
 $match='<span className="match-name">{t?.name||'
 $with='<span className="match-name">{t?.id&&rankingIds.indexOf(t.id)>=0?<span style={{color:"#e4b45e",fontWeight:900,marginRight:5}}>#{rankingIds.indexOf(t.id)+1}</span>:null}{t?.name||'
 if(-not $p.Contains($match)){throw 'Could not find matchup team label; no files installed.'}
 $p=$p.Replace($match,$with)
 $seed='<span className="seed-team-name">{t?.name||'
 $seedWith='<span className="seed-team-name">{t?.id&&rankingIds.indexOf(t.id)>=0?`#${rankingIds.indexOf(t.id)+1} `:""}{t?.name||'
 if($p.Contains($seed)){$p=$p.Replace($seed,$seedWith)}
 $toolbar='<div className="toolbar"><div className="toolbar-section">'
 $toolbarWith='<div className="toolbar"><div className="toolbar-section"><button className="button outline" type="button" onClick={seedFromTop25}>Use Top 25 for Seeding</button></div><div className="toolbar-section">'
 if(-not $p.Contains($toolbar)){throw 'Cannot find bracket toolbar; no files installed.'}
 $p=$p.Replace($toolbar,$toolbarWith)
}

# Add navigation link without touching the logo, brand mark, or styles.
$n=Get-Content -LiteralPath $nav -Raw
if($n -notmatch 'href:\s*[''""]/bowls'){
 $n=[regex]::Replace($n,'(?m)^([ \t]*\{[ \t]*href:[ \t]*[''""]/top-25[''""].*\r?\n)','$1  { href: ''/bowls'', title: ''Bowl Games'', Icon: Trophy },'+"`r`n",1)
 if($n -notmatch "href: '/bowls'"){throw 'Navigation format changed; no files installed.'}
 $n=[regex]::Replace($n,'import[ \t]*\{([^}]+)\}[ \t]*from[ \t]*[''""]lucide-react[''""]',{param($m) $inside=$m.Groups[1].Value;if($inside -notmatch '\bTrophy\b'){$inside+=', Trophy'};return "import {$inside} from 'lucide-react'"},1)
}

$l=$null
if(Test-Path $library){$l=Get-Content -LiteralPath $library -Raw
 if($l -notmatch 'gridiron-manual-bowls-v1'){
  $l=$l.Replace('conferences:unknown};','conferences:unknown;bowls?:unknown};')
  $l=$l.Replace("const CONFERENCES='gridiron-conference-studio-v1';","const CONFERENCES='gridiron-conference-studio-v1';`r`nconst BOWLS='gridiron-manual-bowls-v1';")
  $l=$l.Replace('conferences:safeParse(localStorage.getItem(CONFERENCES))','conferences:safeParse(localStorage.getItem(CONFERENCES)),bowls:safeParse(localStorage.getItem(BOWLS))')
  $restore="  const firstScheduleKey=Object.keys(snapshot.teamSchedules||{})[0];"
  $l=$l.Replace($restore,"  if(snapshot.bowls!==undefined&&snapshot.bowls!==null)localStorage.setItem(BOWLS,JSON.stringify(snapshot.bowls));else localStorage.removeItem(BOWLS);`r`n"+$restore)
  $l=$l.Replace('<Link href="/conferences">Conferences →</Link>','<Link href="/conferences">Conferences →</Link><Link href="/bowls">Bowl Games →</Link>')
 }
}

$dest=Join-Path $Project 'src\app\bowls'
New-Item -ItemType Directory -Path $dest -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'src\app\bowls\page.tsx') -Destination (Join-Path $dest 'page.tsx') -Force
Copy-Item -LiteralPath (Join-Path $root 'src\app\bowls\bowls.module.css') -Destination (Join-Path $dest 'bowls.module.css') -Force
Set-Content -LiteralPath $page -Value $p -Encoding UTF8
Set-Content -LiteralPath $nav -Value $n -Encoding UTF8
if($null -ne $l){Set-Content -LiteralPath $library -Value $l -Encoding UTF8}
Write-Host "Installed. Backups: $backup" -ForegroundColor Green
Write-Host 'Existing logo files and navigation styles were not modified.'
