import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { PublicLeadsController } from './public-leads.controller';

@Module({
  imports: [AuthModule],
  controllers: [LeadsController, PublicLeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
