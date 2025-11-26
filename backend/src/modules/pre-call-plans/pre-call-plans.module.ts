import { Module } from '@nestjs/common';
import { PreCallPlansService } from './pre-call-plans.service';
import { PreCallPlansController } from './pre-call-plans.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PreCallPlansController],
  providers: [PreCallPlansService],
  exports: [PreCallPlansService],
})
export class PreCallPlansModule {}
