import { Worker } from 'bullmq';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: 'worker', level: process.env.LOG_LEVEL ?? 'info' });

const envSchema = z.object({
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  QUEUE_NAME: z.string().min(1).default('firsttimers-default')
});

const env = envSchema.parse(process.env);

const worker = new Worker(
  env.QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Received job placeholder');
  },
  {
    connection: {
      url: env.REDIS_URL
    }
  }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job?.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed');
});

const shutdown = async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

logger.info({ queue: env.QUEUE_NAME }, 'Worker bootstrapped');
