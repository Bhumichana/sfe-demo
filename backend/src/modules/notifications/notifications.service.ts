import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  async findByUser(userId: string, unreadOnly = false) {
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: {
        id,
        userId, // Ensure user owns this notification
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.delete({
      where: {
        id,
        userId, // Ensure user owns this notification
      },
    });
  }

  // ============================================
  // Notification Preferences Methods
  // ============================================

  /**
   * Get user's notification preferences
   * Creates default preferences if not exist
   */
  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if not exist
    if (!preferences) {
      preferences = await this.prisma.notificationPreferences.create({
        data: {
          userId,
          planApproved: true,
          planRejected: true,
          planPending: true,
          reminder: true,
          coaching: true,
          system: true,
          emailNotifications: false,
          pushNotifications: true,
          soundEnabled: true,
          vibrationEnabled: true,
        },
      });
    }

    return preferences;
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ) {
    // First ensure preferences exist
    await this.getPreferences(userId);

    // Then update
    return this.prisma.notificationPreferences.update({
      where: { userId },
      data: updateDto,
    });
  }

  /**
   * Reset user's notification preferences to default
   */
  async resetPreferences(userId: string) {
    return this.prisma.notificationPreferences.update({
      where: { userId },
      data: {
        planApproved: true,
        planRejected: true,
        planPending: true,
        reminder: true,
        coaching: true,
        system: true,
        emailNotifications: false,
        pushNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
      },
    });
  }
}
