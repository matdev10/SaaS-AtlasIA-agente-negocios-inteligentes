export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export type AuthUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

export type Agent = {
  id: string;
  name: string;
  description?: string | null;
  tone?: string | null;
  instructions?: string | null;
  welcomeMessage?: string | null;
  status: string;
  knowledgeBase?: { id: string; name: string; status: string } | null;
};

export type DocumentItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  extractedText?: string | null;
};

export type OnboardingStep =
  | 'WELCOME'
  | 'COMPANY_PROFILE'
  | 'AGENT_CONFIG'
  | 'KNOWLEDGE'
  | 'TEST_CHAT'
  | 'PUBLISH'
  | 'COMPLETED';

export type CompanyOverview = {
  id: string;
  name: string;
  contactEmail: string;
  phone?: string | null;
  industry?: string | null;
  website?: string | null;
  language?: string | null;
  timezone?: string | null;
  businessHours?: string | null;
  status: string;
  onboardingStep: OnboardingStep;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string | null;
  onboardingSteps: OnboardingStep[];
  createdAt: string;
  updatedAt: string;
  plan: {
    id: string;
    name: string;
    maxUsers: number;
    maxAgents: number;
    maxDocuments: number;
    maxConversations: number;
    includesWidget: boolean;
    includesRag: boolean;
  } | null;
  subscription: {
    id: string;
    status: string;
    startsAt: string;
    endsAt?: string | null;
    renewsAt?: string | null;
  } | null;
  stats: {
    users: number;
    agents: number;
    conversations: number;
    documents: number;
    processedDocuments: number;
    activeWidgets: number;
  };
  agents: Array<{
    id: string;
    name: string;
    description?: string | null;
    status: string;
    updatedAt: string;
    documentsCount: number;
    conversationsCount: number;
    widget: {
      id: string;
      name?: string | null;
      status: string;
      position?: string | null;
      primaryColor?: string | null;
      allowedDomains: string[];
      updatedAt: string;
    } | null;
  }>;
  deployment: {
    website?: string | null;
    pages: string[];
    widgets: Array<{
      agentId: string;
      agentName: string;
      agentStatus: string;
      widgetId: string;
      widgetName?: string | null;
      status: string;
      position?: string | null;
      allowedDomains: string[];
      embedSnippet: string;
      updatedAt: string;
    }>;
  };
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('atlasia_token');
}

export function setSession(auth: AuthResponse) {
  localStorage.setItem('atlasia_token', auth.access_token);
  localStorage.setItem('atlasia_user', JSON.stringify(auth.user));
}

export function clearSession() {
  localStorage.removeItem('atlasia_token');
  localStorage.removeItem('atlasia_user');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('atlasia_user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;
    throw new Error(message ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
