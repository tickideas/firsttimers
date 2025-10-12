import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';

export const logger = pino({
  name: 'firsttimers-api',
  level,
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname'
          }
        }
      : undefined
});
