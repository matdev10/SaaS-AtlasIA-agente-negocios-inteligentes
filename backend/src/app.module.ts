import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DatabaseModule } from './database/database.module';
import { DocumentsModule } from './documents/documents.module';
import { TrainingModule } from './training/training.module';
import { UsersModule } from './users/users.module';
import { WidgetsModule } from './widgets/widgets.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    AgentsModule,
    DocumentsModule,
    TrainingModule,
    ConversationsModule,
    WidgetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
