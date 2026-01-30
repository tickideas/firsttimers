import { generateVerificationCode, generateExpiryTime, isValidVerificationCode } from '../utils/verification.js';
import { queueVerificationNotification } from '../services/notifications.js';
import { env } from '../config/env.js';
import type { App } from '../app.js';

const sendVerificationSchema = {
  firstTimerId: 'string',
  channel: ['email', 'sms', 'whatsapp']
};

const verifyCodeSchema = {
  firstTimerId: 'string',
  code: 'string'
};

export const registerVerificationRoutes = (app: App) => {
  app.post('/api/verification/send', async (c) => {
    const prisma = c.get('prisma')
    const body = await c.req.json();
    const { firstTimerId, channel } = body;

    const firstTimer = await prisma.firstTimer.findFirst({
      where: {
        id: firstTimerId,
        tenantId: c.get('authUser')?.tenantId
      }
    });

    if (!firstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    if (channel === 'email' && !firstTimer.email) {
      return c.json({ message: 'No email address available' }, 400);
    }

    if ((channel === 'sms' || channel === 'whatsapp') && !firstTimer.phoneE164) {
      return c.json({ message: 'No phone number available' }, 400);
    }

    if ((channel === 'email' && firstTimer.emailVerified) || 
        ((channel === 'sms' || channel === 'whatsapp') && firstTimer.phoneVerified)) {
      return c.json({ message: 'Channel already verified' }, 400);
    }

    const code = generateVerificationCode();
    const expiresAt = generateExpiryTime();

    const verificationCode = await prisma.verificationCode.create({
      data: {
        tenantId: firstTimer.tenantId,
        firstTimerId,
        channel,
        code,
        type: channel === 'email' ? 'email_verification' : 'phone_verification',
        expiresAt
      }
    });

    const target = channel === 'email' ? firstTimer.email! : firstTimer.phoneE164!;
    
    await Promise.all([
      prisma.notification.create({
        data: {
          tenantId: firstTimer.tenantId,
          target,
          type: 'verification',
          status: 'PENDING',
          payload: {
            code,
            firstTimerId,
            channel,
            expiresAt: expiresAt.toISOString()
          }
        }
      }),
      queueVerificationNotification(
        target,
        code,
        firstTimerId,
        channel,
        expiresAt.toISOString(),
        env.REDIS_URL
      )
    ]);

    return c.json({
      success: true,
      verificationId: verificationCode.id,
      message: 'Verification code sent successfully'
    });
  });

  app.post('/api/verification/verify', async (c) => {
    const prisma = c.get('prisma')
    const body = await c.req.json();
    const { firstTimerId, code } = body;

    if (!isValidVerificationCode(code)) {
      return c.json({ message: 'Invalid verification code format' }, 400);
    }

    const firstTimer = await prisma.firstTimer.findFirst({
      where: {
        id: firstTimerId,
        tenantId: c.get('authUser')?.tenantId
      }
    });

    if (!firstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        firstTimerId,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!verificationCode) {
      return c.json({ message: 'Invalid or expired verification code' }, 400);
    }

    if (verificationCode.attempts >= verificationCode.maxAttempts) {
      return c.json({ message: 'Maximum verification attempts exceeded' }, 400);
    }

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        attempts: { increment: 1 },
        usedAt: new Date()
      }
    });

    const isEmailVerification = verificationCode.type === 'email_verification';
    const updateData: any = {};
    
    if (isEmailVerification) {
      updateData.emailVerified = true;
    } else {
      updateData.phoneVerified = true;
    }

    const updatedFirstTimer = await prisma.firstTimer.update({
      where: { id: firstTimerId },
      data: updateData,
      select: {
        id: true,
        emailVerified: true,
        phoneVerified: true,
        status: true
      }
    });

    const allVerified = updatedFirstTimer.emailVerified && updatedFirstTimer.phoneVerified;
    let newStatus = updatedFirstTimer.status;

    if (allVerified && updatedFirstTimer.status === 'NEW') {
      newStatus = 'VERIFIED';
      await prisma.firstTimer.update({
        where: { id: firstTimerId },
        data: { status: 'VERIFIED' }
      });
    }

    return c.json({
      success: true,
      channel: verificationCode.channel,
      verified: true,
      allVerified,
      status: newStatus,
      message: 'Verification successful'
    });
  });

  app.get('/api/verification/status/:firstTimerId', async (c) => {
    const prisma = c.get('prisma')
    const firstTimerId = c.req.param('firstTimerId');
    const tenantId = c.get('authUser')?.tenantId;

    const firstTimer = await prisma.firstTimer.findFirst({
      where: {
        id: firstTimerId,
        tenantId
      },
      select: {
        id: true,
        email: true,
        phoneE164: true,
        emailVerified: true,
        phoneVerified: true,
        status: true
      }
    });

    if (!firstTimer) {
      return c.json({ message: 'First timer not found' }, 404);
    }

    return c.json({
      firstTimer,
      hasEmail: !!firstTimer.email,
      hasPhone: !!firstTimer.phoneE164,
      emailVerified: firstTimer.emailVerified,
      phoneVerified: firstTimer.phoneVerified,
      fullyVerified: firstTimer.emailVerified && firstTimer.phoneVerified
    });
  });
};