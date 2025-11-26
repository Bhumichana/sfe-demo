import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCoachingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  managerId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comments: string;

  @ApiProperty({ required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  coachingPoints?: any;
}
