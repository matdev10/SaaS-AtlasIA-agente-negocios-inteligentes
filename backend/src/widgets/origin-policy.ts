function hostnameFrom(value: string): string | null {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;

  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return raw.replace(/^www\./, '').split('/')[0] || null;
  }
}

function isLoopback(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

export function isWidgetOriginAllowed(
  origin: string | undefined,
  allowed: string[],
  options?: { allowLoopback?: boolean },
) {
  const hosts = allowed
    .map((value) => hostnameFrom(value))
    .filter((value): value is string => Boolean(value));

  if (hosts.length === 0 || !origin) {
    return true;
  }

  const requestHost = hostnameFrom(origin);
  if (!requestHost) {
    return false;
  }

  if (options?.allowLoopback && isLoopback(requestHost)) {
    return true;
  }

  return hosts.some(
    (host) => requestHost === host || requestHost.endsWith(`.${host}`),
  );
}
