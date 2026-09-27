'use client';

import { DM_Sans, Syne } from 'next/font/google';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Agent,
  api,
  DocumentItem,
  getStoredUser,
} from '@/lib/api';
import styles from './agent.module.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-agent-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-agent-body',
});

type ChatMessage = {
  id: string;
  role: string;
  content: string;
};

function documentStatusLabel(status: string) {
  switch (status) {
    case 'UPLOADED':
      return 'Pendiente';
    case 'PROCESSING':
      return 'Procesando';
    case 'PROCESSED':
      return 'Procesado';
    case 'FAILED':
      return 'Error';
    case 'ARCHIVED':
      return 'Archivado';
    default:
      return status;
  }
}

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;
  const user = getStoredUser();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [tone, setTone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function load() {
    const [agentData, docs] = await Promise.all([
      api<Agent>(`/agents/${agentId}`),
      api<DocumentItem[]>(`/documents?agentId=${agentId}`),
    ]);
    setAgent(agentData);
    setTone(agentData.tone ?? '');
    setInstructions(agentData.instructions ?? '');
    setWelcomeMessage(agentData.welcomeMessage ?? '');
    setDocuments(docs);
  }

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }

    load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar agente'),
    );
  }, [agentId, router]);

  async function saveAgent(event: FormEvent) {
    event.preventDefault();
    setError('');
    setInfo('');
    setSaving(true);
    try {
      const updated = await api<Agent>(`/agents/${agentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ tone, instructions, welcomeMessage }),
      });
      setAgent(updated);
      setInfo('Agente actualizado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function createDocument(event: FormEvent) {
    event.preventDefault();
    setError('');
    setInfo('');
    setUploading(true);
    try {
      await api('/documents', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          name: docName,
          type: 'FAQ',
          extractedText: docText,
        }),
      });
      setDocName('');
      setDocText('');
      setInfo('Documento cargado');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar documento');
    } finally {
      setUploading(false);
    }
  }

  async function trainDocument(documentId: string) {
    setError('');
    setInfo('');
    setTrainingId(documentId);
    try {
      await api(`/documents/${documentId}/train`, { method: 'POST' });
      setInfo('Entrenamiento completado');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrenar');
    } finally {
      setTrainingId(null);
    }
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    setError('');
    setChatting(true);
    try {
      const result = await api<{
        conversationId: string;
        messages: ChatMessage[];
      }>(`/agents/${agentId}/test-chat`, {
        method: 'POST',
        body: JSON.stringify({ message: chatMessage, conversationId }),
      });
      setConversationId(result.conversationId);
      setMessages(result.messages);
      setChatMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setChatting(false);
    }
  }

  async function activateAgent() {
    setError('');
    setInfo('');
    setActivating(true);
    try {
      const updated = await api<Agent>(`/agents/${agentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      setAgent(updated);
      setInfo('Agente activado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar');
    } finally {
      setActivating(false);
    }
  }

  async function publishWidget() {
    setError('');
    setInfo('');
    setPublishing(true);
    try {
      const widget = await api<{ id: string; status: string }>(
        `/agents/${agentId}/widget`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'ACTIVE',
            welcomeMessage: welcomeMessage || 'Hola, ¿en qué puedo ayudarte?',
            primaryColor: '#7e1c8a',
          }),
        },
      );
      setInfo(`Widget publicado: ${widget.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar widget');
    } finally {
      setPublishing(false);
    }
  }

  if (!user) return null;

  return (
    <main className={`${styles.page} ${syne.variable} ${dmSans.variable}`}>
      <header className={styles.topbar}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Volver al panel
        </Link>
        <p className={styles.brandMark}>AtlasIA</p>
      </header>

      <section className={styles.hero} aria-labelledby="agent-title">
        <div className={styles.heroAccent} aria-hidden="true" />
        <div className={styles.heroBody}>
          <div className={styles.heroTitleRow}>
            <h1 id="agent-title" className={styles.heroTitle}>
              {agent?.name ?? 'Agente'}
            </h1>
            {agent ? (
              <span className={styles.statusBadge} aria-label={`Estado ${agent.status}`}>
                {agent.status}
              </span>
            ) : null}
          </div>
          <p className={styles.heroSupport}>
            Configura personalidad, carga conocimiento y prueba respuestas antes de
            publicar.
          </p>
          <dl className={styles.metaRow}>
            <div>
              <dt>Agente</dt>
              <dd>{agent?.status ?? '—'}</dd>
            </div>
            <div>
              <dt>Conocimiento</dt>
              <dd>
                {documents.length} documento{documents.length === 1 ? '' : 's'}
              </dd>
            </div>
            <div>
              <dt>Widget</dt>
              <dd>Estado no disponible</dd>
            </div>
          </dl>
        </div>
      </section>

      {error ? (
        <p className={styles.alertError} role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className={styles.alertInfo} role="status">
          {info}
        </p>
      ) : null}

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="config-title">
          <div className={styles.cardHead}>
            <h2 id="config-title">Configuración del agente</h2>
            <p className={styles.cardHelp}>
              Define tono, instrucciones y el mensaje inicial que verán tus visitantes.
            </p>
          </div>

          <form className={styles.form} onSubmit={saveAgent}>
            <label className={styles.field} htmlFor="agent-tone">
              <span>Tono</span>
              <input
                id="agent-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Ej. cercano, profesional, claro"
              />
            </label>

            <label className={styles.field} htmlFor="agent-instructions">
              <span>Instrucciones</span>
              <textarea
                id="agent-instructions"
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Cómo debe responder y qué límites respetar"
              />
            </label>

            <label className={styles.field} htmlFor="agent-welcome">
              <span>Mensaje de bienvenida</span>
              <textarea
                id="agent-welcome"
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Hola, ¿en qué puedo ayudarte?"
              />
            </label>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={activateAgent}
                disabled={activating}
              >
                {activating ? 'Activando…' : 'Activar'}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={publishWidget}
                disabled={publishing}
              >
                {publishing ? 'Publicando…' : 'Publicar widget'}
              </button>
            </div>
          </form>
        </section>

        <section className={styles.card} aria-labelledby="docs-title">
          <div className={styles.cardHead}>
            <h2 id="docs-title">Documentos</h2>
            <p className={styles.cardHelp}>
              Carga FAQ o texto para entrenar la base de conocimiento de este agente.
            </p>
          </div>

          <form className={styles.form} onSubmit={createDocument}>
            <label className={styles.field} htmlFor="doc-name">
              <span>Nombre</span>
              <input
                id="doc-name"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
                placeholder="Ej. FAQ horarios"
              />
            </label>

            <label className={styles.field} htmlFor="doc-content">
              <span>Contenido</span>
              <textarea
                id="doc-content"
                rows={5}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                required
                placeholder="Pega aquí el texto o las preguntas frecuentes"
              />
            </label>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={uploading}
            >
              {uploading ? 'Cargando…' : 'Cargar FAQ / texto'}
            </button>
          </form>

          <div className={styles.docList} aria-live="polite">
            {documents.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Todavía no hay documentos</p>
                <p className={styles.cardHelp}>
                  Cuando cargues el primero, aparecerá aquí con su estado de
                  procesamiento.
                </p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className={styles.docItem}>
                  <div>
                    <strong>{doc.name}</strong>
                    <p className={styles.docMeta}>
                      {doc.type} ·{' '}
                      <span className={styles.docStatus}>
                        {documentStatusLabel(doc.status)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => trainDocument(doc.id)}
                    disabled={trainingId === doc.id}
                  >
                    {trainingId === doc.id ? 'Entrenando…' : 'Entrenar'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className={`${styles.card} ${styles.chatCard}`} aria-labelledby="chat-title">
        <div className={styles.cardHead}>
          <h2 id="chat-title">Chat de prueba</h2>
          <p className={styles.cardHelp}>
            Prueba respuestas con el conocimiento ya entrenado, sin publicar el widget.
          </p>
        </div>

        <div className={styles.chatShell}>
          <div className={styles.chatMessages} aria-live="polite">
            {messages.length === 0 ? (
              <div className={styles.chatEmpty}>
                <p className={styles.emptyTitle}>Sin mensajes todavía</p>
                <p className={styles.cardHelp}>
                  Escribe una pregunta de ejemplo para ver cómo responde el agente.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.bubble} ${
                    message.role === 'VISITOR' ? styles.bubbleUser : styles.bubbleAgent
                  }`}
                >
                  <span className={styles.bubbleRole}>
                    {message.role === 'VISITOR' ? 'Tú' : 'Agente'}
                  </span>
                  <p>{message.content}</p>
                </div>
              ))
            )}
          </div>

          <form className={styles.chatComposer} onSubmit={sendChat}>
            <label className={styles.srOnly} htmlFor="chat-message">
              Mensaje
            </label>
            <input
              id="chat-message"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              required
              placeholder="Escribe un mensaje…"
              disabled={chatting}
            />
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={chatting || !chatMessage.trim()}
            >
              {chatting ? 'Enviando…' : 'Enviar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
