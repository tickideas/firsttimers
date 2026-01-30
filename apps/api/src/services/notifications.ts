import { Queue } from 'bullmq';
import type { AppBindings } from '../types/context.js';

let notificationQueue: Queue<any> | null = null;

export const getNotificationQueue = (redisUrl: string) => {
  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', {
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
  redisUrl: string
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
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  });
};