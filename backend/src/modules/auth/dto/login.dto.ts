import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'sales1' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class DemoLoginDto {
  @ApiProperty({ example: 'sales1' })
  @IsString()
  @IsNotEmpty()
  username: string;
}
