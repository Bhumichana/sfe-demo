import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'TEAM-BKK-01', description: 'Unique team code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Bangkok Sales Team 1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Sales team for Bangkok North area' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-leader' })
  @IsOptional()
  @IsString()
  leaderId?: string;

  @ApiProperty({ example: 'uuid-of-company' })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
