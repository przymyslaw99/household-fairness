const APP_ORIGIN = "https://household-fairness.local";

export function sanitizeLocalRedirectTarget(input: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const candidate = input.trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return null;
  }

  try {
    const url = new URL(candidate, APP_ORIGIN);

    if (url.origin !== APP_ORIGIN) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function appendRedirectTarget(path: string, redirectTarget: string | null): string {
  if (!redirectTarget) {
    return path;
  }

  const url = new URL(path, APP_ORIGIN);
  url.searchParams.set("redirectTo", redirectTarget);

  return `${url.pathname}${url.search}${url.hash}`;
}
