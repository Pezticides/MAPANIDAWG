const AUTH_CALLBACK_PATTERN = /^ustpcampus:\/\/auth\/callback(?:[?#]|$)/i;

type AuthCallbackListener = (url: string) => void;

const listeners = new Set<AuthCallbackListener>();
let pendingUrl: string | null = null;

export function isAuthCallbackUrl(url: string): boolean {
  return AUTH_CALLBACK_PATTERN.test(url);
}

export function publishAuthCallbackUrl(url: string): void {
  if (!isAuthCallbackUrl(url)) return;

  pendingUrl = url;
  listeners.forEach(listener => listener(url));
}

export function subscribeToAuthCallbackUrls(
  listener: AuthCallbackListener
): () => void {
  listeners.add(listener);

  if (pendingUrl) listener(pendingUrl);

  return () => {
    listeners.delete(listener);
  };
}

export function consumeAuthCallbackUrl(url: string): void {
  if (pendingUrl === url) pendingUrl = null;
}
