import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PublicWidgetsController } from './public-widgets.controller';
import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';

@Module({
  imports: [AuthModule, ConversationsModule],
  controllers: [WidgetsController, PublicWidgetsController],
  providers: [WidgetsService],
})
export class WidgetsModule {}
