import Link from 'next/link';

import styles from './PanelNav.module.css';

type Section = 'panel' | 'leads';

export function PanelNav({ current }: { current?: Section }) {
  return (
    <nav className={styles.nav} aria-label="Secciones del panel">
      <Link
        href="/dashboard"
        aria-current={current === 'panel' ? 'page' : undefined}
      >
        Panel
      </Link>
      <Link
        href="/leads"
        aria-current={current === 'leads' ? 'page' : undefined}
      >
        Prospectos
      </Link>
    </nav>
  );
}
