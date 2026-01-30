import { Worker } from 'bullmq';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: 'worker', level: process.env.LOG_LEVEL ?? 'info' });

const envSchema = z.object({
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  QUEUE_NAME: z.string().min(1).default('firsttimers-default'),
  // Email provider (Resend)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  // SMS provider (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

const env = envSchema.parse(process.env);

interface SmsProvider {
  send(to: string, message: string): Promise<boolean>;
}

interface EmailProvider {
  send(to: string, subject: string, message: string): Promise<boolean>;
}

// Resend email provider implementation
class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(to: string, subject: string, message: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          text: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ error, to }, 'Failed to send email via Resend');
        return false;
      }

      logger.info({ to, subject }, 'Email sent successfully via Resend');
      return true;
    } catch (error) {
      logger.error({ error, to }, 'Exception sending email');
      return false;
    }
  }
}

// Twilio SMS provider implementation
class TwilioProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: this.fromNumber,
          Body: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ error, to }, 'Failed to send SMS via Twilio');
        return false;
      }

      logger.info({ to }, 'SMS sent successfully via Twilio');
      return true;
    } catch (error) {
      logger.error({ error, to }, 'Exception sending SMS');
      return false;
    }
  }
}

// Factory functions to create providers based on environment
const createEmailProvider = (): EmailProvider | null => {
  if (env.RESEND_API_KEY && env.FROM_EMAIL) {
    return new ResendProvider(env.RESEND_API_KEY, env.FROM_EMAIL);
  }
  logger.warn('No email provider configured');
  return null;
};

const createSmsProvider = (): SmsProvider | null => {
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    return new TwilioProvider(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_AUTH_TOKEN,
      env.TWILIO_PHONE_NUMBER
    );
  }
  logger.warn('No SMS provider configured');
  return null;
};

const emailProvider = createEmailProvider();
const smsProvider = createSmsProvider();

const sendSms = async (to: string, message: string) => {
  logger.info({ to }, 'Sending SMS');
  if (!smsProvider) {
    logger.warn('SMS provider not configured, message not sent');
    return false;
  }
  return smsProvider.send(to, message);
};

const sendEmail = async (to: string, subject: string, message: string) => {
  logger.info({ to, subject }, 'Sending email');
  if (!emailProvider) {
    logger.warn('Email provider not configured, message not sent');
    return false;
  }
  return emailProvider.send(to, subject, message);
};

const verificationNotificationSchema = z.object({
  code: z.string(),
  firstTimerId: z.string(),
  channel: z.enum(['email', 'sms']),
  expiresAt: z.string().datetime(),
  target: z.string(),
});

type VerificationNotificationPayload = z.infer<typeof verificationNotificationSchema>;

const processVerificationNotification = async (payload: unknown) => {
  const parsed = verificationNotificationSchema.safeParse(payload);
  if (!parsed.success) {
    logger.error({ errors: parsed.error.errors }, 'Invalid verification notification payload');
    throw new Error('Invalid payload');
  }

  const { code, channel, target } = parsed.data;

  let message = `Your verification code is: ${code}. `;
  message += `This code will expire in 10 minutes. `;
  message += `Please do not share this code with anyone.`;

  if (channel === 'email') {
    await sendEmail(target, 'Verify your contact information', message);
  } else {
    await sendSms(target, message);
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
