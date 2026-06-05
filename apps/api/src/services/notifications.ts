import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE_NAME } from '@firsttimers/types';
import type { AppBindings } from '../types/context.js';

let notificationQueue: Queue<any> | null = null;

export const getNotificationQueue = (redisUrl: string) => {
  if (!notificationQueue) {
    notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection: {
        url: redisUrl
      }
    });
  }
  return notificationQueue;
};

export const queueVerificationNotification = async (
  target: string,
  code: string,
  firstTimerId: string,
  channel: string,
  expiresAt: string,
  redisUrl: string,
  verificationCodeId: string
) => {
  const queue = getNotificationQueue(redisUrl);

  await queue.add('send-notification', {
    payload: {
      target,
      code,
      firstTimerId,
      channel,
      expiresAt
    }
  }, {
    // Deterministic jobId: a second enqueue for the same verification code is
    // ignored by BullMQ, so the same code is never sent twice.
    jobId: `verification:${verificationCodeId}`,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  });
};