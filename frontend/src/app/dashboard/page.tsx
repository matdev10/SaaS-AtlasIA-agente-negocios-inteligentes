'use client';

import { DM_Sans, Syne } from 'next/font/google';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [savingDomains, setSavingDomains] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('es');
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires');
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
    setTimezone(data.timezone ?? 'America/Argentina/Buenos_Aires');
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

  if (!user) return null;

  return (
    <main className={`${dash.page} ${syne.variable} ${dmSans.variable}`}>
      <header className={dash.topbar}>
        <div>
          <p className={dash.brand}>AtlasIA</p>
          <p className={dash.hello}>
            {overview ? overview.name : 'Tu espacio'} · {user.name}
          </p>
        </div>
        <button type="button" className={dash.ghost} onClick={logout}>
          Salir
        </button>
      </header>

      {error ? <p className={dash.error}>{error}</p> : null}
      {info ? <p className={dash.info}>{info}</p> : null}

      {loading || !overview || !action ? (
        <section className={dash.card}>
          <p className={dash.muted}>Cargando tu perfil…</p>
        </section>
      ) : (
        <>
          <section className={dash.hero}>
            <div className={dash.heroMain}>
              <p className={dash.eyebrow}>Perfil de empresa</p>
              <h1 className={dash.companyName}>{overview.name}</h1>
              <p className={dash.heroSupport}>
                {overview.industry ? `${overview.industry} · ` : ''}
                Plan {overview.plan?.name ?? 'Free'} ·{' '}
                {statusLabel(overview.status)}
              </p>
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
                <a href="#company-profile" className={dash.cta}>
                  {action.label}
                </a>
              )}
            </div>
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
            <section
              id="company-profile"
              className={dash.card}
              aria-labelledby="profile-title"
            >
              <div className={dash.cardHead}>
                <h2 id="profile-title">Datos de la empresa</h2>
                <p className={dash.muted}>
                  Completá rubro y sitio web para avanzar el onboarding.
                </p>
              </div>

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
                <button
                  type="submit"
                  className={dash.cta}
                  disabled={savingCompany}
                >
                  {savingCompany ? 'Guardando…' : 'Guardar perfil'}
                </button>
              </form>

              <div className={dash.planBox}>
                <p className={dash.sectionLabel}>Cuenta</p>
                <p className={dash.planName}>
                  {user.name}{' '}
                  <span className={dash.badge}>{user.role}</span>
                </p>
                <p className={dash.muted}>{user.email}</p>
                <p className={dash.planName} style={{ marginTop: '0.85rem' }}>
                  Plan {overview.plan?.name ?? 'Free'}{' '}
                  <span className={dash.badge}>
                    {statusLabel(
                      overview.subscription?.status ?? overview.status,
                    )}
                  </span>
                </p>
                {overview.plan ? (
                  <ul className={dash.planLimits}>
                    <li>Hasta {overview.plan.maxAgents} agentes</li>
                    <li>Hasta {overview.plan.maxDocuments} documentos</li>
                    <li>
                      Hasta {overview.plan.maxConversations} conversaciones
                    </li>
                    <li>
                      Widget{' '}
                      {overview.plan.includesWidget ? 'incluido' : 'no incluido'}
                    </li>
                  </ul>
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
                <p className={dash.sectionLabel}>Páginas configuradas</p>
                {overview.deployment.pages.length === 0 ? (
                  <p className={dash.muted}>
                    Todavía no hay páginas. Agregá tu sitio o rutas abajo.
                  </p>
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

              {primaryAgent ? (
                <form className={dash.form} onSubmit={saveDeployment}>
                  <label className={dash.field} htmlFor="deploy-pages">
                    <span>Páginas / dominios (una por línea)</span>
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
                  <button
                    type="submit"
                    className={dash.cta}
                    disabled={savingDomains}
                  >
                    {savingDomains ? 'Guardando…' : 'Guardar páginas'}
                  </button>
                </form>
              ) : null}
            </section>
          </div>

          <section className={dash.card} aria-labelledby="agents-title">
            <div className={dash.cardHeadRow}>
              <div>
                <h2 id="agents-title">Agentes</h2>
                <p className={dash.muted}>
                  Configuración, conocimiento y publicación de cada asistente.
                </p>
              </div>
            </div>

            <div className={dash.list}>
              {overview.agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className={dash.listItem}
                >
                  <div>
                    <strong>{agent.name}</strong>
                    <p className={dash.muted}>
                      {agent.documentsCount} docs · {agent.conversationsCount}{' '}
                      chats · widget{' '}
                      {agent.widget
                        ? statusLabel(agent.widget.status)
                        : 'sin publicar'}
                    </p>
                  </div>
                  <span className={dash.badge}>{statusLabel(agent.status)}</span>
                </Link>
              ))}
              {overview.agents.length === 0 ? (
                <p className={dash.muted}>No hay agentes todavía.</p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
