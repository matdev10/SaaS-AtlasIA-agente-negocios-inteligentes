import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { RolesGuard } from '../auth/roles.guard';

import { ConversationsService } from './conversations.service';
import { TestChatDto } from './dto/test-chat.dto';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('agents/:agentId/test-chat')
  testChat(
    @Param('agentId') agentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() testChatDto: TestChatDto,
  ) {
    return this.conversationsService.testChat(
      user.companyId,
      agentId,
      testChatDto,
    );
  }

  @Get('agents/:agentId/conversations')
  listByAgent(
    @Param('agentId') agentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.listByAgent(agentId, user.companyId);
  }

  @Get('agents/:agentId/conversations/:conversationId')
  findOne(
    @Param('agentId') agentId: string,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.findOne(
      agentId,
      conversationId,
      user.companyId,
    );
  }
}
