'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_DAYS,
  createConsentState,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentState,
} from '@/lib/consent';
import { acknowledgeCookieNoticeAction } from './actions';

interface ConsentContextValue {
  /** null until read from the cookie on the client, so SSR never flashes the banner. */
  consent: ConsentState | null;
  /** True once the cookie has been read on the client. */
  ready: boolean;
  /** Whether the notice sheet is open (first visit, outdated version, or reopened from settings). */
  noticeOpen: boolean;
  acknowledge: () => void;
  openNotice: () => void;
  closeNotice: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function writeConsentCookie(state: ConsentState): void {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(state)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Hydration-safe: the server renders "not ready" (no banner); the cookie is
  // read once on the client after mount.
  const [state, setState] = useState<{
    ready: boolean;
    consent: ConsentState | null;
    noticeOpen: boolean;
  }>({ ready: false, consent: null, noticeOpen: false });

  useEffect(() => {
    const existing = parseConsentCookie(readCookie(CONSENT_COOKIE_NAME));
    // Deferred to a microtask so the update is not synchronous inside the effect body.
    const id = window.setTimeout(() => {
      setState({ ready: true, consent: existing, noticeOpen: existing === null });
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const { consent, ready, noticeOpen } = state;

  const acknowledge = useCallback(() => {
    const next = createConsentState();
    writeConsentCookie(next);
    setState({ ready: true, consent: next, noticeOpen: false });
    // Fire-and-forget audit row for signed-in users.
    void acknowledgeCookieNoticeAction();
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      ready,
      noticeOpen,
      acknowledge,
      openNotice: () => setState((prev) => ({ ...prev, noticeOpen: true })),
      closeNotice: () => setState((prev) => ({ ...prev, noticeOpen: false })),
    }),
    [consent, ready, noticeOpen, acknowledge],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
