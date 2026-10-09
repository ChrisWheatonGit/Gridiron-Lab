import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(request:Request){
 const key=process.env.CFBD_API_KEY;
 if(!key)return NextResponse.json({error:'CFBD_API_KEY is not configured. Add it to .env.local, or import a historical CSV instead.'},{status:400});
 const params=new URL(request.url).searchParams;
 const years=(params.get('years')||'2023,2024,2025').split(',').map(Number).filter(y=>Number.isInteger(y)&&y>=2001&&y<=2025).slice(0,5);
 if(!years.length)return NextResponse.json({error:'No valid historical seasons selected'},{status:400});
 try{
  const groups=await Promise.all(years.map(async year=>{
   const response=await fetch(`https://api.collegefootballdata.com/games?year=${year}&seasonType=regular&division=fbs`,{headers:{Authorization:`Bearer ${key}`,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw new Error(`CFBD ${year}: HTTP ${response.status}`);
   const result=await response.json();if(!Array.isArray(result))throw new Error(`Unexpected CFBD response for ${year}`);
   return result.map((g:{home_team?:string;away_team?:string;home_points?:number;away_points?:number})=>({year,home:g.home_team,away:g.away_team,homeScore:g.home_points,awayScore:g.away_points})).filter(g=>g.home&&g.away&&Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore));
  }));
  return NextResponse.json({games:groups.flat(),years,source:'CollegeFootballData historical completed games'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Historical import failed'},{status:502});}
}
