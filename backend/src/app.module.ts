import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [DatabaseModule, CompaniesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}