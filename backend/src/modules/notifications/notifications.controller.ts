import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseBoolPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true })) unreadOnly?: boolean,
  ) {
    return this.notificationsService.findByUser(userId, unreadOnly);
  }

  @Get('user/:userId/unread-count')
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string, @Query('userId') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Put('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Query('userId') userId: string) {
    return this.notificationsService.delete(id, userId);
  }

  // ============================================
  // Notification Preferences Endpoints
  // ============================================

  @Get('preferences/:userId')
  getPreferences(@Param('userId') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Put('preferences/:userId')
  updatePreferences(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(userId, updateDto);
  }

  @Post('preferences/:userId/reset')
  resetPreferences(@Param('userId') userId: string) {
    return this.notificationsService.resetPreferences(userId);
  }
}
