import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SFE Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
