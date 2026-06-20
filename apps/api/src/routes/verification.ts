import { rateLimiter } from 'hono-rate-limiter';

import { generateVerificationCode, generateExpiryTime, isValidVerificationCode } from '../utils/verification.js';
import { queueVerificationNotification } from '../services/notifications.js';
import { env } from '../config/env.js';
import type { App } from '../app.js';

// Minimum time between verification-code sends for the same first-timer + channel.
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

// Limit how often the verification endpoints can be hit per client, to curb
// email/SMS cost abuse and brute-forcing of the 6-digit code.
const verificationLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  keyGenerator: (c) =>
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
});

export const registerVerificationRoutes = (app: App) => {
  app.post('/api/verification/send', verificationLimiter, async (c) => {
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

    // Throttle: if an unused, unexpired code was issued within the cooldown
    // window, refuse to send another one. Prevents resend-spam and duplicate
    // outbound email/SMS (which cost money) from impatient users or retries.
    const cooldownStart = new Date(Date.now() - RESEND_COOLDOWN_MS);
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        firstTimerId,
        channel,
        usedAt: null,
        expiresAt: { gt: new Date() },
        createdAt: { gt: cooldownStart }
      }
    });

    if (recentCode) {
      return c.json(
        { message: 'A verification code was already sent recently. Please wait before requesting another.' },
        429
      );
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
        env.REDIS_URL,
        verificationCode.id
      )
    ]);

    return c.json({
      success: true,
      verificationId: verificationCode.id,
      message: 'Verification code sent successfully'
    });
  });

  app.post('/api/verification/verify', verificationLimiter, async (c) => {
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

    // Look up the active code by first-timer (NOT by the submitted code) so that
    // wrong guesses still count against the attempt limit. Looking up by code
    // meant a wrong guess found no row and incremented nothing, so the lockout
    // never triggered and the 6-digit code could be brute-forced.
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        firstTimerId,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verificationCode) {
      return c.json({ message: 'Invalid or expired verification code' }, 400);
    }

    if (verificationCode.attempts >= verificationCode.maxAttempts) {
      return c.json({ message: 'Maximum verification attempts exceeded' }, 400);
    }

    if (verificationCode.code !== code) {
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } }
      });
      return c.json({ message: 'Invalid or expired verification code' }, 400);
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