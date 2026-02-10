const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return isSafeUrl(url) ? url : undefined;
}
