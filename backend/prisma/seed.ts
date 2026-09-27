import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { FREE_PLAN } from '../src/auth/constants/free-plan';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.plan.upsert({
    where: { name: FREE_PLAN.name },
    create: {
      name: FREE_PLAN.name,
      price: FREE_PLAN.price,
      maxUsers: FREE_PLAN.maxUsers,
      maxAgents: FREE_PLAN.maxAgents,
      maxDocuments: FREE_PLAN.maxDocuments,
      maxConversations: FREE_PLAN.maxConversations,
      maxAiTokens: FREE_PLAN.maxAiTokens,
      includesRag: FREE_PLAN.includesRag,
      includesWidget: FREE_PLAN.includesWidget,
    },
    update: {
      price: FREE_PLAN.price,
      maxUsers: FREE_PLAN.maxUsers,
      maxAgents: FREE_PLAN.maxAgents,
      maxDocuments: FREE_PLAN.maxDocuments,
      maxConversations: FREE_PLAN.maxConversations,
      maxAiTokens: FREE_PLAN.maxAiTokens,
      includesRag: FREE_PLAN.includesRag,
      includesWidget: FREE_PLAN.includesWidget,
      status: 'ACTIVE',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
