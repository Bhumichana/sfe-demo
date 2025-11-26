import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckOutDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  checkOutTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  checkOutLat: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  checkOutLng: number;
}
