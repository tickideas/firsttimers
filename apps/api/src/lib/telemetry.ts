import { env } from '../config/env.js';

let sentryInitialized = false;

export const initTelemetry = async (): Promise<void> => {
  if (!sentryInitialized && env.SENTRY_DSN) {
    const Sentry = await import('@sentry/bun');
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1
    });
    sentryInitialized = true;
  }

  if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Placeholder for OTEL SDK initialization.
    const { diag, DiagConsoleLogger, DiagLogLevel } = await import('@opentelemetry/api');
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
    // TODO: configure Node SDK with OTLP exporter when ready.
  }
};
