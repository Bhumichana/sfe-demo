import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActivityTypesModule } from './modules/activity-types/activity-types.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PreCallPlansModule } from './modules/pre-call-plans/pre-call-plans.module';
import { CallReportsModule } from './modules/call-reports/call-reports.module';
import { ManagerModule } from './modules/manager/manager.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { UsersModule } from './users/users.module';
import { TerritoriesModule } from './territories/territories.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Database (Prisma)
    PrismaModule,

    // Feature modules
    AuthModule,
    ActivityTypesModule,
    NotificationsModule,
    PreCallPlansModule,
    CallReportsModule,
    ManagerModule,
    AnalyticsModule,
    CustomersModule, // Customer data endpoints
    ContactsModule, // Contact data endpoints
    UsersModule, // User management endpoints
    TerritoriesModule, // Territory management endpoints
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
