import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ROLES: Array<Pick<Role, 'key' | 'label'>> = [
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'zonal_admin', label: 'Zonal Admin' },
  { key: 'group_admin', label: 'Group Admin' },
  { key: 'church_admin', label: 'Church Admin' },
  { key: 'verifier', label: 'Verifier' },
  { key: 'followup_agent', label: 'Follow-up Agent' },
  { key: 'foundation_coordinator', label: 'Foundation Coordinator' },
  { key: 'department_head', label: 'Department Head' }
];

async function main() {
  console.log('Start seeding...');

  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: role,
      create: role
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ce-hq' },
    update: {},
    create: {
      name: 'Christ Embassy Headquarters',
      slug: 'ce-hq',
      mode: 'STANDALONE'
    }
  });

  const church = await prisma.church.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'main-hq'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Christ Embassy HQ Main',
      slug: 'main-hq'
    }
  });

  // Find existing form or create new one
  let form = await prisma.form.findFirst({
    where: {
      tenantId: tenant.id,
      churchId: church.id
    }
  });

  if (!form) {
    form = await prisma.form.create({
      data: {
        tenantId: tenant.id,
        churchId: church.id,
        schemaJson: {
          title: 'First Timer Registration',
          fields: [
            {
              name: 'fullName',
              label: 'Full Name',
              type: 'text',
              required: true
            },
            {
              name: 'email',
              label: 'Email Address',
              type: 'email',
              required: false
            },
            {
              name: 'phoneE164',
              label: 'Phone Number',
              type: 'tel',
              required: false
            }
          ]
        }
      }
    });
  }

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@ce-hq.com'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@ce-hq.com',
      passwordHash: '$2a$12$1W4i2DX4QRLlPB4CezGT3emz2tMgMAuJp3fcsbb9j8bFOOGIlB616', // password: admin123
      name: 'System Administrator',
      isActive: true
    }
  });

  const adminRole = await prisma.role.findFirst({
    where: { key: 'super_admin' }
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_scope_scopeId: {
          userId: user.id,
          roleId: adminRole.id,
          scope: 'zone',
          scopeId: tenant.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
        tenantId: tenant.id,
        scope: 'zone',
        scopeId: tenant.id
      }
    });
  }

  console.log('Created tenant:', tenant.slug);
  console.log('Created church:', church.slug);
  console.log('Created form:', form.id);
  console.log('Created admin user:', user.email);
  console.log('Seeding finished.');
}

main()
  .catch((error) => {
    console.error('[prisma][seed] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
