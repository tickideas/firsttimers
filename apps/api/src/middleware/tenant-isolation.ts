import type { Context, Next } from 'hono';
import { prisma } from '../lib/prisma.js';
import type { AppBindings } from '../types/context.js';

export const tenantIsolation = async (c: Context<AppBindings>, next: Next) => {
  const user = c.get('authUser');
  
  if (!user) {
    return next();
  }

  const originalFindMany = prisma.firstTimer.findMany.bind(prisma.firstTimer);
  const originalFindFirst = prisma.firstTimer.findFirst.bind(prisma.firstTimer);
  const originalFindUnique = prisma.firstTimer.findUnique.bind(prisma.firstTimer);
  const originalCreate = prisma.firstTimer.create.bind(prisma.firstTimer);
  const originalUpdate = prisma.firstTimer.update.bind(prisma.firstTimer);
  const originalDelete = prisma.firstTimer.delete.bind(prisma.firstTimer);
  prisma.firstTimer.findMany = (args: any) => {
    return originalFindMany({
      ...args,
      where: {
        tenantId: user.tenantId,
        ...args.where
      }
    });
  };

  prisma.firstTimer.findFirst = (args: any) => {
    return originalFindFirst({
      ...args,
      where: {
        tenantId: user.tenantId,
        ...args.where
      }
    });
  };

  prisma.firstTimer.findUnique = (args: any) => {
    return originalFindUnique({
      ...args,
      where: {
        tenantId: user.tenantId,
        ...args.where
      }
    });
  };

  prisma.firstTimer.create = (args: any) => {
    return originalCreate({
      ...args,
      data: {
        tenantId: user.tenantId,
        ...args.data
      }
    });
  };

  prisma.firstTimer.update = (args: any) => {
    return originalUpdate({
      ...args,
      where: {
        tenantId: user.tenantId,
        ...args.where
      },
      ...args
    });
  };

  prisma.firstTimer.delete = (args: any) => {
    return originalDelete({
      ...args,
      where: {
        tenantId: user.tenantId,
        ...args.where
      }
    });
  };

  const modelsToIsolate = [
    'church', 'form', 'formSubmission', 'followUp', 'contactAttempt',
    'foundationCourse', 'foundationClass', 'foundationEnrollment',
    'department', 'departmentEnrollment', 'notification', 'verificationCode'
  ];

  for (const model of modelsToIsolate) {
    const prismaModel = (prisma as any)[model];
    if (prismaModel && prismaModel.findMany) {
      const originalFindMany = prismaModel.findMany.bind(prismaModel);
      prismaModel.findMany = (args: any) => {
        return originalFindMany({
          ...args,
          where: {
            tenantId: user.tenantId,
            ...args.where
          }
        });
      };
    }
  }

  await next();
};