'use client';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {Save,FolderOpen,CheckCircle2} from 'lucide-react';
import {saveWorkspace,KEYS,parse} from '@/lib/workspace';
import styles from './SaveToolbar.module.css';
export default function SaveToolbar(){
 const path=usePathname();const router=useRouter();const [name,setName]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{const sync=()=>{const arr=parse(localStorage.getItem(KEYS.archive));const id=localStorage.getItem(KEYS.active);setName(Array.isArray(arr)?arr.find((s:{id:string})=>s.id===id)?.name||'Unsaved workspace':'Unsaved workspace')};sync();window.addEventListener('gridiron-workspace-saved',sync);window.addEventListener('storage',sync);return ()=>{window.removeEventListener('gridiron-workspace-saved',sync);window.removeEventListener('storage',sync)}},[path]);
 if(path==='/library'||!['/','/schedule','/top-25','/conferences','/bowls','/stats'].includes(path))return null;
 function save(){try{const result=saveWorkspace();setName(result.slot.name);setNotice(result.message);setTimeout(()=>setNotice(''),4500)}catch{setNotice('Could not save: browser storage may be full. Export a backup from Saved Seasons.')}}
 return <aside className={styles.toolbar} aria-label="Save project controls"><span className={styles.label}>{notice?<><CheckCircle2 size={14}/>{notice}</>:<>WORKSPACE <strong>{name}</strong></>}</span><button className={styles.save} onClick={save}><Save size={15}/> Save Progress</button><button className={styles.open} onClick={()=>router.push('/library')}><FolderOpen size={15}/> Open Saved</button></aside>
}
