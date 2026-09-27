import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class PublicWidgetChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  visitorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  visitorContact?: string;
}
