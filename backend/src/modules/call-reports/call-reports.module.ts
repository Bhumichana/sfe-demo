import { Module } from '@nestjs/common';
import { CallReportsService } from './call-reports.service';
import { CallReportsController } from './call-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CallReportsController],
  providers: [CallReportsService],
  exports: [CallReportsService],
})
export class CallReportsModule {}
