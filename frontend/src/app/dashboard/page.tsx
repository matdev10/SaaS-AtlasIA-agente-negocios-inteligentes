'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Agent,
  api,
  clearSession,
  getStoredUser,
} from '@/lib/api';
import styles from '../auth.module.css';
import dash from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }

    api<Agent[]>('/agents')
      .then(setAgents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error al cargar agentes'),
      )
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearSession();
    router.push('/login');
  }

  if (!user) return null;

  const primaryAgent = agents[0];
  const isFreshDraft =
    primaryAgent?.status === 'DRAFT' &&
    !primaryAgent.description &&
    !primaryAgent.tone &&
    !primaryAgent.instructions;

  return (
    <main className={dash.page}>
      <header className={dash.topbar}>
        <div>
          <p className={dash.brand}>AtlasIA</p>
          <p className={dash.hello}>Hola, {user.name}</p>
        </div>
        <button type="button" className={dash.ghost} onClick={logout}>
          Salir
        </button>
      </header>

      {error ? <p className={dash.error}>{error}</p> : null}

      {loading ? (
        <section className={dash.card}>
          <p className={dash.muted}>Cargando tu espacio…</p>
        </section>
      ) : isFreshDraft && primaryAgent ? (
        <section className={dash.welcome}>
          <div className={dash.welcomeVisual}>
            <p className={dash.welcomeBrand}>AtlasIA</p>
            <p className={dash.welcomeEyebrow}>Onboarding</p>
            <h1 className={dash.welcomeTitle}>
              Bienvenido a AtlasIA. Vamos a crear tu primer Agente IA.
            </h1>
            <p className={dash.welcomeSupport}>
              Ya tienes un agente en borrador. En los próximos pasos vas a
              configurar tu empresa, cargar conocimiento y probarlo.
            </p>
          </div>

          <div className={dash.welcomePanel}>
            <p className={dash.panelMark}>Listo para empezar</p>
            <h2 className={dash.panelTitle}>Tu agente principal</h2>
            <p className={dash.muted}>
              Estado actual: <span className={dash.badge}>{primaryAgent.status}</span>
            </p>
            <ul className={dash.checklist}>
              <li>Cuenta y empresa creadas</li>
              <li>Plan Free asignado</li>
              <li>Agente en borrador</li>
              <li>Base de conocimiento vacía</li>
            </ul>
            <Link
              href={`/agents/${primaryAgent.id}`}
              className={`${styles.submit} ${dash.cta}`}
            >
              Comenzar
            </Link>
          </div>
        </section>
      ) : (
        <section className={dash.card}>
          <div className={dash.cardHead}>
            <h1>Agentes</h1>
            <p className={dash.muted}>
              Configura tu agente, carga conocimiento y pruébalo antes de publicar.
            </p>
          </div>

          <div className={dash.list}>
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className={dash.listItem}
              >
                <div>
                  <strong>{agent.name}</strong>
                  <div className={dash.muted}>
                    {agent.description ?? 'Sin descripción'}
                  </div>
                </div>
                <span className={dash.badge}>{agent.status}</span>
              </Link>
            ))}
            {agents.length === 0 && !error ? (
              <p className={dash.muted}>No hay agentes todavía.</p>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}
