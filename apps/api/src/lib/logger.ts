import pino from 'pino'

const level = process.env.LOG_LEVEL ?? 'info'

// Production logger - simple JSON output, no transports
// pino-pretty is only used in development via CLI: bun --watch src/index.ts | bunx pino-pretty
export const logger = pino({
  name: 'firsttimers-api',
  level
})
