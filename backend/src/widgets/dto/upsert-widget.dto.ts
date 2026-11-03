import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { WidgetStatus } from '../../generated/prisma/client';

export class UpsertWidgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  welcomeMessage?: string;

  @IsOptional()
  @IsIn(['bottom-left', 'bottom-center', 'bottom-right'])
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';

  @IsOptional()
  @IsIn(['bottom-left', 'bottom-center', 'bottom-right'])
  buttonPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right';

  @IsOptional()
  @IsIn(['sm', 'md', 'lg'])
  size?: 'sm' | 'md' | 'lg';

  @IsOptional()
  @IsBoolean()
  movable?: boolean;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsEnum(WidgetStatus)
  status?: WidgetStatus;
}
