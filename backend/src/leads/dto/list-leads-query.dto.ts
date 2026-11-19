import { IsOptional, IsUUID } from 'class-validator';

export class ListLeadsQueryDto {
  @IsOptional()
  @IsUUID()
  agentId?: string;
}
