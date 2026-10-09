'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, GitBranch, CalendarDays, ListOrdered, Activity, Network } from 'lucide-react';
import styles from './StudioNav.module.css';

const links = [
  { href: '/', title: 'Playoff Bracket', Icon: GitBranch },
  { href: '/schedule', title: 'Schedule Builder', Icon: CalendarDays },
  { href: '/top-25', title: 'Top 25', Icon: ListOrdered },
  { href: '/sim', title: 'Season Sim', Icon: Activity },
  { href: '/conferences', title: 'Conference Studio', Icon: Network },
];

export default function StudioNav() {
  const pathname = usePathname();
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Gridiron Lab — home">
        <span className={styles.brandIcon}><Shield size={21} aria-hidden="true" /></span>
        <span>GRIDIRON <strong>LAB</strong></span>
      </Link>
      <nav className={styles.nav} aria-label="Gridiron Lab sections">
        {links.map(({ href, title, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} className={`${styles.link} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={16} aria-hidden="true" />
              <span>{title}</span>
            </Link>
          );
        })}
      </nav>
      <span className={styles.tagline}>CUSTOM COLLEGE FOOTBALL STUDIO</span>
    </header>
  );
}
