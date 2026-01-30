import { Worker } from 'bullmq';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: 'worker', level: process.env.LOG_LEVEL ?? 'info' });

const envSchema = z.object({
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  QUEUE_NAME: z.string().min(1).default('firsttimers-default'),
  SMS_API_KEY: z.string().optional(),
  EMAIL_API_KEY: z.string().optional()
});

const env = envSchema.parse(process.env);

const sendSms = async (to: string, message: string) => {
  logger.info({ to }, 'Sending SMS');
  if (!env.SMS_API_KEY) {
    logger.warn('SMS_API_KEY not configured, skipping SMS send');
    return true;
  }
  return true;
};

const sendEmail = async (to: string, subject: string, message: string) => {
  logger.info({ to, subject }, 'Sending email');
  if (!env.EMAIL_API_KEY) {
    logger.warn('EMAIL_API_KEY not configured, skipping email send');
    return true;
  }
  return true;
};

const processVerificationNotification = async (payload: any) => {
  const { code, firstTimerId, channel, expiresAt } = payload;
  
  let message = `Your verification code is: ${code}. `;
  message += `This code will expire in 10 minutes. `;
  message += `Please do not share this code with anyone.`;

  if (channel === 'email') {
    await sendEmail(payload.target, 'Verify your contact information', message);
  } else {
    await sendSms(payload.target, message);
  }
};

const worker = new Worker(
  env.QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing job');

    try {
      switch (job.name) {
        case 'send-notification':
          await processVerificationNotification(job.data.payload);
          break;
        default:
          logger.warn({ jobName: job.name }, 'Unknown job type');
      }
    } catch (error) {
      logger.error({ jobId: job.id, err: error }, 'Job processing failed');
      throw error;
    }
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
