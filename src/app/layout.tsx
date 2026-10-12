import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './studio-tools.css';
import StudioNav from '@/components/StudioNav';
import SaveToolbar from '@/components/SaveToolbar';
export const metadata:Metadata={title:'Gridiron Lab | College Football Bracket Studio',description:'Create, customize, and share college football playoff brackets across FBS, FCS, DII and DIII.'};
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="en"><body><StudioNav/><SaveToolbar/>{children}</body></html>}
