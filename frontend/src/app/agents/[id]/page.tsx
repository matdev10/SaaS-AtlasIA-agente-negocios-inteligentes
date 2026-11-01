'use client';

import { DM_Sans, Syne } from 'next/font/google';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Agent,
  API_URL,
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

const TONE_OPTIONS = [
  { id: 'cercano', label: 'Cercano', value: 'Cercano y amable' },
  { id: 'profesional', label: 'Profesional', value: 'Profesional y claro' },
  { id: 'formal', label: 'Formal', value: 'Formal y preciso' },
  { id: 'directo', label: 'Directo', value: 'Directo y conciso' },
  { id: 'empatico', label: 'Empático', value: 'Empático y paciente' },
] as const;

const INSTRUCTION_OPTIONS = [
  {
    id: 'solo-kb',
    label: 'Solo usa la base de conocimiento',
    text: 'Responde únicamente con información de la base de conocimiento de la empresa.',
  },
  {
    id: 'sin-inventar',
    label: 'No inventes datos',
    text: 'Si no sabes la respuesta, dilo con claridad y ofrece derivar a un humano.',
  },
  {
    id: 'respuestas-cortas',
    label: 'Respuestas breves',
    text: 'Prioriza respuestas cortas, claras y fáciles de leer.',
  },
  {
    id: 'horarios-precios',
    label: 'Enfocado en FAQ',
    text: 'Prioriza horarios, precios, envíos, garantías y políticas frecuentes.',
  },
  {
    id: 'español',
    label: 'Responder en español',
    text: 'Responde siempre en español neutro, salvo que el visitante use otro idioma.',
  },
] as const;

const WELCOME_OPTIONS = [
  {
    id: 'hola',
    label: 'Saludo simple',
    value: '¡Hola! ¿En qué te puedo ayudar?',
  },
  {
    id: 'empresa',
    label: 'Presentación',
    value: 'Hola, soy el asistente de la empresa. ¿Qué necesitas saber?',
  },
  {
    id: 'soporte',
    label: 'Soporte',
    value: 'Bienvenido. Puedo ayudarte con horarios, precios y políticas. ¿Cuál es tu consulta?',
  },
] as const;

const SIZE_OPTIONS = [
  { id: 'sm', label: 'Chico' },
  { id: 'md', label: 'Mediano' },
  { id: 'lg', label: 'Grande' },
] as const;

type WidgetSize = (typeof SIZE_OPTIONS)[number]['id'];

const TEXT_FILE_EXTENSIONS = ['.txt', '.md', '.csv', '.faq', '.text'];

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

function fileExtension(name: string) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function documentTypeFromFile(name: string) {
  const ext = fileExtension(name);
  if (ext === '.faq') return 'FAQ';
  if (ext === '.md' || ext === '.txt' || ext === '.text' || ext === '.csv') {
    return 'TXT';
  }
  return 'OTHER';
}

function buildInstructions(selectedIds: string[]) {
  return INSTRUCTION_OPTIONS.filter((option) => selectedIds.includes(option.id))
    .map((option) => `• ${option.text}`)
    .join('\n');
}

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [tone, setTone] = useState('');
  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  const [selectedInstructionIds, setSelectedInstructionIds] = useState<string[]>(
    [],
  );
  const [instructions, setInstructions] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [previewWelcome, setPreviewWelcome] = useState('');
  const [selectedWelcomeId, setSelectedWelcomeId] = useState<string | null>(
    null,
  );
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [docType, setDocType] = useState('FAQ');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [previewWidgetId, setPreviewWidgetId] = useState<string | null>(null);
  const [previewChecked, setPreviewChecked] = useState(false);
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('lg');
  const [savingSize, setSavingSize] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [sizeSaved, setSizeSaved] = useState(false);

  async function load() {
    const [agentData, docs] = await Promise.all([
      api<Agent>(`/agents/${agentId}`),
      api<DocumentItem[]>(`/documents?agentId=${agentId}`),
    ]);
    setAgent(agentData);
    setTone(agentData.tone ?? '');
    const matchedTone =
      TONE_OPTIONS.find((option) => option.value === agentData.tone)?.id ?? null;
    setSelectedToneId(matchedTone);
    setInstructions(agentData.instructions ?? '');
    const matchedInstructions = INSTRUCTION_OPTIONS.filter((option) =>
      (agentData.instructions ?? '').includes(option.text),
    ).map((option) => option.id);
    setSelectedInstructionIds(matchedInstructions);
    setWelcomeMessage(agentData.welcomeMessage ?? '');
    setPreviewWelcome(agentData.welcomeMessage ?? '');
    const matchedWelcome =
      WELCOME_OPTIONS.find((option) => option.value === agentData.welcomeMessage)
        ?.id ?? null;
    setSelectedWelcomeId(matchedWelcome);
    setDocuments(docs);
    try {
      const widget = await api<{ id: string; size?: string | null }>(
        `/agents/${agentId}/widget`,
      );
      setPreviewWidgetId(widget.id);
      setWidgetSize(
        widget.size === 'sm' || widget.size === 'md' ? widget.size : 'lg',
      );
    } catch {
      setPreviewWidgetId(null);
    } finally {
      setPreviewChecked(true);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewWelcome(welcomeMessage);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [welcomeMessage]);

  function pushPreviewWelcome(text = previewWelcome) {
    const welcome = text.trim() || '¡Hola! ¿En qué te puedo ayudar?';
    previewFrameRef.current?.contentWindow?.postMessage(
      { type: 'atlasia-set-welcome', welcome },
      API_URL,
    );
  }

  useEffect(() => {
    pushPreviewWelcome();
  }, [previewWelcome]);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }

    setMounted(true);
    load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar agente'),
    );
  }, [agentId, router]);

  function selectTone(optionId: string) {
    const option = TONE_OPTIONS.find((item) => item.id === optionId);
    if (!option) return;
    setSelectedToneId(option.id);
    setTone(option.value);
  }

  function toggleInstruction(optionId: string) {
    setSelectedInstructionIds((current) => {
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setInstructions(buildInstructions(next));
      return next;
    });
  }

  function selectWelcome(optionId: string) {
    const option = WELCOME_OPTIONS.find((item) => item.id === optionId);
    if (!option) return;
    setSelectedWelcomeId(option.id);
    setWelcomeMessage(option.value);
    setPreviewWelcome(option.value);
  }

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

  async function readTextFile(file: File) {
    const ext = fileExtension(file.name);
    if (!TEXT_FILE_EXTENSIONS.includes(ext)) {
      throw new Error(
        'Por ahora solo se admiten archivos de texto: .txt, .md, .csv o .faq. PDF/DOCX viene después.',
      );
    }

    if (file.size > 100_000) {
      throw new Error('El archivo supera el límite de 100 KB para esta carga.');
    }

    const text = await file.text();
    if (!text.trim()) {
      throw new Error('El archivo está vacío.');
    }

    return text;
  }

  async function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setInfo('');
    try {
      const text = await readTextFile(file);
      setSelectedFileName(file.name);
      setDocName(file.name.replace(/\.[^.]+$/, ''));
      setDocText(text);
      setDocType(documentTypeFromFile(file.name));
      setInfo(`Archivo listo: ${file.name}`);
    } catch (err) {
      setSelectedFileName('');
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo');
    }
  }

  async function createDocument(event: FormEvent) {
    event.preventDefault();
    setError('');
    setInfo('');
    setUploading(true);
    try {
      const created = await api<DocumentItem>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          name: docName,
          type: docType,
          extractedText: docText,
        }),
      });
      await api(`/documents/${created.id}/train`, { method: 'POST' });
      setDocName('');
      setDocText('');
      setDocType('FAQ');
      setSelectedFileName('');
      setInfo('Documento cargado y entrenado. Ya puedes probarlo en el chat.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar documento');
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(documentId: string) {
    setError('');
    setInfo('');
    setDeletingId(documentId);
    try {
      await api(`/documents/${documentId}`, { method: 'DELETE' });
      setDocuments((current) => current.filter((doc) => doc.id !== documentId));
      setOpenDocId((current) => (current === documentId ? null : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
      setDeletingId(null);
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

  async function deactivateAgent() {
    setError('');
    setInfo('');
    setDeactivating(true);
    try {
      const updated = await api<Agent>(`/agents/${agentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAUSED' }),
      });
      setAgent(updated);
      setInfo('Agente desactivado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar');
    } finally {
      setDeactivating(false);
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

  async function chooseWidgetSize(size: WidgetSize) {
    if (savingSize) return;
    setSizeSaved(false);
    if (size === widgetSize) {
      setSizeMenuOpen(false);
      setSizeSaved(true);
      return;
    }
    setError('');
    setSavingSize(true);
    try {
      const widget = await api<{ id: string; size?: string | null }>(
        `/agents/${agentId}/widget`,
        {
          method: 'PUT',
          body: JSON.stringify({ size }),
        },
      );
      const saved =
        widget.size === 'sm' || widget.size === 'md' || widget.size === 'lg'
          ? widget.size
          : size;
      setWidgetSize(saved);
      setSizeMenuOpen(false);
      setSizeSaved(true);
      setPreviewTick(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el tamaño');
    } finally {
      setSavingSize(false);
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
            welcomeMessage: welcomeMessage || '¡Hola! ¿En qué te puedo ayudar?',
            primaryColor: '#7e1c8a',
          }),
        },
      );
      setPreviewWidgetId(widget.id);
      setPreviewTick(Date.now());
      setInfo(`Widget publicado: ${widget.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar widget');
    } finally {
      setPublishing(false);
    }
  }

  if (!mounted) return null;

  const promptDocs = documents.filter((doc) =>
    /^prompts?\b/i.test(doc.name.trim()),
  );
  const otherDocs = documents.filter((doc) => !promptDocs.includes(doc));

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
            Revisá el chat de tu agente, cargá conocimiento y probá cómo responde.
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

      <div className={styles.workspace}>
        <div className={styles.editorPane}>
        <section className={styles.card} aria-labelledby="config-title">
          <div className={styles.cardHead}>
            <h2 id="config-title">Configuración del agente</h2>
            <p className={styles.cardHelp}>
              Elige opciones y ajústalas si hace falta. Fluye más rápido sin escribir
              todo desde cero.
            </p>
          </div>

          <form className={styles.form} onSubmit={saveAgent}>
            <fieldset className={styles.choiceGroup}>
              <legend>Tono</legend>
              <div className={styles.chipRow} role="group" aria-label="Opciones de tono">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.chip} ${
                      selectedToneId === option.id ? styles.chipActive : ''
                    }`}
                    aria-pressed={selectedToneId === option.id}
                    onClick={() => selectTone(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className={styles.field} htmlFor="agent-tone">
                <span className={styles.srOnly}>Tono personalizado</span>
                <input
                  id="agent-tone"
                  value={tone}
                  onChange={(e) => {
                    setTone(e.target.value);
                    setSelectedToneId(null);
                  }}
                  placeholder="O escribe un tono propio"
                />
              </label>
            </fieldset>

            <fieldset className={styles.choiceGroup}>
              <legend>Instrucciones</legend>
              <div
                className={styles.chipRow}
                role="group"
                aria-label="Opciones de instrucciones"
              >
                {INSTRUCTION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.chip} ${
                      selectedInstructionIds.includes(option.id)
                        ? styles.chipActive
                        : ''
                    }`}
                    aria-pressed={selectedInstructionIds.includes(option.id)}
                    onClick={() => toggleInstruction(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className={styles.field} htmlFor="agent-instructions">
                <span className={styles.srOnly}>Instrucciones editables</span>
                <textarea
                  id="agent-instructions"
                  rows={5}
                  value={instructions}
                  onChange={(e) => {
                    setInstructions(e.target.value);
                    setSelectedInstructionIds([]);
                  }}
                  placeholder="Selecciona opciones arriba o escribe tus propias reglas"
                />
              </label>
            </fieldset>

            <fieldset className={styles.choiceGroup}>
              <legend>Mensaje de bienvenida</legend>
              <div
                className={styles.chipRow}
                role="group"
                aria-label="Opciones de bienvenida"
              >
                {WELCOME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.chip} ${
                      selectedWelcomeId === option.id ? styles.chipActive : ''
                    }`}
                    aria-pressed={selectedWelcomeId === option.id}
                    onClick={() => selectWelcome(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className={styles.field} htmlFor="agent-welcome">
                <span className={styles.srOnly}>Mensaje de bienvenida editable</span>
                <textarea
                  id="agent-welcome"
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => {
                    setWelcomeMessage(e.target.value);
                    setSelectedWelcomeId(null);
                  }}
                  placeholder="O personaliza el saludo"
                />
              </label>
            </fieldset>

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
              Elige un archivo, revisa el contenido y pulsa “Cargar y entrenar”.
              Solo entonces el chat podrá usarlo.
            </p>
          </div>

          <form className={styles.form} onSubmit={createDocument}>
            <div className={styles.dropzone}>
              <input
                ref={fileInputRef}
                id="doc-file"
                type="file"
                className={styles.fileInput}
                accept=".txt,.md,.csv,.faq,.text,text/plain,text/markdown,text/csv"
                onChange={onFileSelected}
              />
              <p className={styles.dropzoneTitle}>Cargar archivo</p>
              <p className={styles.cardHelp}>
                Formatos actuales: TXT, MD, CSV, FAQ. PDF/DOCX se agregará después.
              </p>
              {selectedFileName ? (
                <p className={styles.fileName}>
                  Listo para cargar: {selectedFileName}. Pulsa el botón de abajo.
                </p>
              ) : null}
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => fileInputRef.current?.click()}
              >
                Elegir archivo
              </button>
            </div>

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

            <label className={styles.field} htmlFor="doc-type">
              <span>Tipo</span>
              <select
                id="doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="FAQ">FAQ</option>
                <option value="TXT">TXT</option>
                <option value="MANUAL">Manual</option>
                <option value="POLICY">Política</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>

            <label className={styles.field} htmlFor="doc-content">
              <span>Contenido</span>
              <textarea
                id="doc-content"
                rows={5}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                required
                placeholder="Se completa al subir un archivo, o puedes pegar texto aquí"
              />
            </label>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={uploading || !docName.trim() || !docText.trim()}
            >
              {uploading ? 'Cargando y entrenando…' : 'Cargar y entrenar'}
            </button>
          </form>

          <div className={styles.docList} aria-live="polite">
            {documents.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Todavía no hay documentos</p>
                <p className={styles.cardHelp}>
                  Elegir un archivo no alcanza: hay que pulsar “Cargar y entrenar”.
                  Cuando esté listo, aparecerá aquí como Procesado.
                </p>
              </div>
            ) : (
              <>
                {promptDocs.length > 0 ? (
                  <div className={styles.docCategory}>
                    <button
                      type="button"
                      className={styles.docCategoryToggle}
                      aria-expanded={promptsOpen}
                      onClick={() => setPromptsOpen((open) => !open)}
                    >
                      <span>Prompts</span>
                      <span className={styles.docMeta}>{promptDocs.length}</span>
                      <span className={styles.docChevron} aria-hidden="true">
                        {promptsOpen ? '−' : '+'}
                      </span>
                    </button>
                    {promptsOpen ? (
                      <div className={styles.docCategoryBody}>
                        {promptDocs.map((doc) => (
                          <div key={doc.id} className={`${styles.docItem} ${styles.docItemStack}`}>
                            <div className={styles.docItemMain}>
                              <button
                                type="button"
                                className={styles.docReveal}
                                aria-expanded={openDocId === doc.id}
                                onClick={() =>
                                  setOpenDocId((current) =>
                                    current === doc.id ? null : doc.id,
                                  )
                                }
                              >
                                <strong>{doc.name}</strong>
                                <p className={styles.docMeta}>
                                  {doc.type} ·{' '}
                                  <span className={styles.docStatus}>
                                    {documentStatusLabel(doc.status)}
                                  </span>
                                  {doc.createdAt
                                    ? ` · Subido ${new Intl.DateTimeFormat('es-CL', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      }).format(new Date(doc.createdAt))}`
                                    : ''}
                                </p>
                              </button>
                              {doc.status !== 'PROCESSED' ? (
                                <button
                                  type="button"
                                  className={styles.btnSecondary}
                                  onClick={() => trainDocument(doc.id)}
                                  disabled={trainingId === doc.id}
                                >
                                  {trainingId === doc.id
                                    ? 'Entrenando…'
                                    : 'Entrenar'}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className={styles.docRemove}
                                aria-label={`Eliminar ${doc.name}`}
                                onClick={() => deleteDocument(doc.id)}
                                disabled={deletingId === doc.id}
                              >
                                ×
                              </button>
                            </div>
                            {openDocId === doc.id ? (
                              <p className={styles.docPreview}>
                                {doc.extractedText?.trim() ||
                                  'Este documento no tiene texto para mostrar.'}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {otherDocs.map((doc) => (
                  <div key={doc.id} className={styles.docItem}>
                    <div>
                      <strong>{doc.name}</strong>
                      <p className={styles.docMeta}>
                        {doc.type} ·{' '}
                        <span className={styles.docStatus}>
                          {documentStatusLabel(doc.status)}
                        </span>
                        {doc.createdAt
                          ? ` · Subido ${new Intl.DateTimeFormat('es-CL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(doc.createdAt))}`
                          : ''}
                      </p>
                    </div>
                    {doc.status !== 'PROCESSED' ? (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => trainDocument(doc.id)}
                        disabled={trainingId === doc.id}
                      >
                        {trainingId === doc.id ? 'Entrenando…' : 'Entrenar'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.docRemove}
                      aria-label={`Eliminar ${doc.name}`}
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

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
        </div>

        <aside className={styles.agentPane} aria-labelledby="preview-title">
          <div className={styles.previewHead}>
            <div className={styles.cardHead}>
              <h2 id="preview-title">Así ve el chat tu visitante</h2>
              <p className={styles.cardHelp}>
                Este es el agente de tu cuenta. Se ve igual que en el sitio, y
                podés revisarlo acá mientras lo entrenás.
              </p>
            </div>
            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setPreviewTick(Date.now())}
              >
                Actualizar vista
              </button>
              <a
                className={styles.previewLink}
                href={`${API_URL}/demo-nuvcore.html`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en grande
              </a>
            </div>
            <div className={styles.sizePicker}>
              <button
                type="button"
                className={`${styles.sizeToggle} ${
                  sizeMenuOpen ? styles.sizeToggleOpen : ''
                }`}
                aria-expanded={sizeMenuOpen}
                aria-controls="agent-size-menu"
                disabled={!previewWidgetId}
                onClick={() => setSizeMenuOpen((open) => !open)}
              >
                Tamaño
                <span className={styles.sizeCurrent}>
                  {SIZE_OPTIONS.find((option) => option.id === widgetSize)?.label}
                </span>
              </button>
              {sizeSaved ? <span className={styles.sizeSaved}>Guardado</span> : null}
              {sizeMenuOpen ? (
                <div
                  id="agent-size-menu"
                  className={styles.sizeMenu}
                  role="group"
                  aria-label="Medidas del agente"
                >
                  {SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.sizeOption} ${
                        widgetSize === option.id ? styles.sizeOptionActive : ''
                      }`}
                      disabled={!previewWidgetId || savingSize}
                      aria-pressed={widgetSize === option.id}
                      onClick={() => {
                        setSizeMenuOpen(false);
                        void chooseWidgetSize(option.id);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {previewWidgetId ? (
            <iframe
              ref={previewFrameRef}
              className={styles.previewFrame}
              title="Vista previa del chat del agente"
              src={`${API_URL}/demo-nuvcore.html?widget=${encodeURIComponent(previewWidgetId)}&api=${encodeURIComponent(API_URL)}&open=1${previewTick ? `&t=${previewTick}` : ''}`}
              onLoad={() => pushPreviewWelcome()}
            />
          ) : (
            <p className={styles.cardHelp}>
              {previewChecked
                ? 'Publicá el widget para revisar el chat desde esta cuenta.'
                : 'Cargando el chat…'}
            </p>
          )}
        </aside>
      </div>

      <button
        type="button"
        className={styles.deactivate}
        onClick={deactivateAgent}
        disabled={deactivating || agent?.status === 'PAUSED'}
      >
        {deactivating
          ? 'Desactivando…'
          : agent?.status === 'PAUSED'
            ? 'Agente desactivado'
            : 'Desactivar agente'}
      </button>
    </main>
  );
}
