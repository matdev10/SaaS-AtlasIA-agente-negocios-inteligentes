export const FREE_PLAN = {
  name: 'Free',
  price: 0,
  maxUsers: 3,
  maxAgents: 1,
  maxDocuments: 20,
  maxConversations: 500,
  maxAiTokens: 100_000,
  includesRag: true,
  includesWidget: true,
} as const;
