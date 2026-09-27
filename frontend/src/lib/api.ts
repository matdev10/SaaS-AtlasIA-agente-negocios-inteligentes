const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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
