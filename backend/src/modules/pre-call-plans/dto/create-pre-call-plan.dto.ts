import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePreCallPlanDto {
  @ApiProperty({ description: 'Sales Representative ID' })
  @IsUUID()
  @IsNotEmpty()
  srId: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ description: 'Planned visit date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  planDate: string;

  @ApiPropertyOptional({ description: 'Visit objectives' })
  @IsString()
  @IsOptional()
  objectives?: string;

  @ApiPropertyOptional({
    description: 'Array of planned activity IDs',
    type: [String],
    example: ['activity-id-1', 'activity-id-2']
  })
  @IsArray()
  @IsOptional()
  plannedActivities?: string[];
}
