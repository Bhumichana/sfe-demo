import { IsString, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateActivityTypeDto {
  @IsString()
  code: string;

  @IsString()
  nameTh: string;

  @IsString()
  nameEn: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  requiresPhoto?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
