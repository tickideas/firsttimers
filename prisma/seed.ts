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
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: role,
      create: role
    });
  }
}

main()
  .catch((error) => {
    console.error('[prisma][seed] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
