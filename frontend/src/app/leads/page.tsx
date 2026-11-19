'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PanelNav } from '@/components/PanelNav';
import { API_URL, Agent, api, clearSession, getStoredUser } from '@/lib/api';
import dash from '../dashboard/dashboard.module.css';
import styles from './leads.module.css';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  conversationId: string | null;
  createdAt: string;
  agent: { id: string; name: string };
};

function show(value?: string | null) {
  const text = value?.trim();
  return text ? text : '—';
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function LeadsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace('/login');
      return;
    }
    setReady(true);
    api<Agent[]>('/agents')
      .then(setAgents)
      .catch(() => setAgents([]));
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
    setLoading(true);
    setError('');
    api<Lead[]>(`/leads${query}`)
      .then(setLeads)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los prospectos'),
      )
      .finally(() => setLoading(false));
  }, [ready, agentId]);

  async function exportCsv() {
    setExporting(true);
    setError('');
    try {
      const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
      const token = localStorage.getItem('atlasia_token');
      const response = await fetch(`${API_URL}/leads/export${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error('No se pudo exportar el CSV');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prospectos.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el CSV');
    } finally {
      setExporting(false);
    }
  }

  if (!ready) return null;

  return (
    <main className={dash.page}>
      <header className={dash.topbar}>
        <div>
          <p className={dash.brand}>SOPHIA IA</p>
          <p className={dash.hello}>Prospectos</p>
        </div>
        <PanelNav current="leads" />
        <button
          type="button"
          className={dash.ghost}
          onClick={() => {
            clearSession();
            router.replace('/login');
          }}
        >
          Salir
        </button>
      </header>

      {error ? <p className={dash.error}>{error}</p> : null}

      <section className={dash.card}>
        <div className={styles.tools}>
          <div>
            <h1 className={styles.title}>Prospectos</h1>
            <p className={dash.muted}>
              Contactos que dejaron sus datos en el chat.{' '}
              <Link href="/dashboard">Volver al panel</Link>
            </p>
          </div>
          <label className={styles.filter}>
            Agente
            <select
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
            >
              <option value="">Todos</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={dash.ghost}
            onClick={() => void exportCsv()}
            disabled={exporting || loading || leads.length === 0}
          >
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>

        {loading ? (
          <p className={dash.muted}>Cargando prospectos…</p>
        ) : leads.length === 0 ? (
          <p className={`${dash.muted} ${styles.empty}`}>
            Todavía no hay prospectos para este filtro.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Agente</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>{show(lead.email)}</td>
                    <td>{show(lead.phone)}</td>
                    <td>{lead.agent.name}</td>
                    <td>{formatWhen(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
