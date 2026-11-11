'use client';

import { DM_Sans, Syne } from 'next/font/google';
import Link from 'next/link';
import { Fragment, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  api,
  clearSession,
  CompanyOverview,
  getStoredUser,
  OnboardingStep,
} from '@/lib/api';
import dash from './dashboard.module.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-dash-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dash-body',
});

const STEP_LABELS: Record<OnboardingStep, string> = {
  WELCOME: 'Bienvenida',
  COMPANY_PROFILE: 'Empresa',
  AGENT_CONFIG: 'Agente',
  KNOWLEDGE: 'Conocimiento',
  TEST_CHAT: 'Prueba',
  PUBLISH: 'Publicar',
  COMPLETED: 'Listo',
};

type ChatSummary = {
  id: string;
  agentId: string;
  channel: string;
  status: string;
  visitorName: string | null;
  startedAt: string;
  createdAt: string;
  preview: string;
  messageCount: number;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

function statusLabel(status: string) {
  const map: Record<string, string> = {
    TRIAL: 'Prueba',
    ACTIVE: 'Activo',
    SUSPENDED: 'Suspendido',
    DRAFT: 'Borrador',
    TRAINING: 'Entrenando',
    PAUSED: 'Pausado',
    INACTIVE: 'Inactivo',
    PROCESSED: 'Procesado',
  };
  return map[status] ?? status;
}

function channelLabel(channel: string) {
  if (channel === 'WIDGET') return 'Widget';
  if (channel === 'TEST_CHAT') return 'Prueba';
  return channel;
}

function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `Hace ${days} d`;
}

function chatTitle(chat: ChatSummary) {
  const preview = chat.preview.trim();
  if (preview) return preview.length > 72 ? `${preview.slice(0, 72)}…` : preview;
  if (chat.visitorName?.trim()) return chat.visitorName.trim();
  return `Chat de ${channelLabel(chat.channel).toLowerCase()}`;
}

function messageRole(role: string) {
  if (role === 'VISITOR') return 'Visitante';
  if (role === 'ASSISTANT') return 'Agente';
  return role;
}

function nextAction(
  overview: CompanyOverview,
): { title: string; body: string; href?: string; label: string } {
  const agent = overview.agents[0];
  switch (overview.onboardingStep) {
    case 'WELCOME':
      return {
        title: 'Completá el perfil de tu empresa',
        body: 'Nombre, rubro y sitio web son el punto de partida del onboarding.',
        label: 'Ir al perfil',
      };
    case 'COMPANY_PROFILE':
      return {
        title: 'Configurá tu agente',
        body: 'Definí tono, instrucciones y mensaje de bienvenida.',
        href: agent ? `/agents/${agent.id}` : undefined,
        label: 'Ir al agente',
      };
    case 'AGENT_CONFIG':
      return {
        title: 'Cargá conocimiento',
        body: 'Subí FAQs o textos y entrená al agente.',
        href: agent ? `/agents/${agent.id}` : undefined,
        label: 'Cargar documentos',
      };
    case 'KNOWLEDGE':
      return {
        title: 'Probá el chat',
        body: 'Verificá respuestas con el conocimiento entrenado.',
        href: agent ? `/agents/${agent.id}` : undefined,
        label: 'Abrir chat de prueba',
      };
    case 'TEST_CHAT':
      return {
        title: 'Publicá el widget',
        body: 'Activá el widget y agregalo en tus páginas.',
        href: agent ? `/agents/${agent.id}` : undefined,
        label: 'Publicar widget',
      };
    case 'PUBLISH':
      return {
        title: 'Último empujón',
        body: 'Confirmá el despliegue en tus páginas para cerrar el onboarding.',
        label: 'Revisar despliegue',
      };
    default:
      return {
        title: 'Onboarding completo',
        body: 'Tu espacio ya está listo para operar.',
        href: agent ? `/agents/${agent.id}` : undefined,
        label: 'Ver agente',
      };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const user = getStoredUser();
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingPages, setEditingPages] = useState(false);
  const [savingDomains, setSavingDomains] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [openMessages, setOpenMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('es');
  const [timezone, setTimezone] = useState('America/Santiago');
  const [businessHours, setBusinessHours] = useState('');
  const [domainsText, setDomainsText] = useState('');

  function applyOverview(data: CompanyOverview) {
    setOverview(data);
    setCompanyName(data.name);
    setContactEmail(data.contactEmail);
    setWebsite(data.website ?? '');
    setIndustry(data.industry ?? '');
    setPhone(data.phone ?? '');
    setLanguage(data.language ?? 'es');
    setTimezone(data.timezone ?? 'America/Santiago');
    setBusinessHours(data.businessHours ?? '');
    const primaryDomains =
      data.deployment.widgets[0]?.allowedDomains ??
      (data.website ? [data.website] : []);
    setDomainsText(primaryDomains.join('\n'));
  }

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }

    api<CompanyOverview>('/companies/me')
      .then(applyOverview)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error al cargar perfil'),
      )
      .finally(() => setLoading(false));
  }, [router]);

  const primaryAgent = overview?.agents[0];
  const primaryWidget = overview?.deployment.widgets[0];
  const action = overview ? nextAction(overview) : null;
  const currentStepIndex = useMemo(() => {
    if (!overview) return 0;
    return overview.onboardingSteps.indexOf(overview.onboardingStep);
  }, [overview]);

  function logout() {
    clearSession();
    router.push('/login');
  }

  async function loadChats() {
    if (!overview) return;
    setChatsLoading(true);
    try {
      const lists = await Promise.all(
        overview.agents.map(async (agent) => {
          const rows = await api<
            Array<{
              id: string;
              channel: string;
              status: string;
              visitorName: string | null;
              startedAt: string;
              createdAt: string;
              _count: { messages: number };
              messages: Array<{ content: string }>;
            }>
          >(`/agents/${agent.id}/conversations`);
          return rows.map((row) => ({
            id: row.id,
            agentId: agent.id,
            channel: row.channel,
            status: row.status,
            visitorName: row.visitorName,
            startedAt: row.startedAt,
            createdAt: row.createdAt,
            preview: row.messages[0]?.content ?? '',
            messageCount: row._count.messages,
          }));
        }),
      );
      setChats(
        lists
          .flat()
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar el historial',
      );
    } finally {
      setChatsLoading(false);
    }
  }

  async function toggleChatHistory() {
    const next = !chatHistoryOpen;
    setChatHistoryOpen(next);
    setOpenChatId(null);
    setOpenMessages([]);
    if (next) await loadChats();
  }

  async function toggleChat(chat: ChatSummary) {
    if (openChatId === chat.id) {
      setOpenChatId(null);
      setOpenMessages([]);
      return;
    }

    setOpenChatId(chat.id);
    setOpenMessages([]);
    setMessagesLoading(true);
    try {
      const detail = await api<{ messages: ChatMessage[] }>(
        `/agents/${chat.agentId}/conversations/${chat.id}`,
      );
      setOpenMessages(detail.messages);
    } catch (err) {
      setOpenChatId(null);
      setError(
        err instanceof Error ? err.message : 'No se pudo abrir la conversación',
      );
    } finally {
      setMessagesLoading(false);
    }
  }

  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    setError('');
    setInfo('');
    setSavingCompany(true);
    try {
      await api('/companies/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: companyName,
          contactEmail,
          website: website || undefined,
          industry: industry || undefined,
          phone: phone || undefined,
          language: language || undefined,
          timezone: timezone || undefined,
          businessHours: businessHours || undefined,
        }),
      });
      const refreshed = await api<CompanyOverview>('/companies/me');
      applyOverview(refreshed);
      setEditingCompany(false);
      setInfo(
        refreshed.onboardingStep !== 'WELCOME'
          ? 'Perfil guardado. Onboarding avanzado.'
          : 'Perfil de empresa actualizado',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSavingCompany(false);
    }
  }

  async function saveDeployment(event: FormEvent) {
    event.preventDefault();
    if (!primaryAgent) return;

    setError('');
    setInfo('');
    setSavingDomains(true);
    try {
      const allowedDomains = domainsText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

      await api(`/agents/${primaryAgent.id}/widget`, {
        method: 'PUT',
        body: JSON.stringify({
          allowedDomains,
          name: primaryWidget?.widgetName ?? 'Widget principal',
          status: primaryWidget?.status ?? 'INACTIVE',
        }),
      });

      const refreshed = await api<CompanyOverview>('/companies/me');
      applyOverview(refreshed);
      setEditingPages(false);
      setInfo('Páginas de despliegue guardadas');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el despliegue',
      );
    } finally {
      setSavingDomains(false);
    }
  }

  async function copySnippet(widgetId: string, snippet: string) {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedId(widgetId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('No se pudo copiar el snippet');
    }
  }

  useEffect(() => {
    if (!companyOpen && !accountOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setCompanyOpen(false);
      setAccountOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [companyOpen, accountOpen]);

  if (!user) return null;

  const logoutButton = (
    <button type="button" className={dash.ghost} onClick={logout}>
      Salir
    </button>
  );

  const brandBlock = (
    <div>
      <p className={dash.brand}>SOPHIA IA</p>
      <p className={dash.hello}>software development</p>
    </div>
  );

  const topbar = (
    <header className={dash.topbar}>
      {brandBlock}
      {logoutButton}
    </header>
  );

  return (
    <main className={`${dash.page} ${syne.variable} ${dmSans.variable}`}>
      {error ? <p className={dash.error}>{error}</p> : null}
      {info ? <p className={dash.info}>{info}</p> : null}

      {loading || !overview || !action ? (
        <>
          {topbar}
          <section className={dash.card}>
            <p className={dash.muted}>Cargando tu perfil…</p>
          </section>
        </>
      ) : (
        <div className={dash.stack}>
          <section className={dash.hero}>
            <div className={dash.heroTools}>{logoutButton}</div>
            <div className={dash.heroBody}>
              <div className={dash.heroMain}>
                <p className={dash.eyebrow}>Perfil de empresa</p>
                <div className={dash.companyTitle}>
                  <h1 className={dash.companyName}>{overview.name}</h1>
                  <button
                    type="button"
                    className={dash.editButton}
                    aria-label="Editar datos de la empresa"
                    onClick={() => {
                      setEditingCompany(false);
                      setCompanyOpen(true);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.8 6.7l3.5 3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  className={dash.heroSupport}
                  onClick={() => setAccountOpen(true)}
                >
                  {overview.industry ? `${overview.industry} · ` : ''}
                  Plan {overview.plan?.name ?? 'Free'} ·{' '}
                  {statusLabel(overview.status)}
                </button>
                <div className={dash.metaRow}>
                  <span>{overview.contactEmail}</span>
                  {overview.website ? (
                    <a href={overview.website} target="_blank" rel="noreferrer">
                      {overview.website}
                    </a>
                  ) : (
                    <span>Sin sitio web configurado</span>
                  )}
                  {overview.phone ? <span>{overview.phone}</span> : null}
                </div>
              </div>

              <div className={dash.heroAside}>
                <p className={dash.panelMark}>
                  {overview.onboardingCompleted
                    ? 'Completado'
                    : 'Siguiente paso'}
                </p>
                <h2 className={dash.asideTitle}>{action.title}</h2>
                <p className={dash.muted}>{action.body}</p>
                {action.href ? (
                  <Link href={action.href} className={dash.cta}>
                    {action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={dash.cta}
                    onClick={() => setCompanyOpen(true)}
                  >
                    {action.label}
                  </button>
                )}
              </div>
            </div>
            <div className={dash.heroBrand}>{brandBlock}</div>
          </section>

          {!overview.onboardingCompleted ? (
            <section className={dash.steps} aria-label="Progreso de onboarding">
              {overview.onboardingSteps
                .filter((step) => step !== 'COMPLETED')
                .map((step, index) => {
                  const done = index < currentStepIndex;
                  const current = index === currentStepIndex;
                  return (
                    <div
                      key={step}
                      className={`${dash.step} ${done ? dash.stepDone : ''} ${
                        current ? dash.stepCurrent : ''
                      }`}
                    >
                      <span className={dash.stepIndex}>{index + 1}</span>
                      <span>{STEP_LABELS[step]}</span>
                    </div>
                  );
                })}
            </section>
          ) : null}

          <section className={dash.stats} aria-label="Resumen">
            <article className={dash.stat}>
              <p className={dash.statValue}>{overview.stats.agents}</p>
              <p className={dash.statLabel}>Agentes</p>
            </article>
            <article className={dash.stat}>
              <p className={dash.statValue}>{overview.stats.documents}</p>
              <p className={dash.statLabel}>Documentos</p>
            </article>
            <article className={dash.stat}>
              <p className={dash.statValue}>
                {overview.stats.processedDocuments}
              </p>
              <p className={dash.statLabel}>Entrenados</p>
            </article>
            <article className={dash.stat}>
              <p className={dash.statValue}>{overview.stats.conversations}</p>
              <p className={dash.statLabel}>Conversaciones</p>
            </article>
            <article className={dash.stat}>
              <p className={dash.statValue}>{overview.stats.activeWidgets}</p>
              <p className={dash.statLabel}>Widgets activos</p>
            </article>
          </section>

          <div className={dash.grid}>
            <section className={dash.card} aria-labelledby="agents-title">
              <div className={dash.cardHeadRow}>
                <div>
                  <h2 id="agents-title">Perfil agente</h2>
                  <p className={dash.muted}>
                    Documentos, chats y estado del widget.
                  </p>
                </div>
              </div>

              <div className={dash.list}>
                <button
                  type="button"
                  className={dash.listItem}
                  aria-expanded={chatHistoryOpen}
                  onClick={() => void toggleChatHistory()}
                >
                  <div>
                    <strong>Historial chat</strong>
                    <p className={dash.muted}>
                      {chatHistoryOpen
                        ? 'Ocultar conversaciones'
                        : 'Ver conversaciones recientes'}
                    </p>
                  </div>
                </button>
                {chatHistoryOpen ? (
                  chatsLoading ? (
                    <p className={dash.muted}>Cargando conversaciones…</p>
                  ) : chats.length === 0 ? (
                    <p className={dash.muted}>Todavía no hay conversaciones.</p>
                  ) : (
                    chats.map((chat) => (
                      <Fragment key={chat.id}>
                        <button
                          type="button"
                          className={dash.listItem}
                          aria-expanded={openChatId === chat.id}
                          onClick={() => void toggleChat(chat)}
                        >
                          <div>
                            <strong>{chatTitle(chat)}</strong>
                            <p className={dash.muted}>
                              {relativeTime(chat.startedAt)} · {chat.messageCount}{' '}
                              {chat.messageCount === 1 ? 'mensaje' : 'mensajes'}{' '}
                              · {channelLabel(chat.channel)}
                            </p>
                          </div>
                          <span
                            className={`${dash.badge} ${
                              chat.status === 'CLOSED' ? dash.badgeOk : ''
                            }`}
                          >
                            {chat.status === 'CLOSED' ? 'Cerrado' : 'Abierto'}
                          </span>
                        </button>
                        {openChatId === chat.id ? (
                          messagesLoading ? (
                            <p className={dash.muted}>Cargando mensajes…</p>
                          ) : openMessages.length === 0 ? (
                            <p className={dash.muted}>
                              Esta conversación no tiene mensajes.
                            </p>
                          ) : (
                            <div className={dash.list}>
                              {openMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`${dash.listItem} ${dash.accountRow}`}
                                >
                                  <div>
                                    <strong>{messageRole(message.role)}</strong>
                                    <p className={dash.muted}>{message.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : null}
                      </Fragment>
                    ))
                  )
                ) : null}
              </div>
            </section>

            <section className={dash.card} aria-labelledby="deploy-title">
              <div className={dash.cardHead}>
                <h2 id="deploy-title">Despliegue</h2>
                <p className={dash.muted}>
                  Páginas y dominios donde puede mostrarse el widget.
                </p>
              </div>

              <div className={dash.pagesBox}>
                <div className={dash.pagesHead}>
                  <p className={dash.sectionLabel}>Páginas configuradas</p>
                  {primaryAgent && !editingPages ? (
                    <button
                      type="button"
                      className={dash.editButton}
                      aria-label="Editar páginas"
                      onClick={() => setEditingPages(true)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.8 6.7l3.5 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {editingPages ? (
                  <form className={dash.form} onSubmit={saveDeployment}>
                    <label className={dash.field} htmlFor="deploy-pages">
                      <span>Una por línea</span>
                      <textarea
                        id="deploy-pages"
                        rows={4}
                        value={domainsText}
                        onChange={(e) => setDomainsText(e.target.value)}
                        placeholder={
                          'https://tu-sitio.com\nhttps://tu-sitio.com/ayuda'
                        }
                      />
                    </label>
                    <div className={dash.formActions}>
                      <button
                        type="submit"
                        className={dash.cta}
                        disabled={savingDomains}
                      >
                        {savingDomains ? 'Guardando…' : 'Guardar páginas'}
                      </button>
                      <button
                        type="button"
                        className={dash.cancelButton}
                        disabled={savingDomains}
                        onClick={() => {
                          const primaryDomains =
                            overview.deployment.widgets[0]?.allowedDomains ??
                            (overview.website ? [overview.website] : []);
                          setDomainsText(primaryDomains.join('\n'));
                          setEditingPages(false);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : overview.deployment.pages.length === 0 ? (
                  <p className={dash.muted}>Todavía no hay páginas.</p>
                ) : (
                  <ul className={dash.pageList}>
                    {overview.deployment.pages.map((page) => (
                      <li key={page}>
                        <span className={dash.pageDot} aria-hidden />
                        {page}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {overview.deployment.widgets.length === 0 ? (
                <div className={dash.emptyDeploy}>
                  <p className={dash.muted}>
                    Aún no publicaste un widget. Entrá al agente y usá “Publicar
                    widget”.
                  </p>
                  {primaryAgent ? (
                    <Link
                      href={`/agents/${primaryAgent.id}`}
                      className={dash.linkBtn}
                    >
                      Publicar desde el agente
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className={dash.widgetList}>
                  {overview.deployment.widgets.map((widget) => (
                    <article key={widget.widgetId} className={dash.widgetItem}>
                      <div className={dash.widgetHead}>
                        <div>
                          <strong>{widget.widgetName ?? 'Widget'}</strong>
                          <p className={dash.muted}>
                            {widget.agentName} ·{' '}
                            {widget.position ?? 'bottom-right'}
                          </p>
                        </div>
                        <span
                          className={`${dash.badge} ${
                            widget.status === 'ACTIVE' ? dash.badgeOk : ''
                          }`}
                        >
                          {statusLabel(widget.status)}
                        </span>
                      </div>
                      <pre className={dash.snippet}>{widget.embedSnippet}</pre>
                      <button
                        type="button"
                        className={dash.ghost}
                        onClick={() =>
                          copySnippet(widget.widgetId, widget.embedSnippet)
                        }
                      >
                        {copiedId === widget.widgetId
                          ? 'Copiado'
                          : 'Copiar snippet'}
                      </button>
                    </article>
                  ))}
                </div>
              )}

            </section>
          </div>

          {accountOpen ? (
            <div
              className={dash.modalBackdrop}
              onClick={() => setAccountOpen(false)}
            >
              <div
                className={dash.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="account-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className={dash.modalClose}
                  onClick={() => setAccountOpen(false)}
                >
                  Cerrar
                </button>
          <section className={dash.card} aria-labelledby="account-title">
            <div className={dash.cardHead}>
              <h2 id="account-title">Cuenta</h2>
              <p className={dash.muted}>
                Usuario y plan de esta empresa.
              </p>
            </div>
            <div className={dash.list}>
              <div className={`${dash.listItem} ${dash.accountRow}`}>
                <div>
                  <strong>{user.name}</strong>
                  <p className={dash.muted}>{user.email}</p>
                </div>
                <span className={dash.badge}>{user.role}</span>
              </div>
              <div className={`${dash.listItem} ${dash.accountRow}`}>
                <div>
                  <strong>Plan {overview.plan?.name ?? 'Free'}</strong>
                  {overview.plan ? (
                    <ul className={dash.planLimits}>
                      <li>Hasta {overview.plan.maxAgents} agentes</li>
                      <li>Hasta {overview.plan.maxDocuments} documentos</li>
                      <li>
                        Hasta {overview.plan.maxConversations} conversaciones
                      </li>
                      <li>
                        Widget{' '}
                        {overview.plan.includesWidget
                          ? 'incluido'
                          : 'no incluido'}
                      </li>
                    </ul>
                  ) : (
                    <p className={dash.muted}>Sin plan asignado.</p>
                  )}
                </div>
                <span className={dash.badge}>
                  {statusLabel(
                    overview.subscription?.status ?? overview.status,
                  )}
                </span>
              </div>
            </div>
          </section>
              </div>
            </div>
          ) : null}

          {companyOpen ? (
            <div
              className={dash.modalBackdrop}
              onClick={() => setCompanyOpen(false)}
            >
              <div
                className={dash.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className={dash.modalClose}
                  onClick={() => setCompanyOpen(false)}
                >
                  Cerrar
                </button>
          <section
            id="company-profile"
            className={dash.card}
            aria-labelledby="profile-title"
          >
            <div className={dash.cardHead}>
              <div className={dash.profileHead}>
                <div>
                  <h2 id="profile-title">Datos de la empresa</h2>
                  <p className={dash.muted}>
                    {editingCompany
                      ? 'Modificá los datos y guardá los cambios.'
                      : 'Datos guardados de tu empresa.'}
                  </p>
                </div>
                {editingCompany ? null : (
                  <button
                    type="button"
                    className={dash.editButton}
                    aria-label="Editar datos de la empresa"
                    onClick={() => setEditingCompany(true)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.8 6.7l3.5 3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {editingCompany ? (
            <form className={dash.form} onSubmit={saveCompany}>
              <label className={dash.field} htmlFor="company-name">
                <span>Nombre comercial</span>
                <input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </label>
              <label className={dash.field} htmlFor="company-email">
                <span>Email de contacto</span>
                <input
                  id="company-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </label>
              <label className={dash.field} htmlFor="company-industry">
                <span>Rubro / industria</span>
                <input
                  id="company-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ej. Software, Retail"
                  required
                />
              </label>
              <label className={dash.field} htmlFor="company-website">
                <span>Sitio web</span>
                <input
                  id="company-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  required
                />
              </label>
              <label className={dash.field} htmlFor="company-phone">
                <span>Teléfono</span>
                <input
                  id="company-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 ..."
                />
              </label>
              <label className={dash.field} htmlFor="company-language">
                <span>Idioma principal</span>
                <select
                  id="company-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </label>
              <label className={dash.field} htmlFor="company-timezone">
                <span>Zona horaria</span>
                <select
                  id="company-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="America/Argentina/Buenos_Aires">
                    Argentina (Buenos Aires)
                  </option>
                  <option value="America/Santiago">Chile (Santiago)</option>
                  <option value="America/Bogota">Colombia (Bogotá)</option>
                  <option value="America/Mexico_City">México</option>
                  <option value="America/Lima">Perú (Lima)</option>
                  <option value="Europe/Madrid">España (Madrid)</option>
                </select>
              </label>
              <label className={dash.field} htmlFor="company-hours">
                <span>Horario de atención</span>
                <input
                  id="company-hours"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  placeholder="Lun a Vie, 9 a 18 hs"
                />
              </label>
              <div className={dash.formActions}>
                <button
                  type="submit"
                  className={dash.cta}
                  disabled={savingCompany}
                >
                  {savingCompany ? 'Guardando…' : 'Guardar perfil'}
                </button>
                <button
                  type="button"
                  className={dash.cancelButton}
                  disabled={savingCompany}
                  onClick={() => {
                    if (overview) applyOverview(overview);
                    setEditingCompany(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
            ) : (
              <dl className={dash.profileList}>
                {[
                  ['Nombre comercial', companyName],
                  ['Email de contacto', contactEmail],
                  ['Rubro / industria', industry],
                  ['Sitio web', website],
                  ['Teléfono', phone],
                  [
                    'Idioma principal',
                    language === 'en'
                      ? 'English'
                      : language === 'pt'
                        ? 'Português'
                        : 'Español',
                  ],
                  [
                    'Zona horaria',
                    {
                      'America/Argentina/Buenos_Aires': 'Argentina (Buenos Aires)',
                      'America/Santiago': 'Chile (Santiago)',
                      'America/Bogota': 'Colombia (Bogotá)',
                      'America/Mexico_City': 'México',
                      'America/Lima': 'Perú (Lima)',
                      'Europe/Madrid': 'España (Madrid)',
                    }[timezone] ?? timezone,
                  ],
                  ['Horario de atención', businessHours],
                ].map(([label, value]) => (
                  <div key={label} className={dash.profileItem}>
                    <dt>{label}</dt>
                    <dd>{value?.trim() ? value : 'Sin dato'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
