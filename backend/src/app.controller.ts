import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  getHello() {
    return this.appService.getHealthCheck();
  }

  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  getHealth() {
    return this.appService.getHealthCheck();
  }
}
