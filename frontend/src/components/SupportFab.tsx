'use client';

import { useEffect, useId, useRef, useState } from 'react';

import styles from './SupportFab.module.css';

const SUPPORT_EMAIL = 'soporte@sophiaia.com';

export function SupportFab() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <div className={styles.root}>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className={styles.panel}
          role="dialog"
          aria-label="Soporte AtlasIA"
        >
          <p className={styles.panelTitle}>¿Necesitás ayuda?</p>
          <p className={styles.panelText}>
            Escribinos y te respondemos para configurar tu agente, documentos o
            el widget.
          </p>
          <a
            className={styles.panelAction}
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              'Soporte AtlasIA',
            )}`}
          >
            Contactar soporte
          </a>
          <p className={styles.panelEmail}>{SUPPORT_EMAIL}</p>
        </div>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        className={styles.fab}
        aria-label={open ? 'Cerrar soporte UI BFF' : 'Abrir soporte UI BFF'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <span aria-hidden="true" className={styles.iconClose}>
            ×
          </span>
        ) : (
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-3.8 3.2c-.6.5-1.45.1-1.45-.7V16A2.5 2.5 0 0 1 5 13.5v-7Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 9h7M8.5 12h4.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        )}
        <span className={styles.fabLabel}>Soporte UI BFF</span>
      </button>
    </div>
  );
}
