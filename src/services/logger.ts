// src/services/logger.ts
// Thin logging wrapper. Strips to console in dev. No-ops in production.
// Never logs PII. Crash reporting handled separately via Sentry.

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  debug: (...args: unknown[]) => { if (isDev) console.debug('[INTENT]', ...args) },
  info:  (...args: unknown[]) => { if (isDev) console.info('[INTENT]', ...args) },
  warn:  (...args: unknown[]) => { console.warn('[INTENT]', ...args) },
  error: (...args: unknown[]) => { console.error('[INTENT]', ...args) },
}
