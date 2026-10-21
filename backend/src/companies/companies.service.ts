import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { OnboardingStep } from '../generated/prisma/enums';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  advanceOnboarding,
  isCompanyProfileComplete,
  ONBOARDING_ORDER,
} from './onboarding';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        phone: true,
        industry: true,
        website: true,
        language: true,
        timezone: true,
        businessHours: true,
        status: true,
        onboardingStep: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          where: {
            status: {
              in: ['TRIAL', 'ACTIVE'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            renewsAt: true,
            plan: {
              select: {
                id: true,
                name: true,
                maxUsers: true,
                maxAgents: true,
                maxDocuments: true,
                maxConversations: true,
                includesWidget: true,
                includesRag: true,
              },
            },
          },
        },
        agents: {
          where: {
            status: {
              not: 'ARCHIVED',
            },
          },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            updatedAt: true,
            widget: {
              select: {
                id: true,
                name: true,
                status: true,
                position: true,
                primaryColor: true,
                allowedDomains: true,
                updatedAt: true,
              },
            },
            knowledgeBase: {
              select: {
                id: true,
                status: true,
                _count: {
                  select: {
                    documents: {
                      where: {
                        status: {
                          not: 'ARCHIVED',
                        },
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                conversations: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            agents: {
              where: {
                status: {
                  not: 'ARCHIVED',
                },
              },
            },
            conversations: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const documentsCount = await this.prisma.document.count({
      where: {
        status: {
          not: 'ARCHIVED',
        },
        knowledgeBase: {
          agent: {
            companyId,
          },
        },
      },
    });

    const processedDocuments = await this.prisma.document.count({
      where: {
        status: 'PROCESSED',
        knowledgeBase: {
          agent: {
            companyId,
          },
        },
      },
    });

    const subscription = company.subscriptions[0] ?? null;
    const activeWidgets = company.agents.filter(
      (agent) => agent.widget?.status === 'ACTIVE',
    ).length;

    return {
      id: company.id,
      name: company.name,
      contactEmail: company.contactEmail,
      phone: company.phone,
      industry: company.industry,
      website: company.website,
      language: company.language,
      timezone: company.timezone,
      businessHours: company.businessHours,
      status: company.status,
      onboardingStep: company.onboardingStep,
      onboardingCompleted: company.onboardingCompleted,
      onboardingCompletedAt: company.onboardingCompletedAt,
      onboardingSteps: ONBOARDING_ORDER,
      subscription,
      plan: subscription?.plan ?? null,
      stats: {
        users: company._count.users,
        agents: company._count.agents,
        conversations: company._count.conversations,
        documents: documentsCount,
        processedDocuments,
        activeWidgets,
      },
      agents: company.agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        updatedAt: agent.updatedAt,
        documentsCount: agent.knowledgeBase?._count.documents ?? 0,
        conversationsCount: agent._count.conversations,
        widget: agent.widget,
      })),
      deployment: {
        website: company.website,
        pages: this.buildDeploymentPages(company.website, company.agents),
        widgets: company.agents
          .filter((agent) => agent.widget)
          .map((agent) => ({
            agentId: agent.id,
            agentName: agent.name,
            agentStatus: agent.status,
            widgetId: agent.widget!.id,
            widgetName: agent.widget!.name,
            status: agent.widget!.status,
            position: agent.widget!.position,
            allowedDomains: agent.widget!.allowedDomains,
            embedSnippet: this.buildEmbedSnippet(agent.widget!.id),
            updatedAt: agent.widget!.updatedAt,
          })),
      },
    };
  }

  async updateMine(companyId: string, data: UpdateCompanyDto) {
    await this.assertExists(companyId);

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data,
      select: {
        id: true,
        name: true,
        contactEmail: true,
        phone: true,
        industry: true,
        website: true,
        language: true,
        timezone: true,
        businessHours: true,
        status: true,
        onboardingStep: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (isCompanyProfileComplete(updated)) {
      const onboarding = await advanceOnboarding(
        this.prisma,
        companyId,
        OnboardingStep.WELCOME,
        OnboardingStep.COMPANY_PROFILE,
      );

      return {
        ...updated,
        onboardingStep: onboarding.onboardingStep,
        onboardingCompleted: onboarding.onboardingCompleted,
        onboardingCompletedAt: onboarding.onboardingCompletedAt,
      };
    }

    return updated;
  }

  private async assertExists(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        status: {
          not: 'ARCHIVED',
        },
      },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }
  }

  private buildDeploymentPages(
    website: string | null,
    agents: Array<{
      widget: {
        allowedDomains: string[];
        status: string;
      } | null;
    }>,
  ) {
    const pages = new Set<string>();

    if (website?.trim()) {
      pages.add(website.trim());
    }

    for (const agent of agents) {
      for (const domain of agent.widget?.allowedDomains ?? []) {
        if (domain.trim()) {
          pages.add(domain.trim());
        }
      }
    }

    return [...pages];
  }

  private buildEmbedSnippet(widgetId: string) {
    const apiUrl = (
      process.env.PUBLIC_API_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`
    ).replace(/\/$/, '');

    return [
      `<!-- AtlasIA widget -->`,
      `<script`,
      `  src="${apiUrl}/widget.js"`,
      `  data-atlasia-widget="${widgetId}"`,
      `  data-atlasia-api="${apiUrl}"`,
      `  async`,
      `></script>`,
    ].join('\n');
  }
}
