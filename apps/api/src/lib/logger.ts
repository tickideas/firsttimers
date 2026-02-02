import pino from 'pino'

const level = process.env.LOG_LEVEL ?? 'info'
const isDev = process.env.NODE_ENV === 'development'

// In production, use simple JSON logging (no pino-pretty)
// In development, use pino-pretty for readable output
export const logger = isDev
  ? pino({
      name: 'firsttimers-api',
      level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname'
        }
      }
    })
  : pino({
      name: 'firsttimers-api',
      level
    })
