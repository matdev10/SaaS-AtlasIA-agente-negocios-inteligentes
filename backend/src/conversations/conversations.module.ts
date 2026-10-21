import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { LlmChatService } from './llm-chat.service';

@Module({
  imports: [AuthModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, LlmChatService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
